/**
 * Capital Authority verification.
 *
 * The load-bearing test is CONCURRENCY: many workers racing to reserve from an
 * underfunded bucket must not collectively overspend it. A naive check-then-write
 * implementation passes every sequential test and still overdraws under contention,
 * which is exactly the failure that would quietly consume owner capital.
 *
 * Usage: DATABASE_URL=postgres://... npx tsx src/capital/authority.test.ts
 * Writes test rows — point at a scratch database, never at Factory state.
 */

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CapitalAuthority,
  KillSwitchEngagedError,
  InsufficientBucketFundsError,
  ReservationStateError,
} from './authority.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL to a scratch database. This script writes test rows.');
  process.exit(2);
}

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function expectThrows(name: string, fn: () => Promise<unknown>, ctor: Function) {
  try {
    await fn();
    check(name, false, 'expected a rejection, got success');
  } catch (err) {
    check(name, err instanceof ctor, `expected ${ctor.name}, got ${(err as Error).name}: ${(err as Error).message}`);
  }
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 30 });

/**
 * `DROP SCHEMA public CASCADE` is the most destructive statement in this
 * repository. It is correct against a scratch database and unrecoverable
 * against a durable one, and the only thing that decided which it was hitting
 * was whatever DATABASE_URL happened to hold. It now asks the database first.
 *
 * The check is deliberately positive — the database must SAY it is disposable —
 * so a database that has never heard of this convention is refused rather than
 * assumed safe.
 */
async function assertDisposableDatabase(): Promise<void> {
  const marker = await pool.query<{ present: boolean }>(
    "SELECT to_regclass('public.disposable_test_database') IS NOT NULL AS present",
  );
  if (marker.rows[0]?.present) return;

  const named = await pool.query<{ name: string }>('SELECT current_database() AS name');
  const name = named.rows[0]?.name ?? '(unknown)';
  if (/test|scratch|ci|tmp/i.test(name)) return;

  throw new Error(
    `Refusing to drop the schema of database "${name}". It carries no ` +
      'disposable_test_database marker table and its name does not identify it as a ' +
      'test database. Create the marker table, or point DATABASE_URL at a scratch ' +
      'database. Durable WATCH, transaction and owner-labor history lives in ' +
      'databases this statement would destroy.',
  );
}

async function resetSchema() {
  await assertDisposableDatabase();
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(readFileSync(join(HERE, '../../db/schema.sql'), 'utf8'));
}

async function seedBucket(name: string, allocatedCents: number) {
  await pool.query(
    `INSERT INTO capital_bucket (name, kind, source, allocated_cents)
     VALUES ($1,'DISCOVERY','OWNER_CAPITAL',$2)`,
    [name, allocatedCents],
  );
}

async function disengageKillSwitch() {
  await pool.query(
    `UPDATE system_flag SET bool_value = FALSE, updated_by = 'test' WHERE key = 'PAID_ACTIVITY_HALTED'`,
  );
}

async function main() {
  console.log('\nCapital Authority — verification against a real PostgreSQL instance\n');

  // -- 1. Kill switch fails closed -------------------------------------------
  console.log('1. Kill switch (CONSTITUTION.md §9)');
  await resetSchema();
  await seedBucket('discovery', 5000);
  const ca = new CapitalAuthority(pool);

  await expectThrows(
    'reserve is refused while the kill switch ships engaged',
    () => ca.reserve({ bucketName: 'discovery', maxAmountCents: 100, purpose: 'probe', idempotencyKey: 'k1', actor: 'test' }),
    KillSwitchEngagedError,
  );

  await pool.query(`DELETE FROM system_flag WHERE key = 'PAID_ACTIVITY_HALTED'`);
  await expectThrows(
    'a MISSING kill-switch flag also refuses (fails closed, not open)',
    () => ca.reserve({ bucketName: 'discovery', maxAmountCents: 100, purpose: 'probe', idempotencyKey: 'k2', actor: 'test' }),
    KillSwitchEngagedError,
  );

  // -- 2. Reserve / settle / release lifecycle -------------------------------
  console.log('\n2. RESERVE -> EXECUTE -> SETTLE (CONSTITUTION.md §6)');
  await resetSchema();
  await seedBucket('discovery', 5000);
  await disengageKillSwitch();

  const r1 = await ca.reserve({ bucketName: 'discovery', maxAmountCents: 1000, purpose: 'data probe', idempotencyKey: 'op-1', actor: 'test' });
  check('reserve succeeds when funded', r1.state === 'RESERVED' && !r1.wasAlreadyReserved);
  check('reserved funds are withheld from available', (await ca.availableCents('discovery')) === 4000);

  const r1again = await ca.reserve({ bucketName: 'discovery', maxAmountCents: 1000, purpose: 'data probe', idempotencyKey: 'op-1', actor: 'test' });
  check('retry with same idempotency key does not double-reserve', r1again.wasAlreadyReserved && r1again.id === r1.id);
  check('available is unchanged after the retry', (await ca.availableCents('discovery')) === 4000);

  await ca.settle('op-1', 300, 'test');
  check('settling below the maximum releases the remainder', (await ca.availableCents('discovery')) === 4700);

  await ca.settle('op-1', 300, 'test');
  check('settle is idempotent', (await ca.availableCents('discovery')) === 4700);

  await expectThrows(
    'settling above the reserved maximum is refused',
    async () => {
      await ca.reserve({ bucketName: 'discovery', maxAmountCents: 100, purpose: 'x', idempotencyKey: 'op-2', actor: 'test' });
      await ca.settle('op-2', 500, 'test');
    },
    ReservationStateError,
  );

  await ca.release('op-2', 'test', 'operation did not run');
  check('release returns the full reservation', (await ca.availableCents('discovery')) === 4700);

  await expectThrows(
    'spending more than the bucket holds is refused',
    () => ca.reserve({ bucketName: 'discovery', maxAmountCents: 999999, purpose: 'too big', idempotencyKey: 'op-3', actor: 'test' }),
    InsufficientBucketFundsError,
  );

  // -- 3. CONCURRENCY — the reason this test exists --------------------------
  console.log('\n3. Concurrency under contention (ARCHITECTURE.md ADR-3, risk #6)');
  await resetSchema();
  await seedBucket('validation', 1000); // funds exactly 10 x 100
  await disengageKillSwitch();

  const CONCURRENT = 40;
  const EACH = 100;
  const AFFORDABLE = 10;

  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, (_, i) =>
      ca.reserve({
        bucketName: 'validation',
        maxAmountCents: EACH,
        purpose: `race ${i}`,
        idempotencyKey: `race-${i}`,
        actor: 'test',
      }),
    ),
  );

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const rejected = results.filter((r) => r.status === 'rejected');
  const wrongError = rejected.filter((r) => !(r.reason instanceof InsufficientBucketFundsError));

  check(`exactly ${AFFORDABLE} of ${CONCURRENT} concurrent reservations succeed`, ok === AFFORDABLE, `got ${ok}`);
  check('every rejection is InsufficientBucketFunds, not a crash or deadlock', wrongError.length === 0,
    wrongError.map((r) => String((r.reason as Error).message)).join('; '));

  const { rows: [bucket] } = await pool.query(
    `SELECT allocated_cents, spent_cents, reserved_cents FROM capital_bucket WHERE name='validation'`,
  );
  const overdrawn = Number(bucket.spent_cents) + Number(bucket.reserved_cents) > Number(bucket.allocated_cents);
  check('bucket is NOT overdrawn after the race', !overdrawn,
    `allocated=${bucket.allocated_cents} spent=${bucket.spent_cents} reserved=${bucket.reserved_cents}`);
  check('available is exactly zero', (await ca.availableCents('validation')) === 0);

  // Same key, concurrently: the retry guard must hold under a race too.
  await resetSchema();
  await seedBucket('validation', 1000);
  await disengageKillSwitch();

  const sameKey = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      ca.reserve({ bucketName: 'validation', maxAmountCents: 100, purpose: 'dup', idempotencyKey: 'same-key', actor: 'test' }),
    ),
  );
  const sameKeyOk = sameKey.filter((r) => r.status === 'fulfilled').length;
  const { rows: [dupCount] } = await pool.query(
    `SELECT count(*)::int AS n FROM spend_reservation WHERE idempotency_key='same-key'`,
  );
  check('20 concurrent calls with one key create exactly 1 reservation', dupCount.n === 1, `got ${dupCount.n}`);
  check('only 100 cents are withheld, not 2000', (await ca.availableCents('validation')) === 900,
    `available=${await ca.availableCents('validation')}, fulfilled=${sameKeyOk}`);

  // -- 4. Ledger integrity ---------------------------------------------------
  console.log('\n4. Ledger integrity (CONSTITUTION.md §8)');
  const { rows: [ledger] } = await pool.query(`SELECT count(*)::int AS n FROM ledger_entry`);
  check('reservations wrote ledger entries', ledger.n > 0, `n=${ledger.n}`);

  let ledgerImmutable = false;
  try {
    await pool.query(`UPDATE ledger_entry SET amount_cents = 1 WHERE id = (SELECT min(id) FROM ledger_entry)`);
  } catch {
    ledgerImmutable = true;
  }
  check('ledger rejects UPDATE even from application code', ledgerImmutable);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nTest harness error:', err);
  process.exit(1);
});

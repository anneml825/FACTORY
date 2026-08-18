import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import { CapitalControlUnavailableError, CostController, type CapitalAuthorityPort } from '../portfolio/cost-control.ts';
import {
  INFERENCE_BUCKET,
  InMemoryInferenceUsageJournal,
  InferenceTranche,
  MICROS_PER_CENT,
  TrancheExhaustedError,
  UsageJournalConflictError,
  assertInferenceUsageReconciled,
  centsCeilingFromMicros,
  reconcileInferenceUsage,
} from './inference-accounting.ts';
import { PostgresInferenceUsageJournal } from './postgres-inference-journal.ts';
import { InferenceRouter, MeteredInferenceExecutor, quoteFromProfile, type InferenceAdapter, type InferenceRequest } from '../campaign/inference.ts';

/** $0.00021 per call: the exact magnitude that rounds to zero cents. */
const SUB_CENT_MICROS = 210;

class RecordingAuthority implements CapitalAuthorityPort {
  readonly calls: string[] = [];
  async reserve(input: { idempotencyKey: string; bucketName: string; maxAmountCents: number }) {
    this.calls.push(`reserve:${input.bucketName}:${input.maxAmountCents}`);
    return {
      id: 1,
      idempotencyKey: input.idempotencyKey,
      bucketName: input.bucketName,
      maxAmountCents: input.maxAmountCents,
      state: 'RESERVED' as const,
      wasAlreadyReserved: false,
    };
  }
  async settle(key: string, amount: number) {
    this.calls.push(`settle:${amount}`);
  }
  async release(key: string, actor: string, reason: string) {
    this.calls.push(`release:${reason}`);
  }
}

function usage(index: number, costMicros = SUB_CENT_MICROS) {
  return {
    usageId: `inference:op-${index}`,
    experimentId: `exp-${index % 4}`,
    operationId: `op-${index}`,
    providerId: 'provider-under-test',
    modelId: 'model-under-test',
    task: 'DRAFT',
    inputTokens: 400,
    outputTokens: 120,
    costMicros,
    recordedAt: '2026-08-18T12:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// The defect this file exists for.
// ---------------------------------------------------------------------------

test('REGRESSION: a sub-cent paid operation cannot enter the zero-cost path', async () => {
  // Phase D keyed the "free" branch on `maximumCents === 0`. A real adapter
  // quoting $0.00021 rounds to zero cents, so the operation ran with no
  // reservation, no kill-switch check, and no ledger entry — real money spent
  // entirely outside the Capital Authority (CONSTITUTION.md §6).
  let executed = false;
  const controller = new CostController(null);
  await assert.rejects(
    controller.execute({
      operationId: 'sub-cent',
      reservationIdempotencyKey: 'sub-cent',
      bucketName: INFERENCE_BUCKET,
      maximumCents: 0,
      maximumMicros: SUB_CENT_MICROS,
      currency: 'USD',
      purpose: 'sub-cent inference call',
      actor: 'test',
      run: async () => {
        executed = true;
        return { value: null, actualCostCents: 0, actualCostMicros: SUB_CENT_MICROS };
      },
    }),
    CapitalControlUnavailableError,
  );
  assert.equal(executed, false, 'the provider must not be called without capital authority');
});

test('REGRESSION: a sub-cent operation reserves a whole cent through the Authority', async () => {
  const authority = new RecordingAuthority();
  const result = await new CostController(authority).execute({
    operationId: 'sub-cent',
    reservationIdempotencyKey: 'sub-cent',
    bucketName: INFERENCE_BUCKET,
    maximumCents: 0,
    maximumMicros: SUB_CENT_MICROS,
    currency: 'USD',
    purpose: 'sub-cent inference call',
    actor: 'test',
    run: async () => ({ value: 'ok', actualCostCents: 0, actualCostMicros: SUB_CENT_MICROS }),
  });
  assert.deepEqual(authority.calls, [`reserve:${INFERENCE_BUCKET}:1`, 'settle:1']);
  assert.equal(result.cost.settledCents, 1);
});

test('REGRESSION: an adapter cannot assert a cent ceiling that disagrees with its micros', async () => {
  const adapter: InferenceAdapter = {
    profile: {
      providerId: 'rounds-down',
      modelId: 'legacy',
      tasks: ['DRAFT'],
      qualityScore: 1,
      inputMicrosPerMillionTokens: 1,
      outputMicrosPerMillionTokens: 1,
      credentialState: 'AVAILABLE',
      fixtureOnly: false,
    },
    // The Phase D arithmetic: round to the nearest cent, which is zero.
    quote: () => ({
      estimatedCostMicros: SUB_CENT_MICROS,
      maximumCostMicros: SUB_CENT_MICROS,
      maximumCostCents: Math.round(SUB_CENT_MICROS / MICROS_PER_CENT),
    }),
    execute: async () => {
      throw new Error('must never execute');
    },
  };
  const executor = new MeteredInferenceExecutor(new InferenceRouter([adapter]));
  const request: InferenceRequest = {
    operationId: 'op', experimentId: 'exp', task: 'DRAFT', input: 'x',
    estimatedInputTokens: 100, maximumOutputTokens: 100, minimumQualityScore: 0.5,
  };
  await assert.rejects(
    executor.execute(request, { allowFixture: false }),
    /cent ceiling must be derived from micros/,
  );
});

test('the inference bucket exists in the governance model', () => {
  // Phase D hard-coded `production`, which is not a bucket. Every reservation
  // would have failed. The bucket must be one the migration actually creates.
  const migration = readFileSync('db/migrations/001_owner_configuration.sql', 'utf8');
  assert.match(migration, new RegExp(`\\('${INFERENCE_BUCKET}',`));
  assert.ok(!migration.includes("('production',"));
});

// ---------------------------------------------------------------------------
// Aggregate settlement: the reason per-call rounding is not an acceptable fix.
// ---------------------------------------------------------------------------

test('100 sub-cent calls settle as one aggregate ceiling, not 100 whole cents', async () => {
  const authority = new RecordingAuthority();
  const journal = new InMemoryInferenceUsageJournal();
  const tranche = await InferenceTranche.open({
    trancheId: 'batch-1',
    maximumMicros: 100 * SUB_CENT_MICROS,
    purpose: 'metered generation batch',
    actor: 'test',
    authority,
    journal,
  });
  for (let index = 0; index < 100; index++) {
    tranche.assertAdmits(SUB_CENT_MICROS);
    await tranche.record(usage(index));
  }
  const closed = await tranche.close();
  assert.equal(closed.exactMicros, 21_000);
  assert.equal(closed.settledCents, 3, '21,000 micros is $0.021, which ceilings to 3 cents');
  assert.equal(closed.callCount, 100);
  assert.equal(closed.reservedCents, 3);
  assert.equal(closed.unusedCents, 0);
  // Per-call ceiling would have charged 100 cents for $0.021 of inference — a
  // 47x overstatement against a $50 reserve.
  assert.ok(closed.settledCents < 100);
  assert.deepEqual(authority.calls, [`reserve:${INFERENCE_BUCKET}:3`, 'settle:3']);
});

test('exact per-experiment attribution survives aggregation', async () => {
  const journal = new InMemoryInferenceUsageJournal();
  const tranche = await InferenceTranche.open({
    trancheId: 'batch-attrib',
    maximumMicros: 1_000_000,
    purpose: 'attribution',
    actor: 'test',
    authority: new RecordingAuthority(),
    journal,
  });
  for (let index = 0; index < 8; index++) await tranche.record(usage(index, 500));
  assert.equal(await journal.totalMicrosForExperiment('exp-0'), 1000);
  assert.equal(await journal.totalMicrosForTranche('batch-attrib'), 4000);
  assert.equal((await journal.records('batch-attrib')).length, 8);
});

test('the usage journal is append-only and idempotent', async () => {
  const journal = new InMemoryInferenceUsageJournal();
  const record = { ...usage(1), trancheId: 'journal-only' };
  assert.deepEqual(await journal.append(record), { appended: true, duplicate: false });
  assert.deepEqual(await journal.append(record), { appended: false, duplicate: true });
  await assert.rejects(journal.append({ ...record, costMicros: 999 }), UsageJournalConflictError);
  assert.equal(await journal.totalMicrosForTranche('journal-only'), SUB_CENT_MICROS);
  // A record with no tranche attribution is rejected outright.
  await assert.rejects(
    journal.append({ ...usage(2), trancheId: '' }),
    UsageJournalConflictError,
  );
});

test('a duplicate call does not draw the tranche down twice', async () => {
  const journal = new InMemoryInferenceUsageJournal();
  const tranche = await InferenceTranche.open({
    trancheId: 'batch-dupe',
    maximumMicros: 1000,
    purpose: 'idempotency',
    actor: 'test',
    authority: new RecordingAuthority(),
    journal,
  });
  await tranche.record(usage(1, 400));
  assert.deepEqual(await tranche.record(usage(1, 400)), { duplicate: true });
  assert.equal(tranche.remainingMicros, 600);
});

test('a tranche refuses work beyond its ceiling before the provider is called', async () => {
  const journal = new InMemoryInferenceUsageJournal();
  const tranche = await InferenceTranche.open({
    trancheId: 'batch-tight',
    maximumMicros: 500,
    purpose: 'ceiling',
    actor: 'test',
    authority: new RecordingAuthority(),
    journal,
  });
  await tranche.record(usage(1, 400));
  assert.equal(tranche.admits(400), false);
  assert.throws(() => tranche.assertAdmits(400), TrancheExhaustedError);
});

test('an abandoned tranche releases its reservation', async () => {
  const authority = new RecordingAuthority();
  const tranche = await InferenceTranche.open({
    trancheId: 'batch-abandon',
    maximumMicros: 50_000,
    purpose: 'abandon',
    actor: 'test',
    authority,
    journal: new InMemoryInferenceUsageJournal(),
  });
  await tranche.abandon('batch cancelled before any call');
  assert.deepEqual(authority.calls, [`reserve:${INFERENCE_BUCKET}:5`, 'release:batch cancelled before any call']);
});

// ---------------------------------------------------------------------------
// Reconciliation against provider-reported usage.
// ---------------------------------------------------------------------------

test('reconciliation accepts small provider rounding and halts on material divergence', () => {
  const within = reconcileInferenceUsage({
    journalMicros: 21_000,
    report: { providerId: 'p', periodStart: 'a', periodEnd: 'b', reportedMicros: 21_050 },
  });
  assert.equal(within.reconciled, true);
  assert.equal(within.action, 'ACCEPT');
  assert.doesNotThrow(() => assertInferenceUsageReconciled(within));

  const diverged = reconcileInferenceUsage({
    journalMicros: 21_000,
    report: { providerId: 'p', periodStart: 'a', periodEnd: 'b', reportedMicros: 210_000 },
  });
  assert.equal(diverged.reconciled, false);
  assert.equal(diverged.action, 'HALT');
  assert.throws(() => assertInferenceUsageReconciled(diverged), /differ by 189000 micros/);
});

test('cent conversion is a ceiling in both helpers', () => {
  assert.equal(centsCeilingFromMicros(0), 0);
  assert.equal(centsCeilingFromMicros(1), 1);
  assert.equal(centsCeilingFromMicros(10_000), 1);
  assert.equal(centsCeilingFromMicros(10_001), 2);
  assert.equal(quoteFromProfile(
    { providerId: 'p', modelId: 'm', tasks: ['DRAFT'], qualityScore: 1,
      inputMicrosPerMillionTokens: 1_000_000, outputMicrosPerMillionTokens: 5_000_000,
      credentialState: 'AVAILABLE', fixtureOnly: false },
    { operationId: 'o', experimentId: 'e', task: 'DRAFT', input: '',
      estimatedInputTokens: 3000, maximumOutputTokens: 2000, minimumQualityScore: 0 },
  ).maximumCostMicros, 3000 + 10_000);
});

// ---------------------------------------------------------------------------
// Durability.
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.TEST_DATABASE_URL;

test('PostgreSQL usage journal is append-only at the database level', { skip: !DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const trancheId = `journal-test-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO inference_tranche
         (tranche_id, bucket_name, reservation_idempotency_key, maximum_micros, reserved_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [trancheId, INFERENCE_BUCKET, `inference-tranche:${trancheId}`, 100_000, 10],
    );
    const journal = new PostgresInferenceUsageJournal(pool);
    const record = { ...usage(1), trancheId, usageId: `inference:${trancheId}:op-1` };
    assert.deepEqual(await journal.append(record), { appended: true, duplicate: false });
    assert.deepEqual(await journal.append(record), { appended: false, duplicate: true });
    await assert.rejects(journal.append({ ...record, costMicros: 5 }), UsageJournalConflictError);
    assert.equal(await journal.totalMicrosForTranche(trancheId), SUB_CENT_MICROS);

    await assert.rejects(
      pool.query('UPDATE inference_usage SET cost_micros = 1 WHERE usage_id = $1', [record.usageId]),
      /append-only/,
    );
    await assert.rejects(
      pool.query('DELETE FROM inference_usage WHERE usage_id = $1', [record.usageId]),
      /append-only/,
    );
  } finally {
    await pool.end();
  }
});

test('a tranche cannot settle more than it reserved', { skip: !DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const trancheId = `overdraw-test-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO inference_tranche
         (tranche_id, bucket_name, reservation_idempotency_key, maximum_micros, reserved_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [trancheId, INFERENCE_BUCKET, `inference-tranche:${trancheId}`, 100_000, 10],
    );
    await assert.rejects(
      pool.query('UPDATE inference_tranche SET settled_cents = 11 WHERE tranche_id = $1', [trancheId]),
      /settlement_within_reservation/,
    );
  } finally {
    await pool.end();
  }
});

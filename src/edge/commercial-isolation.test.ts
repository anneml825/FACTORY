/**
 * The separation between the FIXTURE edge and the COMMERCIAL edge.
 *
 * These tests exist because the fixture proof path is destructive by design —
 * it drops and rebuilds its database on every run — and durable commercial
 * history must be structurally out of its reach. Every assertion here is about
 * something being REFUSED. That is the point: the safety of this design is not
 * that the right thing happens, it is that the wrong thing cannot.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { type WorkerEnv } from './worker.ts';
import { SqliteD1 } from './sqlite-d1-shim.ts';
import { D1ObjectStore } from './d1-bindings.ts';
import { fixtureArtifact, FIXTURE_ARTIFACT_KEY } from './fixture-catalog.ts';
import { EDGE_TARGETS, edgeTarget } from './deploy/edge-targets.ts';
import {
  normalizeOwnerMarkers,
  resolveArmsLength,
  type ArmsLengthPolicy,
} from '../portfolio/arms-length-policy.ts';
import type { TransactionClassification } from '../portfolio/types.ts';

const SCHEMA = readFileSync('db/edge/schema.sql', 'utf8');
const RESET = readFileSync('db/edge/reset-fixture.sql', 'utf8');
const ORIGIN = 'https://factory-edge.workers.dev';

async function database(purpose: 'FIXTURE' | 'COMMERCIAL' | null): Promise<SqliteD1> {
  const db = new SqliteD1();
  db.applySchema(SCHEMA);
  if (purpose) {
    db.db.exec(
      `INSERT OR IGNORE INTO edge_deployment_identity (singleton, purpose, database_label, schema_version)
       VALUES (1, '${purpose}', 'test-${purpose.toLowerCase()}', 2)`,
    );
  }
  const artifact = fixtureArtifact();
  await new D1ObjectStore(db).put(FIXTURE_ARTIFACT_KEY, {
    bytes: artifact.bytes,
    mediaType: artifact.mediaType,
    fileName: artifact.fileName,
    sha256: artifact.sha256,
  });
  return db;
}

function env(db: SqliteD1, overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    EDGE_DB: db,
    STRIPE_WEBHOOK_SECRET: 'whsec_isolation',
    WATCH_EVENT_SECRET: 'isolation-watch',
    EDGE_DELIVERY_SECRET: 'isolation-delivery',
    EDGE_INTERNAL_TRAFFIC_TOKEN: 'isolation-internal',
    FIXTURE_CHECKOUT_URL: 'https://buy.stripe.com/test_isolation',
    ...overrides,
  };
}

async function posture(db: SqliteD1, overrides: Partial<WorkerEnv> = {}) {
  const response = await worker.fetch(new Request(`${ORIGIN}/posture`), env(db, overrides));
  assert.equal(response.status, 200);
  return (await response.json()) as {
    deploymentPurpose: string;
    commercialServing: boolean;
    commercialAuthorizations: number;
  };
}

function authorize(db: SqliteD1): void {
  db.db.exec(
    "INSERT INTO commercial_launch_authorization (authorized_by, scope_note) VALUES ('owner', 'test')",
  );
}

// --- the gate ---------------------------------------------------------------

test('commercial serving needs the variable, the purpose, and an authorization', async () => {
  const commercial = await database('COMMERCIAL');
  authorize(commercial);

  // All three present: the only combination that serves.
  assert.equal(
    (await posture(commercial, { COMMERCIAL_SERVING: 'enabled' })).commercialServing,
    true,
  );

  // Remove any one of the three and serving stops.
  assert.equal((await posture(commercial, {})).commercialServing, false);
  assert.equal(
    (await posture(commercial, { COMMERCIAL_SERVING: 'true' })).commercialServing,
    false,
    'only the exact string "enabled" counts',
  );

  const unauthorized = await database('COMMERCIAL');
  assert.equal(
    (await posture(unauthorized, { COMMERCIAL_SERVING: 'enabled' })).commercialServing,
    false,
    'an authorized variable is not an authorized launch',
  );

  const fixture = await database('FIXTURE');
  authorize(fixture);
  assert.equal(
    (await posture(fixture, { COMMERCIAL_SERVING: 'enabled' })).commercialServing,
    false,
    'a fixture database can never serve commercially, however it is configured',
  );
});

test('an unstamped or unreadable database is never commercial', async () => {
  const unstamped = await database(null);
  const seen = await posture(unstamped, { COMMERCIAL_SERVING: 'enabled' });
  assert.equal(seen.deploymentPurpose, 'UNKNOWN');
  assert.equal(seen.commercialServing, false);

  // A database missing the tables entirely must still serve the fixture rather
  // than fail, but must still refuse to call itself commercial.
  const bare = new SqliteD1();
  bare.applySchema(SCHEMA);
  bare.db.exec('DROP TABLE commercial_launch_authorization');
  const degraded = await posture(bare, { COMMERCIAL_SERVING: 'enabled' });
  assert.equal(degraded.deploymentPurpose, 'UNKNOWN');
  assert.equal(degraded.commercialServing, false);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/healthz`), env(bare))).status, 200);
});

// --- immutability -----------------------------------------------------------

test('a database cannot be repurposed once stamped', async () => {
  const commercial = await database('COMMERCIAL');
  assert.throws(
    () => commercial.db.exec("UPDATE edge_deployment_identity SET purpose = 'FIXTURE'"),
    /purpose is immutable/,
  );
  assert.throws(
    () => commercial.db.exec('DELETE FROM edge_deployment_identity'),
    /cannot be deleted/,
  );
  // Re-stamping is a no-op, never a change.
  commercial.db.exec(
    `INSERT OR IGNORE INTO edge_deployment_identity (singleton, purpose, database_label, schema_version)
     VALUES (1, 'FIXTURE', 'someone-elses-label', 2)`,
  );
  const row = commercial.db.prepare('SELECT purpose FROM edge_deployment_identity').get() as {
    purpose: string;
  };
  assert.equal(row.purpose, 'COMMERCIAL');
});

test('launch authorizations are append-only', async () => {
  const commercial = await database('COMMERCIAL');
  authorize(commercial);
  assert.throws(
    () => commercial.db.exec("UPDATE commercial_launch_authorization SET authorized_by = 'someone'"),
    /append-only/,
  );
  assert.throws(
    () => commercial.db.exec('DELETE FROM commercial_launch_authorization'),
    /append-only/,
  );
});

// --- the reset --------------------------------------------------------------

test('the fixture reset destroys fixture state and keeps the identity that fences it', async () => {
  const fixture = await database('FIXTURE');
  fixture.db.exec(
    `INSERT INTO watch_event_inbox (event_id, experiment_key, asset_key, event_type, environment, payload, signature, payload_sha256)
     VALUES ('e1', 'x', 'a', 'PRODUCT_VIEW', 'PROVIDER_TEST', '{}', 'sig', 'sha')`,
  );
  fixture.db.exec(RESET);
  fixture.db.exec(SCHEMA);

  const events = fixture.db.prepare('SELECT count(*) AS n FROM watch_event_inbox').get() as { n: number };
  assert.equal(events.n, 0, 'fixture journal is rebuilt empty');

  const identity = fixture.db.prepare('SELECT purpose FROM edge_deployment_identity').get() as {
    purpose: string;
  };
  assert.equal(identity.purpose, 'FIXTURE', 'the reset must not erase its own permission slip');
});

test('applying the schema to a populated database preserves every durable row', async () => {
  const commercial = await database('COMMERCIAL');
  authorize(commercial);
  commercial.db.exec(
    `INSERT INTO watch_event_inbox (event_id, experiment_key, asset_key, event_type, environment, payload, signature, payload_sha256)
     VALUES ('keep-1', 'x', 'a', 'CHECKOUT_COMPLETED', 'LIVE', '{}', 'sig', 'sha')`,
  );
  commercial.db.exec(
    `INSERT INTO stripe_transaction_reference
       (transaction_id, checkout_session_id, experiment_key, asset_key, classification, gross_cents, currency)
     VALUES ('t1', 'cs_1', 'x', 'a', 'ARM_LENGTH_CUSTOMER', 500, 'USD')`,
  );
  commercial.db.exec(
    `INSERT INTO delivery_grant (grant_id, transaction_id, experiment_key, asset_key, artifact_key, issued_at, expires_at, max_downloads)
     VALUES ('g1', 't1', 'x', 'a', 'k', 'now', 'later', 3)`,
  );

  // A redeploy re-applies the schema. Nothing may be lost by doing so.
  commercial.db.exec(SCHEMA);
  commercial.db.exec(SCHEMA);

  for (const [table, expected] of [
    ['watch_event_inbox', 1],
    ['stripe_transaction_reference', 1],
    ['delivery_grant', 1],
    ['commercial_launch_authorization', 1],
  ] as const) {
    const row = commercial.db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number };
    assert.equal(row.n, expected, `${table} survived a repeated schema apply`);
  }
});

// --- targets ----------------------------------------------------------------

test('fixture and commercial resolve to different everything', () => {
  const fixture = edgeTarget('fixture');
  const commercial = edgeTarget('commercial');
  assert.notEqual(fixture.workerName, commercial.workerName);
  assert.notEqual(fixture.databaseName, commercial.databaseName);
  assert.notEqual(fixture.objectScope, commercial.objectScope);
  assert.equal(fixture.resettable, true);
  assert.equal(commercial.resettable, false, 'commercial state is never rebuilt from scratch');
  assert.throws(() => edgeTarget('production'), /Unknown edge target/);
  assert.throws(() => edgeTarget(undefined), /Unknown edge target/);
  assert.equal(Object.values(EDGE_TARGETS).filter((target) => target.resettable).length, 1);
});

test('wrangler.toml and edge-targets.ts have not drifted apart', () => {
  const config = readFileSync('wrangler.toml', 'utf8');
  const fixture = edgeTarget('fixture');
  const commercial = edgeTarget('commercial');

  // The fixture edge is the top-level configuration.
  assert.match(config, new RegExp(`^name = "${fixture.workerName}"$`, 'm'));
  assert.match(config, new RegExp(`^database_name = "${fixture.databaseName}"$`, 'm'));

  // The commercial edge is its own environment, pointing somewhere else.
  const header = new RegExp(`^\\[env\\.${commercial.wranglerEnvironment}\\]$`, 'm').exec(config);
  assert.ok(header, 'the commercial environment block exists');
  const environment = config.slice(header.index);
  assert.match(environment, new RegExp(`^name = "${commercial.workerName}"$`, 'm'));
  assert.match(environment, new RegExp(`^database_name = "${commercial.databaseName}"$`, 'm'));
  assert.ok(
    !environment.includes(`database_name = "${fixture.databaseName}"`),
    'the commercial environment must not bind the fixture database',
  );
});

// --- arm's-length ------------------------------------------------------------

test('the arm\'s-length filter can only ever downgrade', () => {
  const policy: ArmsLengthPolicy = { ownerMarkers: normalizeOwnerMarkers('owner@f.test, @house.test') };
  const declarations: TransactionClassification[] = [
    'ARM_LENGTH_CUSTOMER',
    'OWNER_TEST',
    'INTERNAL_TEST',
    'OTHER_OR_UNKNOWN',
  ];
  const emails = [null, '', 'stranger@elsewhere.test', 'owner@f.test', 'anyone@house.test', 'OWNER@F.TEST'];

  for (const declared of declarations) {
    for (const buyerEmail of emails) {
      const resolved = resolveArmsLength({ declared, buyerEmail, policy });
      if (declared !== 'ARM_LENGTH_CUSTOMER') {
        assert.equal(resolved.classification, declared, 'non-arm\'s-length inputs pass through');
      }
      assert.notEqual(
        resolved.classification === 'ARM_LENGTH_CUSTOMER' && declared !== 'ARM_LENGTH_CUSTOMER',
        true,
        'nothing may be upgraded to arm\'s-length',
      );
    }
  }

  assert.equal(
    resolveArmsLength({ declared: 'ARM_LENGTH_CUSTOMER', buyerEmail: 'OWNER@F.TEST', policy })
      .classification,
    'OWNER_TEST',
  );
  assert.equal(
    resolveArmsLength({ declared: 'ARM_LENGTH_CUSTOMER', buyerEmail: 'x@house.test', policy })
      .classification,
    'OWNER_TEST',
  );
  assert.equal(
    resolveArmsLength({ declared: 'ARM_LENGTH_CUSTOMER', buyerEmail: null, policy }).classification,
    'OTHER_OR_UNKNOWN',
    'an unidentified buyer cannot be asserted to be a stranger',
  );
  assert.equal(
    resolveArmsLength({ declared: 'ARM_LENGTH_CUSTOMER', buyerEmail: 'stranger@elsewhere.test', policy })
      .classification,
    'ARM_LENGTH_CUSTOMER',
    'a genuine stranger is left alone',
  );
});

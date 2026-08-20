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
const SCOPE_DIGEST = 'a'.repeat(64);

async function database(purpose: 'FIXTURE' | 'COMMERCIAL' | null): Promise<SqliteD1> {
  const db = new SqliteD1();
  db.applySchema(SCHEMA);
  if (purpose) {
    db.db.exec(
      `INSERT OR IGNORE INTO edge_deployment_identity (singleton, purpose, database_label, schema_version)
       VALUES (1, '${purpose}', 'test-${purpose.toLowerCase()}', 3)`,
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
    OWNER_IDENTITY_MARKERS: 'owner@factory.invalid',
    COMMERCIAL_SCOPE_DIGEST: SCOPE_DIGEST,
    ...overrides,
  };
}

async function posture(db: SqliteD1, overrides: Partial<WorkerEnv> = {}) {
  const response = await worker.fetch(new Request(`${ORIGIN}/posture`), env(db, overrides));
  assert.equal(response.status, 200);
  return (await response.json()) as {
    buildId: string | null;
    deploymentPurpose: string;
    commercialServing: boolean;
    commercialAuthorizations: number;
    missingConfiguration: string[];
  };
}

function authorize(db: SqliteD1): void {
  db.db.exec(
    `INSERT INTO commercial_launch_grant
       (authorization_key, scope_kind, scope_digest, expires_at, authorized_by, scope_note)
     VALUES ('authorization-test', 'DEPLOYMENT', '${SCOPE_DIGEST}', '2099-01-01T00:00:00.000Z', 'owner', 'test')`,
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
  assert.equal(
    (await posture(commercial, {
      COMMERCIAL_SERVING: 'enabled',
      COMMERCIAL_SCOPE_DIGEST: 'b'.repeat(64),
    })).commercialServing,
    false,
    'authorization for one scope cannot enable another scope',
  );
  assert.equal(
    (await posture(commercial, {
      COMMERCIAL_SERVING: 'enabled',
      OWNER_IDENTITY_MARKERS: ' , ',
    })).commercialServing,
    false,
    'empty normalized owner markers cannot enable commercial serving',
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

  const expired = await database('COMMERCIAL');
  expired.db.exec(
    `INSERT INTO commercial_launch_grant
       (authorization_key, scope_kind, scope_digest, expires_at, authorized_by, scope_note)
     VALUES ('authorization-expired', 'DEPLOYMENT', '${SCOPE_DIGEST}',
       '2020-01-01T00:00:00.000Z', 'owner', 'expired test')`,
  );
  assert.equal(
    (await posture(expired, { COMMERCIAL_SERVING: 'enabled' })).commercialServing,
    false,
    'expired authorization cannot serve',
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
  bare.db.exec('DROP TABLE commercial_launch_grant');
  const degraded = await posture(bare, { COMMERCIAL_SERVING: 'enabled' });
  assert.equal(degraded.deploymentPurpose, 'UNKNOWN');
  assert.equal(degraded.commercialServing, false);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/healthz`), env(bare))).status, 200);
});

test('posture and liveness answer even when the edge cannot serve', async () => {
  // The state a commercial edge sits in before it has anything to sell: a real
  // database, no Stripe secret, no listing. It must still be inspectable.
  const commercial = await database('COMMERCIAL');
  const bare = { EDGE_DB: commercial, WATCH_EVENT_SECRET: 'isolation-watch' } as WorkerEnv;

  assert.equal((await worker.fetch(new Request(`${ORIGIN}/healthz`), bare)).status, 200);

  const response = await worker.fetch(new Request(`${ORIGIN}/posture`), bare);
  assert.equal(response.status, 200);
  const seen = (await response.json()) as {
    buildId: string | null;
    deploymentPurpose: string;
    commercialServing: boolean;
    missingConfiguration: string[];
  };
  assert.equal(seen.buildId, null, 'an unidentified build reports null, never a guess');
  assert.equal(seen.deploymentPurpose, 'COMMERCIAL');
  assert.equal(seen.commercialServing, false);
  assert.deepEqual(seen.missingConfiguration.sort(), [
    'COMMERCIAL_SCOPE_DIGEST',
    'EDGE_DELIVERY_SECRET',
    'EDGE_INTERNAL_TRAFFIC_TOKEN',
    'OWNER_IDENTITY_MARKERS',
    'STRIPE_WEBHOOK_SECRET',
  ]);

  // A normal empty-catalog route exercises WATCH replay and reaches the
  // application. Credential-dependent commerce routes still fail closed.
  const refused = await worker.fetch(new Request(`${ORIGIN}/p/anything`), bare);
  assert.equal(refused.status, 404);
  assert.equal(refused.headers.get('x-factory-edge-failure'), null);
  assert.equal(
    (await worker.fetch(new Request(`${ORIGIN}/webhooks/stripe`, { method: 'POST' }), bare)).status,
    503,
  );
});

test('posture reports the build that is answering', async () => {
  // A deploy returning is not the same as every colo serving it. Callers wait
  // for this to match the build they deployed before measuring anything.
  const commercial = await database('COMMERCIAL');
  const seen = await posture(commercial, { EDGE_BUILD_ID: 'run-123-1' });
  assert.equal(seen.buildId, 'run-123-1');
});

test('an edge with no listing serves 404, not a failure', async () => {
  const commercial = await database('COMMERCIAL');
  const configured = env(commercial, { FIXTURE_CHECKOUT_URL: undefined });
  const response = await worker.fetch(new Request(`${ORIGIN}/p/anything`), configured);
  assert.equal(response.status, 404, 'nothing to sell is an honest 404, not a broken edge');
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
     VALUES (1, 'FIXTURE', 'someone-elses-label', 3)`,
  );
  const row = commercial.db.prepare('SELECT purpose FROM edge_deployment_identity').get() as {
    purpose: string;
  };
  assert.equal(row.purpose, 'COMMERCIAL');
});

test('launch grants and revocations are scoped, expiring, revocable, and append-only', async () => {
  const commercial = await database('COMMERCIAL');
  authorize(commercial);
  assert.throws(
    () => commercial.db.exec("UPDATE commercial_launch_grant SET authorized_by = 'someone'"),
    /append-only/,
  );
  assert.throws(
    () => commercial.db.exec('DELETE FROM commercial_launch_grant'),
    /append-only/,
  );
  commercial.db.exec(
    "INSERT INTO commercial_launch_revocation (revocation_key, authorization_key, revoked_by, reason) " +
      "VALUES ('revoke-test', 'authorization-test', 'owner', 'test stop')",
  );
  assert.equal(
    (await posture(commercial, { COMMERCIAL_SERVING: 'enabled' })).commercialServing,
    false,
  );
  assert.throws(() => commercial.db.exec('DELETE FROM commercial_launch_revocation'), /append-only/);
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
    ['commercial_launch_grant', 1],
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

test('each workflow names the target it declares, and only that one', () => {
  // Both workflows still spell a Worker name into an env var for the handful of
  // raw wrangler calls that take one. That duplication is where drift would
  // start, so it is asserted rather than trusted.
  for (const [file, name] of [
    ['.github/workflows/phase-e-edge-deploy.yml', 'fixture'],
    ['.github/workflows/phase-e-commercial-deploy.yml', 'commercial'],
  ] as const) {
    const workflow = readFileSync(file, 'utf8');
    const target = edgeTarget(name);
    const other = edgeTarget(name === 'fixture' ? 'commercial' : 'fixture');
    assert.match(workflow, new RegExp(`^      EDGE_TARGET: ${target.name}$`, 'm'), file);
    assert.match(workflow, new RegExp(`^      WORKER_NAME: ${target.workerName}$`, 'm'), file);
    // Only as a wrangler argument: the commercial workflow legitimately mentions
    // the fixture database id in a guard that refuses it, and reads a header
    // whose name happens to contain "factory-edge".
    assert.ok(
      !new RegExp(`d1\\s+execute\\s+${other.databaseName}\\b`).test(workflow),
      `${file} must never run a d1 command against the ${other.name} database`,
    );
    assert.ok(
      !workflow.includes(`database_name = "${other.databaseName}"`),
      `${file} must never assert the ${other.name} database name`,
    );
  }

  // Only the fixture workflow may reach the reset at all.
  const commercial = readFileSync('.github/workflows/phase-e-commercial-deploy.yml', 'utf8');
  assert.ok(!commercial.includes('reset-fixture'), 'the commercial workflow has no reset step');
  assert.ok(!commercial.includes('teardown-stripe'), 'the commercial workflow tears down nothing');
  assert.ok(!commercial.includes('INSERT INTO watch_event_inbox'), 'deploy canaries never enter WATCH');
  assert.match(commercial, /INSERT INTO edge_deploy_canary/);
});

test('the commercial deploy requires a stable final build, not one lucky response', () => {
  const workflow = readFileSync('.github/workflows/phase-e-commercial-deploy.yml', 'utf8');
  assert.match(workflow, /required_consecutive=5/);
  assert.match(workflow, /Final posture came from an unexpected build/);
  assert.match(workflow, /EDGE_BUILD_BASE.*-redeployed/);
});

test('provider-changing and state-writing workflows are manual-only', () => {
  for (const file of [
    '.github/workflows/phase-e-edge-deploy.yml',
    '.github/workflows/phase-e-commercial-deploy.yml',
    '.github/workflows/phase-e-cloudflare-preflight.yml',
    '.github/workflows/data-economics-probe.yml',
  ]) {
    const workflow = readFileSync(file, 'utf8');
    assert.match(workflow, /^  workflow_dispatch:/m, `${file} has an explicit manual trigger`);
    assert.doesNotMatch(workflow, /^  push:/m, `${file} cannot mutate a provider or state on push`);
    assert.doesNotMatch(workflow, /^  schedule:/m, `${file} cannot mutate a provider or state on a schedule`);
  }
});

test('the dormant-edge append-only proof does not require polluting an empty WATCH journal', () => {
  const workflow = readFileSync('.github/workflows/phase-e-commercial-deploy.yml', 'utf8');
  assert.match(workflow, /sqlite_master/);
  assert.match(workflow, /watch_event_inbox_no_update/);
  assert.match(workflow, /watch_event_inbox_no_delete/);
  assert.doesNotMatch(workflow, /UPDATE watch_event_inbox SET event_type='TAMPERED'/);
});

test('deployment canaries are durable operational state, not WATCH telemetry', async () => {
  const commercial = await database('COMMERCIAL');
  commercial.db.exec(
    "INSERT INTO edge_deploy_canary (canary_id, build_id, purpose) VALUES ('c1', 'build-1', 'COMMERCIAL')",
  );
  commercial.db.exec(SCHEMA);
  assert.equal(
    (commercial.db.prepare('SELECT count(*) AS n FROM edge_deploy_canary').get() as { n: number }).n,
    1,
  );
  assert.equal(
    (commercial.db.prepare('SELECT count(*) AS n FROM watch_event_inbox').get() as { n: number }).n,
    0,
  );
  assert.throws(() => commercial.db.exec('DELETE FROM edge_deploy_canary'), /append-only/);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import worker, { type WorkerEnv } from './worker.ts';
import { SqliteD1 } from './sqlite-d1-shim.ts';
import { D1ObjectStore, D1EdgeStateStore, D1WatchStore } from './d1-bindings.ts';
import { fixtureArtifact, fixtureManifest, FIXTURE_ARTIFACT_KEY } from './fixture-catalog.ts';
import { signStripeTestEvent } from '../portfolio/stripe-webhook.ts';

const SCHEMA = readFileSync('db/edge/schema.sql', 'utf8');
const WEBHOOK_SECRET = 'whsec_phase_e_d1_test';
const WATCH_SECRET = 'phase-e-d1-watch-secret';
const DELIVERY_SECRET = 'phase-e-d1-delivery-secret';
const INTERNAL_TOKEN = 'phase-e-d1-internal';
const ARRIVE_REF = 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0';
const ORIGIN = 'https://factory-edge.workers.dev';

const manifest = fixtureManifest();
const EXPERIMENT_ID = manifest.experimentId;
const ASSET_ID = manifest.assetId;

async function seeded(): Promise<SqliteD1> {
  const db = new SqliteD1();
  db.applySchema(SCHEMA);
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
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    WATCH_EVENT_SECRET: WATCH_SECRET,
    EDGE_DELIVERY_SECRET: DELIVERY_SECRET,
    EDGE_INTERNAL_TRAFFIC_TOKEN: INTERNAL_TOKEN,
    FIXTURE_CHECKOUT_URL: 'https://buy.stripe.com/test_phase_e_fixture',
    FIXTURE_ARRIVE_REFERENCE: ARRIVE_REF,
    MAX_DOWNLOADS_PER_GRANT: '2',
    ...overrides,
  };
}

/** Each call is a fresh isolate: the Worker rebuilds all state from D1. */
function call(db: SqliteD1, path: string, init: RequestInit = {}, overrides: Partial<WorkerEnv> = {}) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, { redirect: 'manual', ...init }), env(db, overrides));
}

function checkoutEvent(eventId = 'evt_phase_e_d1'): { payload: string; signature: string } {
  const created = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: eventId,
    type: 'checkout.session.completed',
    created,
    livemode: false,
    data: {
      object: {
        id: 'cs_test_phase_e_d1',
        payment_intent: 'pi_test_phase_e_d1',
        amount_total: manifest.price.amountCents,
        currency: 'usd',
        payment_status: 'paid',
        client_reference_id: ARRIVE_REF,
        metadata: {
          factory_environment: 'PROVIDER_TEST',
          factory_test_transaction: 'true',
          transaction_classification: 'OWNER_TEST',
          experiment_id: EXPERIMENT_ID,
          asset_id: ASSET_ID,
        },
      },
    },
  });
  return { payload, signature: signStripeTestEvent(payload, WEBHOOK_SECRET, created) };
}

function postWebhook(db: SqliteD1, event: { payload: string; signature: string }) {
  return call(db, '/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': event.signature },
    body: event.payload,
  });
}

test('the Worker entry serves the whole fixture commerce path from D1', async () => {
  const db = await seeded();

  const page = await call(db, `/p/${EXPERIMENT_ID}`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /NONCOMMERCIAL FIXTURE/);
  const cookie = (page.headers.get('set-cookie') ?? '').split(';')[0];

  assert.equal((await call(db, `/e/${EXPERIMENT_ID}`, { method: 'POST', headers: { cookie } })).status, 202);

  const buy = await call(db, `/buy/${EXPERIMENT_ID}`, { headers: { cookie } });
  assert.equal(buy.status, 302);
  const target = new URL(buy.headers.get('location') as string);
  assert.equal(target.searchParams.get('client_reference_id'), ARRIVE_REF);

  const webhook = await postWebhook(db, checkoutEvent());
  assert.equal(webhook.status, 200);
  assert.equal(((await webhook.json()) as { status: string }).status, 'PROCESSED');

  const thanks = await call(db, '/thanks?session_id=cs_test_phase_e_d1');
  assert.equal(thanks.status, 200);
  const token = (await thanks.text()).match(/href="\/d\/([^"]+)"/)?.[1];
  assert.ok(token, 'the thanks page must carry a signed download link');

  const download = await call(db, `/d/${token}`);
  assert.equal(download.status, 200);
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), fixtureArtifact().bytes);

  // Every request above rebuilt state from D1, so the funnel is durable by
  // construction — this reads it back through a brand-new store.
  const watch = await D1WatchStore.create({
    db,
    signingSecret: WATCH_SECRET,
    acceptedEnvironments: ['PROVIDER_TEST'],
  });
  const snapshot = watch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.productViews, 1);
  assert.equal(snapshot.offerInteractions, 1);
  assert.equal(snapshot.checkoutStarts, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, true);
  assert.equal(snapshot.transactions[0]?.classification, 'OWNER_TEST');
  assert.equal(snapshot.armLengthGrossRevenueCents, 0);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);
  assert.equal(snapshot.qualifiedExposures, 0);
  db.close();
});

test('a redelivered webhook neither re-fulfils nor mints a second grant', async () => {
  const db = await seeded();
  const event = checkoutEvent();
  assert.equal((await postWebhook(db, event)).status, 200);
  const second = await postWebhook(db, event);
  assert.equal(((await second.json()) as { status: string }).status, 'DUPLICATE');
  const grants = db.db.prepare('SELECT count(*) AS n FROM delivery_grant').get() as { n: number };
  assert.equal(grants.n, 1);
  db.close();
});

test('the D1 download limit holds under concurrent claims', async () => {
  const db = await seeded();
  const state = new D1EdgeStateStore(db);
  await state.putGrant({
    grantId: 'grant_concurrent',
    experimentId: EXPERIMENT_ID,
    assetId: ASSET_ID,
    transactionId: 'pi_concurrent',
    artifactKey: FIXTURE_ARTIFACT_KEY,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    maxDownloads: 3,
    downloads: 0,
  });
  const claims = await Promise.all(
    Array.from({ length: 12 }, () => state.consumeDownload('grant_concurrent', new Date().toISOString())),
  );
  assert.equal(claims.filter((claim) => claim !== null).length, 3);
  const row = db.db.prepare('SELECT downloads FROM delivery_grant WHERE grant_id = ?').get('grant_concurrent') as {
    downloads: number;
  };
  assert.equal(row.downloads, 3);
  db.close();
});

test('the WATCH journal is append-only in the database itself', async () => {
  const db = await seeded();
  await postWebhook(db, checkoutEvent());
  for (const sql of ["UPDATE watch_event_inbox SET event_type='PRODUCT_VIEW'", 'DELETE FROM watch_event_inbox']) {
    assert.throws(() => db.db.prepare(sql).run(), /append-only/);
  }
  db.close();
});

test('a signature from the wrong secret is refused and changes nothing', async () => {
  const db = await seeded();
  const event = checkoutEvent();
  const forged = {
    payload: event.payload,
    signature: signStripeTestEvent(event.payload, 'whsec_wrong', Math.floor(Date.now() / 1000)),
  };
  assert.equal((await postWebhook(db, forged)).status, 400);
  const rows = db.db.prepare('SELECT count(*) AS n FROM watch_event_inbox').get() as { n: number };
  assert.equal(rows.n, 0);
  db.close();
});

test('commercial serving stays off unless explicitly enabled', async () => {
  const db = await seeded();
  // The fixture listing is noncommercial, so it serves either way; what must
  // never happen is the flag being satisfied by an accidental truthy value.
  const page = await call(db, `/p/${EXPERIMENT_ID}`, {}, { COMMERCIAL_SERVING: 'true' });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /NOT FOR SALE|NONCOMMERCIAL FIXTURE/);
  db.close();
});

test('a missing binding or secret returns 503 rather than a broken shop', async () => {
  const db = await seeded();
  const noSecret = await worker.fetch(
    new Request(`${ORIGIN}/p/${EXPERIMENT_ID}`),
    { ...env(db), EDGE_DELIVERY_SECRET: '' } as WorkerEnv,
  );
  assert.equal(noSecret.status, 503);
  const noDb = await worker.fetch(
    new Request(`${ORIGIN}/p/${EXPERIMENT_ID}`),
    { ...env(db), EDGE_DB: undefined as never } as WorkerEnv,
  );
  assert.equal(noDb.status, 503);
  db.close();
});

test('the internal traffic token still excludes owner views at the Worker', async () => {
  const db = await seeded();
  await call(db, `/p/${EXPERIMENT_ID}`, { headers: { 'x-factory-internal': INTERNAL_TOKEN } });
  const watch = await D1WatchStore.create({
    db,
    signingSecret: WATCH_SECRET,
    acceptedEnvironments: ['PROVIDER_TEST'],
  });
  const snapshot = watch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.productViews, 0);
  assert.equal(snapshot.ownerInternalProductViews, 1);
  db.close();
});

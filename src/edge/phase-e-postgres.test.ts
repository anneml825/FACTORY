import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { shortDocumentFixture } from '../portfolio/fixtures.ts';
import { renderAsset } from '../portfolio/renderers.ts';
import { PostgresWatchStore } from '../portfolio/durable-watch.ts';
import { PostgresStripeWebhookStateStore } from '../portfolio/postgres-stripe-webhook-state.ts';
import { StripeTestWebhookProcessor, signStripeTestEvent } from '../portfolio/stripe-webhook.ts';
import type { FunnelEvent, SignedEventEnvelope } from '../portfolio/types.ts';
import { EdgeDeliveryFulfillment } from './router.ts';
import { startEdgeServer } from './server.ts';
import { MemoryCatalogStore, MemoryObjectStore } from './memory-bindings.ts';
import { PostgresEdgeStateStore } from './postgres-bindings.ts';
import type { EdgeEnvironment } from './types.ts';

const databaseUrl = process.env.TEST_DATABASE_URL;
const INTERNAL_EVENT_SECRET = 'phase-e-postgres-internal-secret';
const WEBHOOK_SECRET = 'whsec_phase_e_postgres';
const DELIVERY_SECRET = 'phase-e-postgres-delivery';
const NOW_SECONDS = 1_776_499_200;
const EXPERIMENT_ID = 'phase-a-doc-001';
const ASSET_ID = 'fixture-doc-001';
const ARTIFACT_KEY = 'artifacts/phase-e/postgres-fixture.html';
const ARRIVE_REFERENCE = 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0';

function signEvent(event: FunnelEvent): SignedEventEnvelope {
  const payload = JSON.stringify(event);
  return { payload, signature: createHmac('sha256', INTERNAL_EVENT_SECRET).update(payload).digest('hex') };
}

function checkoutCompleted(): { payload: string; signature: string } {
  const payload = JSON.stringify({
    id: 'evt_phase_e_pg_checkout',
    type: 'checkout.session.completed',
    created: NOW_SECONDS,
    livemode: false,
    data: {
      object: {
        id: 'cs_test_phase_e_pg',
        payment_intent: 'pi_test_phase_e_pg',
        amount_total: 1200,
        currency: 'usd',
        payment_status: 'paid',
        client_reference_id: ARRIVE_REFERENCE,
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
  return { payload, signature: signStripeTestEvent(payload, WEBHOOK_SECRET, NOW_SECONDS) };
}

/**
 * The same fixture path as `phase-e.test.ts`, but every durable boundary is
 * PostgreSQL and the edge is torn down and rebuilt mid-flight. A restart must
 * not void a paid-for download, re-fulfill a processed webhook, or lose the
 * first-party funnel.
 */
test('the edge survives a restart with durable WATCH, webhook state, and delivery grants', {
  skip: !databaseUrl,
}, async (t) => {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  t.after(() => pool.end());

  await pool.query('TRUNCATE watch_event_inbox RESTART IDENTITY');
  await pool.query('TRUNCATE stripe_webhook_inbox RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE stripe_transaction_reference RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE delivery_download, delivery_reference, delivery_grant RESTART IDENTITY CASCADE');

  const manifest = shortDocumentFixture();
  const artifact = renderAsset(manifest);
  const objects = new MemoryObjectStore();
  await objects.put(ARTIFACT_KEY, {
    bytes: artifact.bytes,
    mediaType: artifact.mediaType,
    fileName: artifact.fileName,
    sha256: artifact.sha256,
  });
  const catalog = new MemoryCatalogStore();
  catalog.register({
    experimentId: EXPERIMENT_ID,
    assetId: ASSET_ID,
    title: 'Phase E durable fixture',
    summary: 'Noncommercial fixture proving the durable commerce path.',
    priceCents: 1200,
    currency: 'USD',
    checkoutUrl: 'https://buy.stripe.com/test_factory_fixture',
    artifactKey: ARTIFACT_KEY,
    noncommercialFixture: true,
    environment: 'PROVIDER_TEST',
    arrivalPublicationId: ARRIVE_REFERENCE,
  });

  let fulfillmentAttempts = 0;
  const buildEnvironment = async (): Promise<EdgeEnvironment> => {
    const state = new PostgresEdgeStateStore(pool);
    const watch = await PostgresWatchStore.create({
      pool,
      signingSecret: INTERNAL_EVENT_SECRET,
      acceptedEnvironments: ['PROVIDER_TEST'],
    });
    const inner = new EdgeDeliveryFulfillment({
      objects,
      state,
      catalog,
      now: () => new Date(NOW_SECONDS * 1000),
      ttlSeconds: 3600,
      maxDownloads: 1,
    });
    return {
      objects,
      catalog,
      state,
      watch,
      stripe: new StripeTestWebhookProcessor({
        webhookSecret: WEBHOOK_SECRET,
        internalEventSecret: INTERNAL_EVENT_SECRET,
        state: new PostgresStripeWebhookStateStore(pool),
        watch,
        fulfillment: {
          async fulfill(request) {
            fulfillmentAttempts++;
            return inner.fulfill(request);
          },
        },
        nowSeconds: () => NOW_SECONDS,
      }),
      signEvent,
      deliverySecret: DELIVERY_SECRET,
      internalTrafficToken: 'phase-e-owner-internal',
      allowCommercialListings: false,
      deploymentPurpose: 'FIXTURE' as const,
      commercialAuthorizations: 0,
      now: () => new Date(NOW_SECONDS * 1000),
      deliveryTtlSeconds: 3600,
      maxDownloadsPerGrant: 1,
    };
  };

  // --- first process ------------------------------------------------------
  const first = await startEdgeServer(await buildEnvironment());
  const page = await fetch(`${first.origin}/p/${EXPERIMENT_ID}`);
  const cookie = (page.headers.get('set-cookie') ?? '').split(';')[0];
  await fetch(`${first.origin}/e/${EXPERIMENT_ID}`, { method: 'POST', headers: { cookie } });
  await fetch(`${first.origin}/buy/${EXPERIMENT_ID}`, { headers: { cookie }, redirect: 'manual' });
  const event = checkoutCompleted();
  const webhook = await fetch(`${first.origin}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'stripe-signature': event.signature },
    body: event.payload,
  });
  assert.equal(webhook.status, 200);
  await first.close();

  assert.equal(
    (await pool.query('SELECT count(*)::int AS count FROM delivery_grant')).rows[0].count,
    1,
  );

  // --- restart ------------------------------------------------------------
  const second = await startEdgeServer(await buildEnvironment());
  t.after(() => second.close());

  // The funnel replayed from PostgreSQL, not from process memory.
  const restartedWatch = await PostgresWatchStore.create({
    pool,
    signingSecret: INTERNAL_EVENT_SECRET,
    acceptedEnvironments: ['PROVIDER_TEST'],
  });
  const snapshot = restartedWatch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.productViews, 1);
  assert.equal(snapshot.offerInteractions, 1);
  assert.equal(snapshot.checkoutStarts, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, true);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);
  assert.equal(snapshot.qualifiedExposures, 0);

  // A redelivered webhook after restart neither re-fulfills nor re-grants.
  const redelivered = await fetch(`${second.origin}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'stripe-signature': event.signature },
    body: event.payload,
  });
  assert.equal(((await redelivered.json()) as { status: string }).status, 'DUPLICATE');
  assert.equal(fulfillmentAttempts, 1);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM delivery_grant')).rows[0].count, 1);

  // The buyer's download still works after the restart, and only once.
  const thanks = await fetch(`${second.origin}/thanks?session_id=cs_test_phase_e_pg`);
  assert.equal(thanks.status, 200);
  const token = (await thanks.text()).match(/href="\/d\/([^"]+)"/)?.[1];
  assert.ok(token);
  const download = await fetch(`${second.origin}/d/${token}`);
  assert.equal(download.status, 200);
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), artifact.bytes);
  assert.equal((await fetch(`${second.origin}/d/${token}`)).status, 410);
  assert.equal(
    (await pool.query('SELECT count(*)::int AS count FROM delivery_download')).rows[0].count,
    1,
  );
});

test('the durable download counter cannot be exceeded by concurrent requests', {
  skip: !databaseUrl,
}, async (t) => {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  t.after(() => pool.end());
  await pool.query('TRUNCATE delivery_download, delivery_reference, delivery_grant RESTART IDENTITY CASCADE');

  const state = new PostgresEdgeStateStore(pool);
  await state.putGrant({
    grantId: 'grant_concurrent',
    experimentId: EXPERIMENT_ID,
    assetId: ASSET_ID,
    transactionId: 'pi_concurrent',
    artifactKey: ARTIFACT_KEY,
    issuedAt: new Date(NOW_SECONDS * 1000).toISOString(),
    expiresAt: new Date((NOW_SECONDS + 3600) * 1000).toISOString(),
    maxDownloads: 3,
    downloads: 0,
  });
  const attempts = await Promise.all(
    Array.from({ length: 12 }, () =>
      state.consumeDownload('grant_concurrent', new Date(NOW_SECONDS * 1000).toISOString()),
    ),
  );
  assert.equal(attempts.filter((result) => result !== null).length, 3);
  assert.equal(
    (await pool.query('SELECT downloads FROM delivery_grant WHERE grant_id = $1', ['grant_concurrent'])).rows[0]
      .downloads,
    3,
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { shortDocumentFixture } from '../portfolio/fixtures.ts';
import { renderAsset } from '../portfolio/renderers.ts';
import { InMemoryWatchStore } from '../portfolio/watch.ts';
import {
  InMemoryStripeWebhookStateStore,
  StripeTestWebhookProcessor,
  signStripeTestEvent,
} from '../portfolio/stripe-webhook.ts';
import type { FunnelEvent, SignedEventEnvelope } from '../portfolio/types.ts';
import { createHmac } from 'node:crypto';
import { EdgeDeliveryFulfillment } from './router.ts';
import { startEdgeServer, type EdgeServer } from './server.ts';
import { MemoryCatalogStore, MemoryEdgeStateStore, MemoryObjectStore } from './memory-bindings.ts';
import { mintDeliveryToken } from './delivery.ts';
import type { EdgeEnvironment } from './types.ts';

const WEBHOOK_SECRET = 'whsec_phase_e_test_fixture';
const INTERNAL_EVENT_SECRET = 'phase-e-internal-event-secret';
const DELIVERY_SECRET = 'phase-e-delivery-secret';
const INTERNAL_TRAFFIC_TOKEN = 'phase-e-owner-internal';
const NOW_SECONDS = 1_776_499_200;
const NOW_ISO = new Date(NOW_SECONDS * 1000).toISOString();

const EXPERIMENT_ID = 'phase-a-doc-001';
const ASSET_ID = 'fixture-doc-001';
const ARTIFACT_KEY = 'artifacts/phase-a-doc-001/fixture.html';

function signEvent(event: FunnelEvent): SignedEventEnvelope {
  const payload = JSON.stringify(event);
  return { payload, signature: createHmac('sha256', INTERNAL_EVENT_SECRET).update(payload).digest('hex') };
}

interface Harness {
  env: EdgeEnvironment;
  watch: InMemoryWatchStore;
  objects: MemoryObjectStore;
  state: MemoryEdgeStateStore;
  server: EdgeServer;
  clock: { value: Date };
  fulfillmentAttempts: () => number;
}

async function harness(options: {
  omitArtifact?: boolean;
  commercialListing?: boolean;
  allowCommercialListings?: boolean;
} = {}): Promise<Harness> {
  const manifest = shortDocumentFixture();
  const artifact = renderAsset(manifest);
  const objects = new MemoryObjectStore();
  if (!options.omitArtifact) {
    await objects.put(ARTIFACT_KEY, {
      bytes: artifact.bytes,
      mediaType: artifact.mediaType,
      fileName: artifact.fileName,
      sha256: artifact.sha256,
    });
  }
  const catalog = new MemoryCatalogStore();
  catalog.register({
    experimentId: EXPERIMENT_ID,
    assetId: ASSET_ID,
    title: 'Phase E fixture offer',
    summary: 'A noncommercial fixture used to prove the commerce path end to end.',
    priceCents: 1200,
    currency: 'USD',
    checkoutUrl: 'https://buy.stripe.com/test_factory_fixture',
    artifactKey: ARTIFACT_KEY,
    noncommercialFixture: !options.commercialListing,
    environment: 'PROVIDER_TEST',
    arrivalPublicationId: 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0',
  });
  const state = new MemoryEdgeStateStore();
  const watch = new InMemoryWatchStore(INTERNAL_EVENT_SECRET, ['PROVIDER_TEST']);
  const clock = { value: new Date(NOW_SECONDS * 1000) };
  let attempts = 0;
  const inner = new EdgeDeliveryFulfillment({
    objects,
    state,
    catalog,
    now: () => clock.value,
    ttlSeconds: 3600,
    maxDownloads: 2,
  });
  const stripe = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_EVENT_SECRET,
    state: new InMemoryStripeWebhookStateStore(),
    watch,
    fulfillment: {
      async fulfill(request) {
        attempts++;
        return inner.fulfill(request);
      },
    },
    nowSeconds: () => NOW_SECONDS,
  });
  const env: EdgeEnvironment = {
    objects,
    catalog,
    state,
    watch,
    stripe,
    signEvent,
    deliverySecret: DELIVERY_SECRET,
    internalTrafficToken: INTERNAL_TRAFFIC_TOKEN,
    allowCommercialListings: options.allowCommercialListings ?? false,
    deploymentPurpose: 'FIXTURE' as const,
    commercialAuthorizations: 0,
    now: () => clock.value,
    deliveryTtlSeconds: 3600,
    maxDownloadsPerGrant: 2,
  };
  const server = await startEdgeServer(env);
  return { env, watch, objects, state, server, clock, fulfillmentAttempts: () => attempts };
}

function checkoutCompleted(eventId = 'evt_phase_e_checkout'): { payload: string; signature: string } {
  const payload = JSON.stringify({
    id: eventId,
    type: 'checkout.session.completed',
    created: NOW_SECONDS,
    livemode: false,
    data: {
      object: {
        id: 'cs_test_phase_e',
        payment_intent: 'pi_test_phase_e',
        amount_total: 1200,
        currency: 'usd',
        payment_status: 'paid',
        client_reference_id: 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0',
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

async function postWebhook(origin: string, event: { payload: string; signature: string }): Promise<Response> {
  return fetch(`${origin}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'stripe-signature': event.signature, 'content-type': 'application/json' },
    body: event.payload,
  });
}

test('a fixture artifact traverses page -> measurement -> checkout -> webhook -> signed delivery', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  const origin = h.server.origin;

  // 1. Product page. Real HTTP, real cookie, first-party PRODUCT_VIEW.
  const page = await fetch(`${origin}/p/${EXPERIMENT_ID}`);
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.match(pageHtml, /NONCOMMERCIAL FIXTURE/);
  assert.match(pageHtml, new RegExp(`data-experiment-id="${EXPERIMENT_ID}"`));
  const cookie = (page.headers.get('set-cookie') ?? '').split(';')[0];
  assert.match(cookie, /^fv=/);

  // 2. Offer interaction beacon.
  const beacon = await fetch(`${origin}/e/${EXPERIMENT_ID}`, { method: 'POST', headers: { cookie } });
  assert.equal(beacon.status, 202);

  // 3. Buy click: recorded first-party, then redirected with attribution.
  const buy = await fetch(`${origin}/buy/${EXPERIMENT_ID}`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(buy.status, 302);
  const location = new URL(buy.headers.get('location') as string);
  assert.equal(location.origin + location.pathname, 'https://buy.stripe.com/test_factory_fixture');
  assert.equal(location.searchParams.get('client_reference_id'), 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0');

  // 4. Signed Stripe webhook -> fulfillment -> delivery grant.
  const webhook = await postWebhook(origin, checkoutCompleted());
  assert.equal(webhook.status, 200);
  assert.equal(((await webhook.json()) as { status: string }).status, 'PROCESSED');

  // 5. Buyer returns holding the Checkout Session ID, not the PaymentIntent.
  const thanks = await fetch(`${origin}/thanks?session_id=cs_test_phase_e`);
  assert.equal(thanks.status, 200);
  const thanksHtml = await thanks.text();
  const tokenMatch = thanksHtml.match(/href="\/d\/([^"]+)"/);
  assert.ok(tokenMatch, 'the thanks page must carry a signed download link');

  // 6. Signed delivery returns the exact artifact bytes.
  const download = await fetch(`${origin}/d/${tokenMatch[1]}`);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('x-factory-experiment-id'), EXPERIMENT_ID);
  const delivered = new Uint8Array(await download.arrayBuffer());
  const expected = (await h.objects.get(ARTIFACT_KEY))?.bytes as Uint8Array;
  assert.deepEqual(delivered, expected);

  // 7. Durable WATCH saw the whole funnel, attributed, with no commercial money.
  const snapshot = h.watch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.productViews, 1);
  assert.equal(snapshot.offerInteractions, 1);
  assert.equal(snapshot.checkoutStarts, 1);
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, true);
  assert.equal(snapshot.transactions[0]?.classification, 'OWNER_TEST');
  assert.equal(snapshot.armLengthGrossRevenueCents, 0);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);
  // The edge never claims stranger exposure; that is the ARRIVE adapter's job.
  assert.equal(snapshot.qualifiedExposures, 0);
  assert.equal(snapshot.arrivalFunnels.length, 1);
  assert.equal(snapshot.arrivalFunnels[0]?.arrivalPublicationId, 'factory_arrive_0f1e2d3c4b5a69788796a5b4c3d2e1f0');
});

test('owner-internal traffic is excluded from the first-party denominator', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  await fetch(`${h.server.origin}/p/${EXPERIMENT_ID}`, {
    headers: { 'x-factory-internal': INTERNAL_TRAFFIC_TOKEN },
  });
  const snapshot = h.watch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.productViews, 0);
  assert.equal(snapshot.ownerInternalProductViews, 1);
});

test('repeat views inside one minute cannot inflate the denominator', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  const first = await fetch(`${h.server.origin}/p/${EXPERIMENT_ID}`);
  const cookie = (first.headers.get('set-cookie') ?? '').split(';')[0];
  await fetch(`${h.server.origin}/p/${EXPERIMENT_ID}`, { headers: { cookie } });
  await fetch(`${h.server.origin}/p/${EXPERIMENT_ID}`, { headers: { cookie } });
  assert.equal(h.watch.snapshot(EXPERIMENT_ID).productViews, 1);
});

test('the edge refuses to serve a commercial listing unless commercial mode is enabled', async (t) => {
  const closed = await harness({ commercialListing: true });
  t.after(() => closed.server.close());
  for (const path of [`/p/${EXPERIMENT_ID}`, `/buy/${EXPERIMENT_ID}`]) {
    assert.equal((await fetch(`${closed.server.origin}${path}`, { redirect: 'manual' })).status, 403);
  }
  assert.equal(closed.watch.eventCount(), 0);

  const open = await harness({ commercialListing: true, allowCommercialListings: true });
  t.after(() => open.server.close());
  assert.equal((await fetch(`${open.server.origin}/p/${EXPERIMENT_ID}`)).status, 200);
});

test('webhook redelivery does not mint a second grant or fulfill twice', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  const event = checkoutCompleted();
  assert.equal((await postWebhook(h.server.origin, event)).status, 200);
  const second = await postWebhook(h.server.origin, event);
  assert.equal(((await second.json()) as { status: string }).status, 'DUPLICATE');
  assert.equal(h.fulfillmentAttempts(), 1);
  const grant = await h.state.grantForTransaction('pi_test_phase_e');
  assert.ok(grant);
  assert.equal(h.watch.snapshot(EXPERIMENT_ID).transactions.length, 1);
});

test('a missing artifact is a fulfillment failure, not a silent success', async (t) => {
  const h = await harness({ omitArtifact: true });
  t.after(() => h.server.close());
  const response = await postWebhook(h.server.origin, checkoutCompleted());
  assert.equal(response.status, 500);
  const snapshot = h.watch.snapshot(EXPERIMENT_ID);
  assert.equal(snapshot.fulfillmentFailures, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, false);
  const thanks = await fetch(`${h.server.origin}/thanks?ref=cs_test_phase_e`);
  assert.equal(thanks.status, 202);
});

test('an unsigned or wrongly signed webhook is rejected before any state change', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  const event = checkoutCompleted();
  assert.equal((await fetch(`${h.server.origin}/webhooks/stripe`, { method: 'POST', body: event.payload })).status, 400);
  const forged = await fetch(`${h.server.origin}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'stripe-signature': signStripeTestEvent(event.payload, 'whsec_wrong', NOW_SECONDS) },
    body: event.payload,
  });
  assert.equal(forged.status, 400);
  assert.equal(h.watch.eventCount(), 0);
  assert.equal(h.fulfillmentAttempts(), 0);
});

test('delivery tokens fail closed on tampering, expiry, and exhausted uses', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  await postWebhook(h.server.origin, checkoutCompleted());
  const grant = await h.state.grantForTransaction('pi_test_phase_e');
  assert.ok(grant);

  const valid = mintDeliveryToken(
    { grantId: grant.grantId, experimentId: EXPERIMENT_ID, assetId: ASSET_ID, expiresAt: grant.expiresAt },
    DELIVERY_SECRET,
  );
  const forged = mintDeliveryToken(
    { grantId: grant.grantId, experimentId: EXPERIMENT_ID, assetId: ASSET_ID, expiresAt: grant.expiresAt },
    'not-the-delivery-secret',
  );
  assert.equal((await fetch(`${h.server.origin}/d/${forged}`)).status, 403);

  const expired = mintDeliveryToken(
    { grantId: grant.grantId, experimentId: EXPERIMENT_ID, assetId: ASSET_ID, expiresAt: NOW_ISO },
    DELIVERY_SECRET,
  );
  assert.equal((await fetch(`${h.server.origin}/d/${expired}`)).status, 403);

  assert.equal((await fetch(`${h.server.origin}/d/${valid}`)).status, 200);
  assert.equal((await fetch(`${h.server.origin}/d/${valid}`)).status, 200);
  // maxDownloads is 2; the third attempt is refused even with a valid token.
  assert.equal((await fetch(`${h.server.origin}/d/${valid}`)).status, 410);
});

test('an unknown experiment is a 404 and records nothing', async (t) => {
  const h = await harness();
  t.after(() => h.server.close());
  assert.equal((await fetch(`${h.server.origin}/p/does-not-exist`)).status, 404);
  assert.equal((await fetch(`${h.server.origin}/healthz`)).status, 200);
  assert.equal(h.watch.eventCount(), 0);
});

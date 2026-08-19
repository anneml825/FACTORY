import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PhaseAEngine } from './engine.ts';
import { evaluateExperiment } from './evaluator.ts';
import {
  FixtureArrivalAdapter,
  FixtureEventSigner,
  FixtureMakeAdapter,
} from './fake-adapters.ts';
import { shortDocumentFixture, syntheticEvent } from './fixtures.ts';
import type { StripeRequest, StripeTransport } from './stripe-api.ts';
import { StripeTestPutAdapter } from './stripe-put-adapter.ts';
import { JsonStripePublicationStore } from './stripe-publication-store.ts';
import {
  InMemoryStripeWebhookStateStore,
  InvalidStripeSignatureError,
  signStripeTestEvent,
  StripeTestWebhookProcessor,
  verifyStripeSignature,
  type ProviderTestFulfillment,
} from './stripe-webhook.ts';
import {
  StripeTestReconciler,
  StripeTestReconciliationRecovery,
} from './stripe-reconciliation.ts';
import { InMemoryWatchStore } from './watch.ts';

const INTERNAL_SECRET = 'phase-b-internal-event-secret';
const WEBHOOK_SECRET = 'whsec_phase_b_test_fixture';
const NOW = 1_776_499_200;

class RecordingStripeTransport implements StripeTransport {
  readonly requests: StripeRequest[] = [];
  failNextPrice = false;
  liveNext = false;

  async request<T>(request: StripeRequest): Promise<T> {
    this.requests.push(structuredClone(request));
    if (request.path === '/v1/prices' && this.failNextPrice) {
      this.failNextPrice = false;
      throw new Error('simulated Stripe timeout after product creation');
    }
    const livemode = this.liveNext;
    this.liveNext = false;
    let response: Record<string, unknown>;
    if (request.path === '/v1/products') response = { id: 'prod_test_fixture', livemode };
    else if (request.path === '/v1/prices') response = { id: 'price_test_fixture', livemode };
    else if (request.path === '/v1/payment_links') {
      response = {
        id: 'plink_test_fixture',
        livemode,
        active: true,
        url: 'https://buy.stripe.com/test_factory_fixture',
      };
    } else if (request.path === '/v1/payment_intents/pi_test_fixture') {
      response = {
        id: 'pi_test_fixture',
        livemode,
        amount_received: 1200,
        currency: 'usd',
        latest_charge: 'ch_test_fixture',
      };
    } else if (request.path === '/v1/charges/ch_test_fixture') {
      response = {
        id: 'ch_test_fixture',
        livemode,
        amount: 1200,
        amount_refunded: 300,
        disputed: true,
        currency: 'usd',
        payment_intent: 'pi_test_fixture',
      };
    } else if (request.path.startsWith('/v1/refunds?payment_intent=pi_test_fixture')) {
      response = {
        data: [{
          id: 're_test_fixture',
          amount: 300,
          currency: 'usd',
          created: NOW,
          payment_intent: 'pi_test_fixture',
          charge: 'ch_test_fixture',
        }],
        has_more: false,
      };
    } else if (request.path.startsWith('/v1/disputes?payment_intent=pi_test_fixture')) {
      response = {
        data: [{
          id: 'dp_test_fixture',
          amount: 200,
          currency: 'usd',
          created: NOW,
          payment_intent: 'pi_test_fixture',
          charge: 'ch_test_fixture',
        }],
        has_more: false,
      };
    } else if (request.path.startsWith('/v1/payment_links/')) {
      response = { id: 'plink_test_fixture', livemode, active: false };
    } else if (request.path.startsWith('/v1/prices/')) {
      response = { id: 'price_test_fixture', livemode, active: false };
    } else if (request.path.startsWith('/v1/products/')) {
      response = { id: 'prod_test_fixture', livemode, active: false };
    } else {
      throw new Error(`Unhandled fake Stripe request: ${request.path}`);
    }
    return response as T;
  }
}

function stripeEvent(
  id: string,
  type: string,
  object: Record<string, unknown>,
  livemode = false,
): { payload: string; signature: string } {
  const payload = JSON.stringify({ id, type, created: NOW, livemode, data: { object } });
  return { payload, signature: signStripeTestEvent(payload, WEBHOOK_SECRET, NOW) };
}

function checkoutObject(classification = 'OWNER_TEST'): Record<string, unknown> {
  return {
    id: 'cs_test_fixture',
    payment_intent: 'pi_test_fixture',
    amount_total: 1200,
    currency: 'usd',
    payment_status: 'paid',
    metadata: {
      factory_environment: 'PROVIDER_TEST',
      factory_test_transaction: 'true',
      transaction_classification: classification,
      experiment_id: 'phase-a-doc-001',
      asset_id: 'fixture-doc-001',
    },
  };
}

async function stagedEngine(put: StripeTestPutAdapter) {
  const manifest = shortDocumentFixture();
  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['FIXTURE', 'PROVIDER_TEST']);
  const engine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put,
    arrive: new FixtureArrivalAdapter(),
    watch,
  });
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  return { engine, manifest, watch };
}

test('Stripe PUT creates a Managed Payments product, price, and attributed link exactly once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-stripe-put-'));
  const statePath = join(directory, 'publication.json');
  const transport = new RecordingStripeTransport();
  const firstAdapter = new StripeTestPutAdapter({
    transport,
    store: new JsonStripePublicationStore(statePath),
  });
  const { engine, manifest } = await stagedEngine(firstAdapter);
  const publication = await engine.publish(manifest.experimentId, 'phase-b:publish:fixture');
  const retry = await engine.publish(manifest.experimentId, 'phase-b:publish:fixture');

  assert.equal(publication.publicationId, retry.publicationId);
  assert.equal(publication.mode, 'PROVIDER_TEST');
  assert.equal(transport.requests.filter((request) => request.path === '/v1/products').length, 1);
  assert.equal(transport.requests.filter((request) => request.path === '/v1/prices').length, 1);
  assert.equal(transport.requests.filter((request) => request.path === '/v1/payment_links').length, 1);
  const linkRequest = transport.requests.find((request) => request.path === '/v1/payment_links');
  assert.deepEqual((linkRequest?.form?.managed_payments as { enabled: boolean }).enabled, true);
  assert.equal(
    ((linkRequest?.form?.metadata as Record<string, string>).experiment_id),
    manifest.experimentId,
  );
  assert.equal(
    ((linkRequest?.form?.payment_intent_data as { metadata: Record<string, string> }).metadata
      .transaction_classification),
    'OWNER_TEST',
  );
  assert.ok(transport.requests.every((request) => request.idempotencyKey?.startsWith('factory:')));
});

test('durable publication progress resumes after a provider failure without recreating Product', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-stripe-recovery-'));
  const statePath = join(directory, 'publication.json');
  const transport = new RecordingStripeTransport();
  transport.failNextPrice = true;
  const first = new StripeTestPutAdapter({ transport, store: new JsonStripePublicationStore(statePath) });
  const firstHarness = await stagedEngine(first);
  await assert.rejects(
    firstHarness.engine.publish(firstHarness.manifest.experimentId, 'phase-b:recover'),
    /simulated Stripe timeout/,
  );

  const resumed = new StripeTestPutAdapter({ transport, store: new JsonStripePublicationStore(statePath) });
  const secondHarness = await stagedEngine(resumed);
  const publication = await secondHarness.engine.publish(
    secondHarness.manifest.experimentId,
    'phase-b:recover',
  );
  assert.equal(publication.publicationId, 'plink_test_fixture');
  assert.equal(transport.requests.filter((request) => request.path === '/v1/products').length, 1);
  assert.equal(transport.requests.filter((request) => request.path === '/v1/prices').length, 2);
  assert.equal(transport.requests.filter((request) => request.path === '/v1/payment_links').length, 1);
});

test('provider-test PUT remains gated and rejects any livemode response', async () => {
  const transport = new RecordingStripeTransport();
  const adapter = new StripeTestPutAdapter({ transport });
  const manifest = shortDocumentFixture();
  const watch = new InMemoryWatchStore(INTERNAL_SECRET);
  const engine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put: adapter,
    arrive: new FixtureArrivalAdapter(),
    watch,
  });
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  await assert.rejects(engine.publish(manifest.experimentId, 'too-early'), /requires STAGED state/);
  assert.equal(transport.requests.length, 0);

  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  transport.liveNext = true;
  await assert.rejects(engine.publish(manifest.experimentId, 'live-response'), /livemode=false/);
});

test('signed Stripe checkout records failed fulfillment, recovers idempotently, and never graduates owner revenue', async () => {
  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['FIXTURE', 'PROVIDER_TEST']);
  let attempts = 0;
  const fulfillment: ProviderTestFulfillment = {
    async fulfill() {
      attempts++;
      return attempts === 1
        ? { succeeded: false, reason: 'fixture delivery temporarily unavailable' }
        : { succeeded: true };
    },
  };
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_SECRET,
    watch,
    fulfillment,
    nowSeconds: () => NOW,
  });
  const checkout = stripeEvent('evt_checkout', 'checkout.session.completed', checkoutObject());
  assert.equal((await processor.process(checkout.payload, checkout.signature)).status, 'RETRYABLE_FAILURE');
  let snapshot = watch.snapshot('phase-a-doc-001');
  assert.equal(snapshot.grossRevenueCents, 1200);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);
  assert.equal(snapshot.fulfillmentFailures, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, false);

  assert.equal((await processor.process(checkout.payload, checkout.signature)).status, 'PROCESSED');
  assert.equal((await processor.process(checkout.payload, checkout.signature)).status, 'DUPLICATE');
  snapshot = watch.snapshot('phase-a-doc-001');
  assert.equal(attempts, 2);
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.transactions[0]?.fulfilled, true);
  assert.equal(snapshot.fulfillmentFailures, 1);
  assert.equal(snapshot.armLengthGrossRevenueCents, 0);

  const fixtureSigner = new FixtureEventSigner(INTERNAL_SECRET);
  for (let index = 0; index < 3; index++) {
    await watch.ingest(fixtureSigner.sign(syntheticEvent({
      eventId: `phase-b-exposure-${index}`,
      type: 'QUALIFIED_EXPOSURE',
    })));
  }
  await watch.ingest(fixtureSigner.sign(syntheticEvent({
    eventId: 'phase-b-interaction',
    type: 'OFFER_INTERACTION',
  })));
  const result = evaluateExperiment(shortDocumentFixture(), watch.snapshot('phase-a-doc-001'), 0);
  assert.notEqual(result.decision, 'KEEP');
  assert.equal(result.evidenceGrade, 'E2');
});

test('refund and dispute effects deduplicate, reconcile, and settle to zero commercial money', async () => {
  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['PROVIDER_TEST']);
  const transport = new RecordingStripeTransport();
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_SECRET,
    watch,
    transport,
    fulfillment: { async fulfill() { return { succeeded: true }; } },
    nowSeconds: () => NOW,
  });
  const checkout = stripeEvent('evt_checkout_rd', 'checkout.session.completed', checkoutObject());
  await processor.process(checkout.payload, checkout.signature);
  const refund = stripeEvent('evt_refund', 'refund.created', {
    id: 're_test_fixture',
    payment_intent: 'pi_test_fixture',
    amount: 300,
    currency: 'usd',
  });
  const dispute = stripeEvent('evt_dispute', 'charge.dispute.created', {
    id: 'dp_test_fixture',
    charge: 'ch_test_fixture',
    amount: 200,
    currency: 'usd',
  });
  assert.equal((await processor.process(refund.payload, refund.signature)).status, 'PROCESSED');
  assert.equal((await processor.process(refund.payload, refund.signature)).status, 'DUPLICATE');
  assert.equal((await processor.process(dispute.payload, dispute.signature)).status, 'PROCESSED');
  assert.equal((await processor.process(dispute.payload, dispute.signature)).status, 'DUPLICATE');
  const snapshot = watch.snapshot('phase-a-doc-001');
  assert.equal(snapshot.refundsCents, 300);
  assert.equal(snapshot.disputesCents, 200);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);

  const reconciliation = await new StripeTestReconciler(transport).reconcileTransaction(
    snapshot,
    'pi_test_fixture',
  );
  assert.equal(reconciliation.reconciled, true);
  assert.equal(reconciliation.bookedRevenueCents, 0);
  assert.equal(reconciliation.availableSettledCashCents, 0);
  assert.equal(reconciliation.eligibleArmLengthRevenueCents, 0);
  assert.equal(reconciliation.attributableFactoryCostCents, 0);
});

test('provider reconciliation backfills missing refund and dispute events idempotently', async () => {
  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['PROVIDER_TEST']);
  const transport = new RecordingStripeTransport();
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_SECRET,
    watch,
    transport,
    fulfillment: { async fulfill() { return { succeeded: true }; } },
    nowSeconds: () => NOW,
  });
  const checkout = stripeEvent('evt_checkout_recovery', 'checkout.session.completed', checkoutObject());
  await processor.process(checkout.payload, checkout.signature);

  const recovery = new StripeTestReconciliationRecovery({
    transport,
    watch,
    internalEventSecret: INTERNAL_SECRET,
  });
  const first = await recovery.recoverTransaction(
    watch.snapshot('phase-a-doc-001'),
    'pi_test_fixture',
  );
  assert.deepEqual(first, {
    transactionId: 'pi_test_fixture',
    recoveredRefundEffects: 1,
    recoveredDisputeEffects: 1,
  });
  const recovered = watch.snapshot('phase-a-doc-001');
  assert.equal(recovered.refundsCents, 300);
  assert.equal(recovered.disputesCents, 200);
  assert.equal(recovered.eligibleArmLengthRevenueCents, 0);
  assert.equal(
    (await new StripeTestReconciler(transport).reconcileTransaction(
      recovered,
      'pi_test_fixture',
    )).reconciled,
    true,
  );

  const retry = await recovery.recoverTransaction(
    watch.snapshot('phase-a-doc-001'),
    'pi_test_fixture',
  );
  assert.equal(retry.recoveredRefundEffects, 0);
  assert.equal(retry.recoveredDisputeEffects, 0);
  assert.equal(watch.snapshot('phase-a-doc-001').refundsCents, 300);
  assert.equal(watch.snapshot('phase-a-doc-001').disputesCents, 200);
});

test('out-of-order provider effects remain retryable until checkout attribution exists', async () => {
  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['PROVIDER_TEST']);
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_SECRET,
    state: new InMemoryStripeWebhookStateStore(),
    watch,
    fulfillment: { async fulfill() { return { succeeded: true }; } },
    nowSeconds: () => NOW,
  });
  const refund = stripeEvent('evt_early_refund', 'refund.created', {
    id: 're_early',
    payment_intent: 'pi_test_fixture',
    amount: 300,
    currency: 'usd',
  });
  assert.equal((await processor.process(refund.payload, refund.signature)).status, 'RETRYABLE_FAILURE');
  const checkout = stripeEvent('evt_late_checkout', 'checkout.session.completed', checkoutObject());
  assert.equal((await processor.process(checkout.payload, checkout.signature)).status, 'PROCESSED');
  assert.equal((await processor.process(refund.payload, refund.signature)).status, 'PROCESSED');
  assert.equal(watch.snapshot('phase-a-doc-001').refundsCents, 300);
});

test('webhook verification and environment/classification controls fail closed', async () => {
  const payload = JSON.stringify({ id: 'evt_signature' });
  const signature = signStripeTestEvent(payload, WEBHOOK_SECRET, NOW);
  verifyStripeSignature({ payload, signatureHeader: signature, secret: WEBHOOK_SECRET, nowSeconds: NOW });
  assert.throws(
    () => verifyStripeSignature({ payload: `${payload}x`, signatureHeader: signature, secret: WEBHOOK_SECRET, nowSeconds: NOW }),
    InvalidStripeSignatureError,
  );
  assert.throws(
    () => verifyStripeSignature({ payload, signatureHeader: signature, secret: WEBHOOK_SECRET, nowSeconds: NOW + 301 }),
    /outside tolerance/,
  );

  const watch = new InMemoryWatchStore(INTERNAL_SECRET, ['PROVIDER_TEST']);
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: WEBHOOK_SECRET,
    internalEventSecret: INTERNAL_SECRET,
    watch,
    fulfillment: { async fulfill() { return { succeeded: true }; } },
    nowSeconds: () => NOW,
  });
  const dishonest = stripeEvent(
    'evt_dishonest',
    'checkout.session.completed',
    checkoutObject('ARM_LENGTH_CUSTOMER'),
  );
  assert.equal((await processor.process(dishonest.payload, dishonest.signature)).status, 'REJECTED');
  assert.equal(watch.snapshot('phase-a-doc-001').transactions.length, 0);

  const live = stripeEvent('evt_live', 'checkout.session.completed', checkoutObject(), true);
  await assert.rejects(processor.process(live.payload, live.signature), /refuses livemode/);
});

test('deactivation disables link, price, and product using idempotent provider requests', async () => {
  const transport = new RecordingStripeTransport();
  const adapter = new StripeTestPutAdapter({ transport });
  const { engine, manifest } = await stagedEngine(adapter);
  const publication = await engine.publish(manifest.experimentId, 'phase-b:deactivate:publish');
  const inactive = await adapter.deactivate(publication, 'phase-b:deactivate');
  assert.equal(inactive.status, 'INACTIVE');
  assert.deepEqual(
    transport.requests.slice(-3).map((request) => request.path),
    [
      '/v1/payment_links/plink_test_fixture',
      '/v1/prices/price_test_fixture',
      '/v1/products/prod_test_fixture',
    ],
  );
  assert.ok(transport.requests.slice(-3).every((request) => request.form?.active === false));
  assert.ok(transport.requests.slice(-3).every((request) => request.idempotencyKey));
});

test('deactivation still reports success when the durable record is missing', async () => {
  // The external teardown runs in a fresh workspace, so the publication store is
  // routinely empty by the time it deactivates. Raising there once reported a
  // completed deactivation as a failure and left a live checkout link behind.
  const transport = new RecordingStripeTransport();
  const adapter = new StripeTestPutAdapter({ transport });
  const { engine, manifest } = await stagedEngine(adapter);
  const publication = await engine.publish(manifest.experimentId, 'phase-b:orphan:publish');

  const orphaned = new StripeTestPutAdapter({ transport });
  const inactive = await orphaned.deactivate(publication, 'phase-b:orphan');
  assert.equal(inactive.status, 'INACTIVE');
  assert.ok(transport.requests.slice(-3).every((request) => request.form?.active === false));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CostController,
  CapitalControlUnavailableError,
  type CapitalAuthorityPort,
} from './cost-control.ts';
import { PhaseAEngine } from './engine.ts';
import {
  FakeLocalPutProvider,
  FixtureArrivalAdapter,
  FixtureEventSigner,
  FixtureMakeAdapter,
} from './fake-adapters.ts';
import { InMemoryWatchStore, EventConflictError, InvalidEventSignatureError } from './watch.ts';
import { shortDocumentFixture, spreadsheetFixture, syntheticEvent } from './fixtures.ts';
import { renderShortDocument, renderSpreadsheet } from './renderers.ts';
import { generateFixtureCatalog } from './catalog.ts';
import { evaluateExperiment } from './evaluator.ts';
import type { ArriveAdapter, PutAdapter } from './ports.ts';
import type { AssetManifest, FunnelEvent, FunnelSnapshot, SignedEventEnvelope } from './types.ts';

const SECRET = 'phase-a-local-fixture-secret-not-a-real-credential';

function harness(options: {
  manifest?: AssetManifest;
  arrive?: ArriveAdapter;
  put?: PutAdapter;
  costs?: CostController;
} = {}) {
  const manifest = options.manifest ?? shortDocumentFixture();
  const put = options.put ?? new FakeLocalPutProvider();
  const watch = new InMemoryWatchStore(SECRET);
  const signer = new FixtureEventSigner(SECRET);
  const engine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put,
    arrive: options.arrive ?? new FixtureArrivalAdapter(),
    watch,
    costs: options.costs ?? new CostController(),
  });
  engine.register(manifest);
  return { engine, manifest, put, watch, signer };
}

async function publishAndObserve(context: ReturnType<typeof harness>) {
  const { engine, manifest } = context;
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  await engine.publish(manifest.experimentId, `publish:${manifest.experimentId}`);
  engine.observe(manifest.experimentId);
}

async function ingest(context: ReturnType<typeof harness>, event: FunnelEvent) {
  return context.engine.ingest(context.manifest.experimentId, context.signer.sign(event));
}

async function addMinimumExposure(context: ReturnType<typeof harness>) {
  for (let index = 1; index <= 3; index++) {
    await ingest(context, syntheticEvent({ eventId: `exposure-${index}`, type: 'QUALIFIED_EXPOSURE' }));
  }
}

test('deterministic renderers reproduce byte-identical attributed fixtures', () => {
  const doc = shortDocumentFixture();
  const sheet = spreadsheetFixture();
  const firstDoc = renderShortDocument(doc);
  const secondDoc = renderShortDocument(doc);
  const firstSheet = renderSpreadsheet(sheet);
  const secondSheet = renderSpreadsheet(sheet);
  assert.equal(firstDoc.sha256, secondDoc.sha256);
  assert.deepEqual(firstDoc.bytes, secondDoc.bytes);
  assert.equal(firstSheet.sha256, secondSheet.sha256);
  assert.deepEqual(firstSheet.bytes, secondSheet.bytes);
  assert.match(new TextDecoder().decode(firstDoc.bytes), /phase-a-doc-001/);
  assert.match(new TextDecoder().decode(firstSheet.bytes), /phase-a-sheet-001/);
  assert.match(new TextDecoder().decode(firstSheet.bytes), /'=unsafe formula/);
});

test('complete simulated lifecycle reaches KEEP and retries duplicate nothing', async () => {
  const context = harness();
  await publishAndObserve(context);
  await addMinimumExposure(context);
  await ingest(context, syntheticEvent({ eventId: 'interaction-1', type: 'OFFER_INTERACTION' }));
  const checkout = syntheticEvent({
    eventId: 'checkout-complete-1',
    type: 'CHECKOUT_COMPLETED',
    transactionId: 'tx-arm-1',
    classification: 'ARM_LENGTH_CUSTOMER',
    amountCents: 1200,
  });
  const fulfillment = syntheticEvent({
    eventId: 'fulfillment-success-1',
    type: 'FULFILLMENT_SUCCEEDED',
    transactionId: 'tx-arm-1',
    effectId: 'fulfillment-attempt-arm-1',
  });
  await ingest(context, checkout);
  await ingest(context, fulfillment);

  const duplicateCheckout = await ingest(context, checkout);
  const duplicateFulfillment = await ingest(context, fulfillment);
  const alternateEnvelopeCheckout = await ingest(context, {
    ...checkout,
    eventId: 'checkout-complete-1-redelivery',
  });
  const alternateEnvelopeFulfillment = await ingest(context, {
    ...fulfillment,
    eventId: 'fulfillment-success-1-redelivery',
  });
  const retriedPublication = await context.engine.publish(
    context.manifest.experimentId,
    `publish:${context.manifest.experimentId}`,
  );
  assert.equal(duplicateCheckout.duplicate, true);
  assert.equal(duplicateFulfillment.duplicate, true);
  assert.equal(alternateEnvelopeCheckout.duplicate, true);
  assert.equal(alternateEnvelopeFulfillment.duplicate, true);
  assert.equal((context.put as FakeLocalPutProvider).createdPublications, 1);
  assert.equal(retriedPublication.publicationId, 'fixture-publication-phase-a-doc-001');

  const record = context.engine.evaluate(context.manifest.experimentId);
  assert.equal(record.state, 'KEEP');
  assert.equal(record.decision?.evidenceGrade, 'E3');
  assert.equal(record.decision?.snapshot.grossRevenueCents, 1200);
  assert.equal(record.decision?.snapshot.eligibleArmLengthRevenueCents, 1200);
  assert.equal(record.decision?.settledFactoryCostCents, 0);
  assert.equal(record.decision?.contributionProfitCents, 1200);
  assert.equal(record.decision?.snapshot.transactions.length, 1);
  assert.equal(record.decision?.snapshot.transactions[0]?.experimentId, context.manifest.experimentId);
  assert.equal(context.watch.eventCount(), 6);
  assert.equal(new Set(record.costs.map((cost) => cost.reservationIdempotencyKey)).size, record.costs.length);
  assert.ok(record.costs.every((cost) => cost.status === 'ZERO_COST_SETTLED'));
  assert.ok(record.costs.every((cost) => cost.maximumCents === 0 && cost.settledCents === 0));
  assert.deepEqual(
    record.stateHistory.map((item) => item.state),
    [
      'CANDIDATE',
      'BUILT',
      'FUNCTIONAL_QA_PASS',
      'VALUE_QA_PASS',
      'STAGED',
      'PUBLISHED',
      'OBSERVING',
      'KEEP',
    ],
  );
});

test('owner and internal purchases are visible but excluded from arm-length graduation', async () => {
  const context = harness();
  await publishAndObserve(context);
  await addMinimumExposure(context);
  await ingest(context, syntheticEvent({ eventId: 'interaction-owner', type: 'OFFER_INTERACTION' }));
  for (const [suffix, classification] of [
    ['owner', 'OWNER_TEST'],
    ['internal', 'INTERNAL_TEST'],
  ] as const) {
    await ingest(context, syntheticEvent({
      eventId: `checkout-${suffix}`,
      type: 'CHECKOUT_COMPLETED',
      transactionId: `tx-${suffix}`,
      classification,
      amountCents: 1200,
    }));
    await ingest(context, syntheticEvent({
      eventId: `fulfill-${suffix}`,
      type: 'FULFILLMENT_SUCCEEDED',
      transactionId: `tx-${suffix}`,
      effectId: `fulfillment-attempt-${suffix}`,
    }));
  }
  const record = context.engine.evaluate(context.manifest.experimentId);
  assert.equal(record.state, 'ITERATE');
  assert.equal(record.decision?.evidenceGrade, 'E2');
  assert.equal(record.decision?.snapshot.grossRevenueCents, 2400);
  assert.equal(record.decision?.snapshot.armLengthGrossRevenueCents, 0);
  assert.equal(record.decision?.snapshot.eligibleArmLengthRevenueCents, 0);
});

test('publication is impossible before both QA gates and a complete Arrival gate', async () => {
  const beforeQa = harness();
  await beforeQa.engine.build(beforeQa.manifest.experimentId);
  await assert.rejects(
    beforeQa.engine.publish(beforeQa.manifest.experimentId, 'too-early'),
    /requires STAGED state/,
  );
  assert.equal((beforeQa.put as FakeLocalPutProvider).publishCalls, 0);

  const incompleteArrival: ArriveAdapter = {
    adapterId: 'incomplete-fixture-arrival',
    mode: 'FIXTURE',
    costProfile: { maximumCents: 0, currency: 'USD', bucketName: 'discovery' },
    async evaluateGate(manifest) {
      return { ...manifest.arrivalGate, adapterId: this.adapterId, status: 'PASSED' };
    },
  };
  const incomplete = harness({ arrive: incompleteArrival });
  await incomplete.engine.build(incomplete.manifest.experimentId);
  incomplete.engine.functionalQa(incomplete.manifest.experimentId);
  incomplete.engine.valueQa(incomplete.manifest.experimentId);
  await incomplete.engine.stage(incomplete.manifest.experimentId);
  await assert.rejects(
    incomplete.engine.publish(incomplete.manifest.experimentId, 'incomplete-arrival'),
    /Arrival gate is incomplete/,
  );
  assert.equal((incomplete.put as FakeLocalPutProvider).publishCalls, 0);

  const failed = harness({ arrive: new FixtureArrivalAdapter(false) });
  await failed.engine.build(failed.manifest.experimentId);
  failed.engine.functionalQa(failed.manifest.experimentId);
  failed.engine.valueQa(failed.manifest.experimentId);
  await assert.rejects(failed.engine.stage(failed.manifest.experimentId), /Arrival adapter did not pass/);
  assert.equal(failed.engine.get(failed.manifest.experimentId).state, 'VALUE_QA_PASS');
});

test('failed fulfillment remains visible and cannot count as eligible commercial revenue', async () => {
  const context = harness();
  await publishAndObserve(context);
  await addMinimumExposure(context);
  await ingest(context, syntheticEvent({ eventId: 'interaction-fail', type: 'OFFER_INTERACTION' }));
  await ingest(context, syntheticEvent({
    eventId: 'checkout-fail',
    type: 'CHECKOUT_COMPLETED',
    transactionId: 'tx-fail',
    classification: 'ARM_LENGTH_CUSTOMER',
    amountCents: 1200,
  }));
  const failedFulfillment = syntheticEvent({
    eventId: 'fulfillment-fail',
    type: 'FULFILLMENT_FAILED',
    transactionId: 'tx-fail',
    effectId: 'fulfillment-attempt-fail',
    reason: 'synthetic delivery failure',
  });
  await ingest(context, failedFulfillment);
  await ingest(context, failedFulfillment);
  const record = context.engine.evaluate(context.manifest.experimentId);
  assert.equal(record.state, 'ITERATE');
  assert.equal(record.decision?.evidenceGrade, 'E2');
  assert.equal(record.decision?.snapshot.armLengthGrossRevenueCents, 1200);
  assert.equal(record.decision?.snapshot.eligibleArmLengthRevenueCents, 0);
  assert.equal(record.decision?.snapshot.fulfillmentFailures, 1);
  assert.equal(record.decision?.snapshot.transactions[0]?.fulfilled, false);
});

test('refund and dispute retries do not duplicate financial effects', async () => {
  const context = harness();
  await publishAndObserve(context);
  await addMinimumExposure(context);
  await ingest(context, syntheticEvent({ eventId: 'interaction-rd', type: 'OFFER_INTERACTION' }));
  await ingest(context, syntheticEvent({
    eventId: 'checkout-rd',
    type: 'CHECKOUT_COMPLETED',
    transactionId: 'tx-rd',
    classification: 'ARM_LENGTH_CUSTOMER',
    amountCents: 1200,
  }));
  await ingest(context, syntheticEvent({
    eventId: 'fulfill-rd',
    type: 'FULFILLMENT_SUCCEEDED',
    transactionId: 'tx-rd',
    effectId: 'fulfillment-attempt-rd',
  }));
  const refund = syntheticEvent({
    eventId: 'refund-rd',
    type: 'REFUND_CREATED',
    transactionId: 'tx-rd',
    effectId: 'refund-object-rd',
    amountCents: 300,
  });
  const dispute = syntheticEvent({
    eventId: 'dispute-rd',
    type: 'DISPUTE_CREATED',
    transactionId: 'tx-rd',
    effectId: 'dispute-object-rd',
    amountCents: 200,
  });
  await ingest(context, refund);
  await ingest(context, refund);
  await ingest(context, { ...refund, eventId: 'refund-rd-redelivery' });
  await assert.rejects(
    ingest(context, { ...refund, eventId: 'refund-rd-conflict', amountCents: 400 }),
    /changed semantics/,
  );
  await ingest(context, dispute);
  await ingest(context, dispute);
  await ingest(context, { ...dispute, eventId: 'dispute-rd-redelivery' });
  const record = context.engine.evaluate(context.manifest.experimentId);
  assert.equal(record.decision?.snapshot.refundsCents, 300);
  assert.equal(record.decision?.snapshot.disputesCents, 200);
  assert.equal(record.decision?.snapshot.eligibleArmLengthRevenueCents, 0);
  assert.equal(record.state, 'ITERATE');
});

test('event signatures, event_id conflicts, and experiment attribution fail closed', async () => {
  const context = harness();
  await publishAndObserve(context);
  const event = syntheticEvent({ eventId: 'signed-event', type: 'PRODUCT_VIEW' });
  const signed = context.signer.sign(event);
  await context.engine.ingest(context.manifest.experimentId, signed);

  const tampered: SignedEventEnvelope = {
    payload: JSON.stringify({ ...event, type: 'OFFER_INTERACTION' }),
    signature: signed.signature,
  };
  await assert.rejects(context.engine.ingest(context.manifest.experimentId, tampered), InvalidEventSignatureError);

  const conflicting = context.signer.sign({ ...event, type: 'OFFER_INTERACTION' });
  await assert.rejects(context.engine.ingest(context.manifest.experimentId, conflicting), EventConflictError);

  const wrongExperiment = context.signer.sign({ ...event, eventId: 'wrong-exp', experimentId: 'other' });
  await assert.rejects(context.engine.ingest(context.manifest.experimentId, wrongExperiment), /attribution does not match/);
  assert.equal(context.watch.eventCount(), 1);
});

test('Capital Authority is required before any nonzero adapter can execute', async () => {
  let providerCalls = 0;
  const basePut = new FakeLocalPutProvider();
  const meteredPut: PutAdapter = {
    adapterId: 'metered-fixture-put',
    mode: 'FIXTURE',
    costProfile: { maximumCents: 1, currency: 'USD', bucketName: 'infrastructure' },
    async publish(manifest, artifact, key) {
      providerCalls++;
      return basePut.publish(manifest, artifact, key);
    },
    async deactivate(publication, key) {
      return basePut.deactivate(publication, key);
    },
  };
  const missing = harness({ put: meteredPut, costs: new CostController() });
  await missing.engine.build(missing.manifest.experimentId);
  missing.engine.functionalQa(missing.manifest.experimentId);
  missing.engine.valueQa(missing.manifest.experimentId);
  await missing.engine.stage(missing.manifest.experimentId);
  await assert.rejects(
    missing.engine.publish(missing.manifest.experimentId, 'paid-without-authority'),
    CapitalControlUnavailableError,
  );
  assert.equal(providerCalls, 0);

  const haltedAuthority = {
    async reserve() {
      throw new Error('PAID_ACTIVITY_HALTED fixture: fail closed');
    },
    async settle() {
      throw new Error('settle must not be reached');
    },
    async release() {},
  };
  const halted = harness({ put: meteredPut, costs: new CostController(haltedAuthority) });
  await halted.engine.build(halted.manifest.experimentId);
  halted.engine.functionalQa(halted.manifest.experimentId);
  halted.engine.valueQa(halted.manifest.experimentId);
  await halted.engine.stage(halted.manifest.experimentId);
  await assert.rejects(
    halted.engine.publish(halted.manifest.experimentId, 'paid-while-halted'),
    /PAID_ACTIVITY_HALTED/,
  );
  assert.equal(providerCalls, 0);
});

test('cost controller reserves before execution, settles once, and releases failed work', async () => {
  const calls: string[] = [];
  const authority: CapitalAuthorityPort = {
    async reserve(request) {
      calls.push(`reserve:${request.idempotencyKey}:${request.maxAmountCents}`);
      return {
        id: 1,
        idempotencyKey: request.idempotencyKey,
        bucketName: request.bucketName,
        maxAmountCents: request.maxAmountCents,
        state: 'RESERVED',
        wasAlreadyReserved: false,
      };
    },
    async settle(key, actual) {
      calls.push(`settle:${key}:${actual}`);
    },
    async release(key) {
      calls.push(`release:${key}`);
    },
  };
  const controller = new CostController(authority);
  const result = await controller.execute({
    operationId: 'metered-success',
    reservationIdempotencyKey: 'cost-success',
    bucketName: 'infrastructure',
    maximumCents: 5,
    currency: 'USD',
    purpose: 'cost lifecycle test',
    actor: 'test',
    run: async () => {
      calls.push('run:success');
      return { value: 'done', actualCostCents: 3 };
    },
  });
  assert.equal(result.value, 'done');
  assert.equal(result.cost.status, 'SETTLED');
  assert.equal(result.cost.maximumCents, 5);
  assert.equal(result.cost.settledCents, 3);
  assert.deepEqual(calls, ['reserve:cost-success:5', 'run:success', 'settle:cost-success:3']);

  await assert.rejects(
    controller.execute({
      operationId: 'metered-failure',
      reservationIdempotencyKey: 'cost-failure',
      bucketName: 'infrastructure',
      maximumCents: 5,
      currency: 'USD',
      purpose: 'failed cost lifecycle test',
      actor: 'test',
      run: async () => {
        calls.push('run:failure');
        throw new Error('synthetic provider failure');
      },
    }),
    /synthetic provider failure/,
  );
  assert.deepEqual(calls.slice(-3), ['reserve:cost-failure:5', 'run:failure', 'release:cost-failure']);

  await assert.rejects(
    controller.execute({
      operationId: 'dishonest-zero',
      reservationIdempotencyKey: 'dishonest-zero',
      bucketName: 'infrastructure',
      maximumCents: 0,
      currency: 'USD',
      purpose: 'zero-cost mismatch test',
      actor: 'test',
      run: async () => ({ value: null, actualCostCents: 1 }),
    }),
    /zero-cost operation reported a nonzero actual cost/,
  );
});

test('all four evaluation outcomes are executable', async () => {
  const insufficient = harness();
  await publishAndObserve(insufficient);
  await ingest(insufficient, syntheticEvent({ eventId: 'insufficient-1', type: 'QUALIFIED_EXPOSURE' }));
  assert.equal(insufficient.engine.evaluate(insufficient.manifest.experimentId).state, 'INSUFFICIENT_SIGNAL');

  const killed = harness();
  await publishAndObserve(killed);
  await addMinimumExposure(killed);
  assert.equal(killed.engine.evaluate(killed.manifest.experimentId).state, 'KILL');

  const iterated = harness();
  await publishAndObserve(iterated);
  await addMinimumExposure(iterated);
  await ingest(iterated, syntheticEvent({ eventId: 'iterate-interaction', type: 'OFFER_INTERACTION' }));
  assert.equal(iterated.engine.evaluate(iterated.manifest.experimentId).state, 'ITERATE');

  const kept = harness();
  await publishAndObserve(kept);
  await addMinimumExposure(kept);
  await ingest(kept, syntheticEvent({ eventId: 'keep-interaction', type: 'OFFER_INTERACTION' }));
  await ingest(kept, syntheticEvent({
    eventId: 'keep-checkout',
    type: 'CHECKOUT_COMPLETED',
    transactionId: 'keep-tx',
    classification: 'ARM_LENGTH_CUSTOMER',
    amountCents: 1200,
  }));
  await ingest(kept, syntheticEvent({
    eventId: 'keep-fulfill',
    type: 'FULFILLMENT_SUCCEEDED',
    transactionId: 'keep-tx',
    effectId: 'keep-fulfillment-attempt',
  }));
  assert.equal(kept.engine.evaluate(kept.manifest.experimentId).state, 'KEEP');
});

test('KEEP requires positive contribution after settled Factory cost', () => {
  const manifest = shortDocumentFixture();
  const snapshot: FunnelSnapshot = {
    experimentId: manifest.experimentId,
    qualifiedExposures: 3,
    productViews: 1,
    offerInteractions: 1,
    checkoutStarts: 1,
    transactions: [
      {
        transactionId: 'cost-sensitive-tx',
        experimentId: manifest.experimentId,
        assetId: manifest.assetId,
        classification: 'ARM_LENGTH_CUSTOMER',
        grossCents: 1200,
        currency: 'USD',
        fulfilled: true,
        fulfillmentFailed: false,
        hadFulfillmentFailure: false,
        refundedCents: 0,
        disputedCents: 0,
      },
    ],
    grossRevenueCents: 1200,
    armLengthGrossRevenueCents: 1200,
    eligibleArmLengthRevenueCents: 1200,
    refundsCents: 0,
    disputesCents: 0,
    fulfillmentFailures: 0,
  };
  const result = evaluateExperiment(manifest, snapshot, 1300);
  assert.equal(result.decision, 'ITERATE');
  assert.equal(result.evidenceGrade, 'E3');
  assert.equal(result.settledFactoryCostCents, 1300);
  assert.equal(result.contributionProfitCents, -100);
});

test('catalog is generated from fixture publications and contains no checkout', async () => {
  const doc = harness();
  await publishAndObserve(doc);
  const sheet = harness({ manifest: spreadsheetFixture() });
  await publishAndObserve(sheet);
  const entries = [doc, sheet].map((context) => {
    const record = context.engine.get(context.manifest.experimentId);
    assert.ok(record.publication);
    return { manifest: record.manifest, publication: record.publication };
  });
  const html = generateFixtureCatalog(entries);
  assert.match(html, /NONCOMMERCIAL LOCAL FIXTURE/);
  assert.match(html, /phase-a-doc-001/);
  assert.match(html, /phase-a-sheet-001/);
  assert.match(html, /NO CHECKOUT EXISTS/);
  assert.doesNotMatch(html, /https?:\/\//);
});

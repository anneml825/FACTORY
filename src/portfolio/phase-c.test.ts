import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ArrivalWatchBridge, JsonArrivalMetricCheckpointStore } from './arrival-watch-bridge.ts';
import {
  DevToArriveAdapter,
  JsonDevToArrivalStore,
  type DevToRequest,
  type DevToTransport,
} from './devto-arrive-adapter.ts';
import { JsonJournalWatchStore } from './durable-watch.ts';
import { FixtureEventSigner } from './fake-adapters.ts';
import { shortDocumentFixture, syntheticEvent } from './fixtures.ts';
import { assertPortfolioCompatibleOwnerLabor, projectOwnerLabor, summarizeOwnerLabor } from './owner-labor.ts';
import { signStripeTestEvent, StripeTestWebhookProcessor } from './stripe-webhook.ts';
import type { ArrivalMetrics, ArrivalPublication, Publication } from './types.ts';

const SECRET = 'phase-c-internal-test-secret';
const STRIPE_SECRET = 'whsec_phase_c_test';
const NOW = 1_776_499_200;

function providerPublication(): Publication {
  return {
    publicationId: 'plink_phase_c_fixture',
    experimentId: 'phase-a-doc-001',
    assetId: 'fixture-doc-001',
    providerId: 'stripe-test-managed-payments-v1',
    location: 'https://buy.stripe.com/test_phase_c_fixture',
    idempotencyKey: 'phase-c-put',
    manifestFingerprint: 'fixture-fingerprint',
    mode: 'PROVIDER_TEST',
    status: 'ACTIVE',
  };
}

function metrics(input: Partial<ArrivalMetrics> = {}): ArrivalMetrics {
  return {
    measuredAt: '2026-08-18T20:00:00.000Z',
    qualifiedExposures: 0,
    visits: 0,
    offerInteractions: 0,
    ownerInternalExposures: 0,
    strangerConfirmedInteractions: 0,
    measurementSource: 'recording DEV analytics',
    semantics: {
      qualifiedExposures: 'PROXY: post-baseline article views.',
      visits: 'DIRECT: article views; same provider count as exposure.',
      offerInteractions: 'DIRECT: reactions plus comments.',
    },
    ...input,
  };
}

function arrival(baseline = metrics()): ArrivalPublication {
  return {
    arrivalPublicationId: 'devto-article-42',
    experimentId: 'phase-a-doc-001',
    assetId: 'fixture-doc-001',
    providerId: 'devto-arrive-v1',
    providerObjectId: '42',
    location: 'https://dev.to/factory/fixture-42',
    idempotencyKey: 'phase-c-arrive',
    requestFingerprint: 'arrival-fingerprint',
    status: 'ACTIVE',
    mode: 'LIVE',
    activatedAt: '2026-08-18T19:00:00.000Z',
    baseline,
  };
}

class RecordingDevToTransport implements DevToTransport {
  readonly requests: DevToRequest[] = [];
  private article: Record<string, unknown> | null = null;
  totals: unknown = {
    page_views: { total: 1 },
    reactions: { total: 0 },
    comments: { total: 0 },
  };

  seedOrphanedFixture(): void {
    this.article = {
      id: 42,
      title: 'A tiny checklist for testing idempotent event pipelines',
      description: 'Factory Phase C fixture stale-marker. Noncommercial measurement fixture.',
      url: 'https://dev.to/factory/fixture-42',
      published: true,
      user: { id: 7, name: 'Factory Fixture', username: 'factory-fixture', github_username: null },
    };
  }

  async request<T>(request: DevToRequest): Promise<T> {
    this.requests.push(structuredClone(request));
    let response: unknown;
    if (request.path === '/api/users/me' || request.path === '/api/users/by_username?url=factory-fixture') {
      response = { id: 7, name: 'Factory Fixture', username: 'factory-fixture', github_username: null };
    }
    else if (request.path.startsWith('/api/articles?tag=')) {
      response = [{
        id: 9,
        title: 'A real fresh article',
        description: 'substantial',
        url: 'https://dev.to/example/article',
        positive_reactions_count: 2,
        comments_count: 1,
      }];
    } else if (request.path === '/api/articles/me/all?per_page=1000') {
      response = this.article ? [this.article] : [];
    } else if (request.method === 'POST' && request.path === '/api/articles') {
      const description = ((request.body?.article as Record<string, unknown>).description as string);
      this.article = {
        id: 42,
        title: 'A tiny checklist for testing idempotent event pipelines',
        description,
        url: 'https://dev.to/factory/fixture-42',
        published: true,
        user: { id: 7, name: 'Factory Fixture', username: 'factory-fixture', github_username: null },
      };
      response = this.article;
    } else if (request.path === '/api/analytics/totals' || request.path === '/api/analytics/totals?article_id=42') {
      response = this.totals;
    } else if (request.method === 'PUT' && request.path === '/api/articles/42') {
      this.article = { ...this.article, published: false };
      response = this.article;
    } else {
      throw new Error(`Unexpected DEV request: ${request.method} ${request.path}`);
    }
    return response as T;
  }
}

test('credential-free WATCH journal survives restart and deduplicates effects after recovery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-watch-journal-'));
  const signer = new FixtureEventSigner(SECRET);
  const first = await JsonJournalWatchStore.create(directory, SECRET);
  const event = syntheticEvent({ eventId: 'durable-exposure', type: 'QUALIFIED_EXPOSURE' });
  assert.deepEqual(await first.ingest(signer.sign(event)), { accepted: true, duplicate: false });

  const restarted = await JsonJournalWatchStore.create(directory, SECRET);
  assert.equal(restarted.snapshot(event.experimentId).qualifiedExposures, 1);
  assert.deepEqual(await restarted.ingest(signer.sign(event)), { accepted: false, duplicate: true });

  const changed = { ...event, quantity: 2 };
  await assert.rejects(restarted.ingest(signer.sign(changed)), /different payload/);
  assert.equal(restarted.snapshot(event.experimentId).qualifiedExposures, 1);
});

test('ARRIVE analytics bridge survives checkpoint loss without duplicating durable WATCH counts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-arrive-watch-'));
  const watchDirectory = join(directory, 'watch');
  const checkpointPath = join(directory, 'arrival-checkpoint.json');
  const watch = await JsonJournalWatchStore.create(watchDirectory, SECRET, ['FIXTURE', 'LIVE']);
  const bridge = new ArrivalWatchBridge({
    watch,
    internalEventSecret: SECRET,
    checkpoints: new JsonArrivalMetricCheckpointStore(checkpointPath),
  });
  const surface = arrival(metrics({ qualifiedExposures: 1, visits: 1, ownerInternalExposures: 1 }));
  const observed = metrics({
    qualifiedExposures: 6,
    visits: 6,
    offerInteractions: 2,
    ownerInternalExposures: 1,
    strangerConfirmedInteractions: 2,
  });
  assert.deepEqual(await bridge.ingest(surface, observed), { acceptedEvents: 3, duplicateEvents: 0 });
  let snapshot = watch.snapshot(surface.experimentId);
  assert.equal(snapshot.qualifiedExposures, 5);
  assert.equal(snapshot.ownerInternalExposures, 0);
  assert.equal(snapshot.productViews, 5);
  assert.equal(snapshot.offerInteractions, 2);

  const restartedWatch = await JsonJournalWatchStore.create(watchDirectory, SECRET, ['FIXTURE', 'LIVE']);
  const lostCheckpointBridge = new ArrivalWatchBridge({
    watch: restartedWatch,
    internalEventSecret: SECRET,
    checkpoints: new JsonArrivalMetricCheckpointStore(join(directory, 'lost-checkpoint.json')),
  });
  assert.deepEqual(
    await lostCheckpointBridge.ingest(surface, observed),
    { acceptedEvents: 0, duplicateEvents: 3 },
  );
  snapshot = restartedWatch.snapshot(surface.experimentId);
  assert.equal(snapshot.qualifiedExposures, 5);
  assert.equal(snapshot.productViews, 5);
  assert.equal(snapshot.offerInteractions, 2);
});

test('DEV pilot evaluates a measured gate, publishes once, measures, and deactivates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-devto-arrive-'));
  const transport = new RecordingDevToTransport();
  const adapter = new DevToArriveAdapter({
    transport,
    store: new JsonDevToArrivalStore(join(directory, 'devto.json')),
    tag: 'webdev',
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
  });
  const manifest = shortDocumentFixture();
  const gate = await adapter.evaluateGate(manifest, 'gate-key');
  assert.equal(gate.status, 'PASSED');
  assert.match(gate.quantitativeEvidenceId ?? '', /n=1:engagements=3/);
  assert.ok(gate.measurementVerifiedAt);

  const first = await adapter.activate(manifest, providerPublication(), 'arrive-key');
  const retry = await adapter.activate(manifest, providerPublication(), 'arrive-key');
  assert.equal(first.arrivalPublicationId, retry.arrivalPublicationId);
  assert.match(first.arrivalPublicationId, /^factory_arrive_[a-f0-9]{32}$/);
  const creation = transport.requests.find((request) => request.method === 'POST');
  const body = (creation?.body?.article as Record<string, unknown>)?.body_markdown;
  assert.equal(typeof body, 'string');
  assert.match(body as string, new RegExp(`client_reference_id=${first.arrivalPublicationId}`));
  assert.equal(transport.requests.filter((request) => request.method === 'POST').length, 1);
  assert.equal((await adapter.measure(first)).qualifiedExposures, 1);
  assert.equal((await adapter.deactivate(first, 'deactivate-key')).status, 'INACTIVE');
  assert.equal(transport.requests.filter((request) => request.method === 'PUT').length, 1);
});

test('controlled DEV fixture views remain owner/internal and cannot become stranger evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-controlled-arrive-'));
  const transport = new RecordingDevToTransport();
  const adapter = new DevToArriveAdapter({
    transport,
    store: new JsonDevToArrivalStore(join(directory, 'devto.json')),
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
    controlledFixtureMode: true,
  });
  const watch = await JsonJournalWatchStore.create(join(directory, 'watch'), SECRET, ['FIXTURE', 'LIVE']);
  const bridge = new ArrivalWatchBridge({
    watch,
    internalEventSecret: SECRET,
    checkpoints: new JsonArrivalMetricCheckpointStore(join(directory, 'arrival-checkpoint.json')),
  });
  const publication = await adapter.activate(shortDocumentFixture(), providerPublication(), 'controlled-arrival');

  transport.totals = {
    page_views: { total: 2 },
    reactions: { total: 1 },
    comments: { total: 1 },
  };
  const measured = await adapter.measure(publication);
  assert.equal(measured.ownerInternalExposures, 2);
  assert.equal(measured.strangerConfirmedInteractions, 0);
  await bridge.ingest(publication, measured);

  const snapshot = watch.snapshot(publication.experimentId);
  const funnel = snapshot.arrivalFunnels.find(
    (candidate) => candidate.arrivalPublicationId === publication.arrivalPublicationId,
  );
  assert.equal(snapshot.qualifiedExposures, 0);
  assert.equal(snapshot.ownerInternalExposures, 1);
  assert.equal(snapshot.productViews, 0);
  assert.equal(snapshot.ownerInternalProductViews, 1);
  assert.equal(funnel?.qualifiedExposures, 0);
  assert.equal(funnel?.ownerInternalExposures, 1);
  assert.equal(funnel?.productViews, 0);
  assert.equal(funnel?.ownerInternalProductViews, 1);
});

test('DEV analytics preflight accepts a new account with no aggregate rows', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-devto-empty-analytics-'));
  const transport = new RecordingDevToTransport();
  transport.totals = [];
  const adapter = new DevToArriveAdapter({
    transport,
    store: new JsonDevToArrivalStore(join(directory, 'devto.json')),
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
  });
  assert.equal((await adapter.evaluateGate(shortDocumentFixture(), 'empty-gate')).status, 'PASSED');
  const publication = await adapter.activate(shortDocumentFixture(), providerPublication(), 'empty-arrival');
  assert.equal(publication.baseline.qualifiedExposures, 0);
});

test('DEV gate unpublishes an exact orphaned Phase C fixture before creating another', async () => {
  const transport = new RecordingDevToTransport();
  transport.seedOrphanedFixture();
  const adapter = new DevToArriveAdapter({
    transport,
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
  });
  assert.equal((await adapter.evaluateGate(shortDocumentFixture(), 'orphan-cleanup')).status, 'PASSED');
  const emergencyUnpublish = transport.requests.find(
    (request) => request.method === 'PUT' && request.path === '/api/articles/42',
  );
  assert.deepEqual(emergencyUnpublish?.body, { article: { published: false } });
  assert.equal(transport.requests.some((request) => request.method === 'POST'), false);
});

test('DEV publication fails closed when public identity leaks a personal GitHub handle', async () => {
  class LeakingIdentityTransport extends RecordingDevToTransport {
    override async request<T>(request: DevToRequest): Promise<T> {
      if (request.path === '/api/users/me') {
        return {
          id: 7,
          name: 'Factory Fixture',
          username: 'factory-fixture',
          github_username: 'anneml825',
        } as T;
      }
      return super.request<T>(request);
    }
  }
  const transport = new LeakingIdentityTransport();
  const adapter = new DevToArriveAdapter({
    transport,
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
  });
  await assert.rejects(
    adapter.evaluateGate(shortDocumentFixture(), 'identity-gate'),
    /exposes an unapproved GitHub username/,
  );
  assert.equal(transport.requests.some((request) => request.method === 'POST'), false);
});

test('DEV publication permits only the exact owner-approved GitHub handle', async () => {
  class ApprovedIdentityTransport extends RecordingDevToTransport {
    override async request<T>(request: DevToRequest): Promise<T> {
      const response = await super.request<T>(request);
      if (
        request.path === '/api/users/me' ||
        request.path === '/api/users/by_username?url=factory-fixture' ||
        (request.method === 'POST' && request.path === '/api/articles')
      ) {
        return {
          ...(response as Record<string, unknown>),
          github_username: request.method === 'POST' ? undefined : 'anneml825',
          user: request.method === 'POST'
            ? { id: 7, name: 'Factory Fixture', username: 'factory-fixture', github_username: 'anneml825' }
            : undefined,
        } as T;
      }
      return response;
    }
  }
  const transport = new ApprovedIdentityTransport();
  const adapter = new DevToArriveAdapter({
    transport,
    expectedPublicName: 'Factory Fixture',
    expectedPublicUsername: 'factory-fixture',
    allowedPublicGithubUsername: 'anneml825',
  });
  assert.equal((await adapter.evaluateGate(shortDocumentFixture(), 'approved-identity-gate')).status, 'PASSED');
  const publication = await adapter.activate(shortDocumentFixture(), providerPublication(), 'approved-identity-arrival');
  assert.equal(publication.status, 'ACTIVE');
});

test('Stripe async-payment failure is signed, attributed, visible, and idempotent', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'factory-checkout-failure-'));
  const watch = await JsonJournalWatchStore.create(directory, SECRET, ['PROVIDER_TEST']);
  const processor = new StripeTestWebhookProcessor({
    webhookSecret: STRIPE_SECRET,
    internalEventSecret: SECRET,
    watch,
    fulfillment: { async fulfill() { return { succeeded: true }; } },
    nowSeconds: () => NOW,
  });
  const payload = JSON.stringify({
    id: 'evt_async_failed',
    type: 'checkout.session.async_payment_failed',
    created: NOW,
    livemode: false,
    data: {
      object: {
        id: 'cs_test_failed',
        payment_intent: 'pi_test_failed',
        client_reference_id: 'factory_arrive_0123456789abcdef0123456789abcdef',
        metadata: {
          factory_environment: 'PROVIDER_TEST',
          factory_test_transaction: 'true',
          transaction_classification: 'OWNER_TEST',
          experiment_id: 'phase-a-doc-001',
          asset_id: 'fixture-doc-001',
        },
      },
    },
  });
  const signature = signStripeTestEvent(payload, STRIPE_SECRET, NOW);
  assert.equal((await processor.process(payload, signature)).status, 'PROCESSED');
  assert.equal((await processor.process(payload, signature)).status, 'DUPLICATE');
  const snapshot = watch.snapshot('phase-a-doc-001');
  assert.equal(snapshot.checkoutFailures, 1);
  assert.equal(snapshot.arrivalFunnels[0].arrivalPublicationId, 'factory_arrive_0123456789abcdef0123456789abcdef');
  assert.equal(snapshot.arrivalFunnels[0].checkoutFailures, 1);
  assert.equal(snapshot.transactions.length, 0);
  assert.equal(snapshot.eligibleArmLengthRevenueCents, 0);
});

test('owner labor keeps EXCEPTION separate and rejects per-asset operating work', () => {
  const curve = {
    setupMinutes: 10,
    batchApprovalMinutesPerBatch: 5,
    batchSize: 100,
    exceptionMinutesPerThousandUnits: 15,
    operatingMinutesPerUnit: 0,
    maintenanceMinutesPerThousandUnits: 10,
  };
  assert.doesNotThrow(() => assertPortfolioCompatibleOwnerLabor(curve));
  assert.deepEqual([1, 10, 100, 1000].map((units) => projectOwnerLabor(curve, units).operatingMinutes), [0, 0, 0, 0]);
  assert.throws(
    () => assertPortfolioCompatibleOwnerLabor({ ...curve, operatingMinutesPerUnit: 1 }),
    /scale per unit/,
  );
  assert.deepEqual(summarizeOwnerLabor([{
    interventionId: 'kyc-exception',
    occurredAt: '2026-08-18T00:00:00.000Z',
    kind: 'EXCEPTION',
    actualMinutes: 7,
    reasonHumanRequired: 'provider KYC review',
    isRecurring: false,
    automatable: false,
    unitsAffected: 1000,
  }]), {
    SETUP: 0,
    BATCH_APPROVAL: 0,
    EXCEPTION: 7,
    OPERATING: 0,
    MAINTENANCE_DEBUG: 0,
  });
});

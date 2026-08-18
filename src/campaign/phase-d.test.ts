import test from 'node:test';
import assert from 'node:assert/strict';
import type { CapitalAuthorityPort } from '../portfolio/cost-control.ts';
import { CapitalControlUnavailableError, CostController } from '../portfolio/cost-control.ts';
import { phaseDIntegrationFixtures } from './fixtures.ts';
import { evaluateLiveLaunchGate, validateCommercialExperimentPlan } from './gates.ts';
import {
  FixtureInferenceAdapter,
  InferenceRouter,
  MeteredInferenceExecutor,
  type InferenceAdapter,
  type InferenceRequest,
  type InferenceResponse,
} from './inference.ts';
import { CredentialFreeCampaignOrchestrator } from './orchestrator.ts';

function request(overrides: Partial<InferenceRequest> = {}): InferenceRequest {
  return {
    operationId: 'test-operation',
    experimentId: 'test-experiment',
    task: 'VALUE_QA',
    input: 'fixture input',
    estimatedInputTokens: 500,
    maximumOutputTokens: 100,
    minimumQualityScore: 0.8,
    ...overrides,
  };
}

class RecordingMeteredAdapter implements InferenceAdapter {
  readonly profile;
  executions = 0;

  constructor(input: {
    providerId: string;
    qualityScore: number;
    estimatedCostMicros: number;
    credentialState?: 'AVAILABLE' | 'UNAVAILABLE';
    actualCostCents?: number;
  }) {
    this.profile = {
      providerId: input.providerId,
      modelId: `${input.providerId}-model`,
      tasks: ['VALUE_QA'] as const,
      qualityScore: input.qualityScore,
      inputMicrosPerMillionTokens: input.estimatedCostMicros,
      outputMicrosPerMillionTokens: 0,
      credentialState: input.credentialState ?? 'AVAILABLE',
      fixtureOnly: false,
    };
    this.estimatedCostMicros = input.estimatedCostMicros;
    this.actualCostCents = input.actualCostCents ?? 1;
  }

  private readonly estimatedCostMicros: number;
  private readonly actualCostCents: number;

  quote() {
    return { estimatedCostMicros: this.estimatedCostMicros, maximumCostCents: 2 };
  }

  async execute(input: InferenceRequest): Promise<InferenceResponse> {
    this.executions++;
    return {
      providerId: this.profile.providerId,
      modelId: this.profile.modelId,
      output: `result:${input.task}`,
      inputTokens: input.estimatedInputTokens,
      outputTokens: 10,
      actualCostCents: this.actualCostCents,
      fixture: false,
    };
  }
}

class RecordingAuthority implements CapitalAuthorityPort {
  readonly calls: string[] = [];
  private readonly failReserve: boolean;
  constructor(failReserve = false) { this.failReserve = failReserve; }
  async reserve(input: { idempotencyKey: string }) {
    this.calls.push(`reserve:${input.idempotencyKey}`);
    if (this.failReserve) throw new Error('kill switch engaged');
    return {
      id: 1,
      idempotencyKey: input.idempotencyKey,
      bucketName: 'production',
      maxAmountCents: 2,
      state: 'RESERVED' as const,
      wasAlreadyReserved: false,
    };
  }
  async settle(key: string, amount: number) { this.calls.push(`settle:${key}:${amount}`); }
  async release(key: string) { this.calls.push(`release:${key}`); }
}

test('complete BUYER + PROBLEM + OFFER + MAKE + PUT + ARRIVE + WATCH is mandatory', () => {
  const plan = phaseDIntegrationFixtures(1)[0];
  assert.doesNotThrow(() => validateCommercialExperimentPlan(plan));
  const incomplete = structuredClone(plan);
  incomplete.arrive.who = '';
  assert.throws(() => validateCommercialExperimentPlan(incomplete), /ARRIVE who/);
  const manual = structuredClone(plan);
  manual.ownerLabor.operatingMinutesPerAsset = 1;
  assert.throws(() => validateCommercialExperimentPlan(manual), /owner-labor gate/);
});

test('credential-free E0 fixtures remain fail-closed for live launch after QA', () => {
  const gate = evaluateLiveLaunchGate(phaseDIntegrationFixtures(1)[0], {
    functionalQaPassed: true,
    valueQaPassed: true,
  });
  assert.equal(gate.eligible, false);
  assert.match(gate.reasons.join(' | '), /noncommercial fixture/);
  assert.match(gate.reasons.join(' | '), /E0 to E1/);
  assert.match(gate.reasons.join(' | '), /measurement instrument is unverified/);
});

test('router selects the cheapest available capable model meeting quality', () => {
  const expensive = new RecordingMeteredAdapter({ providerId: 'provider-z', qualityScore: 0.95, estimatedCostMicros: 80 });
  const cheap = new RecordingMeteredAdapter({ providerId: 'provider-a', qualityScore: 0.82, estimatedCostMicros: 20 });
  const tooWeak = new RecordingMeteredAdapter({ providerId: 'provider-b', qualityScore: 0.7, estimatedCostMicros: 1 });
  const unavailable = new RecordingMeteredAdapter({ providerId: 'provider-c', qualityScore: 0.99, estimatedCostMicros: 1, credentialState: 'UNAVAILABLE' });
  const selected = new InferenceRouter([expensive, cheap, tooWeak, unavailable]).select(request(), { allowFixture: false });
  assert.equal(selected.profile.providerId, 'provider-a');
});

test('no eligible provider credential fails closed without executing inference', async () => {
  const unavailable = new RecordingMeteredAdapter({ providerId: 'unavailable', qualityScore: 1, estimatedCostMicros: 1, credentialState: 'UNAVAILABLE' });
  const executor = new MeteredInferenceExecutor(new InferenceRouter([unavailable]));
  await assert.rejects(executor.execute(request(), { allowFixture: false }), /No available inference adapter/);
  assert.equal(unavailable.executions, 0);
});

test('metered inference cannot bypass Capital Authority', async () => {
  const adapter = new RecordingMeteredAdapter({ providerId: 'metered', qualityScore: 1, estimatedCostMicros: 20 });
  const withoutAuthority = new MeteredInferenceExecutor(new InferenceRouter([adapter]));
  await assert.rejects(withoutAuthority.execute(request(), { allowFixture: false }), CapitalControlUnavailableError);
  assert.equal(adapter.executions, 0);

  const authority = new RecordingAuthority();
  const controlled = new MeteredInferenceExecutor(new InferenceRouter([adapter]), new CostController(authority));
  const result = await controlled.execute(request(), { allowFixture: false });
  assert.equal(result.cost.settledCents, 1);
  assert.deepEqual(authority.calls, [
    'reserve:inference:test-operation',
    'settle:inference:test-operation:1',
  ]);
});

test('engaged kill switch fails before provider execution', async () => {
  const adapter = new RecordingMeteredAdapter({ providerId: 'metered', qualityScore: 1, estimatedCostMicros: 20 });
  const executor = new MeteredInferenceExecutor(
    new InferenceRouter([adapter]),
    new CostController(new RecordingAuthority(true)),
  );
  await assert.rejects(executor.execute(request(), { allowFixture: false }), /kill switch engaged/);
  assert.equal(adapter.executions, 0);
});

test('fixture inference retries are idempotent and cannot duplicate execution or cost', async () => {
  const adapter = new FixtureInferenceAdapter();
  const executor = new MeteredInferenceExecutor(new InferenceRouter([adapter]));
  const first = await executor.execute(request(), { allowFixture: true });
  const retry = await executor.execute(request(), { allowFixture: true });
  assert.deepEqual(retry, first);
  assert.equal(adapter.executions, 1);
  assert.equal(first.cost.settledCents, 0);
});

test('initial four-experiment batch prepares concurrently but never publishes', async () => {
  const adapter = new FixtureInferenceAdapter();
  const runner = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([adapter])),
    { concurrency: 3 },
  );
  const result = await runner.prepare(phaseDIntegrationFixtures(4));
  assert.equal(result.requestedExperiments, 4);
  assert.equal(result.peakConcurrency, 3);
  assert.equal(result.ownerOperatingMinutes, 0);
  assert.equal(result.prepared.every((item) => item.state === 'VALUE_QA_PASS'), true);
  assert.equal(result.prepared.every((item) => item.launchGate.eligible === false), true);
  assert.equal(result.prepared.every((item) => item.costs.every((cost) => cost.settledCents === 0)), true);
});

test('same architecture prepares 100 independently attributed experiments with bounded concurrency', async () => {
  const adapter = new FixtureInferenceAdapter();
  const runner = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([adapter])),
    { concurrency: 12 },
  );
  const result = await runner.prepare(phaseDIntegrationFixtures(100));
  assert.equal(result.requestedExperiments, 100);
  assert.equal(result.peakConcurrency, 12);
  assert.equal(result.ownerOperatingMinutes, 0);
  assert.equal(new Set(result.prepared.map((item) => item.experimentId)).size, 100);
  assert.equal(result.prepared.every((item) => item.state === 'VALUE_QA_PASS'), true);
  assert.equal(result.prepared.every((item) => item.launchGate.eligible === false), true);
});

test('one experiment failure is isolated from the rest of a concurrent batch', async () => {
  class SelectiveFailureAdapter extends FixtureInferenceAdapter {
    override async execute(input: InferenceRequest, idempotencyKey: string) {
      if (input.experimentId.endsWith('002')) throw new Error('isolated fixture failure');
      return super.execute(input, idempotencyKey);
    }
  }
  const adapter = new SelectiveFailureAdapter();
  const runner = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([adapter])),
    { concurrency: 4 },
  );
  const result = await runner.prepare(phaseDIntegrationFixtures(5));
  assert.equal(result.prepared.filter((item) => item.state === 'FAILED').length, 1);
  assert.equal(result.prepared.filter((item) => item.state === 'VALUE_QA_PASS').length, 4);
  assert.match(result.prepared.find((item) => item.state === 'FAILED')?.error ?? '', /isolated fixture failure/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import type { CapitalAuthorityPort } from '../portfolio/cost-control.ts';
import { centsCeilingFromMicros } from '../capital/inference-accounting.ts';
import { InMemoryOwnerLaborLedger } from '../portfolio/owner-labor.ts';
import { CapitalControlUnavailableError, CostController } from '../portfolio/cost-control.ts';
import { phaseDIntegrationFixtures } from './fixtures.ts';
import { evaluateLiveLaunchGate, validateCommercialExperimentPlan } from './gates.ts';
import {
  FixtureInferenceAdapter,
  INFERENCE_BUCKET,
  InferenceRouter,
  MeteredInferenceExecutor,
  type InferenceAdapter,
  type InferenceRequest,
  type InferenceResponse,
} from './inference.ts';
import { CredentialFreeCampaignOrchestrator } from './orchestrator.ts';
import type { CommercialExperimentPlan } from './types.ts';

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
    actualCostMicros?: number;
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
    this.actualCostMicros = input.actualCostMicros ?? input.estimatedCostMicros;
  }

  private readonly estimatedCostMicros: number;
  private readonly actualCostMicros: number;

  quote() {
    return {
      estimatedCostMicros: this.estimatedCostMicros,
      maximumCostMicros: this.estimatedCostMicros,
      maximumCostCents: centsCeilingFromMicros(this.estimatedCostMicros),
    };
  }

  async execute(input: InferenceRequest): Promise<InferenceResponse> {
    this.executions++;
    return {
      providerId: this.profile.providerId,
      modelId: this.profile.modelId,
      output: `result:${input.task}`,
      inputTokens: input.estimatedInputTokens,
      outputTokens: 10,
      actualCostMicros: this.actualCostMicros,
      fixture: false,
    };
  }
}

class RecordingAuthority implements CapitalAuthorityPort {
  readonly calls: string[] = [];
  private readonly failReserve: boolean;
  constructor(failReserve = false) { this.failReserve = failReserve; }
  async reserve(input: { idempotencyKey: string; maxAmountCents: number; bucketName: string }) {
    this.calls.push(`reserve:${input.idempotencyKey}:${input.bucketName}:${input.maxAmountCents}`);
    if (this.failReserve) throw new Error('kill switch engaged');
    return {
      id: 1,
      idempotencyKey: input.idempotencyKey,
      bucketName: input.bucketName,
      maxAmountCents: input.maxAmountCents,
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
  assert.equal(result.attribution.centRecord?.settledCents, 1);
  assert.equal(result.attribution.centRecord?.bucketName, INFERENCE_BUCKET);
  assert.deepEqual(authority.calls, [
    `reserve:inference:test-operation:${INFERENCE_BUCKET}:1`,
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
  assert.equal(first.attribution.settlement, 'ZERO_COST');
  assert.equal(first.attribution.actualCostMicros, 0);
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
  assert.equal(result.declaredOwnerOperatingMinutes, 0);
  assert.equal(result.prepared.every((item) => item.state === 'VALUE_QA_PASS'), true);
  assert.equal(result.prepared.every((item) => item.launchGate.eligible === false), true);
  assert.equal(result.prepared.every((item) => item.costs.every((cost) => cost.settledCents === 0)), true);
  assert.equal(result.inferenceCostMicros, 0);
  // No owner-labour source was supplied, so the zero-labour claim is unverified
  // and the gate says so rather than accepting the declaration.
  assert.equal(result.observedOwnerOperatingMinutes, null);
  assert.match(
    result.prepared[0]?.launchGate.reasons.join(' | ') ?? '',
    /owner operating labour has not been reconciled/,
  );
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
  assert.equal(result.declaredOwnerOperatingMinutes, 0);
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

// ---------------------------------------------------------------------------
// §18 pre-revenue cost discipline, wired into execution rather than documented.
// ---------------------------------------------------------------------------

function costedPlan(overrides: {
  nonInferenceMarginalCashCostUsd: number;
  justification?: CommercialExperimentPlan['costDiscipline']['justification'];
  ownerAuthorization?: { reference: string; authorizedAt: string };
}): CommercialExperimentPlan[] {
  const plans = phaseDIntegrationFixtures(1);
  plans[0].costDiscipline = { ...overrides };
  return plans;
}

const FULL_JUSTIFICATION = {
  whyNoCheaperFalsification: 'No zero-cost surface exposes this denominator.',
  whyInformationGainJustifiesIt: 'It is the only way to observe a real purchase decision.',
  alternativeExperimentsSacrificed: 6,
  whyConcentrateBeforeAnyRevenue: 'The result determines whether the portfolio thesis survives.',
};

test('REGRESSION: §18 refuses an above-target experiment before any provider call', async () => {
  const adapter = new FixtureInferenceAdapter();
  const runner = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([adapter])),
    { concurrency: 1, remainingOwnerCapitalUsd: 50 },
  );
  // The Etsy shop-setup mistake: 44% of the capital base for one surface.
  const result = await runner.prepare(costedPlan({ nonInferenceMarginalCashCostUsd: 22 }));
  const prepared = result.prepared[0];
  assert.equal(prepared.state, 'FAILED');
  assert.match(prepared.error ?? '', /§18 pre-revenue cost discipline refused/);
  assert.equal(prepared.costVerdict?.allowed, false);
  assert.equal(adapter.executions, 0, 'cost discipline must gate before the provider is called');
  assert.equal(prepared.launchGate.eligible, false);
});

test('§18 allows a zero-cost experiment and records the verdict', async () => {
  const runner = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([new FixtureInferenceAdapter()])),
    { concurrency: 1, remainingOwnerCapitalUsd: 50 },
  );
  const result = await runner.prepare(costedPlan({ nonInferenceMarginalCashCostUsd: 0 }));
  assert.equal(result.prepared[0].state, 'VALUE_QA_PASS');
  assert.equal(result.prepared[0].costVerdict?.allowed, true);
  assert.equal(result.prepared[0].costVerdict?.requiresOwnerAuthorization, false);
});

test('§18 demands recorded owner authorization above 10% of remaining capital', async () => {
  const build = (ownerAuthorization?: { reference: string; authorizedAt: string }) =>
    new CredentialFreeCampaignOrchestrator(
      new MeteredInferenceExecutor(new InferenceRouter([new FixtureInferenceAdapter()])),
      { concurrency: 1, remainingOwnerCapitalUsd: 50 },
    ).prepare(costedPlan({
      nonInferenceMarginalCashCostUsd: 6,
      justification: FULL_JUSTIFICATION,
      ownerAuthorization,
    }));

  const unauthorized = (await build()).prepared[0];
  assert.equal(unauthorized.state, 'FAILED');
  assert.equal(unauthorized.costVerdict?.requiresOwnerAuthorization, true);
  assert.match(unauthorized.error ?? '', /requires owner authorization/);

  const authorized = (await build({ reference: 'owner-approval-7', authorizedAt: '2026-08-18T00:00:00.000Z' }))
    .prepared[0];
  assert.equal(authorized.state, 'VALUE_QA_PASS');
});

test('REGRESSION: observed owner labour overrides a declared zero at the launch gate', async () => {
  const ledger = new InMemoryOwnerLaborLedger('phase-d-test-ledger');
  const clean = await new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([new FixtureInferenceAdapter()])),
    { concurrency: 2, ownerLaborSource: ledger },
  ).prepare(phaseDIntegrationFixtures(2));
  assert.equal(clean.observedOwnerOperatingMinutes, 0);
  assert.equal(clean.ownerLaborReconciliation?.truthful, true);
  assert.ok(
    !clean.prepared[0].launchGate.reasons.some((reason) => reason.includes('owner operating labour')),
    'a reconciled zero should not raise an owner-labour reason',
  );

  ledger.log({
    interventionId: 'manual-publish-1',
    occurredAt: '2026-08-18T00:00:00.000Z',
    kind: 'OPERATING',
    actualMinutes: 12,
    reasonHumanRequired: 'the operator published this asset by hand',
    isRecurring: true,
    automatable: true,
    unitsAffected: 1,
    experimentIds: ['phase-d-fixture-001'],
  });
  const dirty = await new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([new FixtureInferenceAdapter()])),
    { concurrency: 2, ownerLaborSource: ledger },
  ).prepare(phaseDIntegrationFixtures(2));
  assert.equal(dirty.observedOwnerOperatingMinutes, 12);
  assert.equal(dirty.ownerLaborReconciliation?.truthful, false);
  assert.match(
    dirty.prepared[0].launchGate.reasons.join(' | '),
    /declared owner operating labour is contradicted by observation/,
  );
});

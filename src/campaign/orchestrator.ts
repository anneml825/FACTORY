import { PhaseAEngine } from '../portfolio/engine.ts';
import { FixtureArrivalAdapter, FixtureMakeAdapter, FakeLocalPutProvider } from '../portfolio/fake-adapters.ts';
import { InMemoryWatchStore } from '../portfolio/watch.ts';
import { evaluateLiveLaunchGate, validateCommercialExperimentPlan } from './gates.ts';
import { MeteredInferenceExecutor } from './inference.ts';
import type { CampaignRunResult, CommercialExperimentPlan, PreparedExperiment } from './types.ts';

export interface CampaignOrchestratorOptions {
  concurrency: number;
}

export class CredentialFreeCampaignOrchestrator {
  private readonly inference: MeteredInferenceExecutor;
  private readonly options: CampaignOrchestratorOptions;

  constructor(
    inference: MeteredInferenceExecutor,
    options: CampaignOrchestratorOptions,
  ) {
    this.inference = inference;
    this.options = options;
    if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
      throw new Error('Campaign concurrency must be a positive integer.');
    }
  }

  async prepare(plans: readonly CommercialExperimentPlan[]): Promise<CampaignRunResult> {
    if (plans.length === 0) throw new Error('Campaign preparation requires at least one experiment.');
    const campaignIds = new Set(plans.map((plan) => plan.campaignId));
    if (campaignIds.size !== 1) throw new Error('One run may prepare only one campaign.');
    const experimentIds = new Set(plans.map((plan) => plan.experimentId));
    if (experimentIds.size !== plans.length) throw new Error('Duplicate experiment IDs are forbidden within a campaign run.');
    for (const plan of plans) validateCommercialExperimentPlan(plan);

    const prepared = new Array<PreparedExperiment>(plans.length);
    let cursor = 0;
    let active = 0;
    let peakConcurrency = 0;
    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor++;
        if (index >= plans.length) return;
        active++;
        peakConcurrency = Math.max(peakConcurrency, active);
        try {
          prepared[index] = await this.prepareOne(plans[index]);
        } finally {
          active--;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.options.concurrency, plans.length) }, worker));
    return {
      campaignId: plans[0].campaignId,
      requestedExperiments: plans.length,
      prepared,
      peakConcurrency,
      ownerOperatingMinutes: plans.reduce((sum, plan) => sum + plan.ownerLabor.operatingMinutesPerAsset, 0),
    };
  }

  private async prepareOne(plan: CommercialExperimentPlan): Promise<PreparedExperiment> {
    try {
      const inference = await this.inference.execute({
        operationId: `phase-d:value-qa:${plan.experimentId}`,
        experimentId: plan.experimentId,
        task: 'VALUE_QA',
        input: JSON.stringify({ buyer: plan.buyer, problem: plan.problem, offer: plan.offer, source: plan.manifest.source }),
        estimatedInputTokens: 400,
        maximumOutputTokens: 200,
        minimumQualityScore: 0.8,
      }, { allowFixture: true });

      const engine = new PhaseAEngine({
        make: new FixtureMakeAdapter(),
        put: new FakeLocalPutProvider(),
        arrive: new FixtureArrivalAdapter(false),
        watch: new InMemoryWatchStore('phase-d-unused-watch-secret'),
      });
      engine.register(plan.manifest);
      await engine.build(plan.experimentId);
      engine.functionalQa(plan.experimentId);
      engine.valueQa(plan.experimentId);
      const record = engine.get(plan.experimentId);
      return {
        experimentId: plan.experimentId,
        state: 'VALUE_QA_PASS',
        inferenceProviderId: inference.response.providerId,
        inferenceModelId: inference.response.modelId,
        costs: [inference.cost, ...record.costs],
        launchGate: evaluateLiveLaunchGate(plan, { functionalQaPassed: true, valueQaPassed: true }),
        error: null,
      };
    } catch (error) {
      return {
        experimentId: plan.experimentId,
        state: 'FAILED',
        inferenceProviderId: null,
        inferenceModelId: null,
        costs: [],
        launchGate: evaluateLiveLaunchGate(plan, { functionalQaPassed: false, valueQaPassed: false }),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

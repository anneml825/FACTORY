import { PhaseAEngine } from '../portfolio/engine.ts';
import { FixtureArrivalAdapter, FixtureMakeAdapter, FakeLocalPutProvider } from '../portfolio/fake-adapters.ts';
import { InMemoryWatchStore } from '../portfolio/watch.ts';
import {
  reconcileOwnerLabor,
  type ObservedOwnerLaborSource,
  type OwnerLaborReconciliation,
} from '../portfolio/owner-labor.ts';
import { MICROS_PER_CENT, type InferenceTranche } from '../capital/inference-accounting.ts';
import { assessExperimentCost, type CostVerdict } from '../experiments/cost-discipline.ts';
import { evaluateLiveLaunchGate, validateCommercialExperimentPlan } from './gates.ts';
import { MeteredInferenceExecutor, type InferenceRequest } from './inference.ts';
import type { CampaignRunResult, CommercialExperimentPlan, PreparedExperiment } from './types.ts';

export interface CampaignOrchestratorOptions {
  concurrency: number;
  /**
   * Remaining owner capital, in dollars, that §18 is assessed against. Defaults
   * to the full authorized reserve; a caller with a live ledger should pass the
   * real remaining figure.
   */
  remainingOwnerCapitalUsd?: number;
  /** One whole-cent reservation covering many sub-cent inference calls. */
  tranche?: InferenceTranche;
  /** Where observed owner labour is read from. Absent means unreconciled. */
  ownerLaborSource?: ObservedOwnerLaborSource;
}

const DEFAULT_REMAINING_OWNER_CAPITAL_USD = 50;

/** Preparation result before campaign-level reconciliation fills in the gate. */
type PartiallyPrepared = Omit<PreparedExperiment, 'launchGate'>;

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

    const partial = new Array<PartiallyPrepared>(plans.length);
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
          partial[index] = await this.prepareOne(plans[index]);
        } finally {
          active--;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.options.concurrency, plans.length) }, worker));

    // Owner labour is reconciled once for the whole batch, because interventions
    // are logged against work, not against individual manifests.
    let reconciliation: OwnerLaborReconciliation | null = null;
    if (this.options.ownerLaborSource) {
      const observation = await this.options.ownerLaborSource.observe([...experimentIds]);
      const declaredPerAsset = plans[0].ownerLabor.operatingMinutesPerAsset;
      reconciliation = reconcileOwnerLabor({
        declaredOperatingMinutesPerAsset: declaredPerAsset,
        units: plans.length,
        observation,
      });
    }

    const prepared: PreparedExperiment[] = partial.map((item, index) => ({
      ...item,
      launchGate: evaluateLiveLaunchGate(plans[index], {
        functionalQaPassed: item.state === 'VALUE_QA_PASS',
        valueQaPassed: item.state === 'VALUE_QA_PASS',
        costVerdict: item.costVerdict,
        ownerLabor: reconciliation,
      }),
    }));

    return {
      campaignId: plans[0].campaignId,
      requestedExperiments: plans.length,
      prepared,
      peakConcurrency,
      declaredOwnerOperatingMinutes: plans.reduce(
        (sum, plan) => sum + plan.ownerLabor.operatingMinutesPerAsset,
        0,
      ),
      observedOwnerOperatingMinutes: reconciliation?.observedOperatingMinutes ?? null,
      ownerLaborReconciliation: reconciliation,
      inferenceCostMicros: prepared.reduce((sum, item) => sum + item.inferenceCostMicros, 0),
      trancheSettledCents: null,
    };
  }

  private valueQaRequest(plan: CommercialExperimentPlan): InferenceRequest {
    return {
      operationId: `phase-d:value-qa:${plan.experimentId}`,
      experimentId: plan.experimentId,
      task: 'VALUE_QA',
      input: JSON.stringify({ buyer: plan.buyer, problem: plan.problem, offer: plan.offer, source: plan.manifest.source }),
      estimatedInputTokens: 400,
      maximumOutputTokens: 200,
      minimumQualityScore: 0.8,
    };
  }

  /**
   * §18 is applied to the quoted cost BEFORE the provider is called. Assessing
   * it afterwards would make it a report rather than a control.
   */
  private assessCost(plan: CommercialExperimentPlan, quotedInferenceMicros: number): CostVerdict {
    const inferenceUsd = quotedInferenceMicros / (MICROS_PER_CENT * 100);
    return assessExperimentCost({
      experimentId: plan.experimentId,
      marginalCashCostUsd: plan.costDiscipline.nonInferenceMarginalCashCostUsd + inferenceUsd,
      remainingOwnerCapitalUsd:
        this.options.remainingOwnerCapitalUsd ?? DEFAULT_REMAINING_OWNER_CAPITAL_USD,
      justification: plan.costDiscipline.justification,
    });
  }

  private async prepareOne(plan: CommercialExperimentPlan): Promise<PartiallyPrepared> {
    let costVerdict: CostVerdict | null = null;
    try {
      const request = this.valueQaRequest(plan);
      const quote = this.inference.quoteFor(request, { allowFixture: true });
      costVerdict = this.assessCost(plan, quote.maximumCostMicros);
      if (!costVerdict.allowed) {
        throw new Error(`§18 pre-revenue cost discipline refused this experiment: ${costVerdict.blocking.join('; ')}`);
      }
      if (costVerdict.requiresOwnerAuthorization && !plan.costDiscipline.ownerAuthorization) {
        throw new Error(
          '§18 requires owner authorization for this spend and the plan records none; refusing to proceed.',
        );
      }

      const inference = await this.inference.execute(request, {
        allowFixture: true,
        tranche: this.options.tranche,
      });

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
        costs: [
          ...(inference.attribution.centRecord ? [inference.attribution.centRecord] : []),
          ...record.costs,
        ],
        inferenceCostMicros: inference.attribution.actualCostMicros,
        costVerdict,
        error: null,
      };
    } catch (error) {
      return {
        experimentId: plan.experimentId,
        state: 'FAILED',
        inferenceProviderId: null,
        inferenceModelId: null,
        costs: [],
        inferenceCostMicros: 0,
        costVerdict,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

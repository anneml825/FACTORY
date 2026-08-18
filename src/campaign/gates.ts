import type { OwnerLaborReconciliation } from '../portfolio/owner-labor.ts';
import type { CostVerdict } from '../experiments/cost-discipline.ts';
import type { CommercialExperimentPlan, LaunchGateResult } from './types.ts';

function present(value: string): boolean {
  return value.trim().length > 0;
}

export function validateCommercialExperimentPlan(plan: CommercialExperimentPlan): void {
  const required: Array<[string, string]> = [
    ['campaignId', plan.campaignId],
    ['experimentId', plan.experimentId],
    ['buyer', plan.buyer],
    ['problem', plan.problem],
    ['offer', plan.offer],
    ['MAKE familyArchitectureId', plan.make.familyArchitectureId],
    ['PUT adapterId', plan.put.adapterId],
    ['ARRIVE adapterId', plan.arrive.adapterId],
    ['ARRIVE who', plan.arrive.who],
    ['ARRIVE where', plan.arrive.where],
    ['ARRIVE surface', plan.arrive.surface],
    ['ARRIVE permittedReason', plan.arrive.permittedReason],
    ['ARRIVE measurementInstrument', plan.arrive.measurementInstrument],
    ['WATCH adapterId', plan.watch.adapterId],
  ];
  const missing = required.filter(([, value]) => !present(value)).map(([label]) => label);
  if (missing.length) throw new Error(`Incomplete commercial experiment: missing ${missing.join(', ')}.`);
  if (plan.experimentId !== plan.manifest.experimentId) throw new Error('Plan/manifest experiment attribution differs.');
  if (plan.buyer !== plan.manifest.buyer || plan.problem !== plan.manifest.problem) {
    throw new Error('Plan/manifest buyer-problem attribution differs.');
  }
  if (!Number.isInteger(plan.arrive.minimumMeaningfulExposure) || plan.arrive.minimumMeaningfulExposure < 1) {
    throw new Error('ARRIVE minimumMeaningfulExposure must be a positive integer.');
  }
  if (!plan.put.automated || plan.put.ownerOperatingMinutesPerAsset !== 0 || plan.ownerLabor.operatingMinutesPerAsset !== 0) {
    throw new Error('Experiment fails portfolio owner-labor gate: normal operation scales per asset.');
  }
  if (
    !Number.isFinite(plan.costDiscipline?.nonInferenceMarginalCashCostUsd) ||
    plan.costDiscipline.nonInferenceMarginalCashCostUsd < 0
  ) {
    throw new Error('Experiment must declare a non-negative non-inference marginal cash cost (§18).');
  }
}

export interface LaunchGateState {
  functionalQaPassed: boolean;
  valueQaPassed: boolean;
  /** §18 verdict for this experiment. `null` means the rule was never applied. */
  costVerdict?: CostVerdict | null;
  /**
   * Observed-versus-declared owner labour. `null` means nobody checked, which
   * fails the gate: a zero-labour claim needs evidence, not a declaration.
   */
  ownerLabor?: OwnerLaborReconciliation | null;
}

export function evaluateLiveLaunchGate(
  plan: CommercialExperimentPlan,
  state: LaunchGateState,
): LaunchGateResult {
  const reasons: string[] = [];
  if (plan.manifest.noncommercialFixture) reasons.push('noncommercial fixture cannot launch commercially');
  if (plan.put.mode !== 'LIVE') reasons.push('PUT adapter is not LIVE');
  if (plan.arrive.quantitativeSignal.grade !== 'E1') reasons.push('ARRIVE evidence has not advanced from E0 to E1');
  if (
    plan.arrive.quantitativeSignal.sourceId === null ||
    plan.arrive.quantitativeSignal.retrievedAt === null ||
    plan.arrive.quantitativeSignal.numericValue === null ||
    !plan.arrive.quantitativeSignal.semanticsVerified
  ) reasons.push('independently retrieved quantitative signal is incomplete or semantically unverified');
  if (!plan.arrive.measurementVerified) reasons.push('ARRIVE measurement instrument is unverified');
  if (!state.functionalQaPassed) reasons.push('functional QA has not passed');
  if (!state.valueQaPassed) reasons.push('Value QA has not passed');

  const verdict = state.costVerdict ?? null;
  if (!verdict) {
    reasons.push('pre-revenue cost discipline (§18) has not been assessed');
  } else {
    if (!verdict.allowed) reasons.push(`§18 cost discipline blocks this experiment: ${verdict.blocking.join('; ')}`);
    if (verdict.requiresOwnerAuthorization && !plan.costDiscipline.ownerAuthorization) {
      reasons.push('§18 requires owner authorization for this spend and none is recorded');
    }
  }

  const labor = state.ownerLabor ?? null;
  if (!labor) {
    reasons.push('declared owner operating labour has not been reconciled against owner_intervention records');
  } else if (!labor.truthful) {
    reasons.push(`declared owner operating labour is contradicted by observation: ${labor.reasons.join('; ')}`);
  }

  return { eligible: reasons.length === 0, reasons };
}

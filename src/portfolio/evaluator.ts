import type { AssetManifest, EvaluationResult, FunnelSnapshot } from './types.ts';

export function evaluateExperiment(
  manifest: AssetManifest,
  snapshot: FunnelSnapshot,
  settledFactoryCostCents: number,
): EvaluationResult {
  const contributionProfitCents = snapshot.eligibleArmLengthRevenueCents - settledFactoryCostCents;
  const economics = { settledFactoryCostCents, contributionProfitCents };
  const policy = manifest.evaluationPolicy;
  if (snapshot.qualifiedExposures < policy.minQualifiedExposures) {
    return {
      decision: 'INSUFFICIENT_SIGNAL',
      reason: `Only ${snapshot.qualifiedExposures}/${policy.minQualifiedExposures} required qualified exposures were observed.`,
      evidenceGrade: 'E0',
      ...economics,
      snapshot,
    };
  }

  if (snapshot.fulfillmentFailures > 0 || snapshot.disputesCents > 0) {
    return {
      decision: 'ITERATE',
      reason: 'Operational integrity requires attention: fulfillment failure or dispute observed.',
      evidenceGrade: snapshot.eligibleArmLengthRevenueCents > 0 ? 'E3' : 'E2',
      ...economics,
      snapshot,
    };
  }

  const eligiblePurchases = snapshot.transactions.filter(
    (tx) =>
      tx.classification === 'ARM_LENGTH_CUSTOMER' &&
      tx.fulfilled &&
      !tx.fulfillmentFailed &&
      tx.refundedCents === 0 &&
      tx.disputedCents === 0,
  ).length;
  if (
    eligiblePurchases >= policy.minArmLengthPurchasesToKeep &&
    contributionProfitCents > 0
  ) {
    return {
      decision: 'KEEP',
      reason: `${eligiblePurchases} fulfilled arm's-length purchase(s) met the fixture KEEP threshold.`,
      evidenceGrade: 'E3',
      ...economics,
      snapshot,
    };
  }

  if (eligiblePurchases > 0 && contributionProfitCents <= 0) {
    return {
      decision: 'ITERATE',
      reason: 'A fulfilled arm\'s-length purchase occurred, but contribution profit was not positive.',
      evidenceGrade: 'E3',
      ...economics,
      snapshot,
    };
  }

  if (snapshot.offerInteractions >= policy.minOfferInteractions) {
    return {
      decision: 'ITERATE',
      reason: 'The offer received meaningful interaction but no eligible arm\'s-length purchase.',
      evidenceGrade: 'E2',
      ...economics,
      snapshot,
    };
  }

  return {
    decision: 'KILL',
    reason: 'The minimum exposure was met without the required offer interaction.',
    evidenceGrade: 'E2',
    ...economics,
    snapshot,
  };
}

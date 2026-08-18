/**
 * PRE-REVENUE EXPERIMENT COST DISCIPLINE. EXPERIMENTAL_PROTOCOL.md §18.
 *
 * The $50 is a MAXIMUM-LOSS RESERVE, not a budget to spend. Before arm's-length
 * revenue exists, Factory optimizes:
 *
 *     (experiments × information per experiment) / owner capital consumed
 *
 * The denominator should approach zero. Ideally Factory reaches first revenue
 * having spent almost none of the owner capital.
 *
 * This exists because Factory nearly committed 30-59% of the entire capital base
 * to one Etsy shop setup fee — anchoring on an outlier. Most digital surfaces
 * (KDP, Gumroad, itch.io, Payhip, Draft2Digital, print-on-demand) charge NOTHING
 * until a sale occurs, taking a revenue share instead. A surface paid only when
 * Factory is paid converts fixed capital risk into variable cost, which is the
 * right shape before any revenue exists.
 */

export const COST_DISCIPLINE = {
  targetMaxUsd: 1.0,
  preferredUsd: 0.0,
  /** Fraction of REMAINING owner capital above which owner authorization is required. */
  ownerAuthFraction: 0.10,
} as const;

export interface ExperimentCostCase {
  experimentId: string;
  marginalCashCostUsd: number;
  remainingOwnerCapitalUsd: number;
  /** Required above targetMaxUsd. Its absence is itself blocking. */
  justification?: {
    whyNoCheaperFalsification: string;
    whyInformationGainJustifiesIt: string;
    /** How many ~$0 experiments are forgone by funding this one. */
    alternativeExperimentsSacrificed: number;
    whyConcentrateBeforeAnyRevenue: string;
  };
}

export interface CostVerdict {
  allowed: boolean;
  requiresOwnerAuthorization: boolean;
  blocking: string[];
  notes: string[];
}

export function assessExperimentCost(c: ExperimentCostCase): CostVerdict {
  const blocking: string[] = [];
  const notes: string[] = [];
  const fraction = c.remainingOwnerCapitalUsd > 0
    ? c.marginalCashCostUsd / c.remainingOwnerCapitalUsd
    : Infinity;

  if (c.marginalCashCostUsd <= COST_DISCIPLINE.preferredUsd) {
    notes.push('Zero marginal cost — experiments are unlimited at no capital consumption.');
  }

  if (c.marginalCashCostUsd > COST_DISCIPLINE.targetMaxUsd) {
    const j = c.justification;
    if (!j) {
      blocking.push(
        `$${c.marginalCashCostUsd} exceeds the $${COST_DISCIPLINE.targetMaxUsd} pre-revenue ` +
        'target with no justification. All four justification fields are required.',
      );
    } else {
      for (const [field, val] of Object.entries(j)) {
        if (typeof val === 'string' && !val.trim()) {
          blocking.push(`Justification field "${field}" is empty.`);
        }
      }
      notes.push(
        `Above target: ${j.alternativeExperimentsSacrificed} zero-cost experiments are forgone.`,
      );
    }
  }

  const requiresOwnerAuthorization = fraction > COST_DISCIPLINE.ownerAuthFraction;
  if (requiresOwnerAuthorization) {
    notes.push(
      `Consumes ${(fraction * 100).toFixed(0)}% of remaining owner capital ` +
      `(> ${COST_DISCIPLINE.ownerAuthFraction * 100}%). Owner authorization required; exceptional.`,
    );
  }

  return { allowed: blocking.length === 0, requiresOwnerAuthorization, blocking, notes };
}

// --- Applied to the two live candidates, as a worked check -------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const cases: ExperimentCostCase[] = [
    { experimentId: 'etsy-a03', marginalCashCostUsd: 22, remainingOwnerCapitalUsd: 50 },
    { experimentId: 'gumroad-v047', marginalCashCostUsd: 0, remainingOwnerCapitalUsd: 50 },
  ];
  for (const c of cases) {
    const v = assessExperimentCost(c);
    console.log(`\n${c.experimentId}: $${c.marginalCashCostUsd}`);
    console.log(`  allowed=${v.allowed} ownerAuth=${v.requiresOwnerAuthorization}`);
    for (const b of v.blocking) console.log(`  BLOCK: ${b}`);
    for (const n of v.notes) console.log(`  note: ${n}`);
  }
}

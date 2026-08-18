/**
 * EVIDENCE SEMANTICS GATE — CONSTITUTION-level protection.
 *
 * Origin: three times, a real number from a real source led to a wrong
 * conclusion because nobody asked what the number MEASURED.
 *
 *   - A search endpoint returning a count for every query was read as 100%
 *     "coverage". It was returning zero for most candidates.
 *   - active_installs was read as "this niche has demand". The WordPress search
 *     API loose-matches, so the number belonged to a generic booking plugin: one
 *     plugin was the "top incumbent" for 16 unrelated verticals.
 *   - A distinct-value ratio was read as "poorly discriminating". It was at its
 *     mathematical ceiling because the metric is bucketed.
 *
 * The common failure is not bad data. It is UNEXAMINED SEMANTICS: a true number
 * used to support a proposition it does not actually speak to.
 *
 * RULE: no metric may be used as E1 evidence until it carries a completed
 * EvidenceSemantics record. A real number from a real source is NOT valid
 * evidence if it does not measure the proposition Factory claims it measures.
 */

/** How far the measurement sits from the proposition. Never silently promoted. */
export type EvidenceType =
  /** The metric IS the proposition. A settled purchase record proving a purchase. */
  | 'DIRECT'
  /** Correlated but distinct. Installs as a proxy for demand. */
  | 'PROXY'
  /** Requires a reasoning chain. Competitor count inferred from search results. */
  | 'INFERRED';

export interface EvidenceSemantics {
  metricName: string;
  source: string;

  /** 1. What exactly does this metric measure? Mechanically, not aspirationally. */
  measures: string;

  /** 2. What proposition is Factory using it to support? */
  proposition: string;

  /** 3. Causal/inferential distance between measurement and proposition. */
  inferentialDistance: string;

  /**
   * 4. Does the retrieved item actually correspond to the entity analysed?
   * NULL until verified. This is the check that would have caught the WordPress
   * scanner defect, so it may not be skipped.
   */
  entityCorrespondenceVerified: boolean;
  entityCorrespondenceMethod: string;

  /** 5. What alternative interpretations produce the same number? */
  alternativeInterpretations: string[];

  /**
   * 6. Verified INDEPENDENTLY of search rank or keyword match?
   * A number that arrives because a string matched is not evidence about a niche.
   */
  semanticRelevanceVerifiedIndependently: boolean;
  semanticRelevanceMethod: string;

  /** 7. Direct, proxy, or inferred. */
  evidenceType: EvidenceType;

  /** 8. What this metric is explicitly NOT sufficient to support. */
  insufficientFor: string[];

  /**
   * ADVERSARIAL CHECK — mandatory, non-empty.
   * "What would have to be true for this metric to be technically accurate but
   * economically misleading?"
   * Every failure above passed a plausibility check and failed this one.
   */
  adversarialCheck: string;
}

export interface SemanticsVerdict {
  admissible: boolean;
  blockingReasons: string[];
  warnings: string[];
}

/**
 * A metric is admissible as E1 only if its semantics are fully examined.
 * Deliberately strict: it blocks on absence of examination, not just on bad
 * results, because the failure mode is not looking rather than looking and
 * finding a problem.
 */
export function assessSemantics(s: EvidenceSemantics): SemanticsVerdict {
  const blocking: string[] = [];
  const warnings: string[] = [];

  if (!s.measures.trim()) blocking.push('Q1 unanswered: what the metric measures is not stated.');
  if (!s.proposition.trim()) blocking.push('Q2 unanswered: the proposition is not stated.');
  if (!s.inferentialDistance.trim()) blocking.push('Q3 unanswered: inferential distance not stated.');
  if (!s.adversarialCheck.trim()) {
    blocking.push('Adversarial check missing. Mandatory — every past failure passed plausibility and failed this.');
  }
  if (!s.alternativeInterpretations.length) {
    blocking.push('Q5 unanswered: no alternative interpretation considered. At least one always exists.');
  }
  if (!s.insufficientFor.length) {
    blocking.push('Q8 unanswered: nothing listed that this metric cannot support. No metric supports everything.');
  }
  if (!s.entityCorrespondenceVerified) {
    blocking.push(
      'Q4 FAILED: entity correspondence unverified. The retrieved item is not confirmed to be ' +
      'the thing being analysed — the exact WordPress scanner defect.',
    );
  }
  if (!s.semanticRelevanceVerifiedIndependently) {
    blocking.push(
      'Q6 FAILED: relevance not verified independently of search rank or keyword matching.',
    );
  }

  if (s.evidenceType === 'PROXY') {
    warnings.push('PROXY evidence: may support a hypothesis, may not stand alone as commercial proof.');
  }
  if (s.evidenceType === 'INFERRED') {
    warnings.push('INFERRED evidence: the reasoning chain is itself a failure point. Weakest admissible class.');
  }

  return { admissible: blocking.length === 0, blockingReasons: blocking, warnings };
}

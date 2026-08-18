/**
 * Data Economics Probe — types and PRE-REGISTERED criteria.
 *
 * EXPERIMENTAL_PROTOCOL.md §7 requires the Data Economics Gate to be decided on
 * measured evidence. The thresholds below were committed to git BEFORE any
 * measurement existed, so they cannot be quietly adjusted afterwards to
 * manufacture a pass. Git history is the audit trail.
 *
 * If a threshold is ever changed, the change must be a separate commit, made
 * before the run it applies to, with the reason stated.
 */

/** How close a signal sits to somebody actually paying money. */
export type PurchaseIntentProximity =
  /** Commercial demand: search volume with commercial intent, marketplace sales, listing counts. */
  | 'DIRECT'
  /** Real activity implying a problem worth solving: package downloads, question volume. */
  | 'INDIRECT'
  /** Topic interest only. Says people are curious, not that anyone would pay. */
  | 'WEAK';

export interface SourceDescriptor {
  id: string;
  provider: string;
  signalType: string;
  metricName: string;
  unit: string;
  purchaseIntent: PurchaseIntentProximity;
  requiresCredential: boolean;
  credentialEnvVar?: string;
  /** Terms/automation constraints as understood. Verified separately, not assumed. */
  termsNote: string;
  reliabilityLimitations: string;
}

export type FetchFailureReason =
  | 'NO_CREDENTIAL'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'HTTP_ERROR'
  | 'UNPARSEABLE'
  | 'NETWORK_BLOCKED'
  | 'TIMEOUT';

export interface FetchSuccess {
  ok: true;
  numericValue: number;
  requestCount: number;
  latencyMs: number;
  raw: unknown;
}

export interface FetchFailure {
  ok: false;
  reason: FetchFailureReason;
  detail: string;
  requestCount: number;
  latencyMs: number;
}

export type FetchResult = FetchSuccess | FetchFailure;

export interface EvidenceSource extends SourceDescriptor {
  fetch(candidate: Candidate, signal: AbortSignal): Promise<FetchResult>;
}

/**
 * Candidate strata. Reported separately because aggregate coverage is
 * misleading: free sources cover head terms well and long-tail terms poorly,
 * and real opportunities live in the long tail. A pipeline that scores 90%
 * overall while covering 20% of the long tail has not solved the problem
 * Factory actually has.
 */
export type CandidateStratum = 'HEAD' | 'MID' | 'LONG_TAIL';

export interface Candidate {
  id: string;
  /** Natural-language topic, used for general sources. */
  term: string;
  /** Wikipedia article title where one plausibly exists. */
  wikiTitle?: string;
  /** Package-ecosystem name where the candidate is developer-facing. */
  packageName?: string;
  stratum: CandidateStratum;
}

// ---------------------------------------------------------------------------
// PRE-REGISTERED PASS CRITERIA — committed before measurement.
// Mirrors IMPLEMENTATION_BRIEF.md §8.
// ---------------------------------------------------------------------------

export const GATE_CRITERIA = {
  /** Fraction of candidates for which a usable E1 signal is retrievable. */
  minCoverage: 0.6,
  /** Effective marginal cost per candidate screened, USD. */
  maxCostPerCandidateUsd: 0.02,
  /** Candidates screenable for $5. */
  minCandidatesAt5Usd: 250,
  /** Sustainable candidates per day under observed rate limits. */
  minCandidatesPerDay: 50,
  /**
   * Distinct-value ratio required for a signal to count as discriminating.
   * A source returning the same number for every candidate carries no
   * information regardless of how reliably it responds.
   */
  minDistinctValueRatio: 0.5,
  /**
   * Coverage must be reached using DIRECT or INDIRECT signals. WEAK signals
   * (topic interest) may supplement but cannot carry the gate.
   *
   * ADDED 2026-08-18, BEFORE the first run, and it TIGHTENS the standard.
   * Rationale: the freely reachable sources skew heavily toward topic interest.
   * Without this, a pipeline could pass on 90% coverage of numbers that say
   * people are curious about a subject and nothing about whether anyone would
   * pay — a technically-passing, commercially-useless result. Recorded here
   * rather than applied silently.
   */
  excludeWeakFromCoverage: true,

  // -------------------------------------------------------------------------
  // ADDED 2026-08-18, AFTER the first run. Disclosed as post-hoc, and it can
  // only make the gate HARDER to pass.
  //
  // Run 1 passed on stackexchange_questions and hn_algolia_mentions at 100%
  // coverage. Their distinct-value ratios were 0.53 and 0.59, against 0.98 and
  // 1.00 for the two sources measuring genuinely varying quantities. With 100
  // candidates, ~half sharing a value is the signature of a metric piling up at
  // zero and small integers — not of a metric that discriminates.
  //
  // The flaw was in minDistinctValueRatio: it catches a source returning ONE
  // constant, but not a source returning mostly zeros with a few large values.
  // A search endpoint that always returns a count scores 100% "coverage" while
  // telling us nothing about a pottery or nail-salon niche.
  //
  // These test that specific hypothesis. They are stated here BEFORE the run
  // that evaluates them.
  // -------------------------------------------------------------------------

  /** Max share of candidates returning exactly zero. Mostly-zero is not signal. */
  maxZeroShare: 0.4,
  /** Max share of candidates sharing the single most common value. */
  maxModeShare: 0.4,
  /**
   * The long tail must carry actual signal. Real opportunities live there, and a
   * source that only discriminates among head terms cannot drive the search.
   */
  requireNonZeroLongTailMedian: true,
} as const;

export interface SourceMeasurement {
  source: SourceDescriptor;
  candidatesAttempted: number;
  candidatesWithUsableE1: number;
  coverageByStratum: Record<CandidateStratum, { attempted: number; usable: number }>;
  failuresByReason: Partial<Record<FetchFailureReason, number>>;
  distinctValueRatio: number;
  totalRequests: number;
  medianLatencyMs: number;
  observedRateLimitNote: string;
  values: number[];
  /** Share of returned values equal to exactly zero. */
  zeroShare: number;
  /** Share of returned values equal to the single most common value. */
  modeShare: number;
  /** Median of returned values, per stratum. Long tail is the one that matters. */
  medianByStratum: Record<CandidateStratum, number | null>;
}

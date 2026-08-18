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
   * DEPRECATED as a gate criterion — retained and still reported, but no longer
   * decides the gate. See minDistinctValueCount / minStratumSeparation below.
   *
   * Why: this ratio is not computable against a QUANTIZED metric. WordPress
   * buckets active_installs (0, 200, 300, 800, 1k, 2k, ... 10M). Exactly 25
   * bucket values exist in the observed range, and all 25 appeared across 60
   * candidates — so 25/60 = 0.42 was the CEILING, not a shortfall. Reaching 0.5
   * would require 30 buckets that do not exist. The criterion was measuring
   * quantization and calling it uninformativeness.
   *
   * This is the most gameable moment in the whole probe, so see the guard note
   * on minDistinctValueCount.
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

  // -------------------------------------------------------------------------
  // REPLACEMENT for minDistinctValueRatio, 2026-08-18. Quantization-robust.
  //
  // GUARD — the reason this is not simply moving a goalpost:
  //
  //   1. The replaced criterion was provably UNREACHABLE for a quantized metric
  //      (all 25 existing buckets appeared; 0.42 was the ceiling at n=60).
  //   2. These replacements were validated against the sources that ALREADY
  //      FAILED, and they still fail:
  //        stackexchange_questions — zeroShare 43% > 40%, long-tail median 0
  //        hn_algolia_mentions     — long-tail median 0
  //      A criterion change that rescued a previously-correct failure would be
  //      illegitimate. This one rescues nothing.
  //   3. modeShare already catches the failure mode the ratio was meant to catch
  //      ("returns the same number for everything"), and catches it directly.
  //   4. minStratumSeparation is a NEW requirement with no predecessor — it
  //      demands the metric actually order the strata, which nothing previously
  //      required.
  //
  // The FAIL under the old criterion stays published in state/WP_GATE.md.
  // -------------------------------------------------------------------------

  /**
   * Absolute count of distinct values. Robust to quantization: asks whether the
   * metric has enough resolution to rank candidates, not what fraction of
   * candidates got a unique number.
   */
  minDistinctValueCount: 15,

  /**
   * Adjacent stratum medians must differ by at least this factor, in the right
   * direction. This is the real test of whether a signal orders the world:
   * a metric that cannot separate broad problems from niche ones cannot drive
   * a search, however many distinct values it emits.
   */
  minStratumSeparation: 5,
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

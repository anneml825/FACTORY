/**
 * Data Economics Probe — measurement harness. EXPERIMENTAL_PROTOCOL.md §7.
 *
 * Answers one empirical question: can sufficiently reliable quantitative E1
 * evidence be obtained cheaply enough to support the intended search process?
 *
 * Design commitments against self-flattery:
 *   * Pass criteria are pre-registered in types.ts and committed before any run.
 *   * Every failure is recorded with its reason and stays in the DENOMINATOR.
 *     A source that cannot answer is a source with low coverage, not a source
 *     with fewer candidates.
 *   * Coverage is reported per stratum. Aggregate coverage hides the long tail,
 *     which is where real opportunities are.
 *   * A source returning near-identical values for every candidate carries no
 *     information and fails the discrimination check regardless of response rate.
 *   * WEAK (topic-interest) signals cannot carry the gate.
 *
 * Writes JSON + Markdown. Persistence to `data_source_probe` happens when the
 * database exists; the measurement is real either way.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { ALL_SOURCES } from './sources.ts';
import { CANDIDATES, candidateCounts } from './candidates.ts';
import {
  GATE_CRITERIA,
  type CandidateStratum,
  type EvidenceSource,
  type FetchFailureReason,
  type SourceMeasurement,
} from './types.ts';

const REQUEST_TIMEOUT_MS = 20_000;
const DELAY_BETWEEN_REQUESTS_MS = 250; // deliberately polite; also measures sustainable rate

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function measureSource(source: EvidenceSource): Promise<SourceMeasurement> {
  const coverageByStratum: Record<CandidateStratum, { attempted: number; usable: number }> = {
    HEAD: { attempted: 0, usable: 0 },
    MID: { attempted: 0, usable: 0 },
    LONG_TAIL: { attempted: 0, usable: 0 },
  };
  const failuresByReason: Partial<Record<FetchFailureReason, number>> = {};
  const values: number[] = [];
  const latencies: number[] = [];
  let totalRequests = 0;
  let usable = 0;
  let sawRateLimit = false;

  process.stderr.write(`\n[${source.id}] (${source.purchaseIntent}) `);

  for (const candidate of CANDIDATES) {
    coverageByStratum[candidate.stratum].attempted++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let result;
    try {
      result = await source.fetch(candidate, controller.signal);
    } catch (err) {
      result = {
        ok: false as const,
        reason: 'HTTP_ERROR' as FetchFailureReason,
        detail: String(err).slice(0, 150),
        requestCount: 1,
        latencyMs: 0,
      };
    } finally {
      clearTimeout(timer);
    }

    totalRequests += result.requestCount;
    if (result.latencyMs) latencies.push(result.latencyMs);

    if (result.ok) {
      usable++;
      coverageByStratum[candidate.stratum].usable++;
      values.push(result.numericValue);
      process.stderr.write('.');
    } else {
      failuresByReason[result.reason] = (failuresByReason[result.reason] ?? 0) + 1;
      if (result.reason === 'RATE_LIMITED') sawRateLimit = true;
      process.stderr.write(
        result.reason === 'NO_CREDENTIAL' ? 'k'
        : result.reason === 'NETWORK_BLOCKED' ? 'x'
        : result.reason === 'RATE_LIMITED' ? 'R' : '_',
      );
    }
    if (result.requestCount > 0) await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const distinct = new Set(values).size;
  const distinctValueRatio = values.length ? distinct / values.length : 0;

  return {
    source,
    candidatesAttempted: CANDIDATES.length,
    candidatesWithUsableE1: usable,
    coverageByStratum,
    failuresByReason,
    distinctValueRatio,
    totalRequests,
    medianLatencyMs: median(latencies),
    observedRateLimitNote: sawRateLimit
      ? 'HTTP 429 observed during the run — the advertised limit binds in practice.'
      : `No 429 at ${1000 / DELAY_BETWEEN_REQUESTS_MS}/s over ${CANDIDATES.length} requests.`,
    values,
  };
}

interface Verdict {
  sourceId: string;
  coverage: number;
  passesCoverage: boolean;
  passesDiscrimination: boolean;
  countsTowardGate: boolean;
  notes: string[];
}

function evaluate(measurements: SourceMeasurement[]) {
  const verdicts: Verdict[] = measurements.map((m) => {
    const coverage = m.candidatesWithUsableE1 / m.candidatesAttempted;
    const passesCoverage = coverage >= GATE_CRITERIA.minCoverage;
    const passesDiscrimination = m.distinctValueRatio >= GATE_CRITERIA.minDistinctValueRatio;
    const weakExcluded = GATE_CRITERIA.excludeWeakFromCoverage && m.source.purchaseIntent === 'WEAK';
    const notes: string[] = [];
    if (weakExcluded) {
      notes.push('WEAK purchase-intent proximity: may supplement but cannot carry the gate.');
    }
    if (m.source.requiresCredential && m.failuresByReason.NO_CREDENTIAL) {
      notes.push('Blocked on a credential requiring owner setup — coverage unmeasured, not zero.');
    }
    if (m.failuresByReason.NETWORK_BLOCKED) {
      notes.push('Network-blocked in this environment; rerun where egress is permitted.');
    }
    return {
      sourceId: m.source.id,
      coverage,
      passesCoverage,
      passesDiscrimination,
      countsTowardGate: passesCoverage && passesDiscrimination && !weakExcluded,
      notes,
    };
  });

  const qualifying = verdicts.filter((v) => v.countsTowardGate);
  return {
    verdicts,
    gatePasses: qualifying.length > 0,
    qualifyingSourceIds: qualifying.map((v) => v.sourceId),
  };
}

function renderMarkdown(measurements: SourceMeasurement[], evaluation: ReturnType<typeof evaluate>) {
  const counts = candidateCounts();
  const L: string[] = [];
  L.push('# Data Economics Probe — Results\n');
  L.push(`**Run:** ${new Date().toISOString()}  `);
  L.push(`**Candidates:** ${counts.total} (HEAD ${counts.byStratum.HEAD} / MID ${counts.byStratum.MID} / LONG_TAIL ${counts.byStratum.LONG_TAIL})  `);
  L.push(`**Marginal cash cost:** $0.00 — all sources free or credential-blocked\n`);
  L.push(`## Gate verdict: ${evaluation.gatePasses ? '**PASS**' : '**FAIL**'}\n`);
  if (evaluation.gatePasses) {
    L.push(`Qualifying pipeline(s): \`${evaluation.qualifyingSourceIds.join('`, `')}\`\n`);
  } else {
    L.push('No pipeline met the pre-registered criteria. Per `EXPERIMENTAL_PROTOCOL.md` §7, the');
    L.push('search strategy must be redesigned before material validation capital is spent.\n');
  }

  L.push('## Pre-registered criteria\n');
  L.push('| Criterion | Threshold |');
  L.push('|---|---|');
  L.push(`| Coverage | ≥ ${(GATE_CRITERIA.minCoverage * 100).toFixed(0)}% |`);
  L.push(`| Cost per candidate | ≤ $${GATE_CRITERIA.maxCostPerCandidateUsd.toFixed(2)} |`);
  L.push(`| Candidates at $5 | ≥ ${GATE_CRITERIA.minCandidatesAt5Usd} |`);
  L.push(`| Sustainable rate | ≥ ${GATE_CRITERIA.minCandidatesPerDay}/day |`);
  L.push(`| Distinct-value ratio | ≥ ${GATE_CRITERIA.minDistinctValueRatio} |`);
  L.push(`| WEAK signals carry the gate | ${GATE_CRITERIA.excludeWeakFromCoverage ? 'No' : 'Yes'} |\n`);

  L.push('## Per-source results\n');
  L.push('| Source | Intent | Coverage | HEAD | MID | LONG_TAIL | Distinct | Median latency | Counts |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const m of measurements) {
    const v = evaluation.verdicts.find((x) => x.sourceId === m.source.id)!;
    const pct = (n: { attempted: number; usable: number }) =>
      n.attempted ? `${((n.usable / n.attempted) * 100).toFixed(0)}%` : '—';
    L.push(
      `| \`${m.source.id}\` | ${m.source.purchaseIntent} | **${(v.coverage * 100).toFixed(0)}%** ` +
        `| ${pct(m.coverageByStratum.HEAD)} | ${pct(m.coverageByStratum.MID)} | ${pct(m.coverageByStratum.LONG_TAIL)} ` +
        `| ${m.distinctValueRatio.toFixed(2)} | ${m.medianLatencyMs}ms | ${v.countsTowardGate ? 'YES' : 'no'} |`,
    );
  }

  L.push('\n## Failure breakdown\n');
  L.push('Failures remain in the denominator. A source that cannot answer has low coverage.\n');
  L.push('| Source | Failures by reason |');
  L.push('|---|---|');
  for (const m of measurements) {
    const f = Object.entries(m.failuresByReason).map(([k, n]) => `${k}=${n}`).join(', ') || 'none';
    L.push(`| \`${m.source.id}\` | ${f} |`);
  }

  L.push('\n## Notes and limitations\n');
  for (const m of measurements) {
    const v = evaluation.verdicts.find((x) => x.sourceId === m.source.id)!;
    L.push(`### \`${m.source.id}\`\n`);
    L.push(`- **Signal:** ${m.source.signalType}`);
    L.push(`- **Purchase-intent proximity:** ${m.source.purchaseIntent}`);
    L.push(`- **Limitations:** ${m.source.reliabilityLimitations}`);
    L.push(`- **Terms:** ${m.source.termsNote}`);
    L.push(`- **Observed rate:** ${m.observedRateLimitNote}`);
    for (const n of v.notes) L.push(`- **Note:** ${n}`);
    L.push('');
  }
  return L.join('\n');
}

async function main() {
  process.stderr.write('Data Economics Probe\n');
  process.stderr.write(`${CANDIDATES.length} candidates x ${ALL_SOURCES.length} sources\n`);
  process.stderr.write('legend: . usable  _ failed  k no-credential  x network-blocked  R rate-limited\n');

  const measurements: SourceMeasurement[] = [];
  for (const source of ALL_SOURCES) measurements.push(await measureSource(source));

  const evaluation = evaluate(measurements);

  mkdirSync('state', { recursive: true });
  writeFileSync(
    'state/data-economics-probe.json',
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        criteria: GATE_CRITERIA,
        candidateCounts: candidateCounts(),
        gatePasses: evaluation.gatePasses,
        qualifyingSourceIds: evaluation.qualifyingSourceIds,
        measurements: measurements.map((m) => ({ ...m, source: m.source.id, values: undefined })),
        verdicts: evaluation.verdicts,
      },
      null,
      2,
    ),
  );
  writeFileSync('state/DATA_ECONOMICS_PROBE.md', renderMarkdown(measurements, evaluation));

  process.stderr.write(`\n\nGate: ${evaluation.gatePasses ? 'PASS' : 'FAIL'}\n`);
  process.stderr.write('Wrote state/DATA_ECONOMICS_PROBE.md and state/data-economics-probe.json\n');

  // The probe reports; it does not decide. A FAIL is a valid, useful result and
  // must not be treated as a broken build.
  process.exit(0);
}

main().catch((err) => {
  console.error('Probe harness error:', err);
  process.exit(1);
});

/**
 * Data Economics Gate, evaluated for the WordPress search space specifically.
 *
 * Same source, same GATE_CRITERIA, WordPress-native candidate universe.
 * See wp-candidates.ts for why a second candidate set exists and what guards
 * were fixed in advance against using it to manufacture a pass.
 *
 * Reports BOTH the general-set result and this one. If they disagree, that
 * disagreement is the finding.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { wordpressActiveInstalls } from './sources.ts';
import { WP_CANDIDATES } from './wp-candidates.ts';
import { GATE_CRITERIA, type CandidateStratum } from './types.ts';

const DELAY_MS = 300;
const TIMEOUT_MS = 20_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function main() {
  const byStratum: Record<CandidateStratum, number[]> = { HEAD: [], MID: [], LONG_TAIL: [] };
  const rows: { id: string; term: string; stratum: CandidateStratum; value: number | null }[] = [];
  const values: number[] = [];
  let failures = 0;

  process.stderr.write(`WordPress gate: ${WP_CANDIDATES.length} native candidates\n`);

  for (const cand of WP_CANDIDATES) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await wordpressActiveInstalls.fetch(cand, ctrl.signal);
      if (r.ok) {
        values.push(r.numericValue);
        byStratum[cand.stratum].push(r.numericValue);
        rows.push({ id: cand.id, term: cand.term, stratum: cand.stratum, value: r.numericValue });
        process.stderr.write(r.numericValue === 0 ? '0' : '.');
      } else {
        failures++;
        rows.push({ id: cand.id, term: cand.term, stratum: cand.stratum, value: null });
        process.stderr.write('_');
      }
    } finally {
      clearTimeout(timer);
    }
    await sleep(DELAY_MS);
  }

  const coverage = values.length / WP_CANDIDATES.length;
  const distinctCount = new Set(values).size;
  const distinctRatio = distinctCount / (values.length || 1);
  const zeroShare = values.filter((v) => v === 0).length / (values.length || 1);
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  const modeShare = Math.max(0, ...freq.values()) / (values.length || 1);
  const ltMedian = median(byStratum.LONG_TAIL);
  const headM = median(byStratum.HEAD) ?? 0;
  const midM = median(byStratum.MID) ?? 0;
  const ltM = ltMedian ?? 0;
  // Adjacent strata must be ordered AND separated by the required factor.
  const sepHeadMid = midM > 0 ? headM / midM : Infinity;
  const sepMidLt = ltM > 0 ? midM / ltM : Infinity;
  const separation = Math.min(sepHeadMid, sepMidLt);
  const separationOk =
    headM > midM && midM > ltM && separation >= GATE_CRITERIA.minStratumSeparation;

  const checks = {
    coverage: { value: coverage, threshold: GATE_CRITERIA.minCoverage, pass: coverage >= GATE_CRITERIA.minCoverage },
    distinctCount: { value: distinctCount, threshold: GATE_CRITERIA.minDistinctValueCount, pass: distinctCount >= GATE_CRITERIA.minDistinctValueCount },
    stratumSeparation: { value: separation, threshold: GATE_CRITERIA.minStratumSeparation, pass: separationOk },
    zeroShare: { value: zeroShare, threshold: GATE_CRITERIA.maxZeroShare, pass: zeroShare <= GATE_CRITERIA.maxZeroShare },
    modeShare: { value: modeShare, threshold: GATE_CRITERIA.maxModeShare, pass: modeShare <= GATE_CRITERIA.maxModeShare },
    longTailMedian: { value: ltMedian, threshold: '> 0', pass: ltMedian !== null && ltMedian > 0 },
  };
  const passes = Object.values(checks).every((c) => c.pass);

  const L: string[] = [];
  L.push('# Data Economics Gate — WordPress search space\n');
  L.push(`**Run:** ${new Date().toISOString()}  `);
  L.push(`**Candidates:** ${WP_CANDIDATES.length} WordPress-native, stratified  `);
  L.push('**Cost:** $0.00  \n');
  L.push(`## Verdict: ${passes ? '**PASS**' : '**FAIL**'}\n`);
  L.push('> Evaluated with **unchanged** `GATE_CRITERIA` against a WordPress-native candidate');
  L.push('> universe. The general-set result (49% zeros, long-tail median 0) stands in the');
  L.push('> record and is not withdrawn — see `state/DATA_ECONOMICS_PROBE.md`. That set asked');
  L.push('> the WordPress plugin directory about pottery and nail salons, which measures a');
  L.push('> category mismatch rather than the space. See `src/evidence/wp-candidates.ts` for');
  L.push('> the generation rule and the guards fixed before this set was written.\n');

  L.push('| Check | Value | Threshold | Result |');
  L.push('|---|---|---|---|');
  for (const [name, c] of Object.entries(checks)) {
    const v = typeof c.value === 'number' ? c.value.toFixed(2) : String(c.value);
    L.push(`| ${name} | ${v} | ${c.threshold} | ${c.pass ? 'PASS' : '**FAIL**'} |`);
  }

  L.push('\n## Signal by stratum\n');
  L.push('| Stratum | n | Median active installs | Zero count |');
  L.push('|---|---|---|---|');
  for (const s of ['HEAD', 'MID', 'LONG_TAIL'] as CandidateStratum[]) {
    const xs = byStratum[s];
    L.push(`| ${s} | ${xs.length} | ${median(xs) ?? '—'} | ${xs.filter((v) => v === 0).length} |`);
  }

  L.push('\n## Per-candidate\n');
  L.push('| Stratum | Query | Top plugin active installs |');
  L.push('|---|---|---|');
  for (const r of rows) {
    L.push(`| ${r.stratum} | ${r.term} | ${r.value === null ? 'error' : r.value.toLocaleString()} |`);
  }

  L.push('\n## Reading the zeros\n');
  L.push('A zero means the directory returned **no matching plugin**. That is a real answer, not');
  L.push('a gap: nobody has built for that query. It is simultaneously the most interesting');
  L.push('signal (an unserved niche) and the least useful for ranking, since zeros cannot be');
  L.push('ordered against each other. The gate treats a high zero share as failure for exactly');
  L.push('that reason — a screen that cannot rank cannot drive a search.\n');
  L.push(`Fetch failures (not zeros): ${failures}.`);

  mkdirSync('state', { recursive: true });
  writeFileSync('state/WP_GATE.md', L.join('\n'));
  writeFileSync(
    'state/wp-gate.json',
    JSON.stringify({ runAt: new Date().toISOString(), criteria: GATE_CRITERIA, checks, passes, rows }, null, 2),
  );

  process.stderr.write(`\n\nWordPress gate: ${passes ? 'PASS' : 'FAIL'}\n`);
  for (const [n, c] of Object.entries(checks)) {
    process.stderr.write(`  ${c.pass ? 'ok  ' : 'FAIL'} ${n}=${typeof c.value === 'number' ? c.value.toFixed(2) : c.value}\n`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('WP gate error:', e);
  process.exit(1);
});

/**
 * Search-space reconnaissance. Milestone 0B, second pass.
 *
 * The first probe asked "can we get evidence about consumer niches?" and the
 * answer was no. This asks the prior question Factory should have asked first:
 * WHICH opportunity spaces can Factory screen at all?
 *
 * Measures, per candidate space, at zero cash cost:
 *   * reachability and whether a credential is required
 *   * coverage — fraction of probe terms returning a usable number
 *   * discrimination — whether values actually separate the terms
 *   * cost per candidate and observed sustainable rate
 *
 * Monetization norm, automation feasibility, and platform terms are NOT
 * measurable by HTTP and are assessed separately by research. A space that
 * scores perfectly here can still be non-viable because nobody pays for
 * anything there — which is exactly the trap of picking the first ecosystem
 * that returned data.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { SPACES, SPACE_PROBE_TERMS, type SpaceProbe } from './spaces.ts';

const TIMEOUT_MS = 20_000;
const DELAY_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SpaceResult {
  id: string;
  name: string;
  signal: string;
  arrivalMechanism: string;
  monetizationNorm: string;
  reachable: boolean;
  requiresAuth: boolean;
  termsAttempted: number;
  termsWithValue: number;
  coverage: number;
  distinctValueRatio: number;
  zeroShare: number;
  medianValue: number | null;
  medianLatencyMs: number;
  httpStatuses: Record<string, number>;
  values: { term: string; value: number | null }[];
  failureDetail: string | null;
  notes: string;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function probeSpace(space: SpaceProbe): Promise<SpaceResult> {
  const values: { term: string; value: number | null }[] = [];
  const latencies: number[] = [];
  const httpStatuses: Record<string, number> = {};
  let requiresAuth = false;
  let reachable = false;
  let failureDetail: string | null = null;

  // A whole-catalogue endpoint ignores the term, so probing it repeatedly is
  // pure waste — one request tells us everything it can tell us.
  const isWholeCatalogue = space.id === 'obsidian_plugins';
  const terms = isWholeCatalogue ? [SPACE_PROBE_TERMS[0]] : SPACE_PROBE_TERMS;

  process.stderr.write(`\n[${space.id}] `);

  for (const term of terms) {
    const { url, init } = space.request(term);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      latencies.push(Date.now() - started);
      httpStatuses[String(res.status)] = (httpStatuses[String(res.status)] ?? 0) + 1;

      if (res.status === 401 || res.status === 403) {
        requiresAuth = true;
        failureDetail ??= `HTTP ${res.status} — authentication or policy required`;
        values.push({ term, value: null });
        process.stderr.write('k');
      } else if (!res.ok) {
        failureDetail ??= `HTTP ${res.status}`;
        values.push({ term, value: null });
        process.stderr.write('_');
      } else {
        reachable = true;
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          failureDetail ??= 'response was not JSON';
          values.push({ term, value: null });
          process.stderr.write('?');
          continue;
        }
        const v = space.extract(parsed);
        values.push({ term, value: v });
        process.stderr.write(v === null ? '_' : '.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failureDetail ??= msg.slice(0, 160);
      httpStatuses.network_error = (httpStatuses.network_error ?? 0) + 1;
      values.push({ term, value: null });
      process.stderr.write('x');
    } finally {
      clearTimeout(timer);
    }
    await sleep(DELAY_MS);
  }

  const got = values.map((v) => v.value).filter((v): v is number => v !== null);
  const distinct = new Set(got).size;

  return {
    id: space.id,
    name: space.name,
    signal: space.signal,
    arrivalMechanism: space.arrivalMechanism,
    monetizationNorm: space.monetizationNorm,
    reachable,
    requiresAuth,
    termsAttempted: terms.length,
    termsWithValue: got.length,
    coverage: terms.length ? got.length / terms.length : 0,
    distinctValueRatio: got.length ? distinct / got.length : 0,
    zeroShare: got.length ? got.filter((v) => v === 0).length / got.length : 0,
    medianValue: median(got),
    medianLatencyMs: median(latencies) ?? 0,
    httpStatuses,
    values,
    failureDetail,
    notes: space.notes,
  };
}

function render(results: SpaceResult[]): string {
  const L: string[] = [];
  L.push('# Search-Space Reconnaissance\n');
  L.push(`**Run:** ${new Date().toISOString()}  `);
  L.push(`**Spaces probed:** ${results.length} · **Probe terms:** ${SPACE_PROBE_TERMS.length}  `);
  L.push('**Marginal cash cost:** $0.00\n');
  L.push('Answers "which opportunity spaces can Factory screen at all?" — the question that');
  L.push('should precede choosing what to sell.\n');

  L.push('## Evidence availability\n');
  L.push('| Space | Reachable | Auth | Coverage | Distinct | Zero share | Median signal | Latency |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    L.push(
      `| \`${r.id}\` | ${r.reachable ? 'yes' : '**no**'} | ${r.requiresAuth ? '**required**' : 'none'} ` +
        `| **${(r.coverage * 100).toFixed(0)}%** | ${r.distinctValueRatio.toFixed(2)} ` +
        `| ${(r.zeroShare * 100).toFixed(0)}% | ${r.medianValue ?? '—'} | ${r.medianLatencyMs}ms |`,
    );
  }

  L.push('\n## Structure\n');
  L.push('Evidence alone is not a search space. Monetization norm is assessed by research, not HTTP.\n');
  L.push('| Space | Signal | Arrival mechanism | Monetization norm |');
  L.push('|---|---|---|---|');
  for (const r of results) {
    L.push(`| \`${r.id}\` | ${r.signal} | ${r.arrivalMechanism} | **${r.monetizationNorm}** |`);
  }

  L.push('\n## Per-space detail\n');
  for (const r of results) {
    L.push(`### \`${r.id}\` — ${r.name}\n`);
    L.push(`- **Note:** ${r.notes}`);
    L.push(`- **HTTP statuses:** ${JSON.stringify(r.httpStatuses)}`);
    if (r.failureDetail) L.push(`- **First failure:** ${r.failureDetail}`);
    const shown = r.values
      .map((v) => `${v.term}=${v.value === null ? 'null' : v.value}`)
      .join(', ');
    L.push(`- **Values:** ${shown}`);
    L.push('');
  }
  return L.join('\n');
}

async function main() {
  process.stderr.write('Search-space reconnaissance\n');
  process.stderr.write('legend: . value  _ no value  k auth required  x network  ? not JSON\n');

  const results: SpaceResult[] = [];
  for (const space of SPACES) results.push(await probeSpace(space));

  mkdirSync('state', { recursive: true });
  writeFileSync(
    'state/search-space-recon.json',
    JSON.stringify({ runAt: new Date().toISOString(), probeTerms: SPACE_PROBE_TERMS, results }, null, 2),
  );
  writeFileSync('state/SEARCH_SPACE_RECON.md', render(results));

  const usable = results.filter((r) => r.reachable && !r.requiresAuth && r.coverage >= 0.6);
  process.stderr.write(`\n\n${usable.length} of ${results.length} spaces screenable without credentials\n`);
  process.stderr.write(`  ${usable.map((r) => r.id).join(', ') || '(none)'}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Recon harness error:', err);
  process.exit(1);
});

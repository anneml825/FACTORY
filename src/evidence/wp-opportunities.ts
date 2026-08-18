/**
 * WordPress opportunity scanner — SEARCH SPACE -> QUANTITATIVE OPPORTUNITY EVIDENCE.
 *
 * Finds underserved niches in the WordPress plugin directory from retrieved data
 * only. No model-invented numbers: every figure here comes from
 * api.wordpress.org with a retrieval timestamp (EXPERIMENTAL_PROTOCOL.md §2).
 *
 * THE OPPORTUNITY SIGNATURE, stated before running so it cannot be tuned
 * afterwards to flatter a result:
 *
 *   An opportunity is a query where DEMAND IS PROVEN but INCUMBENTS ARE WEAK.
 *
 *   Demand proven      - the top matching plugin has real active installs, so
 *                        people already look for and install this.
 *   Not dominated      - no incumbent so large that a newcomer is invisible.
 *   Incumbent weakness - at least one of: poor rating, long abandonment, or bad
 *                        support resolution. This is the opening.
 *
 * A query with huge installs and a healthy, actively-maintained, well-rated
 * incumbent is NOT an opportunity — it is a solved problem, and the strongest
 * temptation to misread as "big market". Guarded against explicitly below.
 *
 * QUERY UNIVERSE is a systematic cross-product of site types and jobs, not a
 * hand-picked list. Nothing was added or removed after seeing results.
 */

import { writeFileSync, mkdirSync } from 'node:fs';

const UA = 'FactoryOpportunityScanner/0.1 (+https://github.com/anneml825/FACTORY)';
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Systematic cross-product. Site types are recognizable small-business verticals
// that commonly run WordPress; jobs are operational tasks such a site must do.
const SITE_TYPES = [
  'restaurant', 'dental practice', 'gym fitness studio', 'school', 'church',
  'nonprofit charity', 'hair salon', 'veterinary clinic', 'real estate agency',
  'law firm', 'photographer', 'brewery', 'farm', 'hotel', 'auto repair shop',
  'tutoring', 'event venue', 'marina', 'hoa community', 'library',
];
const JOBS = [
  'booking', 'intake form', 'appointment reminder', 'membership directory',
  'invoice quote', 'inventory tracking', 'waiver signature', 'staff scheduling',
];

interface Plugin {
  name: string; slug: string; rating: number; num_ratings: number;
  active_installs: number; last_updated: string; support_threads: number;
  support_threads_resolved: number; short_description: string; tested: string;
}

interface Row {
  query: string; siteType: string; job: string;
  matchCount: number;
  top: {
    name: string; slug: string; activeInstalls: number; rating: number;
    numRatings: number; lastUpdated: string; monthsSinceUpdate: number;
    supportResolutionPct: number | null;
  } | null;
  demandProven: boolean; notDominated: boolean;
  weakness: string[]; score: number;
}

function monthsSince(iso: string): number {
  // WordPress returns e.g. "2023-04-11 2:31pm GMT"
  const d = new Date(iso.replace(/(\d{4}-\d{2}-\d{2}).*/, '$1'));
  if (isNaN(d.getTime())) return 0;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

// --- Scoring rule. Fixed before the run. --------------------------------------
const DEMAND_FLOOR = 1000;        // top plugin installs proving people want this
const DOMINATION_CEILING = 200000; // above this, a newcomer is invisible
const STALE_MONTHS = 18;           // abandonment threshold
const POOR_RATING = 80;            // WordPress rating is 0-100
const POOR_SUPPORT = 50;           // % of support threads resolved

function evaluate(query: string, siteType: string, job: string, plugins: Plugin[]): Row {
  const top = plugins.length ? plugins.reduce((a, b) => (a.active_installs >= b.active_installs ? a : b)) : null;
  if (!top) {
    return {
      query, siteType, job, matchCount: 0, top: null,
      demandProven: false, notDominated: true, weakness: ['no plugins match at all'], score: 0,
    };
  }

  const months = monthsSince(top.last_updated);
  const supportPct = top.support_threads > 0
    ? (top.support_threads_resolved / top.support_threads) * 100
    : null;

  const demandProven = top.active_installs >= DEMAND_FLOOR;
  const notDominated = top.active_installs <= DOMINATION_CEILING;

  const weakness: string[] = [];
  if (months >= STALE_MONTHS) weakness.push(`incumbent unmaintained ${months.toFixed(0)} months`);
  if (top.num_ratings >= 5 && top.rating < POOR_RATING) weakness.push(`incumbent rated ${top.rating}/100`);
  if (supportPct !== null && top.support_threads >= 5 && supportPct < POOR_SUPPORT) {
    weakness.push(`only ${supportPct.toFixed(0)}% of support threads resolved`);
  }
  if (plugins.length <= 3) weakness.push(`only ${plugins.length} plugins compete`);

  // Score only where demand is proven AND the field is enterable AND there is a
  // concrete opening. A healthy well-maintained incumbent scores ZERO regardless
  // of how large the install base is — a solved problem is not an opportunity.
  let score = 0;
  if (demandProven && notDominated && weakness.length > 0) {
    score = Math.log10(top.active_installs) * weakness.length;
  }

  return {
    query, siteType, job, matchCount: plugins.length,
    top: {
      name: top.name, slug: top.slug, activeInstalls: top.active_installs,
      rating: top.rating, numRatings: top.num_ratings, lastUpdated: top.last_updated,
      monthsSinceUpdate: Number(months.toFixed(1)), supportResolutionPct: supportPct,
    },
    demandProven, notDominated, weakness, score: Number(score.toFixed(2)),
  };
}

async function main() {
  const rows: Row[] = [];
  const retrievedAt = new Date().toISOString();
  const queries: { q: string; siteType: string; job: string }[] = [];
  for (const s of SITE_TYPES) for (const j of JOBS) queries.push({ q: `${s} ${j}`, siteType: s, job: j });

  process.stderr.write(`Scanning ${queries.length} systematic queries\n`);

  for (const { q, siteType, job } of queries) {
    const url =
      'https://api.wordpress.org/plugins/info/1.2/?action=query_plugins' +
      `&request[search]=${encodeURIComponent(q)}&request[per_page]=8`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (!res.ok) { process.stderr.write('_'); await sleep(DELAY_MS); continue; }
      const body = (await res.json()) as { plugins?: Plugin[] };
      const row = evaluate(q, siteType, job, body.plugins ?? []);
      rows.push(row);
      process.stderr.write(row.score > 0 ? '!' : '.');
    } catch {
      process.stderr.write('x');
    }
    await sleep(DELAY_MS);
  }

  const ranked = [...rows].filter((r) => r.score > 0).sort((a, b) => b.score - a.score);

  const L: string[] = [];
  L.push('# WordPress Opportunity Scan\n');
  L.push(`**Retrieved:** ${retrievedAt}  `);
  L.push(`**Queries:** ${queries.length} (systematic ${SITE_TYPES.length} site types x ${JOBS.length} jobs)  `);
  L.push(`**Source:** api.wordpress.org/plugins/info/1.2 · **Cost:** $0.00\n`);
  L.push('## Opportunity signature (fixed before the run)\n');
  L.push('An opportunity is a query where **demand is proven but incumbents are weak**:');
  L.push(`- demand proven: top plugin has ≥ ${DEMAND_FLOOR.toLocaleString()} active installs`);
  L.push(`- not dominated: top plugin ≤ ${DOMINATION_CEILING.toLocaleString()} active installs`);
  L.push(`- ≥1 weakness: unmaintained ≥ ${STALE_MONTHS} months, rated < ${POOR_RATING}/100, support resolution < ${POOR_SUPPORT}%, or ≤3 competitors\n`);
  L.push('**A large, well-maintained, well-rated incumbent scores zero.** A solved problem is');
  L.push('not an opportunity, however big its install base — that is the misreading this rule exists to prevent.\n');
  L.push(`## Ranked opportunities — ${ranked.length} of ${rows.length} queries scored above zero\n`);
  L.push('| # | Query | Top incumbent | Installs | Rating | Stale (mo) | Weaknesses | Score |');
  L.push('|---|---|---|---|---|---|---|---|');
  ranked.slice(0, 25).forEach((r, i) => {
    L.push(
      `| ${i + 1} | ${r.query} | ${r.top!.name.slice(0, 40)} | ${r.top!.activeInstalls.toLocaleString()} ` +
      `| ${r.top!.rating}/100 (${r.top!.numRatings}) | ${r.top!.monthsSinceUpdate} | ${r.weakness.join('; ')} | **${r.score}** |`,
    );
  });

  mkdirSync('state', { recursive: true });
  writeFileSync('state/WP_OPPORTUNITIES.md', L.join('\n'));
  writeFileSync('state/wp-opportunities.json', JSON.stringify({ retrievedAt, rows, ranked }, null, 2));
  process.stderr.write(`\n\n${ranked.length} scored opportunities of ${rows.length} queries\n`);
  ranked.slice(0, 8).forEach((r) => process.stderr.write(`  ${r.score}  ${r.query} — ${r.top!.activeInstalls} installs, ${r.weakness.join('; ')}\n`));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

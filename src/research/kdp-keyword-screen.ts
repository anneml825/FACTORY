/**
 * Keyword-level competition screen for the Books shelf.
 *
 * THE LOAD-BEARING FIELD is `productResults.pageInfo.totalResults` on
 * /api/amazon/search: how many titles compete for a term. Two previous designs
 * died because a field the schema declared was not populated in practice
 * (EXPERIMENTAL_PROTOCOL.md §19), so this run treats that field as an untested
 * claim and proves it on its FIRST request before spending anything else.
 *
 * WHERE THE QUERIES COME FROM. Not from a product idea. Every term is the name
 * of a real Amazon Books subcategory already captured by earlier runs, paired
 * with that subcategory's own id as the category filter — so the question asked
 * is "how many titles compete on this shelf, for this shelf's own subject".
 * Amazon's taxonomy chooses the terms and their order; this file does not. That
 * is what keeps the screen breadth-first rather than a search for evidence
 * supporting something already picked.
 *
 * WHAT IT MEASURES. Competition: the size of the field, plus how much review
 * mass the visible incumbents carry and how much of page one is paid placement.
 *
 * WHAT IT DOES NOT MEASURE. Demand. A crowded shelf may be crowded because it
 * sells; an empty one may be empty because nobody wants it. Converting to units
 * costs one request per ASIN and belongs to a later, narrower pass over a
 * shortlist.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient, CanopyPaymentRequired } from './canopy-client.ts';
import { BudgetRefusal, MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;
const outputPath = process.env.KDP_KEYWORD_OUTPUT ?? 'state/kdp-keyword-screen.json';

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

/**
 * Declared before the first request. Each clause describes the world, not the
 * response format: a mainstream Amazon book shelf searched for its own subject
 * has more than 50 matching titles, shows a full page of them, and its visible
 * incumbents are not uniformly unrated. A response can satisfy every type in the
 * schema and fail all three.
 */
const SEARCH_IS_MEANINGFUL = {
  minTotalResults: 50,
  minResultsOnPage: 10,
  requireAtLeastOneRatedProduct: true,
  requireIdentifiableProducts: true,
};

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

// Seeds, in the order Amazon returned them. First the 35 children of Books,
// then the 16 grandchildren captured beneath Arts & Photography.
const diagnostic = JSON.parse(await readFile('state/canopy-category-diagnostic.json', 'utf8')) as {
  children: { id: string | null; name: string | null }[];
};
const previousScreen = JSON.parse(await readFile('state/kdp-demand-screen.json', 'utf8')) as {
  screens: { name: string; subcategories: { id: string; name: string }[] }[];
};

interface Seed {
  term: string;
  categoryId: string;
  level: 1 | 2;
  parent: string;
}
const seeds: Seed[] = [
  ...diagnostic.children
    .filter((c): c is { id: string; name: string } => Boolean(c.id && c.name))
    .map((c): Seed => ({ term: c.name, categoryId: c.id, level: 1, parent: 'Books' })),
  ...previousScreen.screens.flatMap((s) =>
    s.subcategories.map((sub): Seed => ({ term: sub.name, categoryId: sub.id, level: 2, parent: s.name })),
  ),
];

interface KeywordRow {
  term: string;
  categoryId: string;
  level: 1 | 2;
  parent: string;
  totalResults: number;
  totalPages: number;
  resultsOnPage: number;
  sponsoredOnPage: number;
  ratingCounts: number[];
  prices: number[];
  unratedOnPage: number;
  sample: { asin: string; title: string; ratingsTotal: number; price: number; sponsored: boolean }[];
}

const rows: KeywordRow[] = [];
const failures: string[] = [];
let stopReason: string | null = null;
let abortedByGate = false;

async function query(seed: Seed): Promise<KeywordRow> {
  const response = await canopy.search({ searchTerm: seed.term, categoryId: seed.categoryId, limit: 40 });
  const node = response.data.amazonProductSearchResults;
  const results = node.productResults?.results ?? [];
  const page = node.productResults?.pageInfo ?? {};
  const ratingCounts = results
    .map((r) => r.ratingsTotal)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  const prices = results
    .map((r) => r.price?.value)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  return {
    term: seed.term,
    categoryId: seed.categoryId,
    level: seed.level,
    parent: seed.parent,
    totalResults: page.totalResults ?? 0,
    totalPages: page.totalPages ?? 0,
    resultsOnPage: results.length,
    sponsoredOnPage: results.filter((r) => r.sponsored).length,
    unratedOnPage: results.filter((r) => !r.ratingsTotal).length,
    ratingCounts,
    prices,
    sample: results
      .filter((r) => r.asin)
      .slice(0, 10)
      .map((r) => ({
        asin: r.asin as string,
        title: (r.title ?? '').slice(0, 110),
        ratingsTotal: r.ratingsTotal ?? 0,
        price: r.price?.value ?? 0,
        sponsored: Boolean(r.sponsored),
      })),
  };
}

/** Returns a complaint, or null if the response is consistent with the world it describes. */
function meaningTest(row: KeywordRow): string | null {
  if (row.totalResults < SEARCH_IS_MEANINGFUL.minTotalResults) {
    return `totalResults was ${row.totalResults}; a mainstream Amazon book shelf searched for its own subject has more than ${SEARCH_IS_MEANINGFUL.minTotalResults} matching titles`;
  }
  if (row.resultsOnPage < SEARCH_IS_MEANINGFUL.minResultsOnPage) {
    return `only ${row.resultsOnPage} results on the page`;
  }
  if (SEARCH_IS_MEANINGFUL.requireIdentifiableProducts && row.sample.length === 0) {
    return 'no result carried an ASIN, so nothing can be followed up';
  }
  if (SEARCH_IS_MEANINGFUL.requireAtLeastOneRatedProduct && row.ratingCounts.every((n) => n === 0)) {
    return 'every visible product carried zero ratings, which no real book shelf does';
  }
  return null;
}

try {
  for (const seed of seeds) {
    if (budget.remaining() <= 0) {
      stopReason = 'reservation exhausted before the seed list was finished';
      break;
    }
    let row: KeywordRow;
    try {
      row = await query(seed);
    } catch (error) {
      if (error instanceof BudgetRefusal || error instanceof CanopyPaymentRequired) throw error;
      failures.push(`${seed.term} (${seed.categoryId}): ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    rows.push(row);

    // The whole design rests on the first answer. Nothing else is spent until
    // it has been shown to mean something.
    if (rows.length === 1) {
      const complaint = meaningTest(row);
      if (complaint) {
        abortedByGate = true;
        stopReason =
          `ABORTED after one request — the meaning test failed: ${complaint}. ` +
          `Canopy cannot supply a keyword competition measure. Nothing here is a competition signal, ` +
          `and the remaining budget is preserved.`;
        break;
      }
    }
  }
} catch (error) {
  stopReason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  await budget.commit();
}

const median = (xs: number[]): number => (xs.length === 0 ? 0 : xs[Math.floor(xs.length / 2)]);
const output = {
  runId,
  screenedAt: new Date().toISOString(),
  requestsSpent: budget.spentThisRun(),
  meaningTest: SEARCH_IS_MEANINGFUL,
  abortedByGate,
  stopReason,
  failures,
  seedsAvailable: seeds.length,
  termsScreened: rows.length,
  rows,
};
await mkdir('state', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

process.stdout.write(
  `\nScreened ${rows.length}/${seeds.length} terms using ${budget.spentThisRun()} requests` +
    `${stopReason ? `\n${stopReason}` : ''}\n\n` +
    `${'term'.padEnd(34)}${'lvl'.padStart(4)}${'totalResults'.padStart(14)}${'medRatings'.padStart(12)}${'unrated'.padStart(9)}${'ads'.padStart(5)}${'medPrice'.padStart(10)}\n` +
    rows
      .map(
        (r) =>
          `${r.term.slice(0, 32).padEnd(34)}${String(r.level).padStart(4)}` +
          `${String(r.totalResults).padStart(14)}${String(median(r.ratingCounts)).padStart(12)}` +
          `${String(r.unratedOnPage).padStart(9)}${String(r.sponsoredOnPage).padStart(5)}` +
          `${median(r.prices).toFixed(2).padStart(10)}`,
      )
      .join('\n') +
    '\n',
);
if (failures.length > 0) process.stdout.write(`\nfailures:\n${failures.join('\n')}\n`);
if (abortedByGate) process.exitCode = 1;

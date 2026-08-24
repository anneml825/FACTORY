/**
 * Find the addressing form that actually returns a subcategory chart.
 *
 * Round one established that neither obvious form works. A bare numeric id
 * returns a browse-like listing — 16-18 titles, near-zero ratings, no children.
 * The child's own url returns nothing at all: zero products.
 *
 * The clue is in the root's own response. Asked by the slug `bestsellers_books`,
 * it reports its `currentCategory.id` as **"books"** — not the slug it was asked
 * by — and its children as bare numbers whose urls are real Amazon chart paths
 * of the form /zgbs/books/1/ref=zg_bs_nav_books_1. Two candidate explanations
 * follow, and they are cheap to separate:
 *
 *   A. The id is compositional. If the root is "books" and the child is "1",
 *      the category is "books/1", mirroring the url path.
 *   B. The url form is right but the tracking suffix breaks the parser. A
 *      /ref=... fragment is Amazon navigation state, not part of the address.
 *
 * One category is tested — Arts & Photography, id 1, the first child, chosen
 * because round one already measured it both ways and its wrong answer is on
 * record to compare against. Four forms, four requests.
 *
 * The success criterion is fixed BEFORE the requests go out, so that a plausible
 * wrong answer cannot be talked into being the right one: a real chart of a
 * Books subcategory has tens of products and a median rating count in at least
 * the hundreds. Round one's failure looked successful precisely because nobody
 * had written that down first.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient } from './canopy-client.ts';
import { MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

/** Written before any request is made. A form passes only if it clears this. */
const PLAUSIBLE_CHART = { minProducts: 30, minMedianRatings: 200 };

const FORMS: { label: string; argument: { categoryId?: string; url?: string } }[] = [
  { label: 'compositional id "books/1"', argument: { categoryId: 'books/1' } },
  { label: 'prefixed slug "bestsellers_books_1"', argument: { categoryId: 'bestsellers_books_1' } },
  {
    label: 'url with the /ref tracking suffix stripped',
    argument: { url: 'https://www.amazon.com/Best-Sellers-Books-Arts-Photography/zgbs/books/1' },
  },
  { label: 'canonical short chart url', argument: { url: 'https://www.amazon.com/gp/bestsellers/books/1' } },
];

const attempts: unknown[] = [];
for (const form of FORMS) {
  try {
    const response = await canopy.bestSellers({ ...form.argument, limit: 50 });
    const node = response.data.amazonBestSellers;
    const results = node.productResults?.results ?? [];
    const ratings = results.map((r) => r.ratingsTotal ?? 0).sort((a, b) => a - b);
    const medianRatings = ratings.length ? ratings[Math.floor(ratings.length / 2)] : 0;
    const looksLikeAChart =
      results.length >= PLAUSIBLE_CHART.minProducts && medianRatings >= PLAUSIBLE_CHART.minMedianRatings;
    attempts.push({
      form: form.label,
      argument: form.argument,
      products: results.length,
      medianRatings,
      children: (node.categoryInfo?.childCategories ?? []).length,
      currentCategory: node.categoryInfo?.currentCategory ?? null,
      looksLikeAChart,
      topTitles: results.slice(0, 3).map((r) => `${r.bestSellersRank ?? '?'}. ${(r.title ?? '').slice(0, 55)} [${r.ratingsTotal ?? 0}]`),
    });
  } catch (error) {
    attempts.push({ form: form.label, argument: form.argument, error: error instanceof Error ? error.message : String(error) });
  }
}

await budget.commit();

const report = { runId, criterion: PLAUSIBLE_CHART, attempts };
await mkdir('state', { recursive: true });
await writeFile('state/canopy-addressing-diagnostic.json', `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

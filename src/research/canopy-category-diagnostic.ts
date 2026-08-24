/**
 * Diagnose why the taxonomy walk returned something that is not a bestseller
 * list.
 *
 * The walk passed each child category's `id` to /api/amazon/bestsellers. The
 * root, addressed by its slug `bestsellers_books`, returned 50 titles whose
 * rating counts run into six figures — plainly the real chart. Every child,
 * addressed by a bare numeric id, returned 16-18 titles with near-zero rating
 * counts, no further children, and in several categories a price of $0. A book
 * with five ratings is not the number one bestseller in Self-Help, so the
 * numeric ids are addressing something else — most likely a category browse
 * listing rather than a chart.
 *
 * Three requests to settle it:
 *   1. Re-read the root and print each child's id AND url. The walk stored only
 *      the id, which is why this cannot be answered from the data already held.
 *   2 & 3. Re-request two of those children by URL instead of by id, and compare
 *      against what the id returned.
 *
 * If the URL form returns high rating counts and further children, the walk is
 * repeatable correctly for the price of re-running it. If both forms agree, the
 * numeric ids are right and the assumption that a subcategory chart looks like
 * the root chart is what is wrong.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient } from './canopy-client.ts';
import { MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;
const outputPath = 'state/canopy-category-diagnostic.json';

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

function describe(response: Awaited<ReturnType<CanopyClient['bestSellers']>>) {
  const node = response.data.amazonBestSellers;
  const results = node.productResults?.results ?? [];
  const ratings = results
    .map((r) => r.ratingsTotal ?? 0)
    .sort((a, b) => a - b);
  return {
    products: results.length,
    medianRatings: ratings.length ? ratings[Math.floor(ratings.length / 2)] : 0,
    maxRatings: ratings.length ? ratings[ratings.length - 1] : 0,
    children: (node.categoryInfo?.childCategories ?? []).length,
    currentCategory: node.categoryInfo?.currentCategory ?? null,
    topTitles: results.slice(0, 4).map((r) => `${r.bestSellersRank ?? '?'}. ${(r.title ?? '').slice(0, 60)} [${r.ratingsTotal ?? 0} ratings]`),
  };
}

const report: Record<string, unknown> = { runId };

const root = await canopy.bestSellers({ categoryId: 'bestsellers_books', limit: 50 });
const children = (root.data.amazonBestSellers.categoryInfo?.childCategories ?? []).map((c) => ({
  id: c.id ?? null,
  name: c.name ?? null,
  url: c.url ?? null,
}));
report.rootBySlug = describe(root);
report.children = children;

// Two probes by URL, chosen from opposite ends of the list rather than for
// being interesting, so the comparison is not cherry-picked.
const candidates = children.filter((c) => c.url);
const chosen = [candidates[0], candidates[candidates.length - 1]].filter(Boolean);
const comparisons: unknown[] = [];
for (const child of chosen) {
  try {
    const byUrl = await canopy.bestSellers({ url: child!.url as string, limit: 50 });
    comparisons.push({ child, byUrl: describe(byUrl) });
  } catch (error) {
    comparisons.push({ child, error: error instanceof Error ? error.message : String(error) });
  }
}
report.byUrl = comparisons;

await budget.commit();
await mkdir('state', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

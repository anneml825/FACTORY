/**
 * A breadth-first screen of Amazon's Books bestseller taxonomy.
 *
 * DELIBERATELY NOT STARTED FROM A NICHE. The failure this is built to avoid is
 * picking a category first and then finding evidence for it. So the walk begins
 * at the root of Books and takes every child category it is given, in the order
 * Amazon gives them, until the budget runs out. Whatever looks interesting
 * afterwards is a result, not a premise.
 *
 * WHAT IT MEASURES, AND WHAT IT DOES NOT. Each request returns up to 50 ranked
 * titles with a rating count. The distribution of those rating counts is the
 * signal: a subcategory whose 20th bestseller carries 30 ratings is structurally
 * different from one whose 20th carries 40,000, because accumulated review mass
 * is what a new title has none of. That is a COMPETITION measure.
 *
 * It is not a demand measure. Rank is a snapshot and says nothing about volume,
 * and the sales estimate that would convert rank to units costs one request per
 * ASIN — far too expensive to spend on a screen. Demand is a later, narrower
 * question asked of a shortlist. Anything this script concludes about demand
 * would be invented, so it concludes nothing about demand.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient, CanopyPaymentRequired, type BestSellerResult } from './canopy-client.ts';
import { BudgetRefusal, MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;
const outputPath = process.env.KDP_SCREEN_OUTPUT ?? 'state/kdp-demand-screen.json';

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

interface CategoryScreen {
  id: string;
  name: string;
  parent: string;
  products: number;
  /** Rating counts of the ranked titles, ascending. The distribution is the point. */
  ratingCounts: number[];
  prices: number[];
  childCategories: { id: string; name: string }[];
  /** Kept so a later pass can ask about specific titles without re-walking. */
  sample: { asin: string; title: string; rank: number; ratingsTotal: number; price: number }[];
}

const screens: CategoryScreen[] = [];
const failures: string[] = [];
let stopReason: string | null = null;

function summarise(results: BestSellerResult[]): Pick<CategoryScreen, 'ratingCounts' | 'prices' | 'sample'> {
  const ratingCounts = results
    .map((r) => r.ratingsTotal)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  const prices = results
    .map((r) => r.price?.value)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  const sample = results
    .filter((r) => r.asin)
    .slice(0, 12)
    .map((r) => ({
      asin: r.asin as string,
      title: (r.title ?? '').slice(0, 120),
      rank: r.bestSellersRank ?? 0,
      ratingsTotal: r.ratingsTotal ?? 0,
      price: r.price?.value ?? 0,
    }));
  return { ratingCounts, prices, sample };
}

async function screen(id: string, name: string, parent: string): Promise<{ id: string; name: string }[]> {
  const response = await canopy.bestSellers({ categoryId: id, limit: 50 });
  const node = response.data.amazonBestSellers;
  const results = node.productResults?.results ?? [];
  const children = (node.categoryInfo?.childCategories ?? [])
    .filter((c) => c.id)
    .map((c) => ({ id: c.id as string, name: c.name ?? '(unnamed)' }));
  screens.push({ id, name, parent, products: results.length, childCategories: children, ...summarise(results) });
  return children;
}

try {
  // The root. Its children are the whole first level of the screen.
  const level1 = await screen('bestsellers_books', 'Books', '(root)');

  // Breadth-first, in the order Amazon returns them. One request per node, and
  // the budget — not a judgement about which categories are interesting — is
  // what decides where the walk stops.
  const queue = [...level1];
  while (queue.length > 0 && budget.remaining() > 0) {
    const next = queue.shift() as { id: string; name: string };
    try {
      await screen(next.id, next.name, 'Books');
    } catch (error) {
      if (error instanceof BudgetRefusal || error instanceof CanopyPaymentRequired) throw error;
      failures.push(`${next.name} (${next.id}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} catch (error) {
  // A budget refusal is the control working, not a bug. Recorded, not retried.
  stopReason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  await budget.commit();
}

const output = {
  runId,
  walkedAt: new Date().toISOString(),
  requestsSpent: budget.spentThisRun(),
  stopReason,
  failures,
  categoriesScreened: screens.length,
  screens,
};
await mkdir('state', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

// A compact table in the log. The full record is the file above.
const median = (xs: number[]): number => (xs.length === 0 ? 0 : xs[Math.floor(xs.length / 2)]);
process.stdout.write(
  `\nScreened ${screens.length} categories using ${budget.spentThisRun()} requests` +
    `${stopReason ? ` (stopped: ${stopReason})` : ''}\n\n` +
    `${'category'.padEnd(38)}${'n'.padStart(4)}${'medRatings'.padStart(12)}${'minRatings'.padStart(12)}${'medPrice'.padStart(10)}\n` +
    screens
      .map(
        (s) =>
          `${s.name.slice(0, 36).padEnd(38)}${String(s.products).padStart(4)}` +
          `${String(median(s.ratingCounts)).padStart(12)}` +
          `${String(s.ratingCounts[0] ?? 0).padStart(12)}` +
          `${(median(s.prices)).toFixed(2).padStart(10)}`,
      )
      .join('\n') +
    '\n',
);

if (failures.length > 0) process.stdout.write(`\nfailures:\n${failures.join('\n')}\n`);

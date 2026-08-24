/**
 * A breadth-first screen of the 35 Books subcategories, via the category
 * endpoint.
 *
 * WHY NOT THE BESTSELLERS ENDPOINT. It accepts only the 41 top-level slugs from
 * /api/amazon/bestseller-categories. Handed a subcategory id it does not error —
 * it silently returns a browse-like listing, which is how the previous version
 * of this file produced 35 confident, meaningless rows. Every other addressing
 * form tested returned zero products. Subcategory CHARTS are not reachable
 * through this API; see docs/CANOPY_ACCESS_FINDINGS.md.
 *
 * WHAT THIS MEASURES INSTEAD. /api/amazon/category has no rank, but it carries
 * something bestsellers does not: totalResults, the number of products in the
 * category. That is a more direct competition measure than review mass ever was
 * — it is the size of the field a new title would join — and it is one number
 * per request rather than an inference from a distribution.
 *
 * Alongside it: the rating counts of the first page of products, and the
 * subcategory tree beneath each node for a later, deeper pass.
 *
 * STILL NOT A DEMAND MEASURE. A crowded category may be crowded because it
 * sells; an empty one may be empty because nobody wants it. Nothing here
 * distinguishes those, and converting to units costs a request per ASIN. Demand
 * remains a later question asked of a shortlist.
 *
 * THE ABORT GATE. The criterion for "this endpoint is returning what I think it
 * is" is fixed below, before any request. It is checked after the FIRST node,
 * and a failure stops the walk having spent one request instead of thirty-five.
 * The previous version had no such gate, which is the only reason its mistake
 * cost a full budget rather than a single call.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient, CanopyPaymentRequired } from './canopy-client.ts';
import { BudgetRefusal, MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;
const outputPath = process.env.KDP_SCREEN_OUTPUT ?? 'state/kdp-demand-screen.json';
/** The 35 Books children, already captured. Re-reading the root would cost a request. */
const childrenPath = 'state/canopy-category-diagnostic.json';

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

/** Declared before the first request, so a wrong answer cannot be reinterpreted as a right one. */
const ENDPOINT_IS_BEHAVING = {
  minProducts: 8,
  requireTotalResults: true,
  requireSomeRatings: true,
};

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

const diagnostic = JSON.parse(await readFile(childrenPath, 'utf8')) as {
  children: { id: string | null; name: string | null }[];
};
const targets = diagnostic.children
  .filter((c): c is { id: string; name: string } => Boolean(c.id && c.name))
  .map((c) => ({ id: c.id, name: c.name }));

interface CategoryScreen {
  id: string;
  name: string;
  breadcrumbPath: string;
  /** The size of the field. The headline number. */
  totalResults: number;
  productsOnPage: number;
  sponsoredOnPage: number;
  ratingCounts: number[];
  prices: number[];
  subcategories: { id: string; name: string }[];
  sample: { asin: string; title: string; ratingsTotal: number; price: number }[];
}

const screens: CategoryScreen[] = [];
const failures: string[] = [];
let stopReason: string | null = null;
let abortedByGate = false;

async function screen(target: { id: string; name: string }): Promise<CategoryScreen> {
  const node = (await canopy.category({ categoryId: target.id })).data.amazonProductCategory;
  const results = node.productResults?.results ?? [];
  const ratingCounts = results
    .map((r) => r.ratingsTotal)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  const prices = results
    .map((r) => r.price?.value)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  return {
    id: target.id,
    name: node.name ?? target.name,
    breadcrumbPath: node.breadcrumbPath ?? '',
    totalResults: node.productResults?.pageInfo?.totalResults ?? 0,
    productsOnPage: results.length,
    sponsoredOnPage: results.filter((r) => r.sponsored).length,
    ratingCounts,
    prices,
    subcategories: (node.subcategories ?? [])
      .filter((s): s is { id: string; name: string } => Boolean(s.id))
      .map((s) => ({ id: s.id, name: s.name ?? '(unnamed)' })),
    sample: results
      .filter((r) => r.asin)
      .slice(0, 10)
      .map((r) => ({
        asin: r.asin as string,
        title: (r.title ?? '').slice(0, 110),
        ratingsTotal: r.ratingsTotal ?? 0,
        price: r.price?.value ?? 0,
      })),
  };
}

function passesGate(s: CategoryScreen): string | null {
  if (s.productsOnPage < ENDPOINT_IS_BEHAVING.minProducts) {
    return `only ${s.productsOnPage} products returned`;
  }
  if (ENDPOINT_IS_BEHAVING.requireTotalResults && s.totalResults <= 0) {
    return 'totalResults was absent or zero, so the field-size measure is unavailable';
  }
  if (ENDPOINT_IS_BEHAVING.requireSomeRatings && s.ratingCounts.every((n) => n === 0)) {
    return 'every product carried zero ratings, which no real category page does';
  }
  return null;
}

try {
  for (const target of targets) {
    if (budget.remaining() <= 0) {
      stopReason = 'budget reservation exhausted before the walk completed';
      break;
    }
    let result: CategoryScreen;
    try {
      result = await screen(target);
    } catch (error) {
      if (error instanceof BudgetRefusal || error instanceof CanopyPaymentRequired) throw error;
      failures.push(`${target.name} (${target.id}): ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    screens.push(result);

    // Checked once, on the first node that returned anything at all.
    if (screens.length === 1) {
      const complaint = passesGate(result);
      if (complaint) {
        abortedByGate = true;
        stopReason =
          `ABORTED after one request: the category endpoint is not returning what this screen ` +
          `assumes — ${complaint}. Nothing here should be read as a competition signal.`;
        break;
      }
    }
  }
} catch (error) {
  stopReason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  await budget.commit();
}

const output = {
  runId,
  walkedAt: new Date().toISOString(),
  requestsSpent: budget.spentThisRun(),
  gate: ENDPOINT_IS_BEHAVING,
  abortedByGate,
  stopReason,
  failures,
  categoriesScreened: screens.length,
  screens,
};
await mkdir('state', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

const median = (xs: number[]): number => (xs.length === 0 ? 0 : xs[Math.floor(xs.length / 2)]);
process.stdout.write(
  `\nScreened ${screens.length}/${targets.length} categories using ${budget.spentThisRun()} requests` +
    `${stopReason ? `\n${stopReason}` : ''}\n\n` +
    `${'category'.padEnd(36)}${'totalResults'.padStart(14)}${'n'.padStart(4)}${'medRatings'.padStart(12)}${'medPrice'.padStart(10)}${'subs'.padStart(6)}\n` +
    screens
      .map(
        (s) =>
          `${s.name.slice(0, 34).padEnd(36)}${String(s.totalResults).padStart(14)}` +
          `${String(s.productsOnPage).padStart(4)}${String(median(s.ratingCounts)).padStart(12)}` +
          `${median(s.prices).toFixed(2).padStart(10)}${String(s.subcategories.length).padStart(6)}`,
      )
      .join('\n') +
    '\n',
);
if (failures.length > 0) process.stdout.write(`\nfailures:\n${failures.join('\n')}\n`);
if (abortedByGate) process.exitCode = 1;

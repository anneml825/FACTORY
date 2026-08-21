/**
 * The first request Factory has ever paid for, and a deliberately small one.
 *
 * Its only purpose is to confirm that the API behaves the way its published
 * schema says before the ~60-request demand screen is committed to it. Four
 * questions, one request each:
 *
 *   1. Does the bestseller-category seed return usable ids?
 *   2. Does a bestsellers request return ranked products AND child categories
 *      in one response? (If not, the screen's cost model is wrong and the plan
 *      has to change before it spends sixty requests finding out.)
 *   3. Does a child category id from (2) work as an input to (2)?
 *   4. Does a sales estimate return unit figures for an ASIN found in (2)?
 *
 * It attaches to a reservation made by an earlier step; it cannot create one,
 * and it cannot spend more than was reserved.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { CanopyClient, CanopyPaymentRequired } from './canopy-client.ts';
import { MeteredApiBudget } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const outputPath = process.env.CANOPY_PROBE_OUTPUT ?? 'state/canopy-probe-result.json';
const runId = process.env.GITHUB_RUN_ID;
const apiKey = process.env.CANOPY_API_KEY;

if (!runId) throw new Error('GITHUB_RUN_ID is required.');
if (!apiKey) throw new Error('CANOPY_API_KEY is required.');

const budget = await MeteredApiBudget.resume({ ledgerPath, runId });
const canopy = new CanopyClient({ apiKey, budget });

interface Finding {
  question: string;
  answered: boolean;
  detail: string;
}
const findings: Finding[] = [];
let terminalStop: string | null = null;

function record(question: string, answered: boolean, detail: string): void {
  findings.push({ question, answered, detail });
}

try {
  // 1. Seed.
  const categories = await canopy.bestSellerCategories('US');
  const seeds = categories.data.amazonBestSellerCategories.categories.filter((c) => c.id);
  record(
    'bestseller-category seed returns usable ids',
    seeds.length > 0,
    `${seeds.length} categories; sample: ${seeds.slice(0, 8).map((c) => c.id).join(', ')}`,
  );

  // Books is the category the KDP screen needs. Matched by id or name rather
  // than hard-coded, because a guessed id would waste a paid request.
  const books =
    seeds.find((c) => (c.id ?? '').toLowerCase().includes('book')) ??
    seeds.find((c) => (c.name ?? '').toLowerCase() === 'books');
  record(
    'a Books bestseller category exists',
    Boolean(books),
    books ? `${books.name} (${books.id})` : 'no category matched "book"',
  );

  if (books?.id) {
    // 2. The decisive one: products AND children in a single response.
    const top = await canopy.bestSellers({ categoryId: books.id, limit: 50 });
    const results = top.data.amazonBestSellers.productResults?.results ?? [];
    const children = top.data.amazonBestSellers.categoryInfo?.childCategories ?? [];
    const ranked = results.filter((r) => typeof r.bestSellersRank === 'number');
    record(
      'one bestsellers request returns ranked products AND child categories',
      results.length > 0 && children.length > 0,
      `${results.length} products (${ranked.length} carrying bestSellersRank), ${children.length} child categories`,
    );
    record(
      'products carry the screening fields',
      results.some((r) => r.asin && typeof r.ratingsTotal === 'number'),
      `sample: ${JSON.stringify(results[0] ?? null).slice(0, 300)}`,
    );

    // 3. A child id round-trips as an input.
    const child = children.find((c) => c.id);
    if (child?.id) {
      const deeper = await canopy.bestSellers({ categoryId: child.id, limit: 50 });
      const deeperResults = deeper.data.amazonBestSellers.productResults?.results ?? [];
      const deeperChildren = deeper.data.amazonBestSellers.categoryInfo?.childCategories ?? [];
      record(
        'a child category id works as an input, so the walk is recursive',
        deeperResults.length > 0,
        `${child.name} (${child.id}): ${deeperResults.length} products, ${deeperChildren.length} further children`,
      );
    } else {
      record('a child category id works as an input', false, 'no child category carried an id');
    }

    // 4. Sales estimate on a real ASIN from the list.
    const asin = results.find((r) => r.asin)?.asin;
    if (asin) {
      const sales = await canopy.salesEstimate(asin);
      const estimate = sales.data.amazonProduct.salesEstimate;
      record(
        'a sales estimate returns unit figures',
        Boolean(estimate && Object.keys(estimate).length > 0),
        `${asin}: ${JSON.stringify(estimate ?? null)}`,
      );
    } else {
      record('a sales estimate returns unit figures', false, 'no ASIN available from the list');
    }
  }
} catch (error) {
  if (error instanceof CanopyPaymentRequired) {
    // Not retried, and not swallowed. The allowance is gone; that is the answer.
    terminalStop = error.message;
  } else {
    terminalStop = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }
} finally {
  // Settles even on the failure path. An unrecorded request is worse than a
  // failed probe, because the next run would think it had more room than it does.
  await budget.commit();
}

const summary = {
  runId,
  requestsSpent: budget.spentThisRun(),
  terminalStop,
  findings,
  allAnswered: findings.every((f) => f.answered) && terminalStop === null,
};
await mkdir('state', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (!summary.allAnswered) process.exitCode = 1;

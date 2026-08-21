/**
 * These tests are the control. Every one of them asserts a REFUSAL, because the
 * value of this module is not that it makes requests — it is that it declines to.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BudgetRefusal,
  EXPLORATORY_LIFETIME_CEILING,
  FREE_TIER_REQUESTS,
  MeteredApiBudget,
  ROLLING_WINDOW_DAYS,
  ROLLING_WINDOW_REQUEST_BUDGET,
  spentInWindow,
} from './metered-api-budget.ts';

async function ledgerPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'budget-'));
  return join(dir, 'usage.json');
}

const AT = (iso: string) => () => new Date(iso);
const NO_SLEEP = async () => {};

// --- Check 1: the ceiling cannot be raised quietly --------------------------

test('the configured budget stays below the free tier', () => {
  // If someone — including a future me — raises these, CI goes red and the
  // change has to be argued for in a diff rather than slipped in.
  assert.equal(FREE_TIER_REQUESTS, 100);
  assert.ok(
    ROLLING_WINDOW_REQUEST_BUDGET <= 90,
    'the rolling budget must keep a margin below the free tier',
  );
  assert.ok(ROLLING_WINDOW_REQUEST_BUDGET < FREE_TIER_REQUESTS);
  assert.ok(ROLLING_WINDOW_DAYS >= 31, 'the window must be longer than any calendar month');
  assert.ok(EXPLORATORY_LIFETIME_CEILING <= 400);
});

// --- Check 2: the rolling window ---------------------------------------------

test('the window is rolling, so a billing cycle cannot be straddled', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const ledger = {
    schemaVersion: 1 as const,
    runs: [
      { runId: 'old', startedAt: '2026-06-01T00:00:00Z', requests: 80, note: '' },
      { runId: 'recent', startedAt: '2026-08-01T00:00:00Z', requests: 40, note: '' },
    ],
  };
  // The June run is outside the window; the August one is inside. A calendar
  // month check would have reset on the 1st and let the August spend start over.
  assert.equal(spentInWindow(ledger, now), 40);
});

test('an unparseable timestamp counts against the budget rather than being ignored', () => {
  const ledger = {
    schemaVersion: 1 as const,
    runs: [{ runId: 'broken', startedAt: 'not-a-date', requests: 50, note: '' }],
  };
  assert.equal(spentInWindow(ledger, new Date('2026-08-20T00:00:00Z')), 50);
});

// --- Check 3: fail-closed ledger reads ---------------------------------------

test('a missing ledger is a first run; a corrupt one is a refusal', async () => {
  const path = await ledgerPath();
  const first = await MeteredApiBudget.reserve({ ledgerPath: path, runId: 'r1', intendedRequests: 5 });
  assert.equal(first.remaining(), 5);

  await writeFile(path, '{ this is not json');
  await assert.rejects(
    MeteredApiBudget.reserve({ ledgerPath: path, runId: 'r2', intendedRequests: 1 }),
    BudgetRefusal,
  );

  await writeFile(path, JSON.stringify({ schemaVersion: 9, runs: [] }));
  await assert.rejects(
    MeteredApiBudget.reserve({ ledgerPath: path, runId: 'r3', intendedRequests: 1 }),
    BudgetRefusal,
  );

  await writeFile(
    path,
    JSON.stringify({ schemaVersion: 1, runs: [{ runId: 'x', startedAt: '2026-08-01', requests: -5 }] }),
  );
  await assert.rejects(
    MeteredApiBudget.reserve({ ledgerPath: path, runId: 'r4', intendedRequests: 1 }),
    BudgetRefusal,
  );
});

// --- Check 4: pre-flight reservation -----------------------------------------

test('a run that cannot afford its whole intent never makes its first request', async () => {
  const path = await ledgerPath();
  await writeFile(
    path,
    JSON.stringify({
      schemaVersion: 1,
      runs: [{ runId: 'prior', startedAt: '2026-08-19T00:00:00Z', requests: 85, note: '' }],
    }),
  );
  await assert.rejects(
    MeteredApiBudget.reserve({
      ledgerPath: path,
      runId: 'greedy',
      intendedRequests: 10,
      now: AT('2026-08-20T00:00:00Z'),
    }),
    /would exceed the budget/,
  );
});

test('the exploratory lifetime ceiling is enforced independently of the window', async () => {
  const path = await ledgerPath();
  // All well outside the rolling window, so only the lifetime ceiling can catch it.
  await writeFile(
    path,
    JSON.stringify({
      schemaVersion: 1,
      runs: Array.from({ length: 10 }, (_, index) => ({
        runId: `old-${index}`,
        startedAt: '2025-01-01T00:00:00Z',
        requests: 40,
        note: '',
      })),
    }),
  );
  await assert.rejects(
    MeteredApiBudget.reserve({
      ledgerPath: path,
      runId: 'next',
      intendedRequests: 5,
      now: AT('2026-08-20T00:00:00Z'),
    }),
    /lifetime ceiling/,
  );
});

// --- Check 5: the per-call counter -------------------------------------------

test('a runaway loop is stopped by the counter', async () => {
  const path = await ledgerPath();
  const budget = await MeteredApiBudget.reserve({
    ledgerPath: path,
    runId: 'runaway',
    intendedRequests: 3,
    sleep: NO_SLEEP,
  });

  let calls = 0;
  await assert.rejects(async () => {
    // The bug this exists for: a pagination loop with no working exit condition.
    for (;;) await budget.spend(async () => { calls += 1; });
  }, /exhausted/);

  assert.equal(calls, 3, 'exactly the reserved number of requests were made');
});

test('a failing request still consumes budget', async () => {
  const path = await ledgerPath();
  const budget = await MeteredApiBudget.reserve({
    ledgerPath: path,
    runId: 'failing',
    intendedRequests: 2,
    sleep: NO_SLEEP,
  });
  // Counting only successes is how a retry loop spends real money while
  // reporting zero usage.
  await assert.rejects(budget.spend(async () => { throw new Error('provider 500'); }));
  assert.equal(budget.spentThisRun(), 1);
});

// --- Check 6: velocity --------------------------------------------------------

test('calls are spaced, so velocity is bounded before the counter trips', async () => {
  const path = await ledgerPath();
  const waits: number[] = [];
  const budget = await MeteredApiBudget.reserve({
    ledgerPath: path,
    runId: 'paced',
    intendedRequests: 3,
    sleep: async (ms) => { waits.push(ms); },
  });
  await budget.spend(async () => 1);
  await budget.spend(async () => 2);
  await budget.spend(async () => 3);
  assert.equal(waits.length, 2, 'every call after the first waits');
  assert.ok(waits.every((ms) => ms > 0));
});

// --- Check 7: the kill switch -------------------------------------------------

test('the kill switch halts spending regardless of remaining budget', async () => {
  const path = await ledgerPath();
  await assert.rejects(
    MeteredApiBudget.reserve({ ledgerPath: path, runId: 'halted', intendedRequests: 1, halted: true }),
    /kill switch/,
  );
});

// --- Accounting ---------------------------------------------------------------

test('usage is recorded even when the run fails, and committing twice is a no-op', async () => {
  const path = await ledgerPath();
  const budget = await MeteredApiBudget.reserve({
    ledgerPath: path,
    runId: 'crashed',
    intendedRequests: 5,
    sleep: NO_SLEEP,
    note: 'probe',
  });
  await budget.spend(async () => 1);
  await budget.spend(async () => 2);
  await budget.commit();
  await budget.commit();

  const written = JSON.parse(await readFile(path, 'utf8')) as { runs: { requests: number }[] };
  assert.equal(written.runs.length, 1);
  assert.equal(written.runs[0].requests, 2);

  // And a committed budget refuses further spending.
  await assert.rejects(budget.spend(async () => 3), /already been committed/);
});

test('successive runs accumulate against the same window', async () => {
  const path = await ledgerPath();
  for (const runId of ['a', 'b']) {
    const budget = await MeteredApiBudget.reserve({
      ledgerPath: path,
      runId,
      intendedRequests: 45,
      sleep: NO_SLEEP,
      now: AT('2026-08-20T00:00:00Z'),
    });
    for (let index = 0; index < 45; index += 1) await budget.spend(async () => index);
    await budget.commit();
  }
  await assert.rejects(
    MeteredApiBudget.reserve({
      ledgerPath: path,
      runId: 'c',
      intendedRequests: 1,
      now: AT('2026-08-20T00:00:00Z'),
    }),
    /would exceed the budget/,
  );
});

// --- The chokepoint is the only door ------------------------------------------

test('nothing in src/research talks to a provider except through the budget', async () => {
  // A counter sprinkled at call sites is bypassed by the next code path someone
  // adds. This asserts there is exactly one door.
  const dir = 'src/research';
  for (const name of await readdir(dir)) {
    if (!name.endsWith('.ts') || name.startsWith('metered-api-budget')) continue;
    const source = await readFile(join(dir, name), 'utf8');
    const makesNetworkCall = /\bfetch\s*\(|axios|node:https?\b/.test(source);
    if (!makesNetworkCall) continue;
    assert.match(
      source,
      /MeteredApiBudget/,
      `${name} performs network calls but does not route them through MeteredApiBudget`,
    );
    assert.match(
      source,
      /budget\.spend\s*\(/,
      `${name} must wrap every provider call in budget.spend()`,
    );
  }
});

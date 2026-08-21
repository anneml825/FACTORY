/**
 * A hard spend ceiling for a metered third-party API, enforced by construction.
 *
 * Factory is about to be handed a billable API key. The owner's question was the
 * right one: what stops an agent burning the card? Not good intentions — the
 * realistic failure is not greed but a bug, a pagination loop whose exit
 * condition is wrong, firing ten thousand requests in a minute. Trust is not a
 * control. This module is.
 *
 * Seven independent checks. Each is capable of stopping a runaway on its own, so
 * no single mistake — including a mistake in one of these checks — is sufficient:
 *
 *   1. A compile-time ceiling that a test refuses to let anyone raise quietly.
 *   2. A ROLLING-WINDOW ledger, not a calendar-month one (see below).
 *   3. Fail-closed ledger reads: unreadable history means no requests, ever.
 *   4. A pre-flight reservation that refuses to START a run it cannot finish.
 *   5. A per-call counter at a single chokepoint that throws when exhausted.
 *   6. A minimum interval between calls, so velocity is bounded even before the
 *      counter trips.
 *   7. A kill switch that halts everything regardless of remaining budget.
 *
 * WHY A ROLLING WINDOW RATHER THAN A CALENDAR MONTH. A provider's billing month
 * need not start on the 1st. If it runs the 15th to the 14th and this guard
 * counted calendar months, a run could spend the full budget in the tail of one
 * calendar month and the full budget again in the head of the next — both inside
 * ONE billing period, at nearly double the intended ceiling. A rolling window
 * cannot be gamed by billing alignment because it never resets.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** What the provider gives away before it starts charging. Reference value. */
export const FREE_TIER_REQUESTS = 100;

/**
 * What Factory is allowed to spend in any 31-day window. Deliberately below the
 * free tier so that miscounting, retries, or a provider counting differently
 * than we do still cannot reach a billable request.
 */
export const ROLLING_WINDOW_REQUEST_BUDGET = 90;

/** Days in the rolling window. Longer than any month, so no month can escape it. */
export const ROLLING_WINDOW_DAYS = 31;

/**
 * A total ceiling for the whole exploratory phase, independent of the window.
 * Raising it should be a deliberate, reviewed act — not something that happens
 * while adjusting something else.
 */
export const EXPLORATORY_LIFETIME_CEILING = 400;

/** Minimum milliseconds between calls. Bounds velocity before the counter trips. */
export const MINIMUM_CALL_INTERVAL_MS = 250;

export interface LedgerRun {
  runId: string;
  startedAt: string;
  requests: number;
  note: string;
}

export interface UsageLedger {
  schemaVersion: 1;
  runs: LedgerRun[];
}

export class BudgetRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetRefusal';
  }
}

function emptyLedger(): UsageLedger {
  return { schemaVersion: 1, runs: [] };
}

/**
 * Reads the ledger. A MISSING file is an empty history and is fine — that is a
 * first run. A CORRUPT or unreadable file is not fine: it means the spend
 * history is unknown, and unknown history must never be treated as zero spend.
 */
export async function readLedger(path: string): Promise<UsageLedger> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyLedger();
    throw new BudgetRefusal(
      `Refusing to spend: the usage ledger at ${path} could not be read. ` +
        `Unknown spend history is never treated as zero.`,
    );
  }
  let parsed: UsageLedger;
  try {
    parsed = JSON.parse(raw) as UsageLedger;
  } catch {
    throw new BudgetRefusal(`Refusing to spend: the usage ledger at ${path} is not valid JSON.`);
  }
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.runs)) {
    throw new BudgetRefusal(`Refusing to spend: the usage ledger at ${path} has an unknown shape.`);
  }
  for (const run of parsed.runs) {
    if (!Number.isInteger(run.requests) || run.requests < 0 || !run.startedAt) {
      throw new BudgetRefusal(`Refusing to spend: the usage ledger contains a malformed run entry.`);
    }
  }
  return parsed;
}

export function spentInWindow(ledger: UsageLedger, now: Date): number {
  const cutoff = now.getTime() - ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return ledger.runs
    .filter((run) => {
      const at = Date.parse(run.startedAt);
      // An unparseable timestamp counts AGAINST the budget rather than being
      // skipped: the safe reading of a broken record is that it spent something.
      return Number.isNaN(at) || at >= cutoff;
    })
    .reduce((total, run) => total + run.requests, 0);
}

export function spentLifetime(ledger: UsageLedger): number {
  return ledger.runs.reduce((total, run) => total + run.requests, 0);
}

export interface BudgetOptions {
  ledgerPath: string;
  runId: string;
  /** How many requests this run intends to make. Refused if it cannot fit. */
  intendedRequests: number;
  note?: string;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  /** Set to '1' to halt all spending regardless of remaining budget. */
  halted?: boolean;
}

/**
 * The only thing permitted to call a metered API. Every request goes through
 * `spend()`; nothing else in the codebase may talk to the provider directly, and
 * a test enforces that by scanning the source.
 */
export class MeteredApiBudget {
  private readonly ledgerPath: string;
  private readonly runId: string;
  private readonly note: string;
  private readonly now: () => Date;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly startedAt: string;
  private readonly ledger: UsageLedger;
  private readonly allowance: number;
  private used = 0;
  private lastCallAt = 0;
  private committed = false;

  private constructor(input: {
    ledgerPath: string;
    runId: string;
    note: string;
    now: () => Date;
    sleep: (ms: number) => Promise<void>;
    ledger: UsageLedger;
    allowance: number;
    startedAt: string;
  }) {
    this.ledgerPath = input.ledgerPath;
    this.runId = input.runId;
    this.note = input.note;
    this.now = input.now;
    this.sleep = input.sleep;
    this.ledger = input.ledger;
    this.allowance = input.allowance;
    this.startedAt = input.startedAt;
  }

  /**
   * Check 4 — the pre-flight reservation. A run that cannot afford its whole
   * intent is refused before it makes its FIRST request, rather than dying
   * halfway and leaving a half-collected screen that someone is tempted to
   * "just finish".
   */
  static async reserve(options: BudgetOptions): Promise<MeteredApiBudget> {
    const now = options.now ?? (() => new Date());
    const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

    if (options.halted ?? process.env.FACTORY_METERED_API_HALTED === '1') {
      throw new BudgetRefusal('Refusing to spend: the metered-API kill switch is engaged.');
    }
    if (!Number.isInteger(options.intendedRequests) || options.intendedRequests <= 0) {
      throw new BudgetRefusal('Refusing to spend: a run must declare a positive intended request count.');
    }
    // Check 1 — the compile-time ceiling, re-asserted at runtime so a bad edit
    // fails loudly here even if it somehow reached production.
    if (ROLLING_WINDOW_REQUEST_BUDGET >= FREE_TIER_REQUESTS) {
      throw new BudgetRefusal('Refusing to spend: the configured budget is not below the free tier.');
    }

    const ledger = await readLedger(options.ledgerPath);
    const at = now();
    const window = spentInWindow(ledger, at);
    const lifetime = spentLifetime(ledger);

    if (window + options.intendedRequests > ROLLING_WINDOW_REQUEST_BUDGET) {
      throw new BudgetRefusal(
        `Refusing to spend: ${window} requests already used in the last ${ROLLING_WINDOW_DAYS} days; ` +
          `this run intends ${options.intendedRequests}, which would exceed the budget of ` +
          `${ROLLING_WINDOW_REQUEST_BUDGET}.`,
      );
    }
    if (lifetime + options.intendedRequests > EXPLORATORY_LIFETIME_CEILING) {
      throw new BudgetRefusal(
        `Refusing to spend: the exploratory lifetime ceiling of ${EXPLORATORY_LIFETIME_CEILING} ` +
          `requests would be exceeded (${lifetime} already spent). Raising it is a deliberate decision.`,
      );
    }

    return new MeteredApiBudget({
      ledgerPath: options.ledgerPath,
      runId: options.runId,
      note: options.note ?? '',
      now,
      sleep,
      ledger,
      allowance: options.intendedRequests,
      startedAt: at.toISOString(),
    });
  }

  remaining(): number {
    return this.allowance - this.used;
  }

  spentThisRun(): number {
    return this.used;
  }

  /**
   * Checks 5 and 6 — the chokepoint. The counter is incremented BEFORE the
   * request is made, so a call that throws, times out, or is retried by the
   * provider still consumes budget. Counting only successes is how a retry loop
   * spends real money while reporting zero usage.
   */
  async spend<T>(request: () => Promise<T>): Promise<T> {
    if (this.committed) {
      throw new BudgetRefusal('Refusing to spend: this budget has already been committed.');
    }
    if (this.used >= this.allowance) {
      throw new BudgetRefusal(
        `Refusing to spend: this run's reservation of ${this.allowance} requests is exhausted.`,
      );
    }
    const wait = MINIMUM_CALL_INTERVAL_MS - (Date.now() - this.lastCallAt);
    if (this.lastCallAt !== 0 && wait > 0) await this.sleep(wait);

    this.used += 1;
    this.lastCallAt = Date.now();
    return request();
  }

  /**
   * Writes what was actually used back to the ledger. Called in a `finally`, so
   * a crashed run still records its spend — an unrecorded request is worse than
   * a failed run, because the next run would then believe it has more room than
   * it does.
   */
  async commit(): Promise<UsageLedger> {
    if (this.committed) return this.ledger;
    this.committed = true;
    this.ledger.runs.push({
      runId: this.runId,
      startedAt: this.startedAt,
      requests: this.used,
      note: this.note,
    });
    await mkdir(dirname(this.ledgerPath), { recursive: true });
    await writeFile(this.ledgerPath, `${JSON.stringify(this.ledger, null, 2)}\n`);
    return this.ledger;
  }
}

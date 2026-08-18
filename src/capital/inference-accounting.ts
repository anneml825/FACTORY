/**
 * Micro-denominated inference accounting. Phase E remediation.
 *
 * The constitutional ledger settles integer cents (CONSTITUTION.md §6,
 * FINANCIAL_CONTROLS.md). A single model call can cost a small fraction of one
 * cent. Phase D routed on integer micro-dollars but still handed the Capital
 * Authority a cent-rounded ceiling, which produced two failures:
 *
 *   1. BYPASS. `CostController` treats `maximumCents === 0` as "free" and runs
 *      the operation with no reservation, no kill-switch check, and no ledger
 *      entry. Any real adapter quoting under half a cent would have rounded to
 *      zero and spent real money entirely outside the Capital Authority.
 *
 *   2. DISTORTION. Ceiling every call to one cent and 1,000 assets at ~0.02c
 *      per call bills as ~$10 instead of ~$0.20 — enough to falsely kill the
 *      portfolio thesis on an accounting artifact.
 *
 * The repair keeps the ledger in cents and adds an exact micro-denominated
 * sub-ledger:
 *
 *   reserve   ceil(maximumMicros / MICROS_PER_CENT) cents, once, per tranche
 *   record    exact micros per call, append-only, idempotent, attributed
 *   settle    ceil(sum(micros) / MICROS_PER_CENT) cents, once, at tranche close
 *   reconcile journal total against the provider's own reported usage
 *
 * Rounding is applied to the AGGREGATE, never per call. Over-reserving is safe
 * because a reservation is a ceiling, not a charge.
 */

import type { CapitalAuthorityPort } from '../portfolio/cost-control.ts';

/** 1 cent = $0.01 = 10,000 micro-dollars. */
export const MICROS_PER_CENT = 10_000;

/**
 * Which protected bucket funds model inference.
 *
 * `INTEGRATIONS.md` already recorded this decision ("Model inference … counted
 * against DISCOVERY bucket once metered"). Phase E honours it rather than
 * inventing a new budget category, and the reasoning survives scrutiny:
 * CONSTITUTION.md §7 partitions capital precisely so that *searching and
 * making* cannot consume the money reserved for *validating*. Generation and
 * QA inference is search-and-make cost. The `validation` bucket stays reserved
 * for spend that buys a denominator — exposure, distribution, arrival — which
 * is the scarce thing. Phase D's hard-coded `production` bucket does not exist
 * in the schema and would have failed every reservation.
 */
export const INFERENCE_BUCKET = 'discovery';

export function centsCeilingFromMicros(micros: number): number {
  assertNonNegativeInteger(micros, 'micros');
  return Math.ceil(micros / MICROS_PER_CENT);
}

export function microsFromCents(cents: number): number {
  assertNonNegativeInteger(cents, 'cents');
  return cents * MICROS_PER_CENT;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
}

export class UsageJournalConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageJournalConflictError';
  }
}

export class TrancheExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrancheExhaustedError';
  }
}

export class InferenceReconciliationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InferenceReconciliationError';
  }
}

/** One provider call. `usageId` is the idempotency key; records never change. */
export interface InferenceUsageRecord {
  usageId: string;
  trancheId: string;
  experimentId: string;
  operationId: string;
  providerId: string;
  modelId: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  costMicros: number;
  recordedAt: string;
}

/**
 * Append-only. There is deliberately no update or delete: an inference cost that
 * has been incurred cannot be un-incurred, and the journal is the only exact
 * record of what the cent-denominated ledger rounded.
 */
export interface InferenceUsageJournal {
  append(record: InferenceUsageRecord): Promise<{ appended: boolean; duplicate: boolean }>;
  totalMicrosForTranche(trancheId: string): Promise<number>;
  totalMicrosForExperiment(experimentId: string): Promise<number>;
  records(trancheId: string): Promise<InferenceUsageRecord[]>;
}

export class InMemoryInferenceUsageJournal implements InferenceUsageJournal {
  private readonly byUsageId = new Map<string, InferenceUsageRecord>();
  private readonly order: string[] = [];

  async append(record: InferenceUsageRecord): Promise<{ appended: boolean; duplicate: boolean }> {
    assertNonNegativeInteger(record.costMicros, 'costMicros');
    assertNonNegativeInteger(record.inputTokens, 'inputTokens');
    assertNonNegativeInteger(record.outputTokens, 'outputTokens');
    if (!record.usageId || !record.trancheId || !record.experimentId) {
      throw new UsageJournalConflictError('Usage records require usageId, trancheId, and experimentId.');
    }
    const prior = this.byUsageId.get(record.usageId);
    if (prior) {
      if (JSON.stringify(prior) !== JSON.stringify(record)) {
        throw new UsageJournalConflictError(
          `Usage ${record.usageId} was re-recorded with different values; the journal is append-only.`,
        );
      }
      return { appended: false, duplicate: true };
    }
    this.byUsageId.set(record.usageId, structuredClone(record));
    this.order.push(record.usageId);
    return { appended: true, duplicate: false };
  }

  async totalMicrosForTranche(trancheId: string): Promise<number> {
    return this.sum((record) => record.trancheId === trancheId);
  }

  async totalMicrosForExperiment(experimentId: string): Promise<number> {
    return this.sum((record) => record.experimentId === experimentId);
  }

  async records(trancheId: string): Promise<InferenceUsageRecord[]> {
    return this.order
      .map((id) => this.byUsageId.get(id) as InferenceUsageRecord)
      .filter((record) => record.trancheId === trancheId)
      .map((record) => structuredClone(record));
  }

  private sum(predicate: (record: InferenceUsageRecord) => boolean): number {
    let total = 0;
    for (const id of this.order) {
      const record = this.byUsageId.get(id) as InferenceUsageRecord;
      if (predicate(record)) total += record.costMicros;
    }
    return total;
  }
}

export interface TrancheCloseResult {
  trancheId: string;
  reservedCents: number;
  exactMicros: number;
  settledCents: number;
  /** Cents reserved but not settled. Released back to the bucket by settlement. */
  unusedCents: number;
  callCount: number;
}

/**
 * One Capital Authority reservation covering many sub-cent calls.
 *
 * Open reserves a whole-cent ceiling. Each call draws down in exact micros and
 * is journalled. Close settles the aggregate ceiling once. A tranche that is
 * never closed leaves the reservation outstanding, which is the safe direction:
 * the capital stays committed rather than quietly re-spendable.
 */
export class InferenceTranche {
  readonly trancheId: string;
  readonly bucketName: string;
  readonly maximumMicros: number;
  readonly reservedCents: number;
  private readonly authority: CapitalAuthorityPort;
  private readonly journal: InferenceUsageJournal;
  private readonly actor: string;
  private readonly reservationIdempotencyKey: string;
  private drawnMicros = 0;
  private callCount = 0;
  private closed = false;

  private constructor(input: {
    trancheId: string;
    bucketName: string;
    maximumMicros: number;
    reservedCents: number;
    authority: CapitalAuthorityPort;
    journal: InferenceUsageJournal;
    actor: string;
    reservationIdempotencyKey: string;
  }) {
    this.trancheId = input.trancheId;
    this.bucketName = input.bucketName;
    this.maximumMicros = input.maximumMicros;
    this.reservedCents = input.reservedCents;
    this.authority = input.authority;
    this.journal = input.journal;
    this.actor = input.actor;
    this.reservationIdempotencyKey = input.reservationIdempotencyKey;
  }

  static async open(input: {
    trancheId: string;
    bucketName?: string;
    maximumMicros: number;
    purpose: string;
    actor: string;
    authority: CapitalAuthorityPort;
    journal: InferenceUsageJournal;
  }): Promise<InferenceTranche> {
    assertNonNegativeInteger(input.maximumMicros, 'maximumMicros');
    if (input.maximumMicros === 0) {
      throw new RangeError('A tranche with a zero ceiling cannot fund any call; do not open one.');
    }
    const bucketName = input.bucketName ?? INFERENCE_BUCKET;
    const reservedCents = centsCeilingFromMicros(input.maximumMicros);
    const reservationIdempotencyKey = `inference-tranche:${input.trancheId}`;
    await input.authority.reserve({
      bucketName,
      maxAmountCents: reservedCents,
      purpose: input.purpose,
      idempotencyKey: reservationIdempotencyKey,
      actor: input.actor,
    });
    return new InferenceTranche({
      trancheId: input.trancheId,
      bucketName,
      maximumMicros: input.maximumMicros,
      reservedCents,
      authority: input.authority,
      journal: input.journal,
      actor: input.actor,
      reservationIdempotencyKey,
    });
  }

  get remainingMicros(): number {
    return this.maximumMicros - this.drawnMicros;
  }

  admits(costMicros: number): boolean {
    assertNonNegativeInteger(costMicros, 'costMicros');
    return !this.closed && costMicros <= this.remainingMicros;
  }

  /** Reserve headroom for a quoted call before executing it. Fails closed. */
  assertAdmits(costMicros: number): void {
    if (this.closed) throw new TrancheExhaustedError(`Tranche ${this.trancheId} is closed.`);
    if (!this.admits(costMicros)) {
      throw new TrancheExhaustedError(
        `Tranche ${this.trancheId} has ${this.remainingMicros} micros remaining; ${costMicros} requested.`,
      );
    }
  }

  async record(record: Omit<InferenceUsageRecord, 'trancheId'>): Promise<{ duplicate: boolean }> {
    if (this.closed) throw new TrancheExhaustedError(`Tranche ${this.trancheId} is closed.`);
    const full: InferenceUsageRecord = { ...record, trancheId: this.trancheId };
    const prospective = this.drawnMicros + full.costMicros;
    const result = await this.journal.append(full);
    if (result.duplicate) return { duplicate: true };
    if (prospective > this.maximumMicros) {
      // The call already happened; refusing to record it would be the dishonest
      // option. Record it, then refuse further draw-down.
      this.drawnMicros = prospective;
      this.callCount++;
      throw new TrancheExhaustedError(
        `Tranche ${this.trancheId} overdrew: ${prospective} micros against a ${this.maximumMicros} ceiling. ` +
          'The usage is journalled; settlement will exceed the reservation and must be escalated.',
      );
    }
    this.drawnMicros = prospective;
    this.callCount++;
    return { duplicate: false };
  }

  async close(): Promise<TrancheCloseResult> {
    if (this.closed) throw new TrancheExhaustedError(`Tranche ${this.trancheId} is already closed.`);
    const exactMicros = await this.journal.totalMicrosForTranche(this.trancheId);
    const settledCents = centsCeilingFromMicros(exactMicros);
    if (settledCents > this.reservedCents) {
      throw new TrancheExhaustedError(
        `Tranche ${this.trancheId} settlement ${settledCents}c exceeds its ${this.reservedCents}c reservation.`,
      );
    }
    await this.authority.settle(this.reservationIdempotencyKey, settledCents, this.actor);
    this.closed = true;
    return {
      trancheId: this.trancheId,
      reservedCents: this.reservedCents,
      exactMicros,
      settledCents,
      unusedCents: this.reservedCents - settledCents,
      callCount: this.callCount,
    };
  }

  async abandon(reason: string): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.authority.release(this.reservationIdempotencyKey, this.actor, reason);
  }
}

export interface ProviderUsageReport {
  providerId: string;
  periodStart: string;
  periodEnd: string;
  reportedMicros: number;
}

export interface ReconciliationResult {
  reconciled: boolean;
  journalMicros: number;
  reportedMicros: number;
  discrepancyMicros: number;
  toleranceMicros: number;
  action: 'ACCEPT' | 'HALT';
  reason: string;
}

/**
 * Compare Factory's own journal against what the provider says it billed.
 *
 * Tolerance exists because providers round and batch; material divergence does
 * not get tolerated. A HALT means Factory's record of its own spend is wrong,
 * which is exactly the condition the kill switch exists for.
 */
export function reconcileInferenceUsage(input: {
  journalMicros: number;
  report: ProviderUsageReport;
  toleranceMicros?: number;
}): ReconciliationResult {
  assertNonNegativeInteger(input.journalMicros, 'journalMicros');
  assertNonNegativeInteger(input.report.reportedMicros, 'reportedMicros');
  // One cent, or 1% of the reported total, whichever is larger.
  const tolerance =
    input.toleranceMicros ?? Math.max(MICROS_PER_CENT, Math.ceil(input.report.reportedMicros / 100));
  const discrepancy = Math.abs(input.journalMicros - input.report.reportedMicros);
  const reconciled = discrepancy <= tolerance;
  return {
    reconciled,
    journalMicros: input.journalMicros,
    reportedMicros: input.report.reportedMicros,
    discrepancyMicros: discrepancy,
    toleranceMicros: tolerance,
    action: reconciled ? 'ACCEPT' : 'HALT',
    reason: reconciled
      ? `Journal and ${input.report.providerId} agree within ${tolerance} micros.`
      : `Journal (${input.journalMicros}) and ${input.report.providerId} (${input.report.reportedMicros}) ` +
        `differ by ${discrepancy} micros, above the ${tolerance} tolerance.`,
  };
}

export function assertInferenceUsageReconciled(result: ReconciliationResult): void {
  if (!result.reconciled) throw new InferenceReconciliationError(result.reason);
}

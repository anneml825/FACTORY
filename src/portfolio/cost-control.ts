import type { CapitalAuthority } from '../capital/authority.ts';
import { MICROS_PER_CENT, centsCeilingFromMicros } from '../capital/inference-accounting.ts';
import type { CostRecord } from './types.ts';

export type CapitalAuthorityPort = Pick<CapitalAuthority, 'reserve' | 'settle' | 'release'>;

export class CapitalControlUnavailableError extends Error {
  constructor() {
    super('Paid operation refused: Capital Authority is unavailable.');
    this.name = 'CapitalControlUnavailableError';
  }
}

export class PostExecutionSettlementPendingError extends Error {
  readonly pendingCost: CostRecord;
  readonly cause: unknown;

  constructor(operation: CostedOperation<unknown>, reservedCents: number, cause: unknown) {
    super(
      `Operation ${operation.operationId} may have incurred provider cost; reservation remains ` +
        'open for provider reconciliation.',
    );
    this.name = 'PostExecutionSettlementPendingError';
    this.cause = cause;
    this.pendingCost = {
      operationId: operation.operationId,
      reservationIdempotencyKey: operation.reservationIdempotencyKey,
      bucketName: operation.bucketName,
      maximumCents: reservedCents,
      settledCents: 0,
      currency: operation.currency,
      status: 'SETTLEMENT_PENDING',
    };
  }
}

export interface CostedOperation<T> {
  operationId: string;
  reservationIdempotencyKey: string;
  bucketName: string;
  maximumCents: number;
  /**
   * Exact upper bound in micro-dollars, when the operation can cost less than a
   * cent. Defaults to `maximumCents * MICROS_PER_CENT`.
   *
   * This field closes the Phase D bypass: a sub-cent quote rounds to zero cents,
   * and the zero-cost fast path skips Capital Authority entirely. The zero-cost
   * path is now keyed on MICROS, so any genuinely nonzero cost is mediated even
   * when its cent-rounded ceiling is zero.
   */
  maximumMicros?: number;
  currency: string;
  purpose: string;
  actor: string;
  run: () => Promise<{ value: T; actualCostCents: number; actualCostMicros?: number }>;
}

export class CostController {
  private readonly capitalAuthority: CapitalAuthorityPort | null;

  constructor(capitalAuthority: CapitalAuthorityPort | null = null) {
    this.capitalAuthority = capitalAuthority;
  }

  async execute<T>(operation: CostedOperation<T>): Promise<{ value: T; cost: CostRecord }> {
    if (!Number.isInteger(operation.maximumCents) || operation.maximumCents < 0) {
      throw new RangeError('maximumCents must be a non-negative integer.');
    }
    const maximumMicros = operation.maximumMicros ?? operation.maximumCents * MICROS_PER_CENT;
    if (!Number.isInteger(maximumMicros) || maximumMicros < 0) {
      throw new RangeError('maximumMicros must be a non-negative integer.');
    }

    if (maximumMicros === 0 && operation.maximumCents === 0) {
      const result = await operation.run();
      const actualMicros = result.actualCostMicros ?? result.actualCostCents * MICROS_PER_CENT;
      if (result.actualCostCents !== 0 || actualMicros !== 0) {
        throw new Error('A zero-cost operation reported a nonzero actual cost; refusing settlement.');
      }
      return {
        value: result.value,
        cost: {
          operationId: operation.operationId,
          reservationIdempotencyKey: operation.reservationIdempotencyKey,
          bucketName: operation.bucketName,
          maximumCents: 0,
          settledCents: 0,
          currency: operation.currency,
          status: 'ZERO_COST_SETTLED',
        },
      };
    }

    if (!this.capitalAuthority) throw new CapitalControlUnavailableError();

    // Reserve conservatively: a sub-cent ceiling still reserves a whole cent,
    // because a reservation is a ceiling, not a charge.
    const reserveCents = Math.max(operation.maximumCents, centsCeilingFromMicros(maximumMicros));

    await this.capitalAuthority.reserve({
      bucketName: operation.bucketName,
      maxAmountCents: reserveCents,
      purpose: operation.purpose,
      idempotencyKey: operation.reservationIdempotencyKey,
      actor: operation.actor,
    });

    let providerExecutionStarted = false;
    try {
      // From this point onward a thrown error cannot prove the provider did not
      // bill. The reservation therefore remains committed for reconciliation.
      providerExecutionStarted = true;
      const result = await operation.run();
      const actualMicros = result.actualCostMicros ?? result.actualCostCents * MICROS_PER_CENT;
      if (actualMicros > maximumMicros) {
        throw new Error('Operation cost exceeded its quoted ceiling; refusing settlement.');
      }
      // Single-operation settlement must round UP: settling a real sub-cent cost
      // as zero would understate spend. Callers that make many sub-cent calls
      // should use InferenceTranche, which rounds the aggregate instead.
      const settledCents = Math.max(result.actualCostCents, centsCeilingFromMicros(actualMicros));
      await this.capitalAuthority.settle(
        operation.reservationIdempotencyKey,
        settledCents,
        operation.actor,
      );
      return {
        value: result.value,
        cost: {
          operationId: operation.operationId,
          reservationIdempotencyKey: operation.reservationIdempotencyKey,
          bucketName: operation.bucketName,
          maximumCents: reserveCents,
          settledCents,
          currency: operation.currency,
          status: 'SETTLED',
        },
      };
    } catch (error) {
      if (providerExecutionStarted) {
        throw new PostExecutionSettlementPendingError(operation, reserveCents, error);
      }
      await this.capitalAuthority.release(
        operation.reservationIdempotencyKey,
        operation.actor,
        'operation failed before provider execution',
      );
      throw error;
    }
  }
}

import type { CapitalAuthority } from '../capital/authority.ts';
import type { CostRecord } from './types.ts';

export type CapitalAuthorityPort = Pick<CapitalAuthority, 'reserve' | 'settle' | 'release'>;

export class CapitalControlUnavailableError extends Error {
  constructor() {
    super('Paid operation refused: Capital Authority is unavailable.');
    this.name = 'CapitalControlUnavailableError';
  }
}

export interface CostedOperation<T> {
  operationId: string;
  reservationIdempotencyKey: string;
  bucketName: string;
  maximumCents: number;
  currency: string;
  purpose: string;
  actor: string;
  run: () => Promise<{ value: T; actualCostCents: number }>;
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

    if (operation.maximumCents === 0) {
      const result = await operation.run();
      if (result.actualCostCents !== 0) {
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

    await this.capitalAuthority.reserve({
      bucketName: operation.bucketName,
      maxAmountCents: operation.maximumCents,
      purpose: operation.purpose,
      idempotencyKey: operation.reservationIdempotencyKey,
      actor: operation.actor,
    });

    try {
      const result = await operation.run();
      await this.capitalAuthority.settle(
        operation.reservationIdempotencyKey,
        result.actualCostCents,
        operation.actor,
      );
      return {
        value: result.value,
        cost: {
          operationId: operation.operationId,
          reservationIdempotencyKey: operation.reservationIdempotencyKey,
          bucketName: operation.bucketName,
          maximumCents: operation.maximumCents,
          settledCents: result.actualCostCents,
          currency: operation.currency,
          status: 'SETTLED',
        },
      };
    } catch (error) {
      await this.capitalAuthority.release(
        operation.reservationIdempotencyKey,
        operation.actor,
        'operation failed before settlement',
      );
      throw error;
    }
  }
}

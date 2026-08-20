/**
 * PostgreSQL inference usage journal. Phase E remediation.
 *
 * The in-memory journal proves the semantics; this one survives a restart,
 * which is what makes reconciliation against a provider's billing possible at
 * all. The table is append-only by database trigger, so a rewrite is rejected
 * by PostgreSQL rather than by convention.
 */

import type { Pool } from 'pg';
import {
  UsageJournalConflictError,
  type InferenceUsageJournal,
  type InferenceUsageRecord,
  type InferenceTrancheJournalRecord,
} from './inference-accounting.ts';

interface UsageRow {
  usage_id: string;
  tranche_id: string;
  experiment_key: string;
  operation_id: string;
  provider_id: string;
  model_id: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  cost_micros: string;
  recorded_at: Date;
}

interface TrancheRow {
  tranche_id: string;
  bucket_name: string;
  reservation_idempotency_key: string;
  maximum_micros: string;
  reserved_cents: number;
  exact_micros: string | null;
  settled_cents: number | null;
  closed_at: Date | null;
}

function toTranche(row: TrancheRow): InferenceTrancheJournalRecord {
  return {
    trancheId: row.tranche_id,
    bucketName: row.bucket_name,
    reservationIdempotencyKey: row.reservation_idempotency_key,
    maximumMicros: Number(row.maximum_micros),
    reservedCents: row.reserved_cents,
    exactMicros: row.exact_micros === null ? null : Number(row.exact_micros),
    settledCents: row.settled_cents,
    closedAt: row.closed_at?.toISOString() ?? null,
  };
}

function sameUsage(a: InferenceUsageRecord, b: InferenceUsageRecord): boolean {
  return (Object.keys(a) as (keyof InferenceUsageRecord)[]).every((key) => a[key] === b[key]);
}

function toRecord(row: UsageRow): InferenceUsageRecord {
  return {
    usageId: row.usage_id,
    trancheId: row.tranche_id,
    experimentId: row.experiment_key,
    operationId: row.operation_id,
    providerId: row.provider_id,
    modelId: row.model_id,
    task: row.task,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costMicros: Number(row.cost_micros),
    recordedAt: row.recorded_at.toISOString(),
  };
}

export class PostgresInferenceUsageJournal implements InferenceUsageJournal {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async ensureTranche(record: InferenceTrancheJournalRecord): Promise<InferenceTrancheJournalRecord> {
    await this.pool.query(
      `INSERT INTO inference_tranche
         (tranche_id, bucket_name, reservation_idempotency_key, maximum_micros, reserved_cents)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (tranche_id) DO NOTHING`,
      [record.trancheId, record.bucketName, record.reservationIdempotencyKey, record.maximumMicros, record.reservedCents],
    );
    const result = await this.pool.query<TrancheRow>(
      'SELECT * FROM inference_tranche WHERE tranche_id=$1',
      [record.trancheId],
    );
    const prior = result.rows[0] ? toTranche(result.rows[0]) : null;
    if (!prior) throw new UsageJournalConflictError(`Tranche ${record.trancheId} could not be read back.`);
    if (
      prior.bucketName !== record.bucketName ||
      prior.reservationIdempotencyKey !== record.reservationIdempotencyKey ||
      prior.maximumMicros !== record.maximumMicros ||
      prior.reservedCents !== record.reservedCents
    ) {
      throw new UsageJournalConflictError(`Tranche ${record.trancheId} was reopened with different semantics.`);
    }
    return prior;
  }

  async closeTranche(input: {
    trancheId: string; exactMicros: number; settledCents: number; closedAt: string;
  }): Promise<InferenceTrancheJournalRecord> {
    await this.pool.query(
      `UPDATE inference_tranche SET exact_micros=$2, settled_cents=$3, closed_at=$4
       WHERE tranche_id=$1 AND closed_at IS NULL`,
      [input.trancheId, input.exactMicros, input.settledCents, input.closedAt],
    );
    const result = await this.pool.query<TrancheRow>(
      'SELECT * FROM inference_tranche WHERE tranche_id=$1',
      [input.trancheId],
    );
    const prior = result.rows[0] ? toTranche(result.rows[0]) : null;
    if (!prior) throw new UsageJournalConflictError(`Tranche ${input.trancheId} could not be read back.`);
    if (prior.exactMicros !== input.exactMicros || prior.settledCents !== input.settledCents || !prior.closedAt) {
      throw new UsageJournalConflictError(`Tranche ${input.trancheId} closed with different totals.`);
    }
    return prior;
  }

  async append(record: InferenceUsageRecord): Promise<{ appended: boolean; duplicate: boolean }> {
    const inserted = await this.pool.query(
      `INSERT INTO inference_usage
         (usage_id, tranche_id, experiment_key, operation_id, provider_id, model_id,
          task, input_tokens, output_tokens, cost_micros, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (usage_id) DO NOTHING
       RETURNING usage_id`,
      [
        record.usageId,
        record.trancheId,
        record.experimentId,
        record.operationId,
        record.providerId,
        record.modelId,
        record.task,
        record.inputTokens,
        record.outputTokens,
        record.costMicros,
        record.recordedAt,
      ],
    );
    if ((inserted.rowCount ?? 0) > 0) return { appended: true, duplicate: false };

    const existing = await this.pool.query<UsageRow>(
      'SELECT * FROM inference_usage WHERE usage_id = $1',
      [record.usageId],
    );
    const prior = existing.rows[0] ? toRecord(existing.rows[0]) : null;
    if (!prior) throw new UsageJournalConflictError(`Usage ${record.usageId} could not be read back.`);
    if (!sameUsage(prior, record)) {
      throw new UsageJournalConflictError(
        `Usage ${record.usageId} was re-recorded with different values; the journal is append-only.`,
      );
    }
    return { appended: false, duplicate: true };
  }

  async totalMicrosForTranche(trancheId: string): Promise<number> {
    return this.sum('tranche_id', trancheId);
  }

  async totalMicrosForExperiment(experimentId: string): Promise<number> {
    return this.sum('experiment_key', experimentId);
  }

  async records(trancheId: string): Promise<InferenceUsageRecord[]> {
    const result = await this.pool.query<UsageRow>(
      'SELECT * FROM inference_usage WHERE tranche_id = $1 ORDER BY id',
      [trancheId],
    );
    return result.rows.map(toRecord);
  }

  private async sum(column: 'tranche_id' | 'experiment_key', value: string): Promise<number> {
    const result = await this.pool.query<{ total: string | null }>(
      `SELECT SUM(cost_micros)::TEXT AS total FROM inference_usage WHERE ${column} = $1`,
      [value],
    );
    return Number(result.rows[0]?.total ?? 0);
  }
}

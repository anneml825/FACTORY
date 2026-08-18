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
    if (prior.costMicros !== record.costMicros || prior.experimentId !== record.experimentId) {
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

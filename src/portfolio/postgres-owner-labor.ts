import type { Pool } from 'pg';
import type {
  ObservedOwnerLaborSource,
  OwnerLaborKind,
  OwnerLaborObservation,
} from './owner-labor.ts';

interface LaborRow {
  kind: 'SETUP' | 'APPROVAL' | 'EXCEPTION' | 'OPERATING' | 'MAINTENANCE_DEBUG';
  actual_minutes: number;
  occurred_at: Date;
}

function policyKind(kind: LaborRow['kind']): OwnerLaborKind {
  return kind === 'APPROVAL' ? 'BATCH_APPROVAL' : kind;
}

/** Durable observed owner labor attributed by experiment key. */
export class PostgresOwnerLaborSource implements ObservedOwnerLaborSource {
  private readonly pool: Pool;

  constructor(pool: Pool) { this.pool = pool; }

  async observe(experimentIds: readonly string[]): Promise<OwnerLaborObservation> {
    const unique = [...new Set(experimentIds)];
    const result = unique.length === 0
      ? { rows: [] as LaborRow[] }
      : await this.pool.query<LaborRow>(
          `SELECT DISTINCT i.id, i.kind, COALESCE(i.actual_minutes, 0) AS actual_minutes, i.occurred_at
           FROM owner_intervention i
           JOIN owner_intervention_experiment a ON a.owner_intervention_id = i.id
           WHERE a.experiment_key = ANY($1::text[])
           ORDER BY i.occurred_at, i.id`,
          [unique],
        );
    const rows = result.rows;
    const total = (kind: OwnerLaborKind): number => rows
      .filter((row) => policyKind(row.kind) === kind)
      .reduce((sum, row) => sum + Number(row.actual_minutes), 0);
    return {
      experimentIds: unique,
      units: unique.length,
      observedSetupMinutes: total('SETUP'),
      observedBatchApprovalMinutes: total('BATCH_APPROVAL'),
      observedExceptionMinutes: total('EXCEPTION'),
      observedOperatingMinutes: total('OPERATING'),
      observedMaintenanceMinutes: total('MAINTENANCE_DEBUG'),
      windowStart: rows[0]?.occurred_at.toISOString() ?? '',
      windowEnd: rows.at(-1)?.occurred_at.toISOString() ?? '',
      source: 'postgresql-owner_intervention',
    };
  }
}

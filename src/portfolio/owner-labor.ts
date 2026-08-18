export type OwnerLaborKind =
  | 'SETUP'
  | 'BATCH_APPROVAL'
  | 'EXCEPTION'
  | 'OPERATING'
  | 'MAINTENANCE_DEBUG';

export interface OwnerLaborRecord {
  interventionId: string;
  occurredAt: string;
  kind: OwnerLaborKind;
  actualMinutes: number;
  reasonHumanRequired: string;
  isRecurring: boolean;
  automatable: boolean;
  unitsAffected: number;
}

export interface OwnerLaborCurve {
  setupMinutes: number;
  batchApprovalMinutesPerBatch: number;
  batchSize: number;
  exceptionMinutesPerThousandUnits: number;
  operatingMinutesPerUnit: number;
  maintenanceMinutesPerThousandUnits: number;
}

export interface OwnerLaborProjection {
  units: number;
  setupMinutes: number;
  batchApprovalMinutes: number;
  expectedExceptionMinutes: number;
  operatingMinutes: number;
  maintenanceMinutes: number;
  totalMinutes: number;
}

function nonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative.`);
}

export function projectOwnerLabor(curve: OwnerLaborCurve, units: number): OwnerLaborProjection {
  if (!Number.isInteger(units) || units < 1) throw new Error('Owner-labor projection units must be a positive integer.');
  for (const [label, value] of Object.entries(curve)) nonNegative(value, label);
  if (!Number.isInteger(curve.batchSize) || curve.batchSize < 1) {
    throw new Error('Owner-labor batchSize must be a positive integer.');
  }
  const batchApprovalMinutes = Math.ceil(units / curve.batchSize) * curve.batchApprovalMinutesPerBatch;
  const expectedExceptionMinutes = units / 1000 * curve.exceptionMinutesPerThousandUnits;
  const operatingMinutes = units * curve.operatingMinutesPerUnit;
  const maintenanceMinutes = units / 1000 * curve.maintenanceMinutesPerThousandUnits;
  return {
    units,
    setupMinutes: curve.setupMinutes,
    batchApprovalMinutes,
    expectedExceptionMinutes,
    operatingMinutes,
    maintenanceMinutes,
    totalMinutes:
      curve.setupMinutes +
      batchApprovalMinutes +
      expectedExceptionMinutes +
      operatingMinutes +
      maintenanceMinutes,
  };
}

export function assertPortfolioCompatibleOwnerLabor(curve: OwnerLaborCurve): void {
  if (curve.operatingMinutesPerUnit !== 0) {
    throw new Error('ARRIVE mechanism fails owner-labor gate: recurring operating minutes scale per unit.');
  }
}

export function summarizeOwnerLabor(records: readonly OwnerLaborRecord[]): Record<OwnerLaborKind, number> {
  const totals: Record<OwnerLaborKind, number> = {
    SETUP: 0,
    BATCH_APPROVAL: 0,
    EXCEPTION: 0,
    OPERATING: 0,
    MAINTENANCE_DEBUG: 0,
  };
  for (const record of records) {
    nonNegative(record.actualMinutes, 'actualMinutes');
    totals[record.kind] += record.actualMinutes;
  }
  return totals;
}

// ---------------------------------------------------------------------------
// Observed-versus-declared reconciliation. Phase E remediation.
//
// The Phase D gate rejected a plan whose *declared* operating minutes were
// nonzero. A plan that declares zero and costs five minutes an asset passed it
// unchallenged. OWNER_AUTONOMY.md is explicit that reclassifying or omitting
// real owner labour is the single easiest way to fake this metric, so the
// declaration is now checked against the `owner_intervention` record.
// ---------------------------------------------------------------------------

export interface OwnerLaborObservation {
  experimentIds: string[];
  units: number;
  observedSetupMinutes: number;
  observedBatchApprovalMinutes: number;
  observedExceptionMinutes: number;
  observedOperatingMinutes: number;
  observedMaintenanceMinutes: number;
  windowStart: string;
  windowEnd: string;
  source: string;
}

export interface ObservedOwnerLaborSource {
  observe(experimentIds: readonly string[]): Promise<OwnerLaborObservation>;
}

export interface AttributedOwnerLaborRecord extends OwnerLaborRecord {
  /** Experiments this intervention was actually spent on. */
  experimentIds: string[];
}

/**
 * Minimal in-process ledger with the same shape the `owner_intervention` table
 * exposes. A PostgreSQL-backed source implements the same interface.
 */
export class InMemoryOwnerLaborLedger implements ObservedOwnerLaborSource {
  private readonly records: AttributedOwnerLaborRecord[] = [];

  private readonly source: string;

  constructor(source = 'in-memory-owner-labor-ledger') {
    this.source = source;
  }

  log(record: AttributedOwnerLaborRecord): void {
    nonNegative(record.actualMinutes, 'actualMinutes');
    if (this.records.some((existing) => existing.interventionId === record.interventionId)) {
      throw new Error(`Owner intervention ${record.interventionId} was logged twice.`);
    }
    this.records.push(structuredClone(record));
  }

  async observe(experimentIds: readonly string[]): Promise<OwnerLaborObservation> {
    const wanted = new Set(experimentIds);
    const relevant = this.records.filter((record) =>
      record.experimentIds.some((id) => wanted.has(id)),
    );
    const total = (kind: OwnerLaborKind): number =>
      relevant.filter((record) => record.kind === kind).reduce((sum, record) => sum + record.actualMinutes, 0);
    const timestamps = relevant.map((record) => record.occurredAt).sort();
    return {
      experimentIds: [...experimentIds],
      units: experimentIds.length,
      observedSetupMinutes: total('SETUP'),
      observedBatchApprovalMinutes: total('BATCH_APPROVAL'),
      observedExceptionMinutes: total('EXCEPTION'),
      observedOperatingMinutes: total('OPERATING'),
      observedMaintenanceMinutes: total('MAINTENANCE_DEBUG'),
      windowStart: timestamps[0] ?? '',
      windowEnd: timestamps[timestamps.length - 1] ?? '',
      source: this.source,
    };
  }
}

export interface OwnerLaborReconciliation {
  truthful: boolean;
  declaredOperatingMinutes: number;
  observedOperatingMinutes: number;
  observedMaintenanceMinutes: number;
  discrepancyMinutes: number;
  reasons: string[];
  observation: OwnerLaborObservation;
}

/**
 * `SETUP`, `BATCH_APPROVAL`, and `EXCEPTION` minutes are policy-acceptable when
 * measured, and are reported rather than penalised. `OPERATING` above what the
 * plan declared is a falsified claim. `MAINTENANCE_DEBUG` is surfaced because
 * OWNER_AUTONOMY.md counts it against the autonomy thesis, but it does not by
 * itself make the declaration untruthful.
 */
export function reconcileOwnerLabor(input: {
  declaredOperatingMinutesPerAsset: number;
  units: number;
  observation: OwnerLaborObservation;
}): OwnerLaborReconciliation {
  nonNegative(input.declaredOperatingMinutesPerAsset, 'declaredOperatingMinutesPerAsset');
  if (!Number.isInteger(input.units) || input.units < 1) {
    throw new Error('Owner-labor reconciliation requires a positive integer unit count.');
  }
  const declared = input.declaredOperatingMinutesPerAsset * input.units;
  const observed = input.observation.observedOperatingMinutes;
  const reasons: string[] = [];
  if (observed > declared) {
    reasons.push(
      `Plan declared ${declared} operating minute(s) across ${input.units} unit(s); ` +
        `${observed} were actually logged (source: ${input.observation.source}).`,
    );
  }
  if (input.observation.observedMaintenanceMinutes > 0) {
    reasons.push(
      `${input.observation.observedMaintenanceMinutes} maintenance/debug minute(s) observed; ` +
        'these count against the autonomy thesis after COMMERCIAL_CLOCK_START.',
    );
  }
  return {
    truthful: observed <= declared,
    declaredOperatingMinutes: declared,
    observedOperatingMinutes: observed,
    observedMaintenanceMinutes: input.observation.observedMaintenanceMinutes,
    discrepancyMinutes: Math.max(0, observed - declared),
    reasons,
    observation: input.observation,
  };
}

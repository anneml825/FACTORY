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

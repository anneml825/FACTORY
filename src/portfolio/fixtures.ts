import type { AssetManifest, FunnelEvent, FunnelEventType, TransactionClassification } from './types.ts';

function baseManifest(experimentId: string, assetId: string): Pick<
  AssetManifest,
  | 'schemaVersion'
  | 'experimentId'
  | 'assetId'
  | 'noncommercialFixture'
  | 'price'
  | 'arrivalGate'
  | 'evaluationPolicy'
  | 'attribution'
> {
  return {
    schemaVersion: 1,
    experimentId,
    assetId,
    noncommercialFixture: true,
    price: { amountCents: 1200, currency: 'USD' },
    arrivalGate: {
      adapterId: 'unassigned',
      mode: 'FIXTURE',
      status: 'UNASSESSED',
      who: null,
      where: null,
      surface: null,
      permittedReason: null,
      quantitativeEvidenceId: null,
      measurementInstrument: null,
      measurementVerifiedAt: null,
    },
    evaluationPolicy: {
      minQualifiedExposures: 3,
      minOfferInteractions: 1,
      minArmLengthPurchasesToKeep: 1,
    },
    attribution: { experimentIdField: 'experiment_id', ownerTestExcluded: true },
  };
}

export function shortDocumentFixture(): AssetManifest {
  return {
    ...baseManifest('phase-a-doc-001', 'fixture-doc-001'),
    familyId: 'fixture-short-doc-family',
    family: 'SHORT_DOCUMENT',
    buyer: 'engineering test persona',
    problem: 'needs a deterministic document artifact for lifecycle testing',
    promise: 'renders the same marked-up fixture from the same source',
    source: {
      kind: 'SHORT_DOCUMENT',
      title: 'Phase A Document Fixture',
      summary: 'A deliberately noncommercial artifact used only to verify Factory plumbing.',
      sections: [
        { heading: 'Input', body: 'A typed manifest with stable fixture data.' },
        { heading: 'Output', body: 'Deterministic HTML with a checksum and experiment attribution.' },
      ],
    },
  };
}

export function spreadsheetFixture(): AssetManifest {
  return {
    ...baseManifest('phase-a-sheet-001', 'fixture-sheet-001'),
    familyId: 'fixture-spreadsheet-family',
    family: 'SPREADSHEET',
    buyer: 'engineering test persona',
    problem: 'needs deterministic tabular output for lifecycle testing',
    promise: 'renders stable, injection-safe CSV from typed rows',
    source: {
      kind: 'SPREADSHEET',
      title: 'Phase A Spreadsheet Fixture',
      columns: ['Item', 'Units', 'Unit price cents'],
      rows: [
        ['Fixture A', 2, 125],
        ['=unsafe formula becomes text', 1, 300],
      ],
    },
  };
}

export function syntheticEvent(input: {
  eventId: string;
  type: FunnelEventType;
  experimentId?: string;
  assetId?: string;
  transactionId?: string;
  effectId?: string;
  classification?: TransactionClassification;
  amountCents?: number;
  reason?: string;
}): FunnelEvent {
  return {
    eventId: input.eventId,
    type: input.type,
    occurredAt: '2026-08-18T12:00:00.000Z',
    experimentId: input.experimentId ?? 'phase-a-doc-001',
    assetId: input.assetId ?? 'fixture-doc-001',
    transactionId: input.transactionId,
    effectId: input.effectId,
    classification: input.classification,
    amountCents: input.amountCents,
    currency: input.amountCents === undefined ? undefined : 'USD',
    reason: input.reason,
    environment: 'FIXTURE',
    synthetic: true,
  };
}

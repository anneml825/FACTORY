import { shortDocumentFixture, spreadsheetFixture } from '../portfolio/fixtures.ts';
import type { AssetManifest } from '../portfolio/types.ts';
import type { CommercialExperimentPlan } from './types.ts';

function manifestFor(index: number, family: 'SHORT_DOCUMENT' | 'SPREADSHEET'): AssetManifest {
  const base = family === 'SHORT_DOCUMENT' ? shortDocumentFixture() : spreadsheetFixture();
  const experimentId = `phase-d-fixture-${String(index).padStart(3, '0')}`;
  const assetId = `phase-d-asset-${String(index).padStart(3, '0')}`;
  const buyer = `fixture buyer cohort ${index}`;
  const problem = `needs isolated campaign plumbing fixture ${index}`;
  const source = structuredClone(base.source);
  source.title = `Phase D ${family === 'SHORT_DOCUMENT' ? 'Document' : 'Spreadsheet'} Fixture ${index}`;
  return {
    ...base,
    experimentId,
    assetId,
    familyId: `phase-d-${family.toLowerCase()}-family`,
    buyer,
    problem,
    promise: `exercise deterministic ${family.toLowerCase()} integration path ${index}`,
    source,
    arrivalGate: {
      adapterId: 'unselected-arrive-adapter',
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
  };
}

export function phaseDIntegrationFixtures(count = 4): CommercialExperimentPlan[] {
  if (!Number.isInteger(count) || count < 1) throw new Error('Fixture count must be a positive integer.');
  return Array.from({ length: count }, (_, offset) => {
    const index = offset + 1;
    const manifest = manifestFor(index, index % 2 === 0 ? 'SPREADSHEET' : 'SHORT_DOCUMENT');
    return {
      schemaVersion: 1,
      campaignId: 'phase-d-credential-free-integration',
      experimentId: manifest.experimentId,
      buyer: manifest.buyer,
      problem: manifest.problem,
      offer: manifest.promise,
      manifest,
      make: {
        familyArchitectureId: manifest.familyId,
        generationStrategy: 'DETERMINISTIC_FIXTURE',
        inferenceTasks: ['VALUE_QA'],
        functionalQaRequired: true,
        valueQaRequired: true,
      },
      put: {
        adapterId: 'fake-local-put-v1',
        mode: 'FIXTURE',
        automated: true,
        ownerOperatingMinutesPerAsset: 0,
      },
      arrive: {
        adapterId: 'unselected-arrive-adapter',
        who: manifest.buyer,
        where: 'candidate-specific surface not selected in credential-free Phase D',
        surface: 'UNSELECTED',
        permittedReason: 'must be verified before any real campaign launch',
        quantitativeSignal: {
          grade: 'E0',
          sourceId: null,
          retrievedAt: null,
          numericValue: null,
          semanticsVerified: false,
        },
        measurementInstrument: 'provider-neutral first-party attribution contract',
        measurementVerified: false,
        minimumMeaningfulExposure: 10,
      },
      watch: {
        adapterId: 'durable-watch-v1',
        attributionField: 'experiment_id',
        requiredEvents: [
          'QUALIFIED_EXPOSURE',
          'PRODUCT_VIEW',
          'CHECKOUT_STARTED',
          'CHECKOUT_COMPLETED',
          'FULFILLMENT_SUCCEEDED',
        ],
        crashDurable: true,
      },
      ownerLabor: {
        setupMinutes: 0,
        batchApprovalMinutes: 0,
        exceptionMinutesPerThousand: 0,
        operatingMinutesPerAsset: 0,
      },
    } satisfies CommercialExperimentPlan;
  });
}

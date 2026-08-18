import type { AssetManifest, CostRecord } from '../portfolio/types.ts';

export type EvidenceGrade = 'E0' | 'E1';
export type InferenceTaskKind =
  | 'CANDIDATE_SYNTHESIS'
  | 'SEMANTIC_DESIGN'
  | 'DRAFT'
  | 'VALUE_QA';

export interface QuantitativeSignal {
  grade: EvidenceGrade;
  sourceId: string | null;
  retrievedAt: string | null;
  numericValue: number | null;
  semanticsVerified: boolean;
}

export interface MakePlan {
  familyArchitectureId: string;
  generationStrategy: 'DETERMINISTIC_FIXTURE' | 'INFERENCE_ASSISTED' | 'DETERMINISTIC_FAMILY';
  inferenceTasks: InferenceTaskKind[];
  functionalQaRequired: true;
  valueQaRequired: true;
}

export interface PutPlan {
  adapterId: string;
  mode: 'FIXTURE' | 'PROVIDER_TEST' | 'LIVE';
  automated: boolean;
  ownerOperatingMinutesPerAsset: number;
}

export interface ArrivePlan {
  adapterId: string;
  who: string;
  where: string;
  surface: string;
  permittedReason: string;
  quantitativeSignal: QuantitativeSignal;
  measurementInstrument: string;
  measurementVerified: boolean;
  minimumMeaningfulExposure: number;
}

export interface WatchPlan {
  adapterId: string;
  attributionField: 'experiment_id';
  requiredEvents: Array<
    'QUALIFIED_EXPOSURE' | 'PRODUCT_VIEW' | 'CHECKOUT_STARTED' | 'CHECKOUT_COMPLETED' | 'FULFILLMENT_SUCCEEDED'
  >;
  crashDurable: boolean;
}

export interface CommercialExperimentPlan {
  schemaVersion: 1;
  campaignId: string;
  experimentId: string;
  buyer: string;
  problem: string;
  offer: string;
  manifest: AssetManifest;
  make: MakePlan;
  put: PutPlan;
  arrive: ArrivePlan;
  watch: WatchPlan;
  ownerLabor: {
    setupMinutes: number;
    batchApprovalMinutes: number;
    exceptionMinutesPerThousand: number;
    operatingMinutesPerAsset: number;
  };
}

export interface LaunchGateResult {
  eligible: boolean;
  reasons: string[];
}

export interface PreparedExperiment {
  experimentId: string;
  state: 'VALUE_QA_PASS' | 'FAILED';
  inferenceProviderId: string | null;
  inferenceModelId: string | null;
  costs: CostRecord[];
  launchGate: LaunchGateResult;
  error: string | null;
}

export interface CampaignRunResult {
  campaignId: string;
  requestedExperiments: number;
  prepared: PreparedExperiment[];
  peakConcurrency: number;
  ownerOperatingMinutes: number;
}

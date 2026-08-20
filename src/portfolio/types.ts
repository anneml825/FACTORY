export type AssetFamily = 'SHORT_DOCUMENT' | 'SPREADSHEET';

export type ExperimentState =
  | 'CANDIDATE'
  | 'BUILT'
  | 'FUNCTIONAL_QA_PASS'
  | 'VALUE_QA_PASS'
  | 'STAGED'
  | 'PUBLISHED'
  | 'OBSERVING'
  | 'KEEP'
  | 'ITERATE'
  | 'KILL'
  | 'INSUFFICIENT_SIGNAL';

export type EvaluationDecision = 'KEEP' | 'ITERATE' | 'KILL' | 'INSUFFICIENT_SIGNAL';

export type TransactionClassification =
  | 'OWNER_TEST'
  | 'INTERNAL_TEST'
  | 'ARM_LENGTH_CUSTOMER'
  | 'OTHER_OR_UNKNOWN';

export type CommerceEnvironment = 'FIXTURE' | 'PROVIDER_TEST' | 'LIVE';

export type TrafficClassification =
  | 'OWNER_INTERNAL'
  | 'STRANGER'
  | 'OTHER_OR_UNKNOWN';

export interface Money {
  amountCents: number;
  currency: string;
}

export interface ShortDocumentSource {
  kind: 'SHORT_DOCUMENT';
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
}

export interface SpreadsheetSource {
  kind: 'SPREADSHEET';
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export type AssetSource = ShortDocumentSource | SpreadsheetSource;

export interface ArrivalGateRecord {
  adapterId: string;
  mode: 'FIXTURE' | 'LIVE';
  status: 'UNASSESSED' | 'FAILED' | 'PASSED';
  who: string | null;
  where: string | null;
  surface: string | null;
  permittedReason: string | null;
  quantitativeEvidenceId: string | null;
  measurementInstrument: string | null;
  measurementVerifiedAt: string | null;
}

export interface ArrivalPublication {
  arrivalPublicationId: string;
  experimentId: string;
  assetId: string;
  providerId: string;
  providerObjectId: string;
  location: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  mode: 'FIXTURE' | 'LIVE';
  activatedAt: string | null;
  baseline: ArrivalMetrics;
}

export interface ArrivalMetrics {
  measuredAt: string;
  qualifiedExposures: number;
  visits: number;
  offerInteractions: number;
  ownerInternalExposures: number;
  strangerConfirmedInteractions: number;
  measurementSource: string;
  semantics: {
    qualifiedExposures: string;
    visits: string;
    offerInteractions: string;
  };
}

export interface EvaluationPolicy {
  minQualifiedExposures: number;
  minOfferInteractions: number;
  minArmLengthPurchasesToKeep: number;
}

export interface AssetManifest {
  schemaVersion: 1;
  assetId: string;
  experimentId: string;
  familyId: string;
  family: AssetFamily;
  buyer: string;
  problem: string;
  promise: string;
  noncommercialFixture: boolean;
  price: Money;
  source: AssetSource;
  arrivalGate: ArrivalGateRecord;
  evaluationPolicy: EvaluationPolicy;
  attribution: {
    experimentIdField: 'experiment_id';
    ownerTestExcluded: true;
  };
}

export interface Artifact {
  assetId: string;
  experimentId: string;
  fileName: string;
  mediaType: string;
  bytes: Uint8Array;
  sha256: string;
  rendererId: string;
}

export type QaMode = 'FIXTURE' | 'COMMERCIAL';

/** How a Value QA criterion can legitimately be established. */
export type ValueQaVerification = 'DETERMINISTIC' | 'MODEL_REVIEW' | 'HUMAN_EXCEPTION';

export type ValueQaCriterionStatus = 'UNASSESSED' | 'PASSED' | 'FAILED';

export interface ValueQaCriterionResult {
  id: string;
  requirement: string;
  verification: ValueQaVerification;
  status: ValueQaCriterionStatus;
  evidence: string[];
  failures: string[];
  /** Set when the criterion was established by an owner exception rather than by check. */
  ownerInterventionId: string | null;
}

export interface QaResult {
  passed: boolean;
  checks: string[];
  failures: string[];
  mode: QaMode;
  /** Present for COMMERCIAL Value QA. Fixture QA does not produce criteria. */
  criteria?: ValueQaCriterionResult[];
}

export interface Publication {
  publicationId: string;
  experimentId: string;
  assetId: string;
  providerId: string;
  location: string;
  idempotencyKey: string;
  manifestFingerprint: string;
  mode: CommerceEnvironment;
  status: 'ACTIVE' | 'INACTIVE';
  providerObjects?: {
    productId: string;
    priceId: string;
    paymentLinkId: string;
  };
}

export interface CostRecord {
  operationId: string;
  reservationIdempotencyKey: string;
  bucketName: string;
  maximumCents: number;
  settledCents: number;
  currency: string;
  status: 'ZERO_COST_SETTLED' | 'RESERVED' | 'SETTLED' | 'RELEASED' | 'SETTLEMENT_PENDING';
}

export interface ExperimentRecord {
  manifest: AssetManifest;
  state: ExperimentState;
  stateHistory: Array<{ state: ExperimentState; at: string; reason: string }>;
  artifact: Artifact | null;
  functionalQa: QaResult | null;
  valueQa: QaResult | null;
  publication: Publication | null;
  arrivalPublication: ArrivalPublication | null;
  costs: CostRecord[];
  decision: EvaluationResult | null;
}

export type FunnelEventType =
  | 'QUALIFIED_EXPOSURE'
  | 'PRODUCT_VIEW'
  | 'OFFER_INTERACTION'
  | 'CHECKOUT_STARTED'
  | 'CHECKOUT_FAILED'
  | 'CHECKOUT_COMPLETED'
  | 'FULFILLMENT_SUCCEEDED'
  | 'FULFILLMENT_FAILED'
  | 'REFUND_CREATED'
  | 'DISPUTE_CREATED';

export interface FunnelEvent {
  eventId: string;
  type: FunnelEventType;
  occurredAt: string;
  experimentId: string;
  assetId: string;
  transactionId?: string;
  /** Stable provider object/attempt ID. Required for fulfillment, refund, and dispute effects. */
  effectId?: string;
  classification?: TransactionClassification;
  amountCents?: number;
  currency?: string;
  reason?: string;
  /** Aggregate provider observations use quantity; omitted events count as one. */
  quantity?: number;
  trafficClassification?: TrafficClassification;
  arrivalPublicationId?: string;
  environment: CommerceEnvironment;
  synthetic: boolean;
}

export interface SignedEventEnvelope {
  payload: string;
  signature: string;
}

export interface TransactionSnapshot {
  transactionId: string;
  experimentId: string;
  assetId: string;
  classification: TransactionClassification;
  grossCents: number;
  currency: string;
  fulfilled: boolean;
  fulfillmentFailed: boolean;
  hadFulfillmentFailure: boolean;
  refundedCents: number;
  disputedCents: number;
  arrivalPublicationId?: string;
}

export interface ArrivalFunnelSnapshot {
  arrivalPublicationId: string;
  qualifiedExposures: number;
  ownerInternalExposures: number;
  productViews: number;
  ownerInternalProductViews: number;
  offerInteractions: number;
  checkoutStarts: number;
  checkoutFailures: number;
  transactionIds: string[];
}

export interface FunnelSnapshot {
  experimentId: string;
  qualifiedExposures: number;
  ownerInternalExposures: number;
  unknownExposures: number;
  productViews: number;
  ownerInternalProductViews: number;
  offerInteractions: number;
  checkoutStarts: number;
  checkoutFailures: number;
  transactions: TransactionSnapshot[];
  arrivalFunnels: ArrivalFunnelSnapshot[];
  grossRevenueCents: number;
  armLengthGrossRevenueCents: number;
  eligibleArmLengthRevenueCents: number;
  refundsCents: number;
  disputesCents: number;
  fulfillmentFailures: number;
}

export interface EvaluationResult {
  decision: EvaluationDecision;
  reason: string;
  evidenceGrade: 'E0' | 'E2' | 'E3';
  settledFactoryCostCents: number;
  contributionProfitCents: number;
  snapshot: FunnelSnapshot;
}

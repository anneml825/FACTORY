/**
 * Commercial Value QA. Phase E remediation.
 *
 * Fixture Value QA (`runFixtureValueQa`) checks that a fixture manifest has
 * non-empty strings and a positive price. That is a schema check. It cannot
 * fail a technically valid artifact that nobody should pay for, and it requires
 * `noncommercialFixture: true`, so it can never run on a real product.
 *
 * This module is the commercial contract. It is written BEFORE any real product
 * exists, deliberately, so the criteria cannot be tuned to pass a product the
 * author is already attached to.
 *
 * Every required criterion must be explicitly established. `UNASSESSED` fails.
 * Each criterion declares how it may legitimately be established:
 *
 *   DETERMINISTIC    executable check; the evidence is a check result
 *   MODEL_REVIEW     a recorded, independent, reasoned model verdict
 *   HUMAN_EXCEPTION  owner judgement, logged as an owner_intervention
 *
 * The classification matters because it is the honest statement of what Factory
 * can and cannot verify by itself (CONSTITUTION.md: Verifiable Correctness).
 */

import { createHash } from 'node:crypto';
import type {
  Artifact,
  AssetManifest,
  QaResult,
  ValueQaCriterionResult,
  ValueQaVerification,
} from './types.ts';

export type CommercialCriterionId =
  | 'PROMISE_FULFILLED'
  | 'FUNCTIONAL_CORRECTNESS'
  | 'VERIFIABLE_CORRECTNESS'
  | 'PROVENANCE_RIGHTS'
  | 'FREE_ALTERNATIVE_IDENTIFIED'
  | 'PAID_ALTERNATIVE_COMPARISON'
  | 'DIFFERENTIATION_VS_ALTERNATIVE'
  | 'ACCURACY_INTERNAL_CONSISTENCY'
  | 'USABILITY_COMPLETENESS'
  | 'PRESENTATION_BUYER_COMPREHENSION'
  | 'SLOP_REPETITION_HALLUCINATION'
  | 'PRICE_VALUE_DEFENSIBILITY';

interface CriterionSpec {
  id: CommercialCriterionId;
  requirement: string;
  verification: ValueQaVerification;
  /** Only these may be satisfied by a logged owner exception instead of a check. */
  escalatable: boolean;
}

export const COMMERCIAL_VALUE_QA_CRITERIA: readonly CriterionSpec[] = [
  {
    id: 'PROMISE_FULFILLED',
    requirement:
      'An executed check demonstrates that the artifact actually produces the outcome the manifest promises.',
    verification: 'DETERMINISTIC',
    escalatable: false,
  },
  {
    id: 'PAID_ALTERNATIVE_COMPARISON',
    requirement:
      'At least one relevant paid alternative is identified with price, retrieval time, and a concrete quality comparison.',
    verification: 'DETERMINISTIC',
    escalatable: false,
  },
  {
    id: 'FUNCTIONAL_CORRECTNESS',
    requirement:
      'The artifact is structurally sound for its family, checksum-consistent, and passes its executed functional checks.',
    verification: 'DETERMINISTIC',
    escalatable: false,
  },
  {
    id: 'VERIFIABLE_CORRECTNESS',
    requirement:
      'Every external factual claim carries a primary source and a retrieval timestamp, or the artifact explicitly declares that it makes none.',
    verification: 'DETERMINISTIC',
    escalatable: false,
  },
  {
    id: 'PROVENANCE_RIGHTS',
    requirement:
      'Every input source is licensed for commercial use with a URL, licence, and retrieval timestamp, or the work is attested original.',
    verification: 'DETERMINISTIC',
    escalatable: true,
  },
  {
    id: 'FREE_ALTERNATIVE_IDENTIFIED',
    requirement:
      'A concrete free alternative is named with a URL, how it is obtained free, and an honest overlap assessment.',
    verification: 'DETERMINISTIC',
    escalatable: false,
  },
  {
    id: 'DIFFERENTIATION_VS_ALTERNATIVE',
    requirement:
      'At least one specific, checkable difference from that free alternative, confirmed by an independent model review.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
  {
    id: 'ACCURACY_INTERNAL_CONSISTENCY',
    requirement:
      'Executed consistency checks and an independent review find no accuracy or internal-consistency defect.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
  {
    id: 'USABILITY_COMPLETENESS',
    requirement:
      'The artifact is complete and usable by the named buyer without missing parts, confirmed by an independent model review.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
  {
    id: 'PRESENTATION_BUYER_COMPREHENSION',
    requirement:
      'An independent review confirms that the named buyer can understand the offer and use the presented artifact.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
  {
    id: 'SLOP_REPETITION_HALLUCINATION',
    requirement:
      'An independent review checks repetition, filler, hallucination, broken output, and obvious AI slop.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
  {
    id: 'PRICE_VALUE_DEFENSIBILITY',
    requirement:
      'The asking price has a concrete value justification relative to free and paid alternatives, confirmed independently.',
    verification: 'MODEL_REVIEW',
    escalatable: false,
  },
];

export type SubstantiveOverlap = 'IDENTICAL' | 'SUBSTANTIAL' | 'PARTIAL' | 'MINIMAL';

export interface ExecutedCheck {
  checkId: string;
  description: string;
  executed: boolean;
  passed: boolean;
  evidence: string[];
}

export interface SourceRecord {
  title: string;
  url: string;
  licence: string;
  retrievedAt: string;
  clearedForCommercialUse: boolean;
}

export interface FactualClaimRecord {
  claim: string;
  primarySourceUrl: string;
  retrievedAt: string;
}

export interface FreeAlternativeRecord {
  name: string;
  url: string;
  retrievedAt: string;
  howObtainedFree: string;
  substantiveOverlap: SubstantiveOverlap;
}

export interface PaidAlternativeRecord {
  name: string;
  url: string;
  retrievedAt: string;
  priceCents: number;
  currency: string;
  concreteComparison: string;
}

export interface DifferentiationClaim {
  claim: string;
  /** How a sceptical buyer could confirm the claim without trusting Factory. */
  verifiableBy: string;
}

export interface ModelReviewRecord {
  evidenceId: string;
  artifactSha256: string;
  criterionId: CommercialCriterionId;
  reviewerProviderId: string;
  reviewerModelId: string;
  reviewedAt: string;
  verdict: 'PASS' | 'FAIL';
  rationale: string;
}

export interface OwnerExceptionRecord {
  evidenceId: string;
  artifactSha256: string;
  criterionId: CommercialCriterionId;
  ownerInterventionId: string;
  reason: string;
  recordedAt: string;
}

/**
 * The QA function does not trust caller-supplied IDs. A production resolver
 * checks append-only PostgreSQL evidence; tests may use an explicit allow-list.
 */
export interface CommercialQaEvidenceResolver {
  verifyModelReview(record: ModelReviewRecord): Promise<boolean>;
  verifyOwnerException(record: OwnerExceptionRecord): Promise<boolean>;
  readonly source: string;
}

export interface CommercialValueQaInput {
  manifest: AssetManifest;
  artifact: Artifact;
  /** Identity of whatever produced the artifact, so a reviewer cannot mark its own work. */
  generatorIdentity: { providerId: string; modelId: string };
  promiseCheck: ExecutedCheck;
  functionalChecks: ExecutedCheck[];
  factualClaims: FactualClaimRecord[];
  /** Explicit. An artifact that makes no external factual claim must say so and say why. */
  makesNoExternalFactualClaims: { declared: boolean; justification: string } | null;
  sources: SourceRecord[];
  originalWorkAttestation: string | null;
  freeAlternative: FreeAlternativeRecord | null;
  paidAlternatives: PaidAlternativeRecord[];
  differentiation: DifferentiationClaim[];
  accuracyChecks: ExecutedCheck[];
  priceJustification: string;
  modelReviews: ModelReviewRecord[];
  ownerExceptions: OwnerExceptionRecord[];
}

/**
 * Phrases that assert value without asserting anything checkable. A
 * differentiation claim built only from these is marketing, not a difference.
 */
const EMPTY_CLAIM_PATTERNS = [
  'better',
  'best',
  'high quality',
  'higher quality',
  'more comprehensive',
  'more professional',
  'easier to use',
  'saves time',
  'well designed',
  'well-designed',
  'premium',
  'curated',
  'ai powered',
  'ai-powered',
];

const MINIMUM_RATIONALE_CHARS = 40;
const MINIMUM_USABLE_ARTIFACT_BYTES = 512;

function isoTimestamp(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && /\d{4}-\d{2}-\d{2}T/.test(value);
}

function httpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function meaningfulWords(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

/** Strip the generic phrases and see whether anything checkable is left. */
function claimIsSubstantive(claim: string): boolean {
  let residue = claim.toLowerCase();
  for (const pattern of EMPTY_CLAIM_PATTERNS) residue = residue.replaceAll(pattern, ' ');
  const words = residue.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 3);
  const hasConcreteToken = /\d/.test(residue) || words.length >= 3;
  return hasConcreteToken;
}

class CriterionBuilder {
  private readonly results = new Map<CommercialCriterionId, ValueQaCriterionResult>();

  private readonly exceptions: readonly OwnerExceptionRecord[];

  constructor(exceptions: readonly OwnerExceptionRecord[]) {
    this.exceptions = exceptions;
    for (const spec of COMMERCIAL_VALUE_QA_CRITERIA) {
      this.results.set(spec.id, {
        id: spec.id,
        requirement: spec.requirement,
        verification: spec.verification,
        status: 'UNASSESSED',
        evidence: [],
        failures: [],
        ownerInterventionId: null,
      });
    }
  }

  fail(id: CommercialCriterionId, reason: string): void {
    const result = this.results.get(id) as ValueQaCriterionResult;
    result.status = 'FAILED';
    result.failures.push(reason);
  }

  evidence(id: CommercialCriterionId, note: string): void {
    (this.results.get(id) as ValueQaCriterionResult).evidence.push(note);
  }

  passIfClean(id: CommercialCriterionId): void {
    const result = this.results.get(id) as ValueQaCriterionResult;
    if (result.status === 'FAILED') return;
    result.status = 'PASSED';
  }

  /** Owner escalation, applied only to criteria the spec allows and only with a logged intervention. */
  applyEscalations(): void {
    for (const exception of this.exceptions) {
      const spec = COMMERCIAL_VALUE_QA_CRITERIA.find((item) => item.id === exception.criterionId);
      const result = this.results.get(exception.criterionId);
      if (!spec || !result) continue;
      if (!spec.escalatable) {
        result.failures.push(
          `Criterion ${exception.criterionId} is not escalatable; an owner exception cannot establish it.`,
        );
        result.status = 'FAILED';
        continue;
      }
      if (!exception.ownerInterventionId?.trim() || !exception.reason?.trim()) {
        result.failures.push('Owner exception requires a logged owner_intervention ID and a reason.');
        result.status = 'FAILED';
        continue;
      }
      if (result.status === 'FAILED') {
        result.status = 'PASSED';
        result.verification = 'HUMAN_EXCEPTION';
        result.ownerInterventionId = exception.ownerInterventionId;
        result.evidence.push(
          `Established by owner exception ${exception.ownerInterventionId}: ${exception.reason}`,
        );
      }
    }
  }

  collect(): ValueQaCriterionResult[] {
    return COMMERCIAL_VALUE_QA_CRITERIA.map(
      (spec) => this.results.get(spec.id) as ValueQaCriterionResult,
    );
  }
}

export async function runCommercialValueQa(
  input: CommercialValueQaInput,
  resolver: CommercialQaEvidenceResolver,
): Promise<QaResult> {
  const { manifest, artifact } = input;

  if (manifest.noncommercialFixture) {
    throw new TypeError('Commercial Value QA received a noncommercial fixture manifest.');
  }

  const verifiedReviews = new Set<string>();
  for (const review of input.modelReviews) {
    if (review.artifactSha256 === artifact.sha256 && await resolver.verifyModelReview(review)) {
      verifiedReviews.add(review.evidenceId);
    }
  }
  const verifiedExceptions: OwnerExceptionRecord[] = [];
  for (const exception of input.ownerExceptions) {
    if (exception.artifactSha256 === artifact.sha256 && await resolver.verifyOwnerException(exception)) {
      verifiedExceptions.push(exception);
    }
  }
  const builder = new CriterionBuilder(verifiedExceptions);

  // --- PROMISE_FULFILLED ----------------------------------------------------
  const promise = manifest.promise?.trim() ?? '';
  if (promise.length < 20) {
    builder.fail('PROMISE_FULFILLED', 'The manifest promise is too short to be checkable.');
  }
  const check = input.promiseCheck;
  if (!check || !check.executed) {
    builder.fail('PROMISE_FULFILLED', 'No executed promise check was supplied.');
  } else {
    if (!check.passed) builder.fail('PROMISE_FULFILLED', `Promise check ${check.checkId} failed.`);
    if (check.evidence.length === 0) {
      builder.fail('PROMISE_FULFILLED', 'The promise check produced no evidence.');
    }
    // The check must actually be about the promise, not a check of something else.
    const promiseWords = meaningfulWords(promise);
    const checkWords = meaningfulWords(`${check.description} ${check.evidence.join(' ')}`);
    const overlap = [...promiseWords].filter((word) => checkWords.has(word)).length;
    if (promiseWords.size > 0 && overlap === 0) {
      builder.fail(
        'PROMISE_FULFILLED',
        'The promise check does not reference the promise it claims to verify.',
      );
    } else if (check.passed) {
      builder.evidence('PROMISE_FULFILLED', `${check.checkId}: ${check.description}`);
    }
  }
  builder.passIfClean('PROMISE_FULFILLED');

  // --- FUNCTIONAL_CORRECTNESS ----------------------------------------------
  if (artifact.bytes.length === 0) builder.fail('FUNCTIONAL_CORRECTNESS', 'Artifact is empty.');
  if (artifact.assetId !== manifest.assetId || artifact.experimentId !== manifest.experimentId) {
    builder.fail('FUNCTIONAL_CORRECTNESS', 'Artifact attribution does not match the manifest.');
  }
  if (createHash('sha256').update(artifact.bytes).digest('hex') !== artifact.sha256) {
    builder.fail('FUNCTIONAL_CORRECTNESS', 'Artifact checksum does not match its bytes.');
  }
  if (!artifact.mediaType.trim() || !/\.[a-z0-9]+$/i.test(artifact.fileName)) {
    builder.fail('FUNCTIONAL_CORRECTNESS', 'Artifact lacks a media type or a file extension.');
  }
  if (input.functionalChecks.length === 0) {
    builder.fail('FUNCTIONAL_CORRECTNESS', 'No functional checks were executed.');
  }
  for (const functional of input.functionalChecks) {
    if (!functional.executed) {
      builder.fail('FUNCTIONAL_CORRECTNESS', `Functional check ${functional.checkId} was not executed.`);
    } else if (!functional.passed) {
      builder.fail('FUNCTIONAL_CORRECTNESS', `Functional check ${functional.checkId} failed.`);
    } else {
      builder.evidence('FUNCTIONAL_CORRECTNESS', `${functional.checkId} passed.`);
    }
  }
  builder.passIfClean('FUNCTIONAL_CORRECTNESS');

  // --- VERIFIABLE_CORRECTNESS ----------------------------------------------
  if (input.factualClaims.length === 0) {
    const declaration = input.makesNoExternalFactualClaims;
    if (!declaration?.declared || declaration.justification.trim().length < 20) {
      builder.fail(
        'VERIFIABLE_CORRECTNESS',
        'No factual claims were recorded and no justified declaration that the artifact makes none.',
      );
    } else {
      builder.evidence('VERIFIABLE_CORRECTNESS', `Declared free of external factual claims: ${declaration.justification}`);
    }
  }
  for (const claim of input.factualClaims) {
    if (!httpUrl(claim.primarySourceUrl)) {
      builder.fail('VERIFIABLE_CORRECTNESS', `Claim "${claim.claim}" has no primary-source URL.`);
    }
    if (!isoTimestamp(claim.retrievedAt)) {
      builder.fail('VERIFIABLE_CORRECTNESS', `Claim "${claim.claim}" has no retrieval timestamp.`);
    }
  }
  if (input.factualClaims.length > 0) {
    builder.evidence('VERIFIABLE_CORRECTNESS', `${input.factualClaims.length} claim(s) traced to primary sources.`);
  }
  builder.passIfClean('VERIFIABLE_CORRECTNESS');

  // --- PROVENANCE_RIGHTS ----------------------------------------------------
  if (input.sources.length === 0) {
    if (!input.originalWorkAttestation || input.originalWorkAttestation.trim().length < 20) {
      builder.fail('PROVENANCE_RIGHTS', 'No sources and no original-work attestation.');
    } else {
      builder.evidence('PROVENANCE_RIGHTS', `Original work: ${input.originalWorkAttestation}`);
    }
  }
  for (const source of input.sources) {
    if (!httpUrl(source.url) || !source.licence.trim() || !isoTimestamp(source.retrievedAt)) {
      builder.fail('PROVENANCE_RIGHTS', `Source "${source.title}" lacks a URL, licence, or retrieval timestamp.`);
    }
    if (!source.clearedForCommercialUse) {
      builder.fail('PROVENANCE_RIGHTS', `Source "${source.title}" is not cleared for commercial use.`);
    }
  }
  builder.passIfClean('PROVENANCE_RIGHTS');

  // --- FREE_ALTERNATIVE_IDENTIFIED -----------------------------------------
  const alternative = input.freeAlternative;
  if (!alternative) {
    builder.fail(
      'FREE_ALTERNATIVE_IDENTIFIED',
      'No free alternative was identified. "There is no free alternative" is a claim, not an omission.',
    );
  } else {
    if (!alternative.name.trim()) builder.fail('FREE_ALTERNATIVE_IDENTIFIED', 'The free alternative is unnamed.');
    if (!httpUrl(alternative.url)) builder.fail('FREE_ALTERNATIVE_IDENTIFIED', 'The free alternative has no URL.');
    if (!isoTimestamp(alternative.retrievedAt)) {
      builder.fail('FREE_ALTERNATIVE_IDENTIFIED', 'The free alternative has no retrieval timestamp.');
    }
    if (alternative.howObtainedFree.trim().length < 10) {
      builder.fail('FREE_ALTERNATIVE_IDENTIFIED', 'How the alternative is obtained free is not stated.');
    }
    if (alternative.substantiveOverlap === 'IDENTICAL') {
      builder.fail(
        'FREE_ALTERNATIVE_IDENTIFIED',
        `The artifact is substantively identical to the free "${alternative.name}"; there is nothing to sell.`,
      );
    }
    builder.evidence('FREE_ALTERNATIVE_IDENTIFIED', `${alternative.name} (${alternative.substantiveOverlap} overlap)`);
  }
  builder.passIfClean('FREE_ALTERNATIVE_IDENTIFIED');

  // --- PAID_ALTERNATIVE_COMPARISON ----------------------------------------
  if (input.paidAlternatives.length === 0) {
    builder.fail('PAID_ALTERNATIVE_COMPARISON', 'No relevant paid alternative was compared.');
  }
  for (const paid of input.paidAlternatives) {
    if (!paid.name.trim() || !httpUrl(paid.url) || !isoTimestamp(paid.retrievedAt)) {
      builder.fail('PAID_ALTERNATIVE_COMPARISON', 'A paid alternative lacks a name, URL, or retrieval timestamp.');
    }
    if (!Number.isInteger(paid.priceCents) || paid.priceCents <= 0 || !/^[A-Z]{3}$/.test(paid.currency)) {
      builder.fail('PAID_ALTERNATIVE_COMPARISON', `Paid alternative ${paid.name || '(unnamed)'} has an invalid price.`);
    }
    if (paid.concreteComparison.trim().length < 20) {
      builder.fail('PAID_ALTERNATIVE_COMPARISON', `Paid alternative ${paid.name || '(unnamed)'} lacks a concrete comparison.`);
    }
  }
  builder.passIfClean('PAID_ALTERNATIVE_COMPARISON');

  // --- DIFFERENTIATION_VS_ALTERNATIVE --------------------------------------
  const requiredClaims = alternative?.substantiveOverlap === 'SUBSTANTIAL' ? 2 : 1;
  if (input.differentiation.length < requiredClaims) {
    builder.fail(
      'DIFFERENTIATION_VS_ALTERNATIVE',
      `${requiredClaims} specific difference(s) required against ${alternative?.name ?? 'the free alternative'}; ` +
        `${input.differentiation.length} supplied.`,
    );
  }
  for (const claim of input.differentiation) {
    if (!claimIsSubstantive(claim.claim)) {
      builder.fail(
        'DIFFERENTIATION_VS_ALTERNATIVE',
        `Differentiation claim "${claim.claim}" asserts value without asserting a checkable difference.`,
      );
    }
    if (claim.verifiableBy.trim().length < 10) {
      builder.fail(
        'DIFFERENTIATION_VS_ALTERNATIVE',
        `Differentiation claim "${claim.claim}" states no way for a buyer to confirm it.`,
      );
    }
  }
  applyModelReview(builder, input, 'DIFFERENTIATION_VS_ALTERNATIVE', verifiedReviews, resolver.source);
  builder.passIfClean('DIFFERENTIATION_VS_ALTERNATIVE');

  // --- ACCURACY_INTERNAL_CONSISTENCY --------------------------------------
  if (input.accuracyChecks.length === 0) {
    builder.fail('ACCURACY_INTERNAL_CONSISTENCY', 'No accuracy/internal-consistency check was executed.');
  }
  for (const accuracy of input.accuracyChecks) {
    if (!accuracy.executed || !accuracy.passed || accuracy.evidence.length === 0) {
      builder.fail('ACCURACY_INTERNAL_CONSISTENCY', `Accuracy check ${accuracy.checkId} did not pass with evidence.`);
    }
  }
  applyModelReview(builder, input, 'ACCURACY_INTERNAL_CONSISTENCY', verifiedReviews, resolver.source);
  builder.passIfClean('ACCURACY_INTERNAL_CONSISTENCY');

  // --- USABILITY_COMPLETENESS ----------------------------------------------
  if (artifact.bytes.length < MINIMUM_USABLE_ARTIFACT_BYTES) {
    builder.fail(
      'USABILITY_COMPLETENESS',
      `Artifact is ${artifact.bytes.length} bytes, below the ${MINIMUM_USABLE_ARTIFACT_BYTES}-byte usability floor.`,
    );
  }
  if (!manifest.buyer.trim() || !manifest.problem.trim()) {
    builder.fail('USABILITY_COMPLETENESS', 'Usability cannot be assessed without a named buyer and problem.');
  }
  applyModelReview(builder, input, 'USABILITY_COMPLETENESS', verifiedReviews, resolver.source);
  builder.passIfClean('USABILITY_COMPLETENESS');

  // --- PRESENTATION / SLOP / PRICE ----------------------------------------
  applyModelReview(builder, input, 'PRESENTATION_BUYER_COMPREHENSION', verifiedReviews, resolver.source);
  builder.passIfClean('PRESENTATION_BUYER_COMPREHENSION');
  applyModelReview(builder, input, 'SLOP_REPETITION_HALLUCINATION', verifiedReviews, resolver.source);
  builder.passIfClean('SLOP_REPETITION_HALLUCINATION');
  if (input.priceJustification.trim().length < 40) {
    builder.fail('PRICE_VALUE_DEFENSIBILITY', 'Price justification is not substantive.');
  }
  applyModelReview(builder, input, 'PRICE_VALUE_DEFENSIBILITY', verifiedReviews, resolver.source);
  builder.passIfClean('PRICE_VALUE_DEFENSIBILITY');

  builder.applyEscalations();

  const criteria = builder.collect();
  const failures = criteria.flatMap((criterion) =>
    criterion.status === 'PASSED' ? [] : criterion.failures.length
      ? criterion.failures.map((reason) => `${criterion.id}: ${reason}`)
      : [`${criterion.id}: not assessed.`],
  );

  return {
    passed: failures.length === 0,
    checks: COMMERCIAL_VALUE_QA_CRITERIA.map((spec) => `${spec.id} — ${spec.requirement}`),
    failures,
    mode: 'COMMERCIAL',
    criteria,
  };
}

function applyModelReview(
  builder: CriterionBuilder,
  input: CommercialValueQaInput,
  criterionId: CommercialCriterionId,
  verifiedReviews: ReadonlySet<string>,
  resolverSource: string,
): void {
  const reviews = input.modelReviews.filter((review) => review.criterionId === criterionId);
  if (reviews.length === 0) {
    builder.fail(criterionId, 'No independent model review was recorded.');
    return;
  }
  for (const review of reviews) {
    if (!verifiedReviews.has(review.evidenceId)) {
      builder.fail(
        criterionId,
        `Model review ${review.evidenceId || '(missing ID)'} was not resolved against durable artifact-hashed evidence.`,
      );
      continue;
    }
    if (review.verdict !== 'PASS') {
      builder.fail(criterionId, `Model review returned ${review.verdict}: ${review.rationale}`);
      continue;
    }
    if (review.rationale.trim().length < MINIMUM_RATIONALE_CHARS) {
      builder.fail(criterionId, 'Model review passed without a substantive rationale.');
      continue;
    }
    if (!isoTimestamp(review.reviewedAt)) {
      builder.fail(criterionId, 'Model review has no valid timestamp.');
      continue;
    }
    if (
      review.reviewerProviderId === input.generatorIdentity.providerId &&
      review.reviewerModelId === input.generatorIdentity.modelId
    ) {
      builder.fail(
        criterionId,
        'The reviewing model is the generating model; a model may not mark its own work.',
      );
      continue;
    }
    builder.evidence(
      criterionId,
      `Durable evidence ${review.evidenceId} resolved by ${resolverSource}; reviewed by ` +
        `${review.reviewerProviderId}/${review.reviewerModelId}.`,
    );
  }
}

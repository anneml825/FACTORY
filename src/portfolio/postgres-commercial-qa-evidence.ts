import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import type {
  CommercialQaEvidenceResolver,
  ModelReviewRecord,
  OwnerExceptionRecord,
} from './commercial-value-qa.ts';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Resolves QA claims only against append-only PostgreSQL evidence rows. */
export class PostgresCommercialQaEvidenceResolver implements CommercialQaEvidenceResolver {
  readonly source = 'postgresql-append-only-value-qa-evidence';
  private readonly pool: Pool;

  constructor(pool: Pool) { this.pool = pool; }

  async verifyModelReview(record: ModelReviewRecord): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM value_qa_model_evidence
       WHERE evidence_id=$1 AND artifact_sha256=$2 AND criterion_id=$3
         AND reviewer_provider_id=$4 AND reviewer_model_id=$5 AND verdict=$6
         AND rationale_sha256=$7 AND reviewed_at=$8`,
      [
        record.evidenceId,
        record.artifactSha256,
        record.criterionId,
        record.reviewerProviderId,
        record.reviewerModelId,
        record.verdict,
        sha256(record.rationale),
        record.reviewedAt,
      ],
    );
    return (result.rowCount ?? 0) === 1;
  }

  async verifyOwnerException(record: OwnerExceptionRecord): Promise<boolean> {
    if (!/^\d+$/.test(record.ownerInterventionId)) return false;
    const result = await this.pool.query(
      `SELECT 1 FROM value_qa_owner_exception_evidence
       WHERE evidence_id=$1 AND artifact_sha256=$2 AND criterion_id=$3
         AND owner_intervention_id=$4 AND reason_sha256=$5 AND recorded_at=$6`,
      [
        record.evidenceId,
        record.artifactSha256,
        record.criterionId,
        record.ownerInterventionId,
        sha256(record.reason),
        record.recordedAt,
      ],
    );
    return (result.rowCount ?? 0) === 1;
  }
}

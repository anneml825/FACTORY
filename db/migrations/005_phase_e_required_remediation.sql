-- Phase E independent-review remediation: durable owner-labor attribution and
-- artifact-bound Value QA evidence. Additive only.
BEGIN;

CREATE TABLE IF NOT EXISTS owner_intervention_experiment (
    owner_intervention_id BIGINT NOT NULL REFERENCES owner_intervention (id),
    experiment_key        TEXT NOT NULL,
    PRIMARY KEY (owner_intervention_id, experiment_key)
);
CREATE INDEX IF NOT EXISTS owner_intervention_experiment_key_idx
    ON owner_intervention_experiment (experiment_key);

CREATE TABLE IF NOT EXISTS value_qa_model_evidence (
    evidence_id       TEXT PRIMARY KEY,
    artifact_sha256   TEXT NOT NULL CHECK (artifact_sha256 ~ '^[a-f0-9]{64}$'),
    criterion_id      TEXT NOT NULL,
    usage_id          TEXT NOT NULL REFERENCES inference_usage (usage_id),
    reviewer_provider_id TEXT NOT NULL,
    reviewer_model_id TEXT NOT NULL,
    verdict           TEXT NOT NULL CHECK (verdict IN ('PASS', 'FAIL')),
    rationale_sha256  TEXT NOT NULL CHECK (rationale_sha256 ~ '^[a-f0-9]{64}$'),
    reviewed_at       TIMESTAMPTZ NOT NULL,
    recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS value_qa_owner_exception_evidence (
    evidence_id          TEXT PRIMARY KEY,
    artifact_sha256      TEXT NOT NULL CHECK (artifact_sha256 ~ '^[a-f0-9]{64}$'),
    criterion_id         TEXT NOT NULL,
    owner_intervention_id BIGINT NOT NULL REFERENCES owner_intervention (id),
    reason_sha256        TEXT NOT NULL CHECK (reason_sha256 ~ '^[a-f0-9]{64}$'),
    recorded_at          TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION reject_phase_e_evidence_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Phase E evidence tables are append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_intervention_experiment_append_only ON owner_intervention_experiment;
CREATE TRIGGER owner_intervention_experiment_append_only
    BEFORE UPDATE OR DELETE ON owner_intervention_experiment
    FOR EACH ROW EXECUTE FUNCTION reject_phase_e_evidence_mutation();
DROP TRIGGER IF EXISTS value_qa_model_evidence_append_only ON value_qa_model_evidence;
CREATE TRIGGER value_qa_model_evidence_append_only
    BEFORE UPDATE OR DELETE ON value_qa_model_evidence
    FOR EACH ROW EXECUTE FUNCTION reject_phase_e_evidence_mutation();
DROP TRIGGER IF EXISTS value_qa_owner_exception_evidence_append_only ON value_qa_owner_exception_evidence;
CREATE TRIGGER value_qa_owner_exception_evidence_append_only
    BEFORE UPDATE OR DELETE ON value_qa_owner_exception_evidence
    FOR EACH ROW EXECUTE FUNCTION reject_phase_e_evidence_mutation();

COMMIT;

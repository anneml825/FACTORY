-- Migration 004 — Phase E: always-on commerce edge + micro-denominated inference
-- accounting.
--
-- Two things the cent-denominated ledger cannot express on its own:
--
--   1. Exact inference usage. A model call can cost a fraction of one cent.
--      `inference_usage` is the append-only sub-ledger of what actually
--      happened; `inference_tranche` records the whole-cent reservation that
--      covered a batch of those calls and the single aggregate settlement.
--
--   2. A buyer's right to the file they paid for. `delivery_grant` must survive
--      an edge restart, or a restart silently voids a completed purchase.

BEGIN;

CREATE TABLE IF NOT EXISTS inference_tranche (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tranche_id                  TEXT NOT NULL UNIQUE,
    bucket_name                 TEXT NOT NULL,
    reservation_idempotency_key TEXT NOT NULL UNIQUE,
    maximum_micros              BIGINT NOT NULL CHECK (maximum_micros > 0),
    reserved_cents              INTEGER NOT NULL CHECK (reserved_cents > 0),
    settled_cents               INTEGER CHECK (settled_cents >= 0),
    exact_micros                BIGINT CHECK (exact_micros >= 0),
    opened_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at                   TIMESTAMPTZ,
    -- Settlement rounds the AGGREGATE up, so it can never exceed the ceiling
    -- that was reserved. If it does, the reservation was wrong and must escalate.
    CONSTRAINT settlement_within_reservation
        CHECK (settled_cents IS NULL OR settled_cents <= reserved_cents),
    CONSTRAINT closed_tranche_is_settled
        CHECK (closed_at IS NULL OR (settled_cents IS NOT NULL AND exact_micros IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS inference_usage (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usage_id        TEXT NOT NULL UNIQUE,
    tranche_id      TEXT NOT NULL REFERENCES inference_tranche (tranche_id),
    experiment_key  TEXT NOT NULL,
    operation_id    TEXT NOT NULL,
    provider_id     TEXT NOT NULL,
    model_id        TEXT NOT NULL,
    task            TEXT NOT NULL,
    input_tokens    INTEGER NOT NULL CHECK (input_tokens >= 0),
    output_tokens   INTEGER NOT NULL CHECK (output_tokens >= 0),
    cost_micros     BIGINT NOT NULL CHECK (cost_micros >= 0),
    recorded_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS inference_usage_tranche_idx ON inference_usage (tranche_id);
CREATE INDEX IF NOT EXISTS inference_usage_experiment_idx ON inference_usage (experiment_key);

-- Append-only, for the same reason the ledger is: a cost that was incurred
-- cannot be un-incurred, and a rewritable usage journal cannot be reconciled
-- against a provider's own billing.
CREATE OR REPLACE FUNCTION reject_inference_usage_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'inference_usage is append-only (Phase E accounting repair).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inference_usage_append_only ON inference_usage;
CREATE TRIGGER inference_usage_append_only
    BEFORE UPDATE OR DELETE ON inference_usage
    FOR EACH ROW EXECUTE FUNCTION reject_inference_usage_mutation();

CREATE TABLE IF NOT EXISTS delivery_grant (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grant_id        TEXT NOT NULL UNIQUE,
    transaction_id  TEXT NOT NULL UNIQUE,
    experiment_key  TEXT NOT NULL,
    asset_key       TEXT NOT NULL,
    artifact_key    TEXT NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    max_downloads   INTEGER NOT NULL CHECK (max_downloads > 0),
    downloads       INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    CONSTRAINT downloads_within_limit CHECK (downloads <= max_downloads),
    CONSTRAINT grant_expires_after_issue CHECK (expires_at > issued_at)
);

-- The buyer returns from the payment provider holding a Checkout Session ID or
-- the reference the edge minted, never the PaymentIntent the grant is keyed on.
CREATE TABLE IF NOT EXISTS delivery_reference (
    reference       TEXT PRIMARY KEY,
    transaction_id  TEXT NOT NULL,
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_download (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grant_id        TEXT NOT NULL REFERENCES delivery_grant (grant_id),
    downloaded_at   TIMESTAMPTZ NOT NULL
);

COMMIT;

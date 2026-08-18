-- 003 — Phase C provider-neutral ARRIVE + crash-durable WATCH
-- Safe migration for databases created before the Phase C schema snapshot.

BEGIN;

ALTER TYPE owner_labor_kind ADD VALUE IF NOT EXISTS 'EXCEPTION';

CREATE TABLE IF NOT EXISTS arrival_publication (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    arrival_publication_key TEXT NOT NULL UNIQUE,
    experiment_key TEXT NOT NULL,
    asset_key TEXT NOT NULL,
    adapter_id TEXT NOT NULL,
    provider_object_id TEXT NOT NULL,
    location TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('FIXTURE', 'LIVE')),
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
    idempotency_key TEXT NOT NULL UNIQUE,
    request_fingerprint TEXT NOT NULL,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (adapter_id, provider_object_id),
    UNIQUE (experiment_key, adapter_id)
);

CREATE TABLE IF NOT EXISTS arrival_observation (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    arrival_publication_id BIGINT NOT NULL REFERENCES arrival_publication(id),
    provider_effect_key TEXT NOT NULL UNIQUE,
    metric TEXT NOT NULL CHECK (
        metric IN ('QUALIFIED_EXPOSURE', 'PRODUCT_VIEW', 'OFFER_INTERACTION')
    ),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    traffic_classification TEXT NOT NULL CHECK (
        traffic_classification IN ('OWNER_INTERNAL', 'STRANGER', 'OTHER_OR_UNKNOWN')
    ),
    observed_at TIMESTAMPTZ NOT NULL,
    measurement_source TEXT NOT NULL,
    semantics_note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_event_inbox (
    sequence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    experiment_key TEXT NOT NULL,
    asset_key TEXT NOT NULL,
    event_type TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('FIXTURE', 'PROVIDER_TEST', 'LIVE')),
    payload TEXT NOT NULL,
    signature TEXT NOT NULL,
    payload_sha256 CHAR(64) NOT NULL,
    effect_key TEXT UNIQUE,
    effect_fingerprint TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT watch_effect_pair CHECK (
        (effect_key IS NULL) = (effect_fingerprint IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS watch_event_experiment_idx
    ON watch_event_inbox (experiment_key, sequence);

CREATE TABLE IF NOT EXISTS stripe_webhook_inbox (
    event_id TEXT PRIMARY KEY,
    payload_sha256 CHAR(64) NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('RECEIVED', 'RETRYABLE_FAILURE', 'PROCESSED', 'REJECTED')
    ),
    attempts INTEGER NOT NULL CHECK (attempts > 0),
    last_error TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_transaction_reference (
    transaction_id TEXT PRIMARY KEY,
    checkout_session_id TEXT NOT NULL UNIQUE,
    payment_intent_id TEXT UNIQUE,
    experiment_key TEXT NOT NULL,
    asset_key TEXT NOT NULL,
    classification transaction_class NOT NULL CHECK (
        classification IN ('OWNER_TEST', 'INTERNAL_TEST')
    ),
    gross_cents BIGINT NOT NULL CHECK (gross_cents >= 0),
    currency CHAR(3) NOT NULL,
    arrival_publication_key TEXT CHECK (
        arrival_publication_key IS NULL OR
        arrival_publication_key ~ '^factory_arrive_[a-f0-9]{32}$'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_transaction_reference
    ADD COLUMN IF NOT EXISTS arrival_publication_key TEXT CHECK (
        arrival_publication_key IS NULL OR
        arrival_publication_key ~ '^factory_arrive_[a-f0-9]{32}$'
    );

CREATE OR REPLACE FUNCTION reject_watch_event_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'watch_event_inbox is append-only. Insert a new provider event or reconciliation effect.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS watch_event_no_update ON watch_event_inbox;
CREATE TRIGGER watch_event_no_update
    BEFORE UPDATE ON watch_event_inbox
    FOR EACH ROW EXECUTE FUNCTION reject_watch_event_mutation();

DROP TRIGGER IF EXISTS watch_event_no_delete ON watch_event_inbox;
CREATE TRIGGER watch_event_no_delete
    BEFORE DELETE ON watch_event_inbox
    FOR EACH ROW EXECUTE FUNCTION reject_watch_event_mutation();

COMMIT;

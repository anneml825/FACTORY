-- Cloudflare D1 (SQLite) schema for Factory's always-on commerce edge.
--
-- This is the SQLite counterpart of the PostgreSQL boundary in migrations 003
-- and 004. It is NOT a replacement: PostgreSQL remains the durable WATCH store
-- for anything running outside the edge. The edge needs its own copy because a
-- Worker cannot open a TCP connection to Postgres, and an isolate is evicted
-- between requests, so in-memory state would silently lose a paid-for download
-- or re-fulfil a processed webhook.
--
-- Verified constraint (docs/PHASE_E_CLOUDFLARE_VERIFICATION.md): D1 on the
-- Workers Free plan allows only 50 queries per Worker invocation. Every access
-- path here is written to stay far inside that — in particular the WATCH replay
-- is ONE query returning many rows, never one query per event.

-- --------------------------------------------------------------------------
-- Object storage. R2's stand-in while the fixture artifact is ~1 KB.
-- D1 Free caps a database at 500 MB, so this is explicitly fixture-only; real
-- artifacts belong in R2 behind the same ObjectStore port.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS edge_object (
    key         TEXT PRIMARY KEY,
    media_type  TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    sha256      TEXT NOT NULL,
    body_base64 TEXT NOT NULL
);

-- --------------------------------------------------------------------------
-- Append-only WATCH inbox. Mirrors watch_event_inbox.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watch_event_inbox (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id           TEXT NOT NULL UNIQUE,
    experiment_key     TEXT NOT NULL,
    asset_key          TEXT NOT NULL,
    event_type         TEXT NOT NULL,
    environment        TEXT NOT NULL,
    payload            TEXT NOT NULL,
    signature          TEXT NOT NULL,
    payload_sha256     TEXT NOT NULL,
    effect_key         TEXT,
    effect_fingerprint TEXT,
    received_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS watch_event_experiment_idx
    ON watch_event_inbox (experiment_key, id);

CREATE UNIQUE INDEX IF NOT EXISTS watch_event_effect_idx
    ON watch_event_inbox (effect_key) WHERE effect_key IS NOT NULL;

-- Append-only enforced by the database, not by convention, exactly as the
-- PostgreSQL trigger does.
CREATE TRIGGER IF NOT EXISTS watch_event_inbox_no_update
BEFORE UPDATE ON watch_event_inbox
BEGIN
    SELECT RAISE(ABORT, 'watch_event_inbox is append-only');
END;

CREATE TRIGGER IF NOT EXISTS watch_event_inbox_no_delete
BEFORE DELETE ON watch_event_inbox
BEGIN
    SELECT RAISE(ABORT, 'watch_event_inbox is append-only');
END;

-- --------------------------------------------------------------------------
-- Stripe webhook idempotency. Mirrors stripe_webhook_inbox.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_webhook_inbox (
    event_id       TEXT PRIMARY KEY,
    payload_sha256 TEXT NOT NULL,
    status         TEXT NOT NULL,
    attempts       INTEGER NOT NULL,
    last_error     TEXT,
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stripe_transaction_reference (
    transaction_id          TEXT PRIMARY KEY,
    checkout_session_id     TEXT NOT NULL,
    payment_intent_id       TEXT,
    experiment_key          TEXT NOT NULL,
    asset_key               TEXT NOT NULL,
    classification          TEXT NOT NULL,
    gross_cents             INTEGER NOT NULL CHECK (gross_cents >= 0),
    currency                TEXT NOT NULL,
    arrival_publication_key TEXT
);

CREATE INDEX IF NOT EXISTS stripe_transaction_session_idx
    ON stripe_transaction_reference (checkout_session_id);
CREATE INDEX IF NOT EXISTS stripe_transaction_intent_idx
    ON stripe_transaction_reference (payment_intent_id);

-- --------------------------------------------------------------------------
-- Delivery. A grant is a paid-for right; it must survive isolate eviction.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_grant (
    grant_id       TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE,
    experiment_key TEXT NOT NULL,
    asset_key      TEXT NOT NULL,
    artifact_key   TEXT NOT NULL,
    issued_at      TEXT NOT NULL,
    expires_at     TEXT NOT NULL,
    max_downloads  INTEGER NOT NULL CHECK (max_downloads > 0),
    downloads      INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    CONSTRAINT downloads_within_limit CHECK (downloads <= max_downloads)
);

CREATE TABLE IF NOT EXISTS delivery_reference (
    reference      TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    linked_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_download (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id      TEXT NOT NULL REFERENCES delivery_grant (grant_id),
    downloaded_at TEXT NOT NULL
);

-- --------------------------------------------------------------------------
-- Deployment identity. Stamped once, immutable afterwards.
--
-- This row is what makes FIXTURE and COMMERCIAL databases impossible to
-- confuse at the point of action rather than at the point of configuration.
-- Every destructive script re-reads it and refuses to act when the purpose is
-- not the one that script was written for, so pointing the fixture reset at
-- the commercial database fails instead of succeeding quietly.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS edge_deployment_identity (
    singleton      INTEGER PRIMARY KEY CHECK (singleton = 1),
    purpose        TEXT NOT NULL CHECK (purpose IN ('FIXTURE', 'COMMERCIAL')),
    database_label TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    stamped_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The purpose is the safety property, so the database refuses to change it.
CREATE TRIGGER IF NOT EXISTS edge_deployment_identity_purpose_immutable
BEFORE UPDATE ON edge_deployment_identity
WHEN NEW.purpose <> OLD.purpose
BEGIN
    SELECT RAISE(ABORT, 'edge deployment purpose is immutable');
END;

CREATE TRIGGER IF NOT EXISTS edge_deployment_identity_no_delete
BEFORE DELETE ON edge_deployment_identity
BEGIN
    SELECT RAISE(ABORT, 'edge deployment identity cannot be deleted');
END;

-- --------------------------------------------------------------------------
-- Commercial launch authorization. Append-only.
--
-- Serving a commercial listing needs two independent things to be true: the
-- COMMERCIAL_SERVING variable must be exactly "enabled", and a row must exist
-- here. Turning serving OFF needs only one of them to change, so the asymmetry
-- runs in the safe direction — launching is deliberate, stopping is immediate.
--
-- This records THAT launch was authorized and by whom. It deliberately says
-- nothing about what is being sold; product and channel are not this layer's
-- business.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commercial_launch_authorization (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    authorized_at TEXT NOT NULL DEFAULT (datetime('now')),
    authorized_by TEXT NOT NULL,
    scope_note    TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS commercial_launch_authorization_no_update
BEFORE UPDATE ON commercial_launch_authorization
BEGIN
    SELECT RAISE(ABORT, 'commercial_launch_authorization is append-only');
END;

CREATE TRIGGER IF NOT EXISTS commercial_launch_authorization_no_delete
BEFORE DELETE ON commercial_launch_authorization
BEGIN
    SELECT RAISE(ABORT, 'commercial_launch_authorization is append-only');
END;

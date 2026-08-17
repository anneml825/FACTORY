-- Factory — authoritative schema
-- PostgreSQL 15+
--
-- Design commitments (see ARCHITECTURE.md ADR-3):
--   * Money is BIGINT cents. Never floating point.
--   * The ledger is append-only, enforced by trigger. Corrections are compensating entries.
--   * Overdrawing a bucket is unrepresentable, enforced by CHECK.
--   * Idempotency is enforced by UNIQUE, not by remembering to check.
--   * Evidence without provenance cannot be inserted (all seven E1 fields NOT NULL).
--
-- The intent throughout: an agent that DECIDES to violate a financial or evidentiary rule
-- should still fail.

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE capital_source AS ENUM ('OWNER_CAPITAL', 'FACTORY_EARNINGS');

CREATE TYPE bucket_kind AS ENUM (
    'DISCOVERY',        -- research, data, screening
    'VALIDATION',       -- real experiments with real exposure
    'INFRASTRUCTURE',   -- unavoidable operating cost
    'RESERVE'           -- refund/chargeback reserve; not spendable
);

CREATE TYPE ledger_direction AS ENUM ('DEBIT', 'CREDIT');

CREATE TYPE ledger_event_kind AS ENUM (
    'OWNER_CAPITAL_CONTRIBUTED',
    'BUCKET_ALLOCATED',
    'SPEND_RESERVED',
    'SPEND_SETTLED',
    'RESERVATION_RELEASED',
    'REVENUE_BOOKED',
    'CASH_RECEIVED',
    'PROCESSOR_FEE',
    'REFUND',
    'CHARGEBACK',
    'RESERVE_WITHHELD',
    'RESERVE_RELEASED',
    'PAYOUT_RECEIVED',
    'OWNER_WITHDRAWAL',
    'CORRECTION'
);

CREATE TYPE reservation_state AS ENUM ('RESERVED', 'SETTLED', 'RELEASED', 'FAILED');

CREATE TYPE transaction_class AS ENUM (
    'OWNER_TEST',
    'INTERNAL_TEST',
    'ARM_LENGTH_CUSTOMER',
    'OTHER_OR_UNKNOWN'
);

CREATE TYPE evidence_grade AS ENUM ('E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6');

CREATE TYPE owner_labor_kind AS ENUM (
    'OPERATING',          -- running the business
    'MAINTENANCE_DEBUG',  -- keeping Factory alive; counts against autonomy after clock start
    'SETUP',              -- one-time; reported separately
    'APPROVAL'            -- decisions
);

CREATE TYPE experiment_state AS ENUM (
    'DESIGNED', 'GATED', 'APPROVED', 'LAUNCHED', 'RUNNING',
    'EVALUATED', 'KILLED', 'COMPLETED', 'BLOCKED'
);

CREATE TYPE funnel_stage AS ENUM (
    'QUALIFIED_EXPOSURES', 'VISITS', 'OFFER_INTERACTIONS',
    'CHECKOUT_STARTS', 'PURCHASES'
);

CREATE TYPE funnel_failure_class AS ENUM (
    'NO_DISTRIBUTION',
    'WEAK_CLICK_THROUGH',
    'WEAK_OFFER_ENGAGEMENT',
    'CHECKOUT_FRICTION',
    'WEAK_PURCHASE_CONVERSION',
    'FULFILLMENT_FAILURE',
    'NEGATIVE_UNIT_ECONOMICS',
    'INSUFFICIENT_EXPOSURE'   -- did not run; NOT a demand failure
);

CREATE TYPE gate_kind AS ENUM (
    'STRANGER_ARRIVAL', 'QUANTITATIVE_E1', 'DATA_ECONOMICS',
    'VALUE_QA', 'EXPERIMENT_STOP_LOSS', 'CAMPAIGN_STOP',
    'DAY_30_CHECKPOINT', 'DAY_90_STOP_LOSS', 'AUTONOMY_FAILURE',
    'CAPITAL_AUTHORITY'
);

CREATE TYPE gate_outcome AS ENUM ('PASS', 'FAIL', 'BLOCKED', 'OVERRIDDEN_BY_OWNER');

-- ============================================================================
-- GLOBAL SYSTEM STATE
-- ============================================================================

-- Kill switch and other global flags. Read inside the same transaction as any
-- reservation, so a paid operation cannot slip between the check and the commit.
CREATE TABLE system_flag (
    key             TEXT PRIMARY KEY,
    bool_value      BOOLEAN,
    int_value       BIGINT,
    text_value      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT NOT NULL,
    note            TEXT
);

INSERT INTO system_flag (key, bool_value, updated_by, note) VALUES
    ('PAID_ACTIVITY_HALTED', TRUE, 'bootstrap',
     'Global STOP ALL PAID ACTIVITY kill switch. Ships ENGAGED. Factory cannot spend until the owner explicitly disengages it.');

INSERT INTO system_flag (key, int_value, updated_by, note) VALUES
    ('MAX_OWNER_CAPITAL_AT_RISK_CENTS', 0, 'bootstrap',
     'Owner-configured ceiling. Ships at 0 — no capital is at risk until the owner sets it. Only the owner may raise this.'),
    ('OWNER_LABOR_BUDGET_MINUTES_PER_WEEK', 0, 'bootstrap',
     'Owner-configured. Ships at 0 pending owner decision.');

-- Heartbeat: makes scheduler death visible instead of silent (ARCHITECTURE.md ADR-2).
CREATE TABLE run_heartbeat (
    id                      SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_successful_run_at  TIMESTAMPTZ,
    last_run_job            TEXT,
    CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO run_heartbeat (id) VALUES (1);

-- ============================================================================
-- CAPITAL
-- ============================================================================

-- Non-transferable partitions of capital. There is deliberately no transfer
-- function anywhere in the codebase: an agent cannot call what does not exist.
CREATE TABLE capital_bucket (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                TEXT NOT NULL UNIQUE,
    kind                bucket_kind NOT NULL,
    source              capital_source NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    allocated_cents     BIGINT NOT NULL DEFAULT 0 CHECK (allocated_cents >= 0),
    spent_cents         BIGINT NOT NULL DEFAULT 0 CHECK (spent_cents >= 0),
    reserved_cents      BIGINT NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- The core solvency invariant: a bucket can never be overdrawn.
    CONSTRAINT bucket_not_overdrawn
        CHECK (spent_cents + reserved_cents <= allocated_cents)
);

-- Append-only. UPDATE and DELETE are rejected by trigger below.
CREATE TABLE ledger_entry (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_kind      ledger_event_kind NOT NULL,
    direction       ledger_direction NOT NULL,
    amount_cents    BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    source          capital_source,
    bucket_id       BIGINT REFERENCES capital_bucket(id),
    reservation_id  BIGINT,
    transaction_id  BIGINT,
    experiment_id   BIGINT,
    actor           TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    corrects_entry  BIGINT REFERENCES ledger_entry(id),
    memo            TEXT NOT NULL
);

CREATE INDEX ledger_entry_occurred_idx ON ledger_entry (occurred_at DESC);
CREATE INDEX ledger_entry_kind_idx     ON ledger_entry (event_kind);

CREATE OR REPLACE FUNCTION reject_ledger_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'ledger_entry is append-only (CONSTITUTION.md §8). Insert a compensating CORRECTION entry instead of modifying history.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entry_no_update
    BEFORE UPDATE ON ledger_entry
    FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();

CREATE TRIGGER ledger_entry_no_delete
    BEFORE DELETE ON ledger_entry
    FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();

-- RESERVE -> EXECUTE -> SETTLE. Unique idempotency key prevents double-spend on retry.
CREATE TABLE spend_reservation (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idempotency_key     TEXT NOT NULL UNIQUE,
    bucket_id           BIGINT NOT NULL REFERENCES capital_bucket(id),
    state               reservation_state NOT NULL DEFAULT 'RESERVED',
    max_amount_cents    BIGINT NOT NULL CHECK (max_amount_cents > 0),
    settled_amount_cents BIGINT CHECK (settled_amount_cents >= 0),
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    purpose             TEXT NOT NULL,
    experiment_id       BIGINT,
    external_ref        TEXT,
    reserved_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at          TIMESTAMPTZ,
    actor               TEXT NOT NULL,

    -- Actual cost may never exceed what was reserved.
    CONSTRAINT settled_within_reservation
        CHECK (settled_amount_cents IS NULL OR settled_amount_cents <= max_amount_cents),
    CONSTRAINT settled_state_consistency
        CHECK ((state = 'SETTLED') = (settled_amount_cents IS NOT NULL))
);

-- Recurring cost registry -> MONTHLY_FIXED_BURN / ANNUALIZED_FIXED_BURN.
CREATE TABLE recurring_cost (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_name        TEXT NOT NULL,
    category            TEXT NOT NULL,
    monthly_cents       BIGINT NOT NULL CHECK (monthly_cents >= 0),
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    metered_unit        TEXT,        -- for non-cash ceilings, e.g. CI minutes
    metered_limit       BIGINT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at            TIMESTAMPTZ,
    approved_by_owner   BOOLEAN NOT NULL DEFAULT FALSE,
    note                TEXT
);

-- ============================================================================
-- COMMERCE
-- ============================================================================

CREATE TABLE customer_transaction (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id             TEXT NOT NULL,
    provider                TEXT NOT NULL,
    classification          transaction_class NOT NULL,
    classification_reason   TEXT NOT NULL,
    gross_cents             BIGINT NOT NULL,
    fee_cents               BIGINT NOT NULL DEFAULT 0,
    net_cents               BIGINT NOT NULL,
    currency                CHAR(3) NOT NULL DEFAULT 'USD',
    occurred_at             TIMESTAMPTZ NOT NULL,
    cash_received_at        TIMESTAMPTZ,   -- NULL until settled; booked != received
    payout_received_at      TIMESTAMPTZ,   -- NULL until it clears the payout threshold
    refunded_at             TIMESTAMPTZ,
    charged_back_at         TIMESTAMPTZ,
    experiment_id           BIGINT,
    fulfilled_at            TIMESTAMPTZ,
    fulfillment_method      TEXT,

    UNIQUE (provider, external_id)
);

CREATE INDEX customer_transaction_class_idx ON customer_transaction (classification);

-- ============================================================================
-- OWNER LABOR
-- ============================================================================

CREATE TABLE owner_intervention (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    kind                    owner_labor_kind NOT NULL,
    description             TEXT NOT NULL,
    estimated_minutes       INTEGER CHECK (estimated_minutes >= 0),
    actual_minutes          INTEGER CHECK (actual_minutes >= 0),
    experiment_id           BIGINT,
    campaign_id             BIGINT,
    reason_human_required   TEXT NOT NULL,
    is_recurring            BOOLEAN NOT NULL DEFAULT FALSE,
    automatable             BOOLEAN,
    automation_note         TEXT,
    after_commercial_clock  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX owner_intervention_kind_idx ON owner_intervention (kind, occurred_at DESC);

-- ============================================================================
-- EXPERIMENTATION
-- ============================================================================

CREATE TABLE campaign (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                        TEXT NOT NULL UNIQUE,
    -- The locked variables (EXPERIMENTAL_PROTOCOL.md §4)
    distribution_surface        TEXT NOT NULL,
    product_family              TEXT NOT NULL,
    checkout_architecture       TEXT NOT NULL,
    pricing_pattern             TEXT NOT NULL,
    analytics_attribution       TEXT NOT NULL,
    target_attempts             INTEGER NOT NULL DEFAULT 30,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    started_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    stopped_at                  TIMESTAMPTZ,
    stop_reason                 TEXT
);

CREATE TABLE opportunity (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id             BIGINT REFERENCES campaign(id),
    target_customer         TEXT NOT NULL,
    problem                 TEXT NOT NULL,
    proposed_solution       TEXT NOT NULL,
    grade                   evidence_grade NOT NULL DEFAULT 'E0',
    monetization            TEXT,
    competition_note        TEXT,
    automation_potential    TEXT,
    expected_owner_minutes  INTEGER,
    gross_margin_note       TEXT,
    validation_cost_cents   BIGINT,
    ongoing_obligation_score INTEGER CHECK (ongoing_obligation_score BETWEEN 0 AND 100),
    economic_ceiling_note   TEXT,
    scaling_bottleneck      TEXT,
    capital_constrained     BOOLEAN NOT NULL DEFAULT FALSE,
    status                  TEXT NOT NULL DEFAULT 'OPEN',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The Stranger Arrival Mechanism. All six questions are NOT NULL: a mechanism
-- that cannot answer them cannot be recorded, so it cannot be launched.
CREATE TABLE stranger_arrival_mechanism (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opportunity_id          BIGINT REFERENCES opportunity(id),
    who_is_the_stranger     TEXT NOT NULL,
    where_are_they          TEXT NOT NULL,
    exact_surface           TEXT NOT NULL,
    why_factory_can_appear  TEXT NOT NULL,
    usage_evidence_id       BIGINT NOT NULL,   -- FK to evidence_signal; a NUMBER, not a claim
    measurement_method      TEXT NOT NULL,
    measurement_verified_at TIMESTAMPTZ,       -- NULL = instrument not yet proven to record
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quantitative E1 signals. All seven mandatory fields NOT NULL, so a
-- model-invented number (no source, no retrieval timestamp) cannot be inserted.
-- EXPERIMENTAL_PROTOCOL.md §2 enforced by schema rather than by discipline.
CREATE TABLE evidence_signal (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opportunity_id              BIGINT REFERENCES opportunity(id),
    metric_name                 TEXT NOT NULL,
    numeric_value               NUMERIC NOT NULL,
    unit                        TEXT NOT NULL,
    source                      TEXT NOT NULL,
    retrieved_at                TIMESTAMPTZ NOT NULL,
    collection_method           TEXT NOT NULL,
    reliability_limitations     TEXT NOT NULL,
    raw_response_ref            TEXT,     -- preserved raw evidence (Master Codex §25)
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evidence_signal_opportunity_idx ON evidence_signal (opportunity_id);

ALTER TABLE stranger_arrival_mechanism
    ADD CONSTRAINT sam_usage_evidence_fk
    FOREIGN KEY (usage_evidence_id) REFERENCES evidence_signal(id);

CREATE TABLE experiment (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id                 BIGINT NOT NULL REFERENCES campaign(id),
    opportunity_id              BIGINT NOT NULL REFERENCES opportunity(id),
    arrival_mechanism_id        BIGINT NOT NULL REFERENCES stranger_arrival_mechanism(id),
    hypothesis                  TEXT NOT NULL,
    offer_description           TEXT NOT NULL,
    price_cents                 BIGINT NOT NULL CHECK (price_cents >= 0),
    state                       experiment_state NOT NULL DEFAULT 'DESIGNED',

    -- Stop-loss parameters: all required BEFORE launch (Master Codex §28)
    max_spend_cents             BIGINT NOT NULL CHECK (max_spend_cents >= 0),
    max_duration_days           INTEGER NOT NULL CHECK (max_duration_days > 0),
    min_meaningful_denominator  INTEGER NOT NULL CHECK (min_meaningful_denominator > 0),
    success_threshold           TEXT NOT NULL,
    failure_threshold           TEXT NOT NULL,
    kill_condition              TEXT NOT NULL,
    evaluation_date             DATE NOT NULL,
    expected_information_gain   TEXT NOT NULL,
    estimated_owner_minutes     INTEGER NOT NULL,

    grade_before_launch         evidence_grade NOT NULL,
    fulfillment_mechanism       TEXT NOT NULL,
    launched_at                 TIMESTAMPTZ,
    evaluated_at                TIMESTAMPTZ,
    failure_class               funnel_failure_class,
    outcome_note                TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE experiment_state_change (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    experiment_id   BIGINT NOT NULL REFERENCES experiment(id),
    from_state      experiment_state,
    to_state        experiment_state NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor           TEXT NOT NULL,
    reason          TEXT NOT NULL
);

-- Denominators. Without these, an E2+ conclusion is not admissible.
CREATE TABLE funnel_observation (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    experiment_id   BIGINT NOT NULL REFERENCES experiment(id),
    stage           funnel_stage NOT NULL,
    count           BIGINT NOT NULL CHECK (count >= 0),
    observed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    measurement_source TEXT NOT NULL,
    is_estimate     BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE (experiment_id, stage, observed_at)
);

CREATE TABLE value_qa_review (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    experiment_id               BIGINT NOT NULL REFERENCES experiment(id),
    fulfills_promise            BOOLEAN NOT NULL,
    free_alternatives           TEXT NOT NULL,
    paid_alternatives           TEXT NOT NULL,
    concrete_differentiation    TEXT NOT NULL,
    accuracy_note               TEXT NOT NULL,
    usability_note              TEXT NOT NULL,
    slop_check_note             TEXT NOT NULL,
    price_justification         TEXT NOT NULL,
    claims_supported            BOOLEAN NOT NULL,
    passed                      BOOLEAN NOT NULL,
    reviewed_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewer                    TEXT NOT NULL
);

-- ============================================================================
-- DATA ECONOMICS GATE
-- ============================================================================

CREATE TABLE data_source_probe (
    id                              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_provider                 TEXT NOT NULL,
    signal_type                     TEXT NOT NULL,
    coverage_note                   TEXT NOT NULL,
    queryability_note               TEXT NOT NULL,
    cost_per_query_micros           BIGINT NOT NULL CHECK (cost_per_query_micros >= 0),
    effective_cost_per_candidate_micros BIGINT CHECK (effective_cost_per_candidate_micros >= 0),
    rate_limit_note                 TEXT NOT NULL,
    reliability_limitations         TEXT NOT NULL,
    freshness_note                  TEXT NOT NULL,
    automation_terms_constraints    TEXT NOT NULL,

    -- The binding term: measured, not projected.
    candidates_attempted            INTEGER NOT NULL CHECK (candidates_attempted >= 0),
    candidates_with_usable_e1       INTEGER NOT NULL CHECK (candidates_with_usable_e1 >= 0),

    screening_capacity_at_1_usd     INTEGER,
    screening_capacity_at_5_usd     INTEGER,
    screening_capacity_at_10_usd    INTEGER,

    minimum_deposit_cents           BIGINT NOT NULL DEFAULT 0,
    probed_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
    note                            TEXT,

    CONSTRAINT usable_not_exceeding_attempted
        CHECK (candidates_with_usable_e1 <= candidates_attempted)
);

-- ============================================================================
-- CLOCKS AND GATES
-- ============================================================================

-- Single row. Set once. Never retroactively adjusted to flatter a checkpoint.
CREATE TABLE commercial_clock (
    id                              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    started_at                      TIMESTAMPTZ,
    financial_control_plane_ok      BOOLEAN NOT NULL DEFAULT FALSE,
    money_spine_ok                  BOOLEAN NOT NULL DEFAULT FALSE,
    campaign_ok                     BOOLEAN NOT NULL DEFAULT FALSE,
    arrival_mechanism_ok            BOOLEAN NOT NULL DEFAULT FALSE,
    measurement_attribution_ok      BOOLEAN NOT NULL DEFAULT FALSE,
    autonomous_launch_ok            BOOLEAN NOT NULL DEFAULT FALSE,
    automated_fulfillment_ok        BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_note                   TEXT,

    -- The clock cannot start unless every condition is genuinely true.
    CONSTRAINT clock_requires_all_conditions CHECK (
        started_at IS NULL OR (
            financial_control_plane_ok AND money_spine_ok AND campaign_ok
            AND arrival_mechanism_ok AND measurement_attribution_ok
            AND autonomous_launch_ok AND automated_fulfillment_ok
        )
    )
);
INSERT INTO commercial_clock (id) VALUES (1);

-- Every gate evaluation, including passes. An absent gate_event means the gate
-- was never run, which is itself a finding.
CREATE TABLE gate_event (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind            gate_kind NOT NULL,
    outcome         gate_outcome NOT NULL,
    experiment_id   BIGINT REFERENCES experiment(id),
    campaign_id     BIGINT REFERENCES campaign(id),
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor           TEXT NOT NULL,
    rationale       TEXT NOT NULL,
    owner_override_reason TEXT,

    CONSTRAINT override_requires_reason
        CHECK (outcome <> 'OVERRIDDEN_BY_OWNER' OR owner_override_reason IS NOT NULL)
);

COMMIT;

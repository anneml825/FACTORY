-- 001 — Owner configuration
--
-- Records owner decisions of 2026-08-17. These values are constitutional
-- parameters: only the owner may change them (CONSTITUTION.md §3, §8).
--
-- Applied against a live database only after the owner provisions one.

BEGIN;

-- ---------------------------------------------------------------------------
-- Capital authorization: $50.00 total lifetime exposure. Not monthly.
-- ---------------------------------------------------------------------------
UPDATE system_flag
   SET int_value = 5000,
       updated_by = 'owner',
       updated_at = now(),
       note = 'Owner-authorized 2026-08-17: $50.00 maximum lifetime owner capital at risk. '
              'Factory may never raise this (CONSTITUTION.md §3). Factory-generated earnings '
              'may increase deployable cash without increasing this ceiling.'
 WHERE key = 'MAX_OWNER_CAPITAL_AT_RISK_CENTS';

-- ---------------------------------------------------------------------------
-- Owner labor budget: 120 min/week authorized ceiling; 30 min/week target.
--
-- The owner authorized 2 hours/week. Master Codex §8 describes the mature target
-- as "brief checking and occasional approvals, not hours of weekly execution",
-- so two lines are tracked rather than one:
--
--   BUDGET (120) — the hard gate. Exceeding it for two consecutive weeks
--                  triggers a mandatory AUTONOMY FAILURE REVIEW regardless of
--                  revenue (EXPERIMENTAL_PROTOCOL.md §12).
--   TARGET  (30) — the mission line. The dashboard warns above it so drift is
--                  visible early rather than only at the ceiling, by which point
--                  Factory would already be consuming ~100 owner-hours a year.
--
-- The target is advisory and triggers no gate. Only the budget gates.
-- ---------------------------------------------------------------------------
UPDATE system_flag
   SET int_value = 120,
       updated_by = 'owner',
       updated_at = now(),
       note = 'Owner-authorized 2026-08-17: 120 min/week ceiling for operating + '
              'maintenance/debug labor after COMMERCIAL_CLOCK_START. Two consecutive '
              'weeks above this triggers an AUTONOMY FAILURE REVIEW.'
 WHERE key = 'OWNER_LABOR_BUDGET_MINUTES_PER_WEEK';

INSERT INTO system_flag (key, int_value, updated_by, note) VALUES
    ('OWNER_LABOR_TARGET_MINUTES_PER_WEEK', 30, 'factory',
     'Advisory mission target (Master Codex §8). Dashboard warns above this. Gates nothing.'),
    ('OWNER_APPROVAL_BUDGET_MINUTES_PER_MONTH', 60, 'owner',
     'Owner-authorized 2026-08-17. Approvals are batched, never daily.');

-- ---------------------------------------------------------------------------
-- Tax residence: United States.
-- All surveyed merchants of record support US individual sellers with ACH
-- payout and accept sellers with no business entity (INTEGRATIONS.md).
-- Raises HUMAN_SETUP_REQUIRED: TAX / ACCOUNTING on first arm's-length revenue.
-- ---------------------------------------------------------------------------
INSERT INTO system_flag (key, text_value, updated_by, note) VALUES
    ('OWNER_TAX_RESIDENCE', 'US', 'owner',
     'Owner-stated 2026-08-17. Country only — no identifying or financial detail is stored. '
     'A merchant of record remits sales tax/VAT; income tax remains the owner''s obligation.');

-- ---------------------------------------------------------------------------
-- Protected buckets. $50.00 partitioned so discovery cannot consume the money
-- reserved for real validation (CONSTITUTION.md §7).
--
-- Validation is weighted heaviest because underfunded experiments are
-- uninformative rather than cheap (EXPERIMENTAL_PROTOCOL.md §5).
--
-- RESERVE starts at zero: the refund/chargeback reserve is funded from REVENUE,
-- never from owner capital.
--
-- There is deliberately no transfer path between these buckets.
-- ---------------------------------------------------------------------------
INSERT INTO capital_bucket (name, kind, source, allocated_cents) VALUES
    ('validation',     'VALIDATION',     'OWNER_CAPITAL', 3000),
    ('discovery',      'DISCOVERY',      'OWNER_CAPITAL', 1000),
    ('infrastructure', 'INFRASTRUCTURE', 'OWNER_CAPITAL', 1000),
    ('reserve',        'RESERVE',        'FACTORY_EARNINGS', 0);

INSERT INTO ledger_entry (event_kind, direction, amount_cents, source, actor, idempotency_key, memo)
VALUES ('OWNER_CAPITAL_CONTRIBUTED', 'CREDIT', 5000, 'OWNER_CAPITAL', 'owner',
        'owner-capital-authorization-2026-08-17',
        'Owner authorized $50.00 maximum lifetime exposure on 2026-08-17.');

INSERT INTO ledger_entry (event_kind, direction, amount_cents, source, bucket_id, actor, idempotency_key, memo)
SELECT 'BUCKET_ALLOCATED', 'DEBIT', b.allocated_cents, b.source, b.id, 'owner',
       'bucket-alloc-2026-08-17-' || b.name,
       'Initial allocation to ' || b.name || ' bucket.'
  FROM capital_bucket b
 WHERE b.allocated_cents > 0;

-- ---------------------------------------------------------------------------
-- The kill switch REMAINS ENGAGED.
--
-- Authorizing capital is not the same as permitting spend. Nothing exists yet
-- that could usefully spend money: there is no money spine, no Campaign, and no
-- verified Stranger Arrival Mechanism. The switch is disengaged by the owner when
-- Factory is actually ready to transact, not when capital is allocated.
-- ---------------------------------------------------------------------------

COMMIT;

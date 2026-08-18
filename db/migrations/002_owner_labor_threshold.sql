-- 002 — Owner labor threshold revision
--
-- Owner decision, 2026-08-18. Supersedes the labor-budget values in 001.
-- Migrations are append-only once committed; 001 is left as the historical record
-- of what was authorized on 2026-08-17.
--
-- Two changes:
--   1. Hard autonomy-review threshold: 120 -> 60 minutes/week.
--   2. Review semantics: a SINGLE week above threshold triggers a review.
--      Previously two consecutive weeks were required.
--
-- The owner's framing, which governs how the review is written and read:
--   "A single anomalous week should trigger review rather than automatic
--    termination; recurring or structural owner labor above the threshold is
--    the concern."
--
-- So the trigger is deliberately sensitive and the CONSEQUENCE is deliberately
-- mild. A review is a diagnosis, not a verdict. Its job is to distinguish an
-- anomalous week from a structural burden — pausing or terminating is one
-- possible OUTCOME of that review, never an automatic result of crossing the
-- line. Triggering on one week means a structural problem is caught in its first
-- week rather than its third.
--
-- The 30 min/week advisory target is retained unchanged. It gates nothing.

BEGIN;

UPDATE system_flag
   SET int_value = 60,
       updated_by = 'owner',
       updated_at = now(),
       note = 'Owner-revised 2026-08-18 (was 120). Hard threshold for operating + '
              'maintenance/debug labor after COMMERCIAL_CLOCK_START. A single week above '
              'this triggers an AUTONOMY FAILURE REVIEW — a diagnosis, not a termination. '
              'The review determines whether the burden is anomalous or structural.'
 WHERE key = 'OWNER_LABOR_BUDGET_MINUTES_PER_WEEK';

-- Retained from 001, unchanged, stated explicitly so this migration is
-- self-describing: advisory mission target, gates nothing.
UPDATE system_flag
   SET note = 'Advisory mission target (Master Codex §8). Dashboard warns above this. '
              'Gates nothing. Retained unchanged by owner decision 2026-08-18.'
 WHERE key = 'OWNER_LABOR_TARGET_MINUTES_PER_WEEK';

INSERT INTO system_flag (key, int_value, updated_by, note) VALUES
    ('AUTONOMY_REVIEW_CONSECUTIVE_WEEKS_REQUIRED', 1, 'owner',
     'Owner-set 2026-08-18. Weeks above threshold needed to trigger an AUTONOMY FAILURE '
     'REVIEW. 1 = a single anomalous week triggers review. Sensitive trigger, mild '
     'consequence: the review classifies the burden, it does not terminate anything.');

COMMIT;

-- Verification that CONSTITUTION.md's financial protections are enforced by the
-- database, not by agent discipline. Each block must FAIL for the schema to be correct.

\set ON_ERROR_STOP off

-- Seed
INSERT INTO capital_bucket (name, kind, source, allocated_cents)
VALUES ('discovery', 'DISCOVERY', 'OWNER_CAPITAL', 1000);

INSERT INTO ledger_entry (event_kind, direction, amount_cents, actor, memo)
VALUES ('OWNER_CAPITAL_CONTRIBUTED', 'CREDIT', 5000, 'test', 'seed');

\echo '--- T1: ledger UPDATE must be rejected (append-only) ---'
UPDATE ledger_entry SET amount_cents = 999999 WHERE id = 1;

\echo '--- T2: ledger DELETE must be rejected (append-only) ---'
DELETE FROM ledger_entry WHERE id = 1;

\echo '--- T3: bucket overdraw must be rejected ---'
UPDATE capital_bucket SET spent_cents = 1001 WHERE name = 'discovery';

\echo '--- T4: reserved + spent exceeding allocation must be rejected ---'
UPDATE capital_bucket SET spent_cents = 600, reserved_cents = 500 WHERE name = 'discovery';

\echo '--- T5: duplicate idempotency key must be rejected (no double-spend on retry) ---'
INSERT INTO spend_reservation (idempotency_key, bucket_id, max_amount_cents, purpose, actor)
VALUES ('key-abc', 1, 100, 'probe', 'test');
INSERT INTO spend_reservation (idempotency_key, bucket_id, max_amount_cents, purpose, actor)
VALUES ('key-abc', 1, 100, 'probe retry', 'test');

\echo '--- T6: settling above the reserved maximum must be rejected ---'
UPDATE spend_reservation SET state='SETTLED', settled_amount_cents = 500 WHERE idempotency_key='key-abc';

\echo '--- T7: evidence without provenance must be rejected (model-invented number) ---'
INSERT INTO evidence_signal (metric_name, numeric_value, unit, source, retrieved_at, collection_method, reliability_limitations)
VALUES ('monthly_search_volume', 12000, 'searches/mo', NULL, NULL, NULL, NULL);

\echo '--- T8: commercial clock must not start with unmet conditions ---'
UPDATE commercial_clock SET started_at = now() WHERE id = 1;

\echo '--- T9: owner override without a stated reason must be rejected ---'
INSERT INTO gate_event (kind, outcome, actor, rationale)
VALUES ('DAY_90_STOP_LOSS', 'OVERRIDDEN_BY_OWNER', 'owner', 'continuing');

\echo '--- T10: valid operations must SUCCEED ---'
INSERT INTO evidence_signal (metric_name, numeric_value, unit, source, retrieved_at, collection_method, reliability_limitations)
VALUES ('etsy_listing_count', 1843, 'listings', 'Etsy Open API v3 /listings/active', now(), 'GET, keyword=x', 'Reflects listings, not sales');

UPDATE spend_reservation SET state='SETTLED', settled_amount_cents = 80 WHERE idempotency_key='key-abc';

\echo '--- T11: clock CAN start once every condition is genuinely true ---'
UPDATE commercial_clock SET
  financial_control_plane_ok=TRUE, money_spine_ok=TRUE, campaign_ok=TRUE,
  arrival_mechanism_ok=TRUE, measurement_attribution_ok=TRUE,
  autonomous_launch_ok=TRUE, automated_fulfillment_ok=TRUE,
  started_at=now()
WHERE id=1;

\echo '--- T12: explicit EXCEPTION owner labor can be recorded separately ---'
INSERT INTO owner_intervention
  (kind, description, actual_minutes, reason_human_required, is_recurring, automatable)
VALUES
  ('EXCEPTION', 'provider KYC exception', 7, 'provider required owner identity action', FALSE, FALSE);

\echo '--- T13: durable WATCH event log must reject mutation ---'
INSERT INTO watch_event_inbox
  (event_id, experiment_key, asset_key, event_type, environment, payload,
   signature, payload_sha256)
VALUES
  ('db-watch-event', 'db-experiment', 'db-asset', 'QUALIFIED_EXPOSURE', 'FIXTURE',
   '{}', 'fixture-signature', repeat('0', 64));
UPDATE watch_event_inbox SET event_type='PRODUCT_VIEW' WHERE event_id='db-watch-event';

\echo '--- RESULTS ---'
SELECT 'kill switch ships engaged: ' || bool_value FROM system_flag WHERE key='PAID_ACTIVITY_HALTED';
SELECT 'owner capital ceiling ships at: ' || int_value || ' cents' FROM system_flag WHERE key='MAX_OWNER_CAPITAL_AT_RISK_CENTS';
SELECT 'ledger rows (must be 1, unmodified, amount 5000): ' || count(*) || ' amount=' || max(amount_cents) FROM ledger_entry;
SELECT 'evidence rows (must be 1 — the provenanced one): ' || count(*) FROM evidence_signal;
SELECT 'reservation settled at: ' || settled_amount_cents FROM spend_reservation;
SELECT 'clock started: ' || (started_at IS NOT NULL) FROM commercial_clock;
SELECT 'exception labor rows (must be 1): ' || count(*) FROM owner_intervention WHERE kind='EXCEPTION';
SELECT 'watch event type (must remain QUALIFIED_EXPOSURE): ' || event_type FROM watch_event_inbox WHERE event_id='db-watch-event';

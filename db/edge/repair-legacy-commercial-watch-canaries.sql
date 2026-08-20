-- Run only through repair-legacy-commercial-watch-canaries.ts after its exact
-- commercial/no-commerce/all-legacy preconditions pass.
DROP TRIGGER watch_event_inbox_no_update;
DROP TRIGGER watch_event_inbox_no_delete;

DELETE FROM watch_event_inbox
WHERE event_id LIKE 'deploy-proof-%'
  AND experiment_key = 'deployment-proof'
  AND asset_key = 'deployment-proof'
  AND event_type = 'DEPLOYMENT_PROOF'
  AND environment = 'PROVIDER_TEST'
  AND payload = '{}'
  AND signature = 'n/a'
  AND payload_sha256 = 'n/a'
  AND effect_key IS NULL
  AND effect_fingerprint IS NULL;

CREATE TRIGGER watch_event_inbox_no_update
BEFORE UPDATE ON watch_event_inbox
BEGIN
    SELECT RAISE(ABORT, 'watch_event_inbox is append-only');
END;

CREATE TRIGGER watch_event_inbox_no_delete
BEFORE DELETE ON watch_event_inbox
BEGIN
    SELECT RAISE(ABORT, 'watch_event_inbox is append-only');
END;

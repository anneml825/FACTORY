-- Reset the FIXTURE edge database.
--
-- Fixture-only, and deliberately destructive. Each external proof run generates
-- fresh WATCH/delivery/internal secrets machine-side, and the WATCH journal is
-- HMAC-signed with the secret that was current when each event was written. A
-- new signing secret therefore cannot verify an older journal: D1WatchStore
-- refuses to open, and the Worker fails closed with 503 on every route. That is
-- the append-only journal behaving correctly, not a bug in the edge.
--
-- So a proof that rotates secrets must also start from an empty journal. This
-- file does that.
--
-- It must only ever be run through src/edge/deploy/reset-fixture-db.ts, which
-- refuses to run unless the target is the fixture target AND the database is
-- stamped FIXTURE. No workflow invokes this file directly. Commercial
-- deployments never regenerate their signing secrets, so they never need it.

DROP TRIGGER IF EXISTS watch_event_inbox_no_update;
DROP TRIGGER IF EXISTS watch_event_inbox_no_delete;
DROP TABLE IF EXISTS delivery_download;
DROP TABLE IF EXISTS delivery_reference;
DROP TABLE IF EXISTS delivery_grant;
DROP TABLE IF EXISTS stripe_transaction_reference;
DROP TABLE IF EXISTS stripe_webhook_inbox;
DROP TABLE IF EXISTS watch_event_inbox;
DROP TABLE IF EXISTS edge_object;
DROP TRIGGER IF EXISTS edge_deploy_canary_no_update;
DROP TRIGGER IF EXISTS edge_deploy_canary_no_delete;
DROP TABLE IF EXISTS edge_deploy_canary;
DROP TRIGGER IF EXISTS commercial_launch_revocation_no_update;
DROP TRIGGER IF EXISTS commercial_launch_revocation_no_delete;
DROP TABLE IF EXISTS commercial_launch_revocation;
DROP TRIGGER IF EXISTS commercial_launch_grant_no_update;
DROP TRIGGER IF EXISTS commercial_launch_grant_no_delete;
DROP TABLE IF EXISTS commercial_launch_grant;
DROP TRIGGER IF EXISTS commercial_launch_authorization_no_update;
DROP TRIGGER IF EXISTS commercial_launch_authorization_no_delete;
DROP TABLE IF EXISTS commercial_launch_authorization;

-- edge_deployment_identity is deliberately NOT dropped. It is what proves this
-- database is the fixture one, and a reset that erased its own permission slip
-- would leave the next run unable to tell the two databases apart.

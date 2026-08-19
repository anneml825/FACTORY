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
-- file does that, and nothing else in Factory may run it: production rotation
-- needs a key-id-tagged journal that can verify events under a retired key, and
-- that work is recorded as deferred debt in docs/PHASE_E_EXTERNAL_PROOF.md.

DROP TRIGGER IF EXISTS watch_event_inbox_no_update;
DROP TRIGGER IF EXISTS watch_event_inbox_no_delete;
DROP TABLE IF EXISTS delivery_download;
DROP TABLE IF EXISTS delivery_reference;
DROP TABLE IF EXISTS delivery_grant;
DROP TABLE IF EXISTS stripe_transaction_reference;
DROP TABLE IF EXISTS stripe_webhook_inbox;
DROP TABLE IF EXISTS watch_event_inbox;
DROP TABLE IF EXISTS edge_object;

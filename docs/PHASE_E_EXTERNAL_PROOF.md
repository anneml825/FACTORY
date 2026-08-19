# Phase E — external proof of the fixture commerce edge

Status: **proven externally.** GitHub Actions run
[`32291422138`](https://github.com/anneml825/FACTORY/actions/runs/32291422138),
job `96192875771`, commit `ed9455f`, 2026-08-19T19:09:14Z–19:10:27Z.

This records what a live Cloudflare Worker and a live Stripe sandbox actually
did, not what the Node tests simulate. Nothing here is commercial: the listing
is the noncommercial fixture, `COMMERCIAL_SERVING` was deployed as `disabled`,
the Stripe key is a sandbox key, and every transaction is permanently
classified `OWNER_TEST`.

## What is deployed, and where

| Thing | Value |
| --- | --- |
| Cloudflare account | Free plan, no card on file |
| Worker | `factory-edge` |
| Public URL | `https://factory-edge.whoknowsbruno15.workers.dev` |
| D1 database | `factory-edge`, id `3fa6df57-8c13-4bd1-af87-756a089049b0` |
| Secrets | `STRIPE_WEBHOOK_SECRET`, `WATCH_EVENT_SECRET`, `EDGE_DELIVERY_SECRET`, `EDGE_INTERNAL_TRAFFIC_TOKEN` — all machine-generated in the runner, masked in the log, never seen by the owner |
| Vars | `COMMERCIAL_SERVING=disabled`, `MAX_DOWNLOADS_PER_GRANT=2`, `FIXTURE_CHECKOUT_URL`, `FIXTURE_ARRIVE_REFERENCE` |

## The 14 external checks

Every request below crossed the public internet from a GitHub-hosted runner.
The webhook was created *and signed and delivered by Stripe*, not self-signed:
the run drives `stripe trigger checkout.session.completed` with Factory's
attribution metadata as overrides, so Stripe builds a real test-mode Checkout
Session and posts the event to the Worker itself.

| # | Check | Observed |
| --- | --- | --- |
| 1 | edge is reachable on the public internet | `GET /healthz -> 200` |
| 2 | fixture product page is served | `GET /p/phase-a-doc-001 -> 200`, 822 bytes, noncommercial banner present |
| 3 | visitor cookie is issued for first-party measurement | `set-cookie -> fv=5a9c593f-…` |
| 4 | offer-interaction beacon is recorded | `POST /e -> 202` |
| 5 | owner-internal request is served but classified separately | `GET /p (internal) -> 200` |
| 6 | buy click redirects to Stripe carrying the ARRIVE reference | `302`, `client_reference_id=factory_arrive_fff4837c018ff75971068e23aeb7a00e` |
| 7 | Stripe accepted Factory's metadata overrides | `Trigger succeeded` |
| 8 | Stripe created a completed Checkout Session | `cs_test_a1YT5BIkiCpm7JkN1wxm26EKCDxZGDxuydD0XoTgFhLCgUQPlJZMacYSFI`, `experiment_id=phase-a-doc-001`, `client_reference_id` propagated |
| 9 | webhook fulfillment produced a signed download grant | `GET /thanks -> 200`, signed link issued |
| 10 | signed download returns the exact fixture artifact | `GET /d -> 200`, 671 bytes, sha256 match |
| 11 | download limit is enforced by the edge | repeat downloads `200, 410, 410, 410, 410` |
| 12 | a tampered delivery token is refused | `GET /d -> 403` |
| 13 | Stripe redelivered the same event for the idempotency check | `resent evt_1U6Es90pEa3CWQlPWqIWqEuA` |
| 14 | an unknown listing is a 404 | `GET /p/not-a-real-experiment -> 404` |

**14/14 passed.**

## Durable state, read back out of production D1

```
watch_event_inbox    CHECKOUT_COMPLETED 1 · CHECKOUT_STARTED 1 · FULFILLMENT_SUCCEEDED 1
                     OFFER_INTERACTION 1 · PRODUCT_VIEW 2      (all PROVIDER_TEST)
transaction          OWNER_TEST, 3000¢ USD,
                     arrival_publication_key=factory_arrive_fff4837c018ff75971068e23aeb7a00e
delivery_grant       max_downloads 2, downloads 2, logged 2
stripe_webhook_inbox PROCESSED, attempts 1     ← the Stripe redelivery did not re-fulfil
```

`UPDATE watch_event_inbox SET event_type='TAMPERED'` against the **production**
database was rejected by the append-only trigger.

This matters because a Worker isolate is evicted between requests. The buy
click, the webhook, the `/thanks` page and each download were separate isolates,
and the state survived all of them because it lives in D1, not in memory.

## What this does not prove

* **No stranger has ever arrived.** Every request in this run came from a
  runner Factory controls. The Stranger Arrival Test is untouched, and ARRIVE
  remains the unsolved problem.
* **No arm's-length revenue exists.** The transaction is `OWNER_TEST` by
  construction and is excluded from eligible revenue.
* **No commercial listing has been served.** `COMMERCIAL_SERVING` was
  `disabled`; a commercial listing would have been refused.

## Defects the live providers exposed, and what was changed

1. **Teardown reported a failure that was really a bookkeeping gap, and left a
   live checkout link.** `deactivate()` raised after it had already deactivated
   the three provider objects, because the synthetic `Publication` teardown
   built had an `experimentId` that was never in the publication store. The
   only confirmation was an HTTP status on the buy URL — which a deactivated
   Stripe link still answers with `200`, so the check could neither prove nor
   disprove anything. Teardown now sweeps the sandbox by Factory's fixture
   metadata, deletes the webhook endpoint outright, and re-reads Stripe to prove
   nothing live survived; the workflow fails when a surface remains.
2. **A rotated WATCH secret bricks the edge.** Each run installs freshly
   generated secrets, and every journal row is HMAC-signed under the secret
   current when it was written, so a new secret cannot verify an older journal.
   `D1WatchStore` refused to open and the Worker failed closed with `503` on
   every route — run `32290874451` scored 3/11 for exactly this reason. That is
   the append-only journal behaving correctly. The fixture database is now reset
   per proof (`db/edge/reset-fixture.sql`).
3. **Stripe's idempotency cache handed each run the previous run's objects.**
   A reused idempotency key replays a cached response for 24 hours, so the
   second proof would have pointed its buy button at a Payment Link that the
   first proof's teardown had already deactivated — while reporting success.
   Provisioning now scopes its key to the run.

## Known limitations, deliberately not solved

* **D1 stands in for R2.** The fixture artifact is ~1 KB of base64 in a D1 row.
  Real artifacts belong in R2 behind the same `ObjectStore` port. D1 Free caps a
  database at 500 MB.
* **Full WATCH replay per request.** The edge replays the whole journal on every
  request. It is one query returning many rows — well inside D1 Free's 50
  queries per invocation — but it is O(journal) work per request and will not
  survive real traffic. It needs a materialised snapshot.
* **Secret rotation has no migration path.** Rotating `WATCH_EVENT_SECRET` in
  production would invalidate the journal exactly as it did here. A production
  edge needs key-id-tagged events so a retired key can still verify its own
  rows. Resetting the database is a fixture-only answer.

## Cost and owner labor

Cloudflare Workers Free, D1 Free, GitHub Actions on a public repository, Stripe
test mode: **$0.00**, no card on file, no capital drawn from any bucket.

Owner labor was `SETUP` — one-time and reusable: create the Cloudflare account,
mint a least-privilege API token, add two repository secrets. Roughly 25
minutes. No recurring `OPERATING` labor was introduced; every subsequent proof
runs unattended.

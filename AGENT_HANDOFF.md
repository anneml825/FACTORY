# Agent handoff — Phase C ARRIVE + durable WATCH checkpoint

**Date:** 2026-08-18

**Branch:** `codex/phase-c-arrive-durable-watch`

**Status:** Phase B real-provider proof `PASS`. Phase C is `DONE` as a controlled engineering
proof. Genuine commercial ARRIVE remains `UNPROVEN`; no stranger exposure is claimed.

**Cash spent:** $0.00

**External Phase C action:** run `32185055925` created one temporary DEV fixture, retrieved its
analytics, propagated one ARRIVE reference into one fulfilled USD 12.00 Stripe sandbox owner-test
transaction, recorded zero eligible commercial revenue, and automatically deactivated both
surfaces. Direct checks returned DEV 404 and Stripe “The link is no longer active.” No real money.

**Phase D / metered MAKE:** prohibited until the owner reviews this Phase C closeout

**Owner setup:** Stripe is complete. The scoped `DEVTO_API_KEY` is stored directly in GitHub
Actions. Never request or expose its value in chat or logs.

**Public identity:** the owner configured DEV as `Factory94`. The real probe requires exact
display name `Factory94` and username `factory94`, verifies authenticated and public DEV identity,
and rechecks the created article author. After reviewing the exposure, the owner explicitly
approved `anneml825` in DEV's GitHub field only; every other GitHub value and any occurrence in the
DEV name, username, or other identity metadata fails before publication. Do not broaden or infer
this allowlist.

**Provider findings:** DEV totals are nested (`page_views.total`, `reactions.total`, and
`comments.total`). The create-to-persist interval now has emergency cleanup, exact-marker orphan
cleanup, and serialized execution. The controlled browser load in run `32185055925` did not appear
in DEV totals within ten minutes, so DEV analytics is not a timely visit instrument. Stripe also
did not yield a usable attributed `checkout.session.created` event; WATCH preserves
`checkoutStarts: 0` rather than inventing it.

Read `AGENTS.md`, `CONSTITUTION.md`, `EXPERIMENTAL_PROTOCOL.md`, `FINANCIAL_CONTROLS.md`,
`DISTRIBUTION.md`, and `docs/PHASE_B_STRIPE_SANDBOX.md` before continuing.

## Phase C implementation checkpoint

Read `docs/PHASE_C_ARRIVE_DURABLE_WATCH.md` first.

Implemented without credentials:

- provider-neutral ARRIVE gate / activate / measure / deactivate contract;
- DEV Community pilot adapter with substantial noncommercial fixture content, stable create
  recovery, per-article analytics, and deactivation;
- cumulative ARRIVE metric bridge with stable provider-effect IDs and checkpoint-loss recovery;
- fsynced local WATCH event journal with restart replay;
- append-only PostgreSQL `watch_event_inbox` plus PostgreSQL Stripe webhook inbox and
  transaction references;
- explicit `EXCEPTION` owner-labor storage and reporting;
- visible, attributed `checkout.session.created` and
  `checkout.session.async_payment_failed` handling;
- GitHub Actions workflow with disposable PostgreSQL 16 core verification and an optional real
  DEV + Stripe sandbox probe.

Final local result: 33 tests discovered, 31 passed, 2 PostgreSQL tests skipped because this build
workspace has no database service; duration 1.353 s. GitHub Actions run `32185055925` passed all
33, including both PostgreSQL restart tests, in 489.558 ms. TypeScript and database invariant
checks passed.

Phase C is complete only as infrastructure. Do not reinterpret its controlled fixture, DEV view,
or owner-test checkout as demand, stranger arrival, revenue, or channel validation.

External runs `32180403256` and `32180836478` failed closed before publishing. They showed that a
new account's account-level analytics preflight can return an empty aggregate result. The adapter
now checks endpoint reachability at the gate, then parses the scoped article result after creation;
an empty scoped result is explicitly zero while any nonempty unknown shape still fails closed.
No public article was created by either failed attempt.

Run `32183291790` then exposed DEV's nested analytics shape and a create-time cleanup gap. The
corrected run `32185055925` cleaned the orphan, published one fresh fixture, and deactivated it.
Its job conclusion is `failure` only because the old acceptance expression required a prompt DEV
counter increment and an attributed checkout-start event. The artifact proves the fulfilled,
attributed `OWNER_TEST` transaction and all zero-commercial controls. The runner was corrected
afterward and the workflow made manual-only; do not launch another DEV fixture to cosmetically
change the historical run badge.

## Canonical Phase A base

Remote branch `codex/make-put-watch-dry-run` ended at handoff commit
`0e26e9a82cb81f64a8e168b07402bd0b58f9a74e`. Its immutable Phase A snapshot is remote commit
`62284c1872e947cb09787038bff0cf7822a6ebe5`, content-equivalent to original local commit
`0b99642401eb8750929bcb3c0c21e06f643052ab` and tree
`44a7d4a920b9e5ae73e8168806c1f9c28b52a79b`.

## What is executable without credentials

- Sandbox-only Stripe HTTP transport with API version `2026-06-24.dahlia`.
- Gate-enforced Product -> Price -> Managed Payments Payment Link creation.
- Stable Stripe idempotency keys plus atomically persisted partial publication progress.
- Raw Stripe signature verification and normalized provider-test WATCH events.
- Duplicate event/effect rejection, out-of-order retry, fulfillment failure/recovery.
- Refund/dispute reconciliation, idempotent recovery of webhook gaps from authoritative provider
  objects, and structurally zero commercial settlement for every test transaction.
- Link/Price/Product deactivation.
- GitHub Actions orchestration for a real sandbox probe using Stripe CLI event forwarding.

## Verification

```bash
node --test src/portfolio/phase-a.test.ts src/portfolio/phase-b-stripe.test.ts
node --check src/portfolio/run-stripe-sandbox-probe.ts
git diff --check
```

Final local result: 21 passed, 0 failed; Node duration 886.827 ms. The unit tests use a recording
transport; the separate GitHub Actions result below is the real provider evidence.

## First real sandbox run

GitHub Actions run `32167225370`, attempt 2, returned `FAIL` after correctly observing two
`OWNER_TEST` checkouts and fulfillments, a $3.00 refund, zero eligible commercial revenue, zero
settled cash, and successful provider-object deactivation. Stripe reconciliation reported the
second charge as disputed, but WATCH recorded zero dispute cents, so that transaction did not
reconcile. This is the exact failure the correction addresses.

Additional findings: the $12.00 catalog fixture produced a $13.10 customer total under Managed
Payments; separate subtotal/tax/fees/proceeds semantics are therefore mandatory before live use.
GitHub did not automatically mask dynamically generated workflow secrets; the correction masks
both ephemeral secrets before export. No repository Stripe key was exposed.

## Passing real sandbox run

Run `32173279299`, attempt 1, completed successfully in 6m 2s. Its final artifact reports:

- `passed: true`, `environment: PROVIDER_TEST`, and Managed Payments requested;
- two `OWNER_TEST` transactions, each USD 13.20 gross and fulfilled;
- one USD 3.00 refund and one USD 12.69 dispute;
- the missing dispute effect recovered once from authoritative Stripe state;
- both provider reconciliations fully true;
- zero booked revenue, available settled cash, eligible arm-length revenue, and Factory cost;
- Product, Price, and Payment Link deactivated;
- commercial clock false and ARRIVE false.

The cloud browser's Checkout pages remained visually stuck on `Processing`, but both one-time
submissions reached Stripe and the signed provider events completed the lifecycle. Treat the
provider artifact and reconciliation—not the client success screen—as the authoritative proof.

Run `32171304848` disproved another orchestration assumption: GitHub does not finalize live job
logs or a step summary while the long-running probe step is still waiting, so the connector could
not retrieve the Payment Link in time. The corrected workflow starts the probe in the background,
ends an initial setup step after the link exists, uploads `phase-b-stripe-checkout`, and waits for
the lifecycle in a separate step. The timed-out run created no transaction and deactivated its
temporary provider objects.

## Honest limits

- This sandbox accepted Managed Payments and the selected downloadable-document tax code. That is
  sandbox provider evidence, not live-account eligibility.
- GitHub Actions + Stripe CLI is a one-time test receiver, not production webhook hosting.
- WATCH and webhook state remain in-memory during the one-run probe. Provider retries and
  reconciliation are implemented/tested; production crash durability still requires the
  PostgreSQL boundary.
- ARRIVE remains provider-neutral and unsolved. No stranger exposure or E1/E2/E3 evidence exists.
- No commercial product, live storefront, payout, tax, bank, domain, Cloudflare, or Anthropic
  credential is involved.

## Official Stripe planner review — 2026-08-18

The authenticated Stripe connector and implementation planner are available for the account
named Factory. The planner selected direct web-browser Managed Payments with API-created hosted
Payment Links for this use case.

**Do not add Connect to Phase B.** Managed Payments explicitly does not support Connect, and
Factory currently has no third-party sellers or split-payout requirement. Connect becomes
relevant only if Factory later operates a multi-party marketplace/platform that onboards and
pays independent recipients.

Read-only parent-account inspection found that account details are not submitted, payment
capabilities are inactive, and charges/payouts are disabled. That finding did not describe the
separate Factory sandbox. Run `32173279299` now proves this sandbox accepts the Phase B Managed
Payments Product/Price/Payment Link and checkout path. It does not prove live-account eligibility.

The Stripe connector is still authorized to the parent Factory account ending `…gxHgL`, not the
Factory sandbox ending `…CWQlP`; it cannot currently inspect the sandbox. Do not confuse parent-
account onboarding status with sandbox readiness.

The existing implementation matches the planner's minimum architecture. The final local suite
passed 21/21; Node duration 886.827 ms. Before production—not needed
for the card-only Phase B probe—make `checkout.session.async_payment_failed` visible rather than
silently ignored.

## Owner-labor and ARRIVE clarification — 2026-08-18

The owner does not require zero human contact. Brief reusable `SETUP`, occasional
`BATCH_APPROVAL`, and rare measured `EXCEPTION` labor are acceptable. Recurring `OPERATING`
labor that scales with assets, customers, posts, or sales is strongly disfavored and remains
subject to the owner-hours gate.

Factory may propose modest one-time or recurring costs under Capital Authority when evidence
shows they buy materially better information or reusable commercial capability. Nothing in
this clarification authorizes spending.

Every candidate must be structurally complete as
`BUYER + PROBLEM + OFFER + MAKE + PUT + ARRIVE + WATCH`; an asset without a credible stranger-
arrival hypothesis is incomplete. ARRIVE remains provider-neutral and should support multiple
adapters across the portfolio. No ARRIVE provider was selected in this update.

The prior `EXCEPTION` storage gap is resolved by Phase C schema migration 003 and TypeScript
accounting. GitHub Actions run `32185055925` verified it against PostgreSQL.

## Stop condition

Phase C is closed for owner review. Stop here. Do not begin Phase D, request
`ANTHROPIC_API_KEY`, generate a commercial product, create a live storefront, run another DEV
fixture, or spend capital without new owner authorization.

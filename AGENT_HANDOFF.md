# Agent handoff — Phase C ARRIVE + durable WATCH checkpoint

**Date:** 2026-08-18

**Branch:** `codex/phase-c-arrive-durable-watch`

**Status:** Phase B real-provider proof `PASS`. Phase C credential-free implementation is
`BUILT`; the public noncommercial DEV ARRIVE probe has not run and no stranger exposure is yet
claimed.

**Cash spent:** $0.00

**External commerce actions:** Stripe sandbox only — four owner-test checkouts across two provider
runs, four fulfillments, two refunds, two disputes, reconciliation, and deactivation. Phase C has
not yet created its public DEV fixture. No real money.

**Phase D / metered MAKE:** prohibited until Phase C passes and the owner reviews it

**Owner setup:** Stripe is complete. The scoped `DEVTO_API_KEY` is stored directly in GitHub
Actions. Never request or expose its value in chat or logs.

**Public identity:** the owner configured DEV as `Factory94`. The real probe requires exact
display name `Factory94` and username `factory94`, verifies authenticated and public DEV identity,
rejects any exposed GitHub username or `anneml825`, and rechecks the created article author. A
mismatch fails before publication; do not weaken or infer this identity gate.

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

Local result before connector publication: 28 tests discovered, 26 passed, 2 PostgreSQL tests
skipped because this build workspace has no database service. TypeScript passed locally. The
combined Node suite's final pre-commit run reported 2.23 s. The GitHub Actions core job must run both PostgreSQL tests
before the real probe is requested.

Do not report Phase C `DONE` until the workflow records post-baseline DEV article views, an
attributed Stripe sandbox checkout start and fulfilled `OWNER_TEST` transaction, zero eligible
commercial revenue, and deactivation of both provider surfaces.

External runs `32180403256` and `32180836478` failed closed before publishing. They showed that a
new account's account-level analytics preflight can return an empty aggregate result. The adapter
now checks endpoint reachability at the gate, then parses the scoped article result after creation;
an empty scoped result is explicitly zero while any nonempty unknown shape still fails closed.
No public article was created by either failed attempt.

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
accounting. It still needs the PostgreSQL Actions verification before being called provider-run
evidence.

## Stop condition

Complete only the Phase C noncommercial provider probe and report it for owner review. Do not
begin Phase D, request `ANTHROPIC_API_KEY`, generate a commercial product, create a live
storefront, or spend capital.

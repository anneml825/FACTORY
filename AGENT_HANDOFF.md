# Agent handoff — Phase B Stripe sandbox checkpoint

**Date:** 2026-08-18

**Branch:** `codex/phase-b-stripe-test-mode`

**Status:** reconciliation recovery is published. Corrected run `32171304848` failed closed with
no transactions because its checkout instructions were trapped inside the still-running Actions
step. A non-secret early checkout artifact correction is verified locally and awaiting rerun.

**Cash spent:** $0.00

**External commerce actions:** Stripe sandbox only — Product, Price, Payment Link, two owner-test
checkouts, two fulfillments, one refund, reconciliation, and deactivation

**Phase C:** prohibited until the owner reviews a completed Phase B sandbox result

**Owner setup:** complete. `STRIPE_TEST_SECRET_KEY` exists in GitHub Actions. Never request or
expose its value.

Read `AGENTS.md`, `CONSTITUTION.md`, `EXPERIMENTAL_PROTOCOL.md`, `FINANCIAL_CONTROLS.md`,
`DISTRIBUTION.md`, and `docs/PHASE_B_STRIPE_SANDBOX.md` before continuing.

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

Last local result after the first real-run finding: 21 passed, 0 failed; Node duration 954.632 ms.
The unit tests use a recording transport; the separate GitHub Actions result below is the real
provider evidence.

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

## Corrected rerun sequence

1. Publish the checkout-handoff correction through the GitHub connector.
2. Let the branch push trigger `Phase B Stripe sandbox probe` with a fresh per-attempt idempotency
   namespace.
3. Retrieve the early `phase-b-stripe-checkout` artifact while the listener continues running.
4. Complete the two owner-classified test checkouts with browser automation, with action-time
   confirmation before submitting them.
5. Inspect the uploaded `phase-b-stripe-sandbox-result` artifact.
6. Require `passed: true`, all provider objects deactivated, both transactions `OWNER_TEST`,
   zero eligible arm-length revenue, zero available settled cash, a recorded refund and dispute,
   and every reconciliation `reconciled: true`.
7. Record the measured result, update this handoff, and publish the follow-up through the GitHub
   connector. Do not use shell git push if authentication remains unavailable.

If Managed Payments activation or Product/Price/Payment Link creation is denied, record the
exact Stripe error. That disproves the account-specific assumption and requires an architecture
change; do not silently fall back to Stripe direct for live commerce.

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

Read-only account inspection found that account details are not submitted, payment capabilities
are inactive, and charges/payouts are disabled. Account-specific Managed Payments eligibility
and sandbox operation therefore remain unproved. No Stripe object was created or modified during
this review, and no secret was exposed.

The Stripe connector is still authorized to the parent Factory account ending `…gxHgL`, not the
Factory sandbox ending `…CWQlP`; it cannot currently inspect the sandbox. Do not confuse parent-
account onboarding status with sandbox readiness.

The existing implementation matches the planner's minimum architecture. The combined suite was
re-run after review: 20 passed, 0 failed; Node duration 882.734 ms. Before production—not needed
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

Implementation gap recorded honestly: `owner_intervention.kind` currently has no distinct
`EXCEPTION` value. Align the schema and reporting before autonomous commercial operation; do
not claim separate exception metrics until that is implemented and tested.

## Stop condition

Stop after the corrected Phase B result is recorded and published. Do not begin metered MAKE,
request `ANTHROPIC_API_KEY`, select ARRIVE, create a live storefront, or begin Phase C.

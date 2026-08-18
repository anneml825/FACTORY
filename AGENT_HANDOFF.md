# Agent handoff — Phase B Stripe sandbox checkpoint

**Date:** 2026-08-18

**Branch:** `codex/phase-b-stripe-test-mode`

**Status:** credential-free Phase B implementation verified locally; real Stripe sandbox run
blocked on one owner action

**Cash spent:** $0.00

**External commerce actions:** none yet

**Phase C:** prohibited until the owner reviews a completed Phase B sandbox result

Read `AGENTS.md`, `CONSTITUTION.md`, `EXPERIMENTAL_PROTOCOL.md`, `FINANCIAL_CONTROLS.md`,
`DISTRIBUTION.md`, and `docs/PHASE_B_STRIPE_SANDBOX.md` before continuing.

## Canonical Phase A base

Remote branch `codex/make-put-watch-dry-run` ended at handoff commit
`0e26e9a82cb81f64a8e168b07402bd0b58f9a74e`. Its immutable Phase A snapshot is remote commit
`62284c1872e947cb09787038bff0cf7822a6ebe5`, content-equivalent to original local commit
`0b99642401eb8750929bcb3c0c21e06f643052ab` and tree
`44a7d4a920b9e5ae73e8168806c1f9c28b52a79b`.

## What is executable without credentials

- Sandbox-only Stripe HTTP transport with API version `2025-03-31.basil`.
- Gate-enforced Product -> Price -> Managed Payments Payment Link creation.
- Stable Stripe idempotency keys plus atomically persisted partial publication progress.
- Raw Stripe signature verification and normalized provider-test WATCH events.
- Duplicate event/effect rejection, out-of-order retry, fulfillment failure/recovery.
- Refund/dispute reconciliation and structurally zero commercial settlement for every test
  transaction.
- Link/Price/Product deactivation.
- GitHub Actions orchestration for a real sandbox probe using Stripe CLI event forwarding.

## Verification

```bash
node --test src/portfolio/phase-a.test.ts src/portfolio/phase-b-stripe.test.ts
node --check src/portfolio/run-stripe-sandbox-probe.ts
git diff --check
```

Last local result: 20 passed, 0 failed; Node duration 874.276 ms. No Stripe request occurred.
The provider transport in the tests is a recording fake.

## Owner action and resume sequence

The owner must use Stripe's sandbox only, activate Managed Payments/accept its terms if the
Dashboard offers it, and store the sandbox secret key as repository Actions secret
`STRIPE_TEST_SECRET_KEY`. The key must never be pasted into chat, source, logs, or a commit.

After the secret exists:

1. Re-run the `Phase B Stripe sandbox probe` Actions run on this branch.
2. In the live job log, open the noncommercial Stripe test link.
3. Complete one checkout with Stripe test card `4242 4242 4242 4242`.
4. Complete a second checkout with dispute test card `4000 0000 0000 0259`.
5. Inspect the uploaded `phase-b-stripe-sandbox-result` artifact.
6. Require `passed: true`, all provider objects deactivated, both transactions `OWNER_TEST`,
   zero eligible arm-length revenue, zero available settled cash, a recorded refund and dispute,
   and every reconciliation `reconciled: true`.
7. Record the measured result, update this handoff, and publish the follow-up through the GitHub
   connector. Do not use shell git push if authentication remains unavailable.

If Managed Payments activation or Product/Price/Payment Link creation is denied, record the
exact Stripe error. That disproves the account-specific assumption and requires an architecture
change; do not silently fall back to Stripe direct for live commerce.

## Honest limits

- Managed Payments is supported by current Stripe documentation for eligible downloadable
  documents and explicitly has a sandbox flow. This specific account's eligibility is unproved.
- GitHub Actions + Stripe CLI is a one-time test receiver, not production webhook hosting.
- WATCH and webhook state remain in-memory during the one-run probe. Provider retries and
  reconciliation are implemented/tested; production crash durability still requires the
  PostgreSQL boundary.
- ARRIVE remains provider-neutral and unsolved. No stranger exposure or E1/E2/E3 evidence exists.
- No commercial product, live storefront, payout, tax, bank, domain, Cloudflare, or Anthropic
  credential is involved.

## Stop condition

Stop after requesting the single Stripe sandbox setup action. Do not begin metered MAKE, request
`ANTHROPIC_API_KEY`, select ARRIVE, create a live storefront, or begin Phase C.

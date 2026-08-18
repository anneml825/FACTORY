# Phase B — Stripe Managed Payments sandbox

**Date:** 2026-08-18  
**Status:** credential-free implementation complete and locally verified; real Stripe sandbox
execution blocked on one owner-provisioned sandbox key  
**Cash spent:** $0.00  
**Commercial assets:** none; the only manifest is a visibly noncommercial fixture  
**ARRIVE:** deliberately unsolved and unchanged

## Decision

The minimum Phase B implementation is a Stripe-hosted Managed Payments Payment Link, not a
Factory storefront:

```text
fixture manifest + QA/Arrival gates
  -> Stripe test Product (eligible tax code)
  -> Stripe test Price
  -> Stripe test Payment Link (managed_payments[enabled]=true)
  -> Stripe-hosted test checkout
  -> Stripe CLI forwards a real signed sandbox event
  -> signature verification + retryable inbox
  -> deterministic fixture fulfillment
  -> WATCH attribution
  -> refund/dispute events
  -> Stripe-vs-WATCH reconciliation
  -> Payment Link, Price, and Product deactivation
```

The one-run probe lives in `.github/workflows/phase-b-stripe-sandbox.yml`. GitHub Actions is
only the temporary test receiver: Stripe CLI forwards sandbox events to the job's localhost
HTTP handler. This proves the provider boundary without launching a storefront, buying a
domain, requesting Cloudflare, or creating a durable public endpoint. It is not the production
webhook-hosting decision.

## Managed Payments finding

The proposed **product context is supported in principle**. Stripe documents Managed Payments
for digital content and downloads, including downloadable standalone documents under tax code
`txcd_10503000`. Products must be sold directly, rights must be held, and fulfillment must be
fully automated. The Phase B fixture meets the technical shape but is explicitly not a product
for sale.

The proposed **account context remains UNKNOWN** until the sandbox call succeeds. Stripe makes
Managed Payments subject to an account eligibility review, supported business geography,
Dashboard activation, and acceptance of Managed Payments terms. Code and public documentation
cannot establish that this specific account is enabled.

Managed Payments is genuinely testable: Stripe's current guide documents test-mode Checkout
and Payment Links, `managed_payments[enabled]=true`, `cs_test_...` sessions, test cards, and
sandbox transaction inspection. Therefore the dry-run assumption is testable rather than
hypothetical.

Primary official references:

- <https://docs.stripe.com/payments/managed-payments/set-up>
- <https://docs.stripe.com/payments/managed-payments/use-payment-links>
- <https://docs.stripe.com/payments/managed-payments/eligibility>
- <https://docs.stripe.com/testing/overview>
- <https://docs.stripe.com/webhooks>
- <https://docs.stripe.com/metadata>

## Credential-free implementation

- `stripe-api.ts`: sandbox-only HTTP transport. It accepts only `sk_test_` or `rk_test_` and
  rejects any provider object not explicitly marked `livemode=false`.
- `stripe-put-adapter.ts`: Product, Price, and Managed Payments Payment Link creation with a
  stable idempotency key per external operation. Both Payment Link and underlying
  PaymentIntent metadata carry `experiment_id`, `asset_id`, environment, and forced
  `OWNER_TEST` classification.
- `stripe-publication-store.ts`: atomically persisted partial publication progress. A crash
  after Product creation resumes at Price creation rather than blindly recreating Product.
- `stripe-webhook.ts`: raw-body Stripe signature verification, timestamp tolerance, duplicate
  event IDs, duplicate provider-effect IDs, explicit provider-test classification, retryable
  out-of-order attribution, and fulfillment success/failure visibility.
- `stripe-reconciliation.ts`: PaymentIntent and Charge reconciliation. Provider-test settlement
  is always zero booked commercial revenue, zero available settled cash, zero eligible
  arm's-length revenue, and zero Factory cost.
- `run-stripe-sandbox-probe.ts`: noncommercial end-to-end probe, automatic partial test refund,
  dispute observation, reconciliation, and deactivation.

All Stripe mutations are $0 sandbox operations. The global paid-activity kill switch remains
engaged; the probe requires `FACTORY_PAID_ACTIVITY_HALTED=1` and refuses all live keys, live
objects, and live events. Existing Capital Authority tests still prove that any nonzero adapter
cannot execute without authorization.

## Local verification

Run:

```bash
node --test src/portfolio/phase-a.test.ts src/portfolio/phase-b-stripe.test.ts
node --check src/portfolio/run-stripe-sandbox-probe.ts
git diff --check
```

Measured locally on 2026-08-18: 20 tests passed, 0 failed; Node reported 874.276 ms for the
combined test process. No Stripe request was made; Phase B tests use a recording transport.

The suite covers:

- Product/Price/Payment Link request shape and `managed_payments[enabled]=true`;
- duplicate publication and crash recovery after a partial provider sequence;
- QA and Arrival publication gates;
- live-key/object/event refusal;
- Stripe signature verification and replay tolerance;
- duplicate and out-of-order webhook delivery;
- failed fulfillment, visible failure, retry, and recovery;
- refund and dispute deduplication;
- owner/test exclusion from arm's-length revenue and E3/KEEP;
- provider reconciliation and zero commercial settlement;
- Payment Link, Price, and Product deactivation.

## Assumptions corrected

1. **Metadata does not automatically propagate everywhere.** Payment Link metadata copies to
   Checkout Sessions, but PaymentIntent metadata must also be set explicitly through
   `payment_intent_data[metadata]` so later refund/dispute attribution can be reconciled.
2. **Stripe events are not ordered.** The Phase A direct-ingestion assumption cannot cross the
   real boundary. Phase B adds retryable inbox state and provider-object lookup.
3. **`synthetic: true` cannot describe a real sandbox event.** WATCH now records an explicit
   `PROVIDER_TEST` environment. That environment is structurally barred from arm's-length
   classification even though its webhook is genuinely from Stripe.
4. **A Checkout completion is still not commercial success.** Fulfillment, refund, dispute,
   environment, and classification remain separate facts.
5. **A public webhook host is not necessary for the one-time proof.** Stripe CLI forwarding in
   an ephemeral Action is sufficient for Phase B. Production hosting remains a later decision.

## Remaining gate

The provider-independent code is ready. One real sandbox run must still prove:

- this Stripe account can activate Managed Payments;
- the selected digital-document tax code is accepted for the account;
- Stripe creates the Product, Price, and Payment Link;
- two hosted test checkouts produce genuine signed webhook events;
- the refund and dispute fixtures behave under Managed Payments;
- provider reconciliation and deactivation complete.

Until that run passes, Phase B is `BUILT`, not `DONE`. No money spine exists,
`COMMERCIAL_CLOCK_START` remains unset, and Phase C is prohibited.

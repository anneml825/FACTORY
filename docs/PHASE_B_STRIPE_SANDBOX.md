# Phase B — Stripe Managed Payments sandbox

**Date:** 2026-08-18  
**Status:** real Stripe sandbox execution reached the full provider boundary; reconciliation
recovery is published, and an early checkout-artifact correction is pending one rerun after a
second run failed closed with no transactions because its live link was not retrievable in time
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

### Official Stripe planner and Connect decision — 2026-08-18

The authenticated Stripe implementation planner selected:

```text
Stripe only -> web browser -> digital goods -> Managed Payments
            -> API-created hosted Payment Links
```

**Connect is not part of this architecture.** Stripe documents Managed Payments as a direct-
integration product and explicitly excludes Connect platforms, Express accounts, accounts
controlled by a platform, and Connect-only Payment Link parameters such as
`application_fee_amount`, `on_behalf_of`, and `transfer_data`.

Factory is currently the sole seller of Factory-owned assets. Add Connect only if the business
later onboards independent third-party sellers or service providers and must route customer
funds, platform fees, or payouts among multiple legal recipients. That would be a new
multi-party business model and a separate architecture decision—not an enhancement to this
Phase B money spine.

Read-only inspection through the authenticated Stripe connector found a US direct account named
Factory, but its account details are not yet submitted, payment capabilities are inactive, and
charges and payouts are disabled. No sensitive account fields are stored here. This does not
invalidate credential-free implementation, but account-specific Managed Payments eligibility
and sandbox execution remain unproved.

The owner subsequently identified a Factory sandbox with Dashboard account ID
`acct_1U5qkg0pEa3CWQlP`. Stripe sandboxes have their own account context, API keys, webhooks, and
objects. The connector remains authorized to the parent Factory account ending `…gxHgL` and
cannot inspect this sandbox with its current permission scope. Parent onboarding status must not
be reported as sandbox status.

The proposed **product context is supported in principle**. Stripe documents Managed Payments
for digital content and downloads, including downloadable standalone documents under tax code
`txcd_10503000`. Products must be sold directly, rights must be held, and fulfillment must be
fully automated. The Phase B fixture meets the technical shape but is explicitly not a product
for sale.

The proposed **account context remains UNKNOWN** until the sandbox call succeeds. Stripe makes
Managed Payments subject to an account eligibility review and supported business geography.
Code and public documentation cannot establish that this specific sandbox is enabled.

Managed Payments is enabled on the Payment Link API request with
`managed_payments[enabled]=true`; the owner does not need to find a dedicated Dashboard tile
first. The general Stripe setup wizard concerns live account activation and is not itself proof
that the sandbox can or cannot run this probe. If the API rejects the Managed Payments request,
record the exact error and complete only the specific eligibility/onboarding task it identifies.

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
- `stripe-reconciliation.ts`: PaymentIntent and Charge reconciliation plus idempotent recovery of
  missing refund/dispute effects from authoritative Stripe objects. Provider-test settlement is
  always zero booked commercial revenue, zero available settled cash, zero eligible arm's-length
  revenue, and zero Factory cost.
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

Re-run after the official Stripe planner review: **20 passed, 0 failed; 882.734 ms**. The local
working tree was clean before this documentation update. No Stripe object was created or
modified.

After the first provider run exposed the reconciliation gap: **21 passed, 0 failed; 954.632 ms**.
The added test proves missing refund/dispute webhooks are backfilled from Stripe with stable
provider effect IDs, and that repeating recovery duplicates neither refunds nor disputes.

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
6. **A timely webhook cannot be assumed even when provider state has already changed.** The first
   real run observed `charge.disputed=true` during reconciliation but no dispute effect in WATCH.
   Reconciliation must therefore repair missing provider effects idempotently, not merely report
   a mismatch.
7. **GitHub does not automatically mask secrets generated inside a workflow.** The first run's
   ephemeral internal signing secret and Stripe CLI webhook secret appeared in finalized job
   logs. They expired with the runner and did not expose the repository Stripe key, but the
   workflow now calls `add-mask` before exporting either generated secret.
8. **An idempotency namespace cannot be permanent across intentionally separate probes.** A
   rerun after deactivation would otherwise replay the prior inactive Product/Price/Payment Link.
   Each GitHub run attempt now has a unique probe namespace; retries within that attempt remain
   stable and deduplicated.
9. **Managed Payments can make customer total differ from catalog price.** The $12.00 fixture
   produced $13.10 Checkout totals in this sandbox. WATCH correctly records customer gross, but
   live economics must keep catalog subtotal, tax, provider fees, seller proceeds, and settled
   payout separate.
10. **A step summary is not an early handoff channel for a long-running step.** Run `32171304848`
    created a fresh test Payment Link, but GitHub did not finalize the step summary or connector
    job log while that same step remained open waiting for checkout. The run timed out with no
    transactions and deactivated its temporary objects. The workflow now starts the probe in the
    background, uploads a non-secret `phase-b-stripe-checkout` artifact in a completed step, and
    waits for the lifecycle in a separate step.

## First real sandbox result — failed closed, 2026-08-18

GitHub Actions run `32167225370`, attempt 2, made genuine Stripe sandbox requests and proved:

- this sandbox accepted `managed_payments[enabled]=true` for the downloadable-document tax code;
- API creation of one Product, Price, and hosted Payment Link succeeded;
- two owner test checkouts produced attributed `OWNER_TEST` transactions;
- both fixture fulfillments succeeded;
- one $3.00 test refund reached WATCH;
- Stripe provider state marked the dispute-card charge disputed;
- every revenue/cash/cost settlement field remained zero and no commercial clock started;
- the Payment Link, Price, and Product were deactivated.

The run correctly returned `FAIL`, not success, because WATCH recorded zero dispute cents while
Stripe reconciliation reported the second charge as disputed. Both transactions remained
ineligible for arm's-length revenue. No capital was spent and no demand evidence was created.

## Remaining gate

One corrected rerun must prove the missing dispute effect is recovered into WATCH, both
transactions reconcile, and the final artifact reports `passed: true`. Product eligibility,
Managed Payments creation, Checkout, fulfillment, refund, owner exclusion, zero settlement, and
deactivation are already observed provider facts rather than implementation claims.

Until that run passes, Phase B is `BUILT`, not `DONE`. No money spine exists,
`COMMERCIAL_CLOCK_START` remains unset, and Phase C is prohibited.

Before any production design, add explicit handling and visibility for
`checkout.session.async_payment_failed`. The Phase B card-only proof does not depend on delayed
payment methods, but Managed Payments controls payment-method presentation, so a production
handler may not silently ignore a delayed-payment failure.

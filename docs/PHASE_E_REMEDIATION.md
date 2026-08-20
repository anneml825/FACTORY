# Phase E — remediation and commercial readiness

**Date:** 2026-08-19
**Branch:** `claude/factory-phase-e-remediation` (Codex `codex/phase-d-credential-free` untouched)
**Status:** defects repaired and tested; **no product generated, no mechanism selected, no capital spent**
**Cash spent:** $0.00 · **Owner capital consumed:** $0.00 · **Kill switch:** engaged

Phase E fixes what a read-only review of Phase D found. It does not advance the commercial
programme: no buyer, problem, offer, niche, product, listing, or arrival mechanism was chosen.
Product #1 belongs to the next agent.

---

## Why an edge, and why first

Phase D closed with the conclusion that an inference credential was the next owner action. It
was not. The review found that Factory had **no always-on internet-facing component at all**:

- no product page a stranger could load;
- no webhook receiver outside a GitHub Actions job (a batch runner, not a listener);
- no mechanism to give a buyer the file they paid for. `ProviderTestFulfillment` was an
  interface with a test stub, and `grep` found no Cloudflare, R2, or hosting code anywhere.

Stripe hosts checkout. It does not host the offer and it does not deliver the artifact. So the
binding constraint on a first dollar was infrastructure, not generation — and an API key would
have bought files with nowhere to go.

`src/edge/` is that component. One WHATWG `fetch` handler, run unchanged by a Node HTTP adapter
(`server.ts`, what the tests exercise) and by a deployed Cloudflare Worker entry (`worker.ts`).
The fixture edge and dormant commercial edge use separate Workers and D1 databases; genuine
commercial serving remains disabled and unproven.

```
GET  /p/:experimentId    product page + first-party PRODUCT_VIEW
POST /e/:experimentId    offer-interaction beacon
GET  /buy/:experimentId  first-party buy click -> 302 to Stripe with client_reference_id
POST /webhooks/stripe    signed webhook -> fulfillment -> delivery grant
GET  /thanks?ref=        post-payment page carrying the signed download link
GET  /d/:token           signed, expiring, use-limited artifact delivery
```

### What the edge deliberately does not do

**It never emits `QUALIFIED_EXPOSURE`.** The edge can count views of its own page honestly. It
cannot know that an appropriate stranger was exposed. That claim belongs to an ARRIVE adapter
and to the Stranger Arrival Test, and conflating the two is how a denominator becomes fiction.

What the edge supplies is the **product-view denominator** — the thing Phase C could not get,
because DEV's article counter did not register a controlled browser load within ten minutes and
Stripe's `checkout.session.created` never produced usable attribution. Arrival at the page is
now measured the moment it happens, by Factory, for every adapter.

`CHECKOUT_STARTED` from the edge is labelled in its own `reason` field as a first-party buy
click, permanently, so it can never be mistaken for a provider event.

### Commercial serving is off by default

`allowCommercialListings` defaults to `false` and the handler returns 403 for any listing whose
`noncommercialFixture` is false. Phase E cannot accidentally launch anything.

---

## The accounting defect

Phase D's own closeout described sub-cent inference as a precision problem. It was a **control
bypass**.

`CostController.execute()` branched on `maximumCents === 0` and, in that branch, ran the
operation with no reservation, no kill-switch check, and no ledger entry. A real adapter
quoting $0.00021 rounds to zero cents and self-reports zero cents, so real money would have
been spent entirely outside the Capital Authority with the ledger reading $0.00 — a
`CONSTITUTION.md` §6 violation, silently.

The opposite rounding is also decision-changing: ceiling every call to one cent and 1,000
assets at ~0.02c bills as ~$10 instead of ~$0.20, which would falsely kill the portfolio thesis
on an accounting artifact.

The repair, in `src/capital/inference-accounting.ts`:

| Step | Rule |
|---|---|
| Quote | Micro-dollars are authoritative; the cent ceiling is **derived**, and an adapter that asserts its own disagreeing cent figure is rejected |
| Zero path | Keyed on **micros**, not cents. Any nonzero cost is mediated |
| Reserve | `ceil(maximumMicros / 10,000)` cents, once, per tranche. Over-reserving is safe: a reservation is a ceiling, not a charge |
| Record | Exact micros per call, append-only, idempotency-keyed, experiment-attributed |
| Settle | `ceil(sum(micros) / 10,000)` cents, once, at tranche close. **Aggregate rounding, never per-call** |
| Reconcile | Journal total against provider-reported usage; material divergence returns `HALT` |

Measured: 100 calls at 210 micros settle **3 cents**, not 100.

### The bucket

Phase D hard-coded `bucketName: 'production'`, which does not exist in the schema — every
metered reservation would have failed. Phase E uses **`discovery`**, which `INTEGRATIONS.md`
already designated for metered inference, and the reasoning holds: `CONSTITUTION.md` §7
partitions capital so that *searching and making* cannot consume the money reserved for
*validating*. Generation and QA inference is search-and-make cost. `validation` stays reserved
for spend that buys a denominator — exposure, distribution, arrival — which is the scarce
thing. A test asserts the bucket exists in migration 001 and that `production` does not.

---

## §18 is now a control, not a document

`assessExperimentCost` was dead code: referenced only by its own self-test. It is now applied in
`CredentialFreeCampaignOrchestrator` **before the provider is called**, on the quoted inference
cost plus the plan's declared non-inference cash cost. Above-target spend without justification
fails the experiment; spend above 10% of remaining capital fails unless the plan records owner
authorization. Assessing it afterwards would have made it a report.

---

## Commercial Value QA

The previous Value QA checked that `buyer`, `problem`, and `promise` were non-empty strings and
that the price was a positive integer. It could not fail a technically valid artifact nobody
should pay for, and it *required* `noncommercialFixture: true`, so it could never run on a real
product at all.

`src/portfolio/commercial-value-qa.ts` is the commercial contract. It was written **before any
product exists**, deliberately — that is the only moment the criteria can be set honestly.

| Criterion | Verification | Escalatable |
|---|---|---|
| `PROMISE_FULFILLED` | DETERMINISTIC | no |
| `FUNCTIONAL_CORRECTNESS` | DETERMINISTIC | no |
| `VERIFIABLE_CORRECTNESS` | DETERMINISTIC | no |
| `PROVENANCE_RIGHTS` | DETERMINISTIC | **yes**, with a logged `owner_intervention` |
| `FREE_ALTERNATIVE_IDENTIFIED` | DETERMINISTIC | no |
| `PAID_ALTERNATIVE_COMPARISON` | DETERMINISTIC | no |
| `DIFFERENTIATION_VS_ALTERNATIVE` | MODEL_REVIEW | no |
| `ACCURACY_INTERNAL_CONSISTENCY` | MODEL_REVIEW + executed checks | no |
| `USABILITY_COMPLETENESS` | MODEL_REVIEW | no |
| `PRESENTATION_BUYER_COMPREHENSION` | MODEL_REVIEW | no |
| `SLOP_REPETITION_HALLUCINATION` | MODEL_REVIEW | no |
| `PRICE_VALUE_DEFENSIBILITY` | MODEL_REVIEW | no |

Fail-closed throughout: `UNASSESSED` fails. Specific refusals worth naming —

- an artifact whose overlap with the named free alternative is `IDENTICAL` fails: there is
  nothing to sell;
- omitting the free-alternative comparison fails. "There is no free alternative" is a claim,
  not an omission;
- a differentiation claim built only from generic value words ("better", "more comprehensive")
  fails, because it asserts value without asserting a checkable difference;
- a claim with no way for a buyer to confirm it fails;
- **a model may not mark its own work**: a review from the same provider/model that generated
  the artifact is rejected;
- a `PASS` review with no substantive rationale is a rubber stamp and fails;
- a promise check that does not reference the promise it claims to verify fails;
- the owner may waive provenance judgement, which is genuinely a human call. The owner may
  **not** waive `PROMISE_FULFILLED` — a thing Factory must verify itself cannot be voted away.

Fixture Value QA is untouched and still runs for fixtures.

Commercial model reviews and owner exceptions are accepted only when a resolver confirms an
append-only PostgreSQL evidence row bound to the exact artifact SHA-256. A caller-supplied ID
alone cannot pass the gate.

---

## COMMERCIAL mode

`PhaseAEngine` gains a mode. `FIXTURE` is the default and behaves exactly as before, including
refusing non-fixture manifests and LIVE PUT adapters. `COMMERCIAL` refuses fixture manifests,
requires a LIVE PUT adapter, requires the commercial evidence bundle at Value QA (there is no
"assume it passed" branch), and `assertPublicationGates` additionally requires COMMERCIAL
functional and Value QA plus a LIVE arrival gate.

The renderers now omit the noncommercial banner for a commercial manifest, and functional QA
checks the marker in **both** directions: present on a fixture, absent on a product.

All of it is exercised with a manifest whose buyer and problem read `SYNTHETIC … gate test
only`. No real buyer, problem, offer, or niche was invented.

---

## Owner-labour truthfulness

The Phase D gate rejected a plan that *declared* nonzero operating minutes. A plan declaring
zero while costing five minutes an asset passed unchallenged. `reconcileOwnerLabor` now checks
the declaration against attributed `owner_intervention` records, and the launch gate fails
closed when nobody has reconciled at all — a zero-labour claim needs evidence, not a
declaration.

Policy is preserved: `SETUP`, `BATCH_APPROVAL`, and `EXCEPTION` minutes are reported, not
penalised. `OPERATING` above what was declared is a falsified claim. `MAINTENANCE_DEBUG` is
surfaced because `OWNER_AUTONOMY.md` counts it against the autonomy thesis.

---

## ARRIVE readiness without an ARRIVE campaign

`ArriveAdapterRegistry` lets the portfolio hold several independently described mechanisms and
refuses a batch that claims diversity it does not have. **It selects nothing and contains no
adapter.** No SEO page, social account, marketplace listing, DEV article, or advertisement was
created. That selection belongs with the first real product batch.

---

## What is proven, and by what

The current complete local suite discovers 125 tests: 119 pass, 6 PostgreSQL-dependent tests
skip when this workspace has no `TEST_DATABASE_URL`, and 0 fail. TypeScript and workflow YAML
also validate. Earlier Phase E runs exercised the PostgreSQL and public fixture paths; see
`AGENT_HANDOFF.md` and `docs/PHASE_E_EXTERNAL_PROOF.md` for the evidence boundaries.

The complete fixture commerce path is exercised **over real HTTP against real PostgreSQL**,
including a mid-flight restart: page → cookie → beacon → buy click → signed webhook →
fulfillment → grant → thanks page → signed download → durable WATCH, with the funnel replayed
from the database and the transaction permanently `OWNER_TEST` at zero eligible revenue.

## What remains unverified or deliberately inactive

- **Corrected commercial-route redeployment:** the Worker and D1 bindings have run externally,
  but the earlier commercial deploy wrote operational canaries into signed WATCH and therefore
  did not prove a healthy ordinary application route. The corrected manual deploy moves canaries
  outside WATCH, performs a narrowly fenced cleanup, and requires an unknown product route to
  return `404`; its new run evidence belongs in `docs/PHASE_E_COMMERCIAL_ISOLATION.md`.
- **KV fulfillment is intentionally unsupported.** `KvEdgeStateStore.consumeDownload` throws by
  design because KV cannot enforce a download limit atomically. The deployed proof uses D1.
- **Live Stripe.** Sandbox only, as before.
- **Any commercial claim whatsoever.** No product, no stranger, no revenue, no arrival.

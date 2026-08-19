# Agent handoff — Phase E remediation checkpoint

**Date:** 2026-08-19

**Branch:** `claude/factory-phase-e-remediation`, based on Codex `codex/phase-d-credential-free`
(`5d34716`), which is **unmodified**.

**Status:** Phase A fixture, Phase B real Stripe sandbox, and Phase C controlled engineering
proofs stand unchanged. Phase D credential-free campaign/inference infrastructure stands, with
four defects repaired. Phase E adds the always-on commerce edge. **Genuine commercial ARRIVE,
metered MAKE, and any commercial claim remain UNPROVEN.**

**Cash spent:** $0.00 · **Owner capital consumed:** $0.00 · **Kill switch:** engaged

**Nothing commercial happened in Phase E.** No product, buyer, problem, offer, niche, listing,
arrival mechanism, inference provider, credential, account, deployment, or capital.

## Phase E remediation checkpoint

Read `docs/PHASE_E_REMEDIATION.md` first.

An independent read-only review of Phase D found four defects. All four are repaired and each
has a regression test that reproduces the original failure:

1. **No always-on internet-facing component.** Not a product page, not a webhook receiver
   outside a CI job, not a way to deliver a purchased file — `ProviderTestFulfillment` was an
   interface with a test stub, and there was no hosting code anywhere. This, not inference, was
   the binding constraint on a first dollar. `src/edge/` supplies it.
2. **A sub-cent inference cost would have bypassed the Capital Authority entirely.**
   `CostController` branched on `maximumCents === 0`, and a real adapter quoting $0.00021 rounds
   to zero. Real money, no reservation, no kill-switch check, no ledger entry. Now keyed on
   micros.
3. **§18 pre-revenue cost discipline was dead code.** `assessExperimentCost` was referenced only
   by its own self-test. It now runs before any provider call.
4. **Value QA could not fail anything.** It checked non-empty strings and a positive price, and
   required `noncommercialFixture: true` so it could never run on a product.

Also repaired: the hard-coded `production` bucket (which does not exist in the schema — every
metered reservation would have failed), the declared-not-observed owner-labour gate, the Phase B
workflow's push trigger, and the silent downgrade of Etsy's measured $15–29 setup fee to
"UNKNOWN".

### The edge

One WHATWG `fetch` handler behind provider-neutral ports, run unchanged by a Node HTTP adapter
(tested) and by a Cloudflare Worker entry (**not deployed, not verified**).

```
GET  /p/:experimentId    product page + first-party PRODUCT_VIEW
POST /e/:experimentId    offer-interaction beacon
GET  /buy/:experimentId  first-party buy click -> 302 to Stripe with client_reference_id
POST /webhooks/stripe    signed webhook -> fulfillment -> delivery grant
GET  /thanks?ref=        post-payment page carrying the signed download link
GET  /d/:token           signed, expiring, use-limited artifact delivery
```

**The edge never emits `QUALIFIED_EXPOSURE`.** It counts views of its own page; it cannot know
an appropriate stranger was exposed. Do not change this. What it supplies is the product-view
denominator Phase C could not get from a provider. Its `CHECKOUT_STARTED` is labelled in its own
`reason` field as a first-party buy click, permanently, so it can never be confused with
Stripe's `checkout.session.created`.

**Commercial serving is off by default** (`allowCommercialListings: false` → 403).

### Accounting rules the next agent must not undo

- Micro-dollars are authoritative; the cent ceiling is derived. An adapter asserting its own
  disagreeing cent figure is rejected.
- The zero-cost path is keyed on **micros**. Never re-key it on cents.
- Reserve `ceil(micros/10,000)` cents per tranche; settle `ceil(sum(micros)/10,000)` **once**.
  Per-call ceiling would bill 100 cents for $0.021 of inference.
- Metered inference draws on **`discovery`**, not `validation` (`CONSTITUTION.md` §7:
  search-and-make spend must not consume the money reserved for buying a denominator).

### Verification

```bash
npm test                      # 93 tests, 0 skipped, with TEST_DATABASE_URL set
npx tsc --noEmit
DATABASE_URL=... ./db/tests/run.sh
DATABASE_URL=... npx tsx src/capital/authority.test.ts
```

Measured on 2026-08-19 against local PostgreSQL 16: **93 passed, 0 failed, 0 skipped**, Node
duration 1.196 s. Capital Authority 19/19. Database invariants unchanged: 10 constitutional
violations rejected, valid operations succeeded. TypeScript and `git diff --check` clean.

The complete fixture commerce path is exercised **over real HTTP against real PostgreSQL**,
including tearing the edge down mid-flight and rebuilding it: page → cookie → beacon → buy click
→ signed webhook → fulfillment → grant → thanks page → signed download → durable WATCH, with the
funnel replayed from the database, the redelivered webhook refusing to re-fulfill, the download
limit holding under 12 concurrent requests, and the transaction permanently `OWNER_TEST` at zero
eligible revenue.

### Still unverified after Phase E

- **The Cloudflare deployment.** `worker.ts` and `wrangler.toml` have never run. The handler is
  shared with the tested Node adapter, so what is unverified is the binding translation, not the
  commerce logic. `KvEdgeStateStore.consumeDownload` **throws by design**: KV cannot enforce a
  download limit atomically. Bind D1 or a Durable Object before serving a real download.
- **Live Stripe.** Sandbox only.
- **Commercial ARRIVE.** Unchanged from Phase C: unproven, and the hardest remaining problem.
- **MAKE quality.** The commercial Value QA contract exists and can fail things. Whether Factory
  can produce an artifact that passes it honestly is untested, because no artifact has been
  generated.

### Owner setup that Phase E did not request

Cloudflare account + API token (10–15 min) and R2/D1 provisioning + four Worker secrets
(5–10 min), recorded as E1–E2 in `OWNER_AUTONOMY.md`. Not requested, on the same rule that
deferred the inference credential: ask when the next agent will consume it immediately.

### Phase E external proof — 2026-08-19

The always-on commerce edge is no longer a simulation. A noncommercial fixture
Worker is deployed to Cloudflare at `https://factory-edge.whoknowsbruno15.workers.dev`
with a D1 database, and GitHub Actions run `32291422138` exercised the whole
path over the public internet: product page, first-party measurement, buy click
carrying the ARRIVE reference, a Stripe-signed and Stripe-delivered webhook,
fulfillment, signed download, download-limit enforcement, token tampering,
and webhook redelivery. 14/14 checks passed. Durable state was read back out of
production D1 afterwards, and production D1 rejected a WATCH mutation.

Cost $0.00 on free tiers with no card on file. Owner labor was one-time `SETUP`
(~25 minutes: Cloudflare account, least-privilege API token, two repository
secrets). Every temporary Stripe object was deactivated and the sandbox was
proven empty afterwards.

Nothing commercial happened. `COMMERCIAL_SERVING` was deployed as `disabled`,
the single transaction is `OWNER_TEST` and excluded from eligible revenue, and
every request came from a runner Factory controls — no stranger has arrived.
ARRIVE remains unsolved and no ARRIVE mechanism was selected.

Details, including the three defects live providers exposed and the three
scaling limitations deliberately left in place, are in
`docs/PHASE_E_EXTERNAL_PROOF.md`.

## Product-independent commercial readiness — 2026-08-19

The fixture edge and a commercial edge are now separate Workers on separate D1
databases, and the separation is enforced in three independent places: a single
source of truth for names (`src/edge/deploy/edge-targets.ts`), an immutable
identity stamp inside each database, and a refusal in every destructive script
that re-reads that stamp. Fixture teardown cannot see commercial Stripe objects.
The commercial deploy path has no reset step, regenerates no secret, and creates
or deletes no provider object.

Commercial serving requires three independent things to agree — the deployed
variable, the database's stamped purpose, and an owner authorization row — so
starting takes three deliberate acts and stopping takes one. `GET /posture`
reports the result and answers even while the edge is failing closed.

Proven externally on the live commercial database: secrets are installed once
and left alone, the identity stamp is written once, a redeploy preserves durable
journal state, and the journal is append-only in production. The fixture proof
still passes its 14 external checks and asserts its own posture is FIXTURE.

Two adjacent hazards were fixed: the capital suite's `DROP SCHEMA public
CASCADE` now requires the database to identify itself as disposable, and the
Data Economics Probe no longer commits results back to whatever branch triggered
it.

Nothing commercial exists. No product, no channel, no pricing, no live payments,
no launch authorization. `docs/PHASE_E_COMMERCIAL_ISOLATION.md` records what is
proven and what was deliberately deferred because it depends on Product #1 or
ARRIVE.

## Stop condition observed

Product #1 belongs to Codex. Phase E generated no product, selected no niche, performed no
market research, chose no inference provider, requested no credential, created no account,
deployed nothing, published nothing, and spent nothing.

---

## Phase D credential-free checkpoint (historical — see Phase E for repairs)

Read `docs/PHASE_D_CREDENTIAL_FREE.md` first. Four findings below were superseded by Phase E;
each is annotated in place.

Implemented without credentials or spend:

- typed `BUYER + PROBLEM + OFFER + MAKE + PUT + ARRIVE + WATCH` plans;
- provider/model-neutral inference adapter registry and per-task cost/quality router;
- explicit credential availability and fixture-only filtering;
- Capital Authority mediation for every nonzero inference quote and refusal before execution when
  authority/kill-switch checks fail;
- deterministic, idempotent fixture inference and Phase A renderer/QA reuse;
- bounded concurrent campaign preparation with per-experiment attribution and failure isolation;
- structural zero-per-asset owner operating-labor enforcement;
- independent launch-gate checks for E1 evidence, semantic verification, ARRIVE measurement,
  functional QA, Value QA, LIVE PUT, and non-fixture status;
- four-plan integration batch plus a 100-plan scale simulation.

Measured local simulation: 4/4 prepared in 13.174 ms at peak concurrency 3; 100/100 prepared in
74.254 ms at peak concurrency 12. **These numbers measure local event-loop throughput over
cloned fixtures with a zero-cost adapter.** Real portfolio concurrency will be bounded by
provider rate limits and platform policy, neither of which any run has exercised; do not cite
them as scaling evidence. Both reported zero launch eligibility, zero settled cost, and
zero owner operating minutes. These are deterministic local measurements, not provider/model
benchmarks or commercial evidence.

Complete local verification discovered 43 tests: 41 passed, 2 PostgreSQL integration tests skipped
because this workspace has no database service, and 0 failed. Node duration was 1.445 seconds and
shell wall time 1.771 seconds. TypeScript, runner syntax, and whitespace checks passed.

Important finding: routing prices use integer micro-dollars, but Capital Authority settles cents.
Before any metered adapter is enabled, implement/review exact usage persistence plus batch/provider
reconciliation so sub-cent calls are neither rounded down nor each charged as a full cent.

> **RESOLVED IN PHASE E**, and it was worse than described here: the zero-cost fast path was
> keyed on cents, so a sub-cent paid call would have executed with no reservation, no
> kill-switch check, and no ledger entry at all. See `docs/PHASE_E_REMEDIATION.md`.

No provider-specific credential name is embedded in the new contract. Do not default to Anthropic
or request any inference credential merely because this layer exists.

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

**Current, as of the Phase E remediation checkpoint.** Stop here. Do not generate a commercial
product, design the first experiment batch, generate further H0 candidates, perform product or
niche market research, enable a metered adapter, select an inference provider, request any
credential, serve a commercial listing from the edge, activate live Stripe, run another DEV fixture, spend capital, or
launch commercially without new owner authorization.

Product #1 and the first real commercial MAKE/ARRIVE campaign belong to the next engineering
agent, after this remediation has been reviewed.

The earlier Phase D stop condition said the same about metered MAKE and remains in force; Phase E
changed only which defect is next, not the permission boundary.

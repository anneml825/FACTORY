# ROADMAP.md

Build status and milestone sequence. The honest record of what exists.

**Sequence authority:** Master Codex §56 / Bootstrap Instructions v2.1 *Updated early
milestone sequence*. Where v2.1's earlier `## Milestone order` section conflicts, the updated
sequence governs (see the conflict note in `docs/spec/BOOTSTRAP_INSTRUCTIONS_v2.1.md`).

---

## Status legend

`DONE` verified working · `BUILT` code exists, not verified against the real external system ·
`DESIGNED` documented, not built · `BLOCKED` waiting on an owner action · `NOT STARTED`

---

## Current state — 2026-08-20

| Item | Status |
|---|---|
| Environment inspection | `DONE` |
| Governing documentation (9 files) | `DONE` |
| Source specs recorded verbatim | `DONE` |
| Database schema | `DONE` — applies to PostgreSQL 16; invariants verified (`db/tests/EXPECTED.md`) |
| Owner configuration migration | `DONE` — applied and verified against PostgreSQL 16 |
| **Capital Authority** | **`DONE`** — 19/19 verified, including concurrency under contention |
| **MAKE / PUT / ARRIVE / WATCH Phase A fixture infrastructure** | **`DONE` locally** — 12/12 tests; all commerce and arrival behavior simulated |
| **Phase B Stripe Managed Payments sandbox adapter** | **`DONE`** — run `32173279299` passed the complete provider-test lifecycle and deactivated all objects |
| **Phase C ARRIVE + durable WATCH** | **`DONE` as an engineering proof** — temporary DEV publication/analytics/deactivation, attributed Stripe sandbox transaction, PostgreSQL durability, and zero commercial evidence |
| **Phase E always-on commerce edge + required review remediation** | **`DONE` locally; external re-proof pending** — fixture and dormant commercial Workers/D1 were previously deployed; the approved remediation removes invalid unsigned WATCH canaries, scopes launch grants, completes §9 Value QA, makes inference tranches restartable, and adds durable owner-labor evidence. No commercial serving |
| Live database instance | `BLOCKED` — needs owner Neon account |
| External MAKE / PUT / ARRIVE / WATCH providers | Stripe PUT/WATCH and DEV publication/measurement plumbing externally exercised; genuine commercial ARRIVE and metered MAKE not started |

**Only provider-test commerce has happened.** Stripe sandbox objects, two owner-test checkouts,
two fulfillments, one refund, reconciliation, and deactivation occurred. No live publication,
real payment, arm's-length customer interaction, demand evidence, or capital spend occurred.

**Fixed monthly burn: $0.00.** **Owner capital consumed: $0.00.**
**Owner capital authorized: $50.00** (2026-08-17) — allocated but entirely unspent.
**Paid activity: HALTED** — the kill switch remains engaged. Authorizing capital is not
permitting spend, and nothing exists yet that could usefully spend it.

---

## Phase A — MAKE + PUT + WATCH fixture infrastructure

**Status: `DONE` locally. Cost: $0.00. Owner actions: 0.**

Implemented in `src/portfolio/`:

- typed `AssetManifest` and gate-enforced lifecycle state machine;
- deterministic short-document HTML and spreadsheet CSV fixture renderers;
- provider-neutral MAKE, PUT, ARRIVE, and WATCH contracts;
- fake/local PUT and fixture ARRIVE adapters;
- generated noncommercial fixture catalog;
- signed synthetic checkout, fulfillment, refund, and dispute events;
- end-to-end `experiment_id` attribution;
- owner/internal transaction exclusion;
- event, publication, fulfillment, revenue, refund, dispute, and cost idempotency;
- explicit zero-cost reservation/settlement records;
- KEEP / ITERATE / KILL / INSUFFICIENT_SIGNAL evaluation.

Local verification: **12/12 tests pass** using Node's built-in test runner. The final timed test
process reported 760 ms; measured shell wall time was 1.109 seconds. See `AGENT_HANDOFF.md` for the
exact command and limitations.

**This is executable simulation, not a money spine.** No external system was contacted. No
real publication, checkout, payment, fulfillment, customer, revenue, refund, dispute, or
arrival evidence exists. `COMMERCIAL_CLOCK_START` remains unset. Phase B was approved on
2026-08-18. Its Stripe provider-test path is now built and has reached the real sandbox; see
`docs/PHASE_B_STRIPE_SANDBOX.md`.

---

## Phase B — Stripe Managed Payments sandbox

**Status: `DONE` for the scoped sandbox proof. Cost: $0.00.**

The implementation creates a noncommercial test Product, Price, and Managed Payments Payment
Link; accepts only Stripe sandbox credentials and `livemode=false` objects/events; verifies raw
Stripe signatures; fulfills an attributed fixture; handles duplicate/out-of-order checkout,
refund, and dispute events; reconciles provider state; and deactivates all provider objects.

Local verification: **21/21 combined Phase A + Phase B tests pass**. Provider run `32173279299`
then passed Product/Price/Payment Link creation, two owner-test Checkouts, signed webhooks, two
fulfillments, refund, dispute recovery, full reconciliation, zero commercial settlement, and
deactivation. The owner approved Phase C on 2026-08-18; its noncommercial engineering proof is
complete.

---

## Phase C — provider-neutral ARRIVE + durable WATCH

**Status: `DONE` as an engineering proof. Genuine commercial ARRIVE: `UNPROVEN`. Cost: $0.00.**

Implemented: a provider-neutral activation/measurement/deactivation contract, one DEV
Community pilot adapter, cumulative-metric idempotency, a crash-durable local journal, an
append-only PostgreSQL WATCH inbox, durable Stripe webhook/transaction state, explicit
`EXCEPTION` labor, and visible `checkout.session.async_payment_failed` handling.

A temporary DEV article was created and automatically unpublished. The controlled browser load
did not appear in DEV totals within ten minutes, so DEV analytics is not accepted as a timely
visit instrument. The ARRIVE reference nevertheless propagated into a fulfilled Stripe sandbox
transaction and remained excluded from commercial evidence. See
`docs/PHASE_C_ARRIVE_DURABLE_WATCH.md`.

---

## Phase E — remediation and commercial readiness

**Status: `DONE` locally for the repair pass; safe commercial-edge redeploy proof pending. Cost: $0.00. No product, no mechanism.**

An independent read-only review of Phase D found that Factory had no internet-facing component
at all, that a sub-cent inference cost would have bypassed the Capital Authority entirely, that
§18 cost discipline was dead code, and that Value QA could not fail a worthless artifact.
Phase E repairs those and nothing else.

Delivered:

- `src/edge/` — always-on commerce edge (product page, first-party PRODUCT_VIEW /
  OFFER_INTERACTION / buy-click measurement, Stripe webhook reception, signed expiring
  use-limited delivery from object storage), proven over real HTTP against real PostgreSQL
  including a mid-flight restart;
- micro-denominated inference accounting with tranche reservation, append-only usage journal,
  aggregate settlement, and provider reconciliation that fails closed;
- the `discovery` bucket named as the inference funding source, replacing a hard-coded bucket
  that did not exist;
- §18 pre-revenue cost discipline enforced before any provider call;
- commercial Value QA with deterministic / model-review / owner-exception classification, able
  to fail a technically valid artifact;
- COMMERCIAL engine mode with stricter publication gates;
- observed-versus-declared owner-labour reconciliation;
- an ARRIVE adapter registry holding several mechanisms, selecting none.

**Nothing commercial happened.** No product, buyer, niche, listing, arrival mechanism,
inference provider, credential, or capital. See `docs/PHASE_E_REMEDIATION.md`.

Cloudflare fixture and dormant commercial Workers plus separate D1 databases are deployed on
the free plan. Commercial serving remains false. The earlier commercial deploy proof wrote
four invalid unsigned canaries into WATCH; the required remediation moves canaries to
`edge_deploy_canary` and includes a fenced one-time cleanup plus a normal-route `404` smoke
test. Until that redeploy is green, external remediation status remains pending.

---

## Milestone 0A — Governance + financial control plane

**Status: partially complete, then `BLOCKED` on owner authorization.**

| Component | Status |
|---|---|
| Documentation architecture | `DONE` |
| Schema: buckets, ledger, reservations, flags | `DONE` (verified) |
| Append-only ledger enforcement | `DONE` (verified) |
| Bucket overdraw prevention | `DONE` (verified) |
| Idempotency uniqueness | `DONE` (verified) |
| Kill switch, ships engaged | `DONE` (verified) |
| Capital Authority (TypeScript) | `DONE` (verified) |
| Reserve → execute → settle logic | `DONE` (verified) |
| Concurrency safety under contention | `DONE` (verified) |
| Owner capital authorization + buckets | `DONE` — $50 allocated 30/10/10, reserve from earnings |
| Recurring-cost registry population | `NOT STARTED` — nothing to register at $0 burn |
| Live database instance | `BLOCKED` — needs owner Neon account |

**Exit criteria:** Capital Authority refuses an unauthorized spend, in code, against a live
database, under a passing concurrency test. **Met, against a local PostgreSQL 16 instance —
19/19 checks pass** (`src/capital/authority.test.ts`).

The concurrency result is the one that mattered: 40 workers racing to reserve from a bucket
funding exactly 10 produced **exactly 10 successes, no overdraw, no deadlock**, with every
rejection a clean `InsufficientBucketFunds`. A naive check-then-write implementation passes
every sequential test and still overdraws here — which is precisely how owner capital would
quietly leak.

**Remaining for 0A:** run the same suite against the owner-provisioned Neon instance. Verified
locally is not verified in production.

---

## Milestone 0B — Data Economics Probe

**Status: `DONE` for the historical data probe; no ARRIVE provider selected. Cost: $0.00.**

The WordPress.org investigation found a developer-data search space, but later semantic review
invalidated its opportunity conclusions and the owner rejected WordPress as Factory's default
commercial/ARRIVE path. `state/WP_GATE.md` and `docs/SEARCH_SPACE_SELECTION.md` are historical
probe records, not current authorization.

The consumer-niche search space remains **FAIL** and is not reopened.

Decision and next options: [`docs/DATA_ECONOMICS_GATE_DECISION.md`](docs/DATA_ECONOMICS_GATE_DECISION.md).
Raw measurements: [`state/DATA_ECONOMICS_PROBE.md`](state/DATA_ECONOMICS_PROBE.md).

100 candidates, stratified, 6 sources, 600 requests, run in GitHub Actions (ADR-2a).
**Every free source returns nothing or zero for long-tail candidates**, and the only
DIRECT commercial source is blocked on an unregistered free credential.

Run 1 passed spuriously on two sources at 100% coverage whose long-tail median was zero —
search endpoints always return a count, and coverage measured whether a source *answered*
rather than whether the answer *distinguished* anything. Three tightening criteria were added
post-hoc (disclosed), and the gate correctly failed.

**Factory does not proceed to high-volume autonomous screening until this passes**
(`EXPERIMENTAL_PROTOCOL.md` §7). Cheapest credible path is free Etsy/eBay developer
registration (~30 min owner time, $0). A genuine strategic fork — narrowing the search space
to developer tools, where free evidence already works well — awaits an owner decision.

**Original design notes, retained:**

Measures, for each candidate source, all eleven required fields, and above all the measured
**`pct_candidates_with_retrievable_E1`** across a real candidate set. Computes screening
capacity at $1, $5, $10.

**Gate:** at least one pipeline whose cost, coverage, reliability, and terms are compatible
with available capital and intended Campaign volume. Proposed go/no-go thresholds are in
`IMPLEMENTATION_BRIEF.md`.

**This gate can fail, and failing is a legitimate outcome.** If no free pipeline reaches the
threshold, Factory redesigns the search strategy before spending validation capital — it does
not proceed on model-estimated numbers.

---

## Milestone 1 — Money spine

**Status: sandbox proof `DONE`; live money spine `NOT STARTED`.**

One deliberately hand-selected inexpensive offer proving:

```
REAL VISITOR → OFFER → CHECKOUT → REAL PAYMENT → WEBHOOK
             → AUTOMATED FULFILLMENT → TRANSACTION RECORD
             → ATTRIBUTED REVENUE → ATTRIBUTED COST → PROFIT LINE
```

**Critical verification item:** attribution must survive the merchant-of-record boundary
(`DISTRIBUTION.md`). If an experiment ID cannot be carried through to the transaction record,
every downstream denominator is unreliable. This is proven at Milestone 1 or the Campaign
cannot learn.

**Exit criteria:** an owner test purchase completes the full chain and produces a correct,
attributed profit line, with the transaction flagged `OWNER_TEST`.

**This proves plumbing. It proves nothing about demand** (`EXPERIMENTAL_PROTOCOL.md` §13).

---

## Milestone 2 — Initial Campaign + Stranger Arrival Mechanism

**Status: `NOT STARTED` commercially. No surface is locked.**

WordPress.org is explicitly not selected. Phase C uses DEV Community only for one
noncommercial empirical infrastructure probe. A later Campaign may choose DEV, Pinterest,
another adapter, or multiple Campaign-specific adapters based on measured fit; none is a
universal default.

Lock one distribution surface, one product family, one checkout/fulfillment architecture, one
pricing pattern, common analytics. Candidate families and their unresolved objections are in
`DISTRIBUTION.md`.

**Exit criteria:** a Stranger Arrival Mechanism passing all six questions, with
`measurement_verified_at` set — an instrument confirmed to actually record, not merely
configured.

---

## Milestone 3 — Value QA + autonomous attempt loop

**Status: `CREDENTIAL-FREE INFRASTRUCTURE IMPLEMENTED`; commercial loop not started.**

Phase D implements typed complete experiment plans, provider-neutral per-task inference routing,
Capital Authority mediation, deterministic fixture QA, bounded concurrent preparation, and
fail-closed launch gates. Four fixtures prove integration only; a 100-plan local simulation proves
there is no 3–5 asset architecture cap or per-asset owner operating step. No provider credential,
metered inference, E1 evidence, commercial product, live PUT, or commercial ARRIVE has started.
See `docs/PHASE_D_CREDENTIAL_FREE.md`.

Factory retrieves E1 signals, selects opportunities within Campaign constraints, builds,
passes Value QA, launches within policy, measures, kills or iterates — **without owner
prompting**.

**`COMMERCIAL_CLOCK_START` is set when this milestone's loop is genuinely operational** and
all seven conditions in `EXPERIMENTAL_PROTOCOL.md` §10 hold. Enforced by DB constraint: the
clock cannot start with an unmet condition.

**From here, owner maintenance/debugging counts against the autonomy thesis.**

---

## Milestone 4 — Arm's-length commercial validation

**Status: `NOT STARTED`.**

Seek arm's-length transactions within cash and owner-time budgets. Target ~30 attempts,
abandoned early if a Campaign stop condition fires.

**Exit criteria:** ≥1 arm's-length transaction (E3) **with its denominator preserved**.

---

## Milestone 5 — Day-30 / Day-90 gates + continuous autonomy gate

**Status: `NOT STARTED`.** Automatic once the clock starts.

- **Day 30:** meaningful E2 evidence, or a mandatory Campaign review with no automatic spend
  increase.
- **Day 90:** zero arm's-length transactions → default recommendation **STOP FUNDING THE
  AUTONOMOUS-ENTREPRENEUR THESIS**.
- **Continuous:** owner labor over budget → Autonomy Failure Review, *regardless of revenue*.

Factory must be capable of recommending its own shutdown, and must not manufacture
justification to avoid it.

---

## Milestones 6–11

`NOT STARTED`, and deliberately not elaborated. Each is gated on evidence that does not exist.

**6.** Opportunity-radar expansion — *only after* data economics are demonstrated.
**7.** Automated publishing/distribution.
**8.** Portfolio SCALE / ITERATE / KILL decisions.
**9.** Self-funding — **cannot begin until cumulative revenue clears a payout threshold**
(`INTEGRATIONS.md`), a materially higher bar than first sale.
**10.** Repeatability and Ceiling Phase — triggered by the first positive autonomous loop.
Tests repeatability, depth, breadth **before** any scaling claim.
**11.** Scale engines and portfolio compounding.

Detailed planning of these now would be fiction. They are listed for sequence, not designed.

---

## Blocking owner actions

Factory cannot proceed past Milestone 0A without items 1–4 in `OWNER_AUTONOMY.md`
(~15 minutes total). Everything else on this roadmap is Factory's work.

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

## Current state — 2026-08-17

| Item | Status |
|---|---|
| Environment inspection | `DONE` |
| Governing documentation (9 files) | `DONE` |
| Source specs recorded verbatim | `DONE` |
| Database schema | `DONE` — applies to PostgreSQL 16; invariants verified (`db/tests/EXPECTED.md`) |
| Capital Authority code | `NOT STARTED` |
| Everything else | `NOT STARTED` |

**Nothing external has happened.** No account created, no credential issued, no service
contacted, no deployment, no payment, no publication, no customer interaction.

**Fixed monthly burn: $0.00.** **Owner capital consumed: $0.00.** **Owner capital at risk:
$0.00** — the ceiling ships at zero and the kill switch ships engaged.

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
| Capital Authority (TypeScript) | `NOT STARTED` |
| Reserve → execute → settle logic | `NOT STARTED` |
| Concurrency safety under contention | `NOT STARTED` — designed, unproven |
| Recurring-cost registry population | `NOT STARTED` |
| Live database instance | `BLOCKED` — needs owner Neon account |

**Exit criteria:** Capital Authority refuses an unauthorized spend, in code, against a live
database, under a passing concurrency test.

---

## Milestone 0B — Data Economics Probe

**Status: `DESIGNED`.** Runs immediately after 0A. Costs $0 — free sources only.

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

**Status: `NOT STARTED`. `BLOCKED` on owner MoR account.**

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

**Status: `NOT STARTED`.** Requires 0B to have passed.

Lock one distribution surface, one product family, one checkout/fulfillment architecture, one
pricing pattern, common analytics. Candidate families and their unresolved objections are in
`DISTRIBUTION.md`.

**Exit criteria:** a Stranger Arrival Mechanism passing all six questions, with
`measurement_verified_at` set — an instrument confirmed to actually record, not merely
configured.

---

## Milestone 3 — Value QA + autonomous attempt loop

**Status: `NOT STARTED`.** The first real test of the thesis.

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

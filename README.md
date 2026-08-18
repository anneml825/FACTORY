# Factory

An autonomous, profit-first internet-business experimentation system.

Factory's purpose is to discover economically promising opportunities, test them cheaply,
build and operate offers, acquire customers, collect real revenue, fulfill automatically,
measure actual profitability, scale winners, kill losers — **without becoming a second job for
its owner.**

Two co-equal objectives: **maximize sustainable realized profit** and **minimize routine owner
labor**. Neither outranks the other.

> **I CHECK. FACTORY OPERATES.**

---

## Status — 2026-08-18

**Phase B Stripe sandbox proof passed. Phase C ARRIVE + durable WATCH is built and awaits its
one noncommercial provider probe.**

| | |
|---|---|
| Fixed monthly burn | **$0.00** |
| Owner capital consumed | **$0.00** |
| Owner capital authorized | **$50.00 maximum lifetime exposure; $0.00 consumed** |
| Paid activity | **HALTED** — kill switch ships engaged |
| Arm's-length transactions | **0** |
| Commercial clock | **not started** |

**External evidence is sandbox-only.** Stripe test objects and owner-test transactions proved
PUT/WATCH plumbing; they produced no commercial revenue or demand evidence. No public ARRIVE
fixture has yet been published.

**→ Start with [`IMPLEMENTATION_BRIEF.md`](IMPLEMENTATION_BRIEF.md).**

---

## Reading order

**If you are an agent working on Factory: read [`AGENTS.md`](AGENTS.md) first. Every time.**

| Document | What it is |
|---|---|
| [`CONSTITUTION.md`](CONSTITUTION.md) | Permanent rules. **Highest authority.** Short by design — re-read it, don't recall it |
| [`EXPERIMENTAL_PROTOCOL.md`](EXPERIMENTAL_PROTOCOL.md) | The gates. Required reading before any economic experiment |
| [`IMPLEMENTATION_BRIEF.md`](IMPLEMENTATION_BRIEF.md) | Current plan, findings, risks, and what the owner must decide |
| [`ROADMAP.md`](ROADMAP.md) | Honest build status — what exists, what doesn't |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Stack, ADRs, data model |
| [`FINANCIAL_CONTROLS.md`](FINANCIAL_CONTROLS.md) | How the money is protected |
| [`DISTRIBUTION.md`](DISTRIBUTION.md) | How strangers find offers — the hardest unsolved problem |
| [`OWNER_AUTONOMY.md`](OWNER_AUTONOMY.md) | Every owner action, why, how long, how it gets removed |
| [`INTEGRATIONS.md`](INTEGRATIONS.md) | Provider comparisons and their reliability caveats |
| [`docs/spec/`](docs/spec/) | The two source specifications, verbatim. Records — never edit |

---

## Governing principles

- **Revenue is not spend authority.** Only settled, available cash is deployable.
- **Only arm's-length customer revenue** counts toward a commercial gate. Owner test purchases
  verify plumbing and nothing else.
- **No experiment launches** without a specific, measurable Stranger Arrival Mechanism.
- **No opportunity reaches E1** without an independently retrieved quantitative signal.
  Model-invented market numbers are forbidden — and structurally unwritable (§below).
- **Owner capital at risk never increases autonomously.**
- **No fake functionality, and no claim that an external action occurred unless it did.**
- **There is no artificial profit ceiling.** The $50 bounds initial exposure, not ambition.

## Controls are enforced, not described

The protections in `CONSTITUTION.md` live in the database. Constitutional violations are
tested against PostgreSQL—including
inserting a market statistic with no source or retrieval timestamp, which is `NOT NULL`-blocked
and therefore cannot be written at all.

Verified results: [`db/tests/EXPECTED.md`](db/tests/EXPECTED.md). Reproduce with
`DATABASE_URL=… ./db/tests/run.sh`.

The design target: *an agent that decides to violate a financial or evidentiary rule still
fails.*

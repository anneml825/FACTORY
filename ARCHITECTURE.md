# ARCHITECTURE.md

How Factory is built and where it runs. Subordinate to `CONSTITUTION.md`.

---

## Design pressure

Factory has an unusual constraint profile that drives nearly every decision here:

- **Total capital is $50, once.** Any fixed monthly cost is an existential threat, not a line
  item. $20/month consumes the entire capital base in ten weeks without a single experiment.
- **The owner must not operate it.** Anything requiring a laptop to be open, a tab to stay
  alive, or a human to re-run something is a mission failure even if it works.
- **It must survive its own build environment.** The container this was built in is ephemeral
  and will be reclaimed. Factory cannot live there.

The architecture is therefore optimized for **zero fixed burn and durable unattended
operation**, in that order, ahead of elegance or scalability. Scalability is a problem
Factory earns the right to have.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (Node 22) | Master Codex §46 preference; available in environment |
| State | PostgreSQL | Constraints and transactions are where financial protections actually live |
| DB host | Neon free tier | 0.5 GB, scale-to-zero, $0. Sufficient by orders of magnitude for this data volume |
| Scheduler | GitHub Actions `schedule` | Durable, unattended, already owned, $0 |
| Dashboard | Generated Markdown committed to repo | Readable on GitHub from any device, $0, no hosting, no ToS question |
| Storefront | Merchant-of-record hosted pages | See `INTEGRATIONS.md`. Avoids hosting a commercial site entirely |
| Money | Integer cents (`BIGINT`) + ISO currency code | Floating-point money is a defect class we decline to have |

### ADR-1 — Deviation from the suggested Vercel deployment

Master Codex §46 suggests Vercel. Factory does not deploy to Vercel at bootstrap.

Vercel's Hobby (free) plan is designated for personal, non-commercial use; a storefront
transacting with strangers is commercial. The compliant tier is Pro at ~$20/month — **40% of
total owner capital, monthly, before a single experiment runs.**

Factory instead runs as scheduled jobs against a managed Postgres, and lets the merchant of
record host the customer-facing pages. This removes the need for a commercial web host at
bootstrap altogether, rather than paying to solve a problem we can avoid having.

*This deviation is recorded rather than silently taken. If a self-hosted surface later
becomes necessary, hosting cost re-enters as a real spend decision under the Capital
Authority, and the Vercel ToS position must be verified directly against current terms
before deploying — the position above is from general knowledge, not a checked contract.*

### ADR-2 — GitHub Actions as the durable runtime

Scheduled workflows give durable, unattended execution at zero cost on an account the owner
already has.

**Known reliability caveats, both of which are autonomy risks and are mitigated, not
ignored:**

1. **Scheduled workflows are disabled after ~60 days of repository inactivity** on free
   accounts. An autonomous system whose scheduler silently stops is an autonomy failure that
   *presents as* commercial failure — Factory would appear to be trying and failing to sell,
   when in fact it stopped running. Mitigation: Factory commits its own state and dashboard
   on every run, which is itself repository activity; plus an explicit heartbeat check
   (below).
2. **`schedule` triggers are best-effort and can be delayed** under platform load, sometimes
   by tens of minutes. Factory's cadence must tolerate this. Nothing may depend on running
   at an exact minute.
3. **Private-repo minutes are metered** (2,000/month on Free). Factory's jobs are small, but
   usage is tracked in the recurring-cost registry as a non-cash resource with a ceiling.

**Heartbeat.** Every scheduled run writes `last_successful_run_at`. The dashboard shows time
since last run prominently. If the scheduler dies, the owner sees a stale clock rather than a
quiet absence of results — the failure is visible instead of invisible.

### ADR-2a — Evidence retrieval runs in Actions, not in build sessions

Measured 2026-08-18: the agent build container's egress policy **denies general
internet hosts**. Wikipedia, Etsy, eBay, Google Trends, Reddit, and StackExchange all
returned `403` at the gateway on `CONNECT`. Only package registries (npm, PyPI, crates.io,
Go proxy) and GitHub are reachable.

This is a policy denial, not a misconfiguration, and it is not to be routed around.

**Consequence:** no evidence retrieval, Data Economics Probe, or Scout work can run inside a
build session. All of it belongs in GitHub Actions, which has normal egress — which is where
Factory's durable work runs anyway (ADR-2), so this costs nothing architecturally.

**The trap it creates:** a probe run in a build session returns near-total failure and *looks
exactly like* a genuine finding that no data source works. It is not a measurement, and it
must never be recorded as one. Probe output produced under a blocked egress policy is
discarded, not committed. This already happened once during development and the output was
deleted rather than published.

### ADR-3 — Financial protections live in the database

`CONSTITUTION.md` §8 requires that controls not be prose. Concretely:

- **The ledger is append-only**, enforced by a trigger that rejects `UPDATE` and `DELETE`.
  Corrections are new compensating entries, never edits. History cannot be rewritten.
- **Balances carry `CHECK` constraints** that make an overdrawn bucket unrepresentable.
- **Reservation, kill-switch read, and balance check happen in one serializable
  transaction.** A paid operation cannot slip between the check and the commit.
- **`idempotency_key` is `UNIQUE`.** Double-spend on retry is prevented by the database, not
  by remembering to check.
- **Bucket transfers have no code path.** Not "restricted" — absent. An agent cannot call a
  function that does not exist.

The goal is that an agent which *decides* to violate a financial rule still fails.

---

## Repository layout

```
/                            governing docs (AGENTS, CONSTITUTION, EXPERIMENTAL_PROTOCOL, …)
  docs/spec/                 verbatim source specifications — records, not working docs
  docs/decisions/            ADRs beyond those inline here
  db/schema.sql              authoritative schema
  db/migrations/             ordered migrations
  src/capital/               Capital Authority, ledger, reservations, kill switch
  src/evidence/              E1 signal retrieval + persistence, source adapters
  src/experiments/           Campaign, experiment lifecycle, gates
  src/portfolio/             Phase A MAKE / PUT / ARRIVE / WATCH contracts and fixture harness
  src/workers/               scout, analyst, producer, qa, publisher, measurement, …
  src/adapters/              external services behind interfaces
  src/dashboard/             owner check-in renderer
  .github/workflows/         scheduled durable jobs
  state/                     generated dashboard + reports (committed)
```

---

## Data model

Authoritative definition: `db/schema.sql`. Shape and intent:

**Capital and money**
`capital_bucket` — named, source-tagged, non-transferable partitions of capital ·
`ledger_entry` — append-only record of every financial event ·
`spend_reservation` — RESERVE → EXECUTE → SETTLE lifecycle, unique idempotency key ·
`customer_transaction` — sales, classified `OWNER_TEST` / `INTERNAL_TEST` /
`ARM_LENGTH_CUSTOMER` / `OTHER_OR_UNKNOWN` · `recurring_cost` — fixed burn registry ·
`system_flag` — kill switch and other global state

**Owner labor**
`owner_intervention` — one row per human action, typed into operating / maintenance-debug /
setup / approval, with minutes and automatability

**Experimentation**
`campaign` · `opportunity` · `experiment` · `evidence_signal` (the seven mandatory E1 fields)
· `funnel_observation` (denominators at each stage) · `value_qa_review` ·
`data_source_probe` (Data Economics Gate measurements)

**Clocks and gates**
`commercial_clock` — single row, set once, with per-condition evidence · `gate_event` —
every gate evaluation and its outcome, including the ones that passed

### Two modeling commitments worth stating

**Money is never a float.** All amounts are `BIGINT` cents with an explicit currency.

**Evidence carries its provenance or it is not evidence.** `evidence_signal` makes all seven
fields (`metric_name`, `numeric_value`, `unit`, `source`, `retrieved_at`, `collection_method`,
`reliability_limitations`) `NOT NULL`. A model-invented number has no source and no retrieval
timestamp, so it cannot be inserted. `EXPERIMENTAL_PROTOCOL.md` §2 is enforced by the schema
rather than by an agent's discipline.

---

## Worker architecture

Narrow modules with structured inputs/outputs, per Master Codex §34: `SCOUT` · `RESEARCHER` ·
`ANALYST` · `STRATEGIST` · `PRODUCER` · `QA` · `PUBLISHER` · `DISTRIBUTION` · `MEASUREMENT` ·
`FULFILLMENT` · `PORTFOLIO_MANAGER`.

**No worker holds a payment credential or calls a paid API directly.** Paid capability is
mediated by the Capital Authority, which is the only component that can authorize spend.

**Workers are built when the milestone needs them**, not up front. A swarm of agents with
nothing verified to do is exactly what the Bootstrap Instructions forbid.

---

## What exists and what does not

The Phase A in-memory fixture path in `src/portfolio/` is implemented and locally verified. It
executes typed manifests, deterministic HTML/CSV rendering, gate-enforced state transitions,
a fake/local PUT adapter, signed synthetic WATCH events, attribution, exclusions,
idempotency, zero-cost records, and evaluation. It does **not** use PostgreSQL and does not
prove any external provider, deployment, payment, arrival mechanism, or durable recovery.

The Phase B Stripe Managed Payments sandbox PUT/WATCH adapter has passed a real provider run.
GitHub Actions run `32173279299` created Product/Price/Payment Link objects, completed two
owner-test Checkouts and fulfillments, observed a refund, recovered a missing dispute effect,
fully reconciled both transactions, preserved zero commercial settlement, and deactivated every
provider object. The adapter repairs missing refund/dispute effects idempotently from
authoritative provider objects. It remains restricted
to noncommercial fixtures, sandbox keys, and `livemode=false` objects/events. Stripe CLI forwarding
is ephemeral test infrastructure, not production hosting.

Phase C now implements the provider-neutral ARRIVE activation/measurement/deactivation contract,
a first DEV Community noncommercial pilot adapter, an fsynced local WATCH journal, and an
append-only PostgreSQL WATCH/webhook state boundary. The credential-free restart tests are local;
the real public DEV probe has not yet run. External MAKE remains unimplemented. `ROADMAP.md`
tracks the honest build status.

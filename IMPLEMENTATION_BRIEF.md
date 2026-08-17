# Initial Implementation Brief

**Date:** 2026-08-17 · **Phase:** Bootstrap complete, Milestone 0A partially built
**Required by:** Bootstrap Instructions v2.1, *First response to the owner* + *Additions to
the first implementation brief*

---

## 1. Current repository state

Empty at session start — no commits, no upstream heads, no prior code or documentation.

Now contains: nine governing documents, both source specifications recorded verbatim, a
verified database schema, and an invariant test suite.

**Nothing external has occurred.** No account created, no credential issued, no service
contacted, no deployment, no payment, no publication, no customer interaction, no listing.

| Metric | Value |
|---|---|
| Fixed monthly burn | **$0.00** |
| Owner capital consumed | **$0.00** |
| Owner capital at risk | **$0.00** (ceiling ships at zero) |
| Paid activity | **HALTED** (kill switch ships engaged) |
| Owner minutes consumed so far | ~10 (supplying the two specifications) |

---

## 2. Files created

**Governing** — `AGENTS.md` · `CONSTITUTION.md` · `EXPERIMENTAL_PROTOCOL.md` · `ROADMAP.md` ·
`ARCHITECTURE.md` · `FINANCIAL_CONTROLS.md` · `DISTRIBUTION.md` · `OWNER_AUTONOMY.md` ·
`INTEGRATIONS.md`

**Records** — `docs/spec/MASTER_CODEX_v5.1.md` · `docs/spec/BOOTSTRAP_INSTRUCTIONS_v2.1.md`
(verbatim, with provenance and completeness notes) · `ENVIRONMENT_INSPECTION.md`

**Implementation** — `db/schema.sql` · `db/tests/invariants.sql` · `db/tests/run.sh` ·
`db/tests/EXPECTED.md`

---

## 3. Milestone 0A architecture

Full reasoning in `ARCHITECTURE.md`. Three decisions carry the design:

**Zero fixed burn is an existential requirement, not a preference.** $20/month consumes the
entire capital base in ten weeks with zero experiments run. Everything below follows from
this.

| Layer | Choice | Cost |
|---|---|---|
| Language | TypeScript (Node 22) | $0 |
| State | PostgreSQL on Neon free tier | $0 |
| Scheduler | GitHub Actions `schedule` | $0 |
| Dashboard | Markdown committed to the repo, read on GitHub | $0 |
| Customer-facing pages | Merchant-of-record hosted | $0 |

**ADR-1 — no Vercel at bootstrap.** Master Codex §46 suggests it. Vercel's free Hobby tier is
designated personal/non-commercial; a storefront transacting with strangers is commercial, and
the compliant Pro tier is ~$20/month — 40% of total capital, monthly. Factory instead lets the
merchant of record host customer-facing pages, removing the need for a commercial web host
entirely rather than paying to solve an avoidable problem. *Deviation recorded, not silently
taken.*

**ADR-2 — GitHub Actions as the durable runtime.** The build container is ephemeral and cannot
host Factory. Actions gives durable unattended execution at $0 on infrastructure the owner
already has. Two known risks are mitigated rather than ignored: scheduled workflows disable
after ~60 days of repo inactivity (Factory commits state on every run, and a **heartbeat** on
the dashboard makes scheduler death visible rather than silent), and `schedule` triggers can
lag (nothing may depend on exact timing).

**ADR-3 — protections live in the database, not in prose.** The design target: *an agent that
decides to violate a financial rule still fails.*

---

## 4. Capital Authority / ledger schema — built and verified

`db/schema.sql`, applied to PostgreSQL 16 and tested. **Money is `BIGINT` cents everywhere;
never floating point.**

**Core tables:** `capital_bucket` (source-tagged, non-transferable partitions) ·
`ledger_entry` (append-only) · `spend_reservation` (RESERVE→EXECUTE→SETTLE) ·
`recurring_cost` · `system_flag` (kill switch) · `customer_transaction` (arm's-length
classification, three separate cash timestamps) · `owner_intervention` · `campaign` ·
`opportunity` · `stranger_arrival_mechanism` · `evidence_signal` · `experiment` ·
`funnel_observation` · `value_qa_review` · `data_source_probe` · `commercial_clock` ·
`gate_event`

### Verified enforcement

Nine constitutional violations were attempted against a live database. **All nine were
rejected.** Three valid operations succeeded. Full results: `db/tests/EXPECTED.md`.

| Attempted violation | Blocked by |
|---|---|
| Rewrite or delete ledger history | append-only trigger |
| Overdraw a bucket (directly, or via reserved+spent) | `bucket_not_overdrawn` CHECK |
| Reuse an idempotency key (double-spend on retry) | `UNIQUE` constraint |
| Settle above the reserved maximum | `settled_within_reservation` CHECK |
| **Insert a market number with no source or retrieval time** | `NOT NULL` on all seven E1 fields |
| Start the commercial clock with unmet conditions | `clock_requires_all_conditions` CHECK |
| Owner override with no stated reason | `override_requires_reason` CHECK |

The fifth is the one I would highlight. `EXPERIMENTAL_PROTOCOL.md` §2 forbids model-invented
market metrics — the most likely way this project fools itself. A fabricated number has no
source and no retrieval timestamp, and those columns are `NOT NULL`, so **it cannot be
written down.** The rule is enforced by the schema rather than by an agent choosing to comply.

**Honest limit:** this covers the storage layer only. Nothing stops an agent putting a
fabricated number in a report or a text field. The schema narrows the hole; `AGENTS.md` §5
governs the rest.

**Buckets have no transfer function anywhere in the codebase.** Not restricted — absent.

### Proposed bucket allocation (owner decision)

| Bucket | Proposed | Purpose |
|---|---|---|
| `VALIDATION` | **$30** | Real experiments with real exposure |
| `DISCOVERY` | **$10** | Data retrieval, screening |
| `INFRASTRUCTURE` | **$10** | Unavoidable operating cost, held in reserve |
| `RESERVE` | **$0** | Refund/chargeback — funded from *revenue*, not owner capital |

Validation is weighted heaviest because `EXPERIMENTAL_PROTOCOL.md` §5 warns that
underfunded experiments are uninformative, not cheap.

---

## 5. External services that may eventually require accounts

Full comparison in `INTEGRATIONS.md`. All figures retrieved 2026-08-17 from public sources
and **must be re-verified against provider documentation before any spend decision.**

| Service | Purpose | Owner action | Cost |
|---|---|---|---|
| **Neon** | Postgres | Account + `DATABASE_URL` secret | $0 |
| **Merchant of record** | Checkout, fulfillment, sales-tax remittance | Account + identity + payout setup | Per-transaction only |
| GitHub Actions | Scheduler | Already owned | $0 |
| Etsy / eBay developer | E1 evidence | Possibly app registration | $0 |
| DataForSEO | Search-volume data | **Deferred** — see §8 | $50 min deposit |

### Merchant of record — provisional, decided at Milestone 1

| Provider | Fee | Payout min | Note |
|---|---|---|---|
| **Lemon Squeezy** | 5% + $0.50 | **$50** | Best economics and cash timing |
| **Gumroad** | 10% + $0.50 | **$100** | Worse economics, but **Discover is a real discovery surface** |
| Paddle | 5% + $0.50 | — | Heavier approval, aimed at scaling SaaS |
| Polar | 5% + $0.50 | $100 | Cheaper rates now behind paid plans — disqualifying at $0 burn |
| Stripe direct | 2.9% + $0.30 | low | **Not an MoR** — leaves all tax compliance as recurring owner labor |

**MoR over bare Stripe is chosen on owner-labor grounds, not cost.** Multi-jurisdiction
sales-tax administration is precisely the recurring, unautomatable owner work
`CONSTITUTION.md` §2 exists to prevent.

The Gumroad/Lemon Squeezy choice is genuinely open, and it is not a price question. It is:
**does Factory need to buy distribution through fees because it cannot buy it with capital?**
Gumroad's 30% Discover fee purchases access to a discovery surface Factory has no other way
to obtain at $0 ad budget. That question belongs to Milestone 2, informed by the Data
Economics Probe.

### The payout-threshold trap — most important finding here

**Every surveyed MoR holds a payout minimum at or above the entire $50 capital base.**

Under `CONSTITUTION.md` §4, money below that threshold is **not** `AVAILABLE_SETTLED_CASH`.
Factory can be genuinely earning and have **zero** deployable cash. Consequences:

- Early revenue is real **evidence** (E3/E4) but **not usable capital**. The dashboard reports
  these separately and must never conflate them.
- **Self-funding (Milestone 9) cannot begin at first sale** — it begins when cumulative net
  revenue clears a payout threshold. A materially higher bar.
- `customer_transaction` carries three distinct timestamps (`occurred_at`,
  `cash_received_at`, `payout_received_at`); only the third moves money into deployable cash.

---

## 6. Expected fixed monthly burn

**$0.00/month at bootstrap, and this is a design constraint rather than an outcome.**

| Item | Monthly |
|---|---|
| Neon free tier | $0.00 |
| GitHub Actions (2,000 min/mo Free) | $0.00 |
| Dashboard hosting (none — Markdown in repo) | $0.00 |
| Web hosting (none — MoR-hosted) | $0.00 |
| **Total** | **$0.00** |

Transaction fees are **marginal, not fixed** — incurred only when a sale occurs, and netted
by the MoR before payout.

Non-cash metered ceilings (CI minutes) are registered in `recurring_cost` with limits: a free
resource with a hard cap is still a dependency that can fail.

**No recurring cost may be added without owner approval** (`CONSTITUTION.md` §8).

---

## 7. Expected owner actions and time

Full register in `OWNER_AUTONOMY.md`.

### Blocking now — ~15 minutes total

| # | Action | Est. |
|---|---|---|
| 1 | Authorize capital exposure ($50 or another figure) | 1 min |
| 2 | Confirm owner labor budget | 2 min |
| 3 | Create Neon account, add `DATABASE_URL` as a GitHub secret | 10 min |
| 4 | Confirm tax residence / country | 1 min |

Item 3 is a scoped infrastructure credential entered into **GitHub's secret store** — not
pasted into an agent session, and not a bank or payout credential.

### Milestone 1 — ~45 minutes, one time

MoR account creation (15–25 min) · payout/identity setup **in the provider's own interface**
(10 min) · approve the money-spine offer (5 min) · one owner test purchase (5 min).

**The payout setup is the hard credential boundary.** Factory never sees, requests, stores, or
logs bank details. The owner enters them at the provider, directly. I will never ask for them
here.

### Steady state — the number that actually matters

**~5 minutes per week** of dashboard checking, plus ~15 min/month of batched approvals.

Everything before Milestone 3 is construction. Autonomy is a claim about the steady state and
cannot be evaluated until there is one.

### Proposed owner labor budget (owner decision)

| Metric | Proposed |
|---|---|
| Routine operating + maintenance | **≤ 30 min/week** after clock start |
| Approvals | **≤ 60 min/month** |
| Autonomy Failure Review trigger | Over budget for **2 consecutive weeks** |

Ships at `0` until set — a safe default that fails loudly rather than silently permitting
unlimited owner labor.

---

## 8. E1 data sources, costs, and the Data Economics Probe

### Proposed sources

| Source | Signal | Advertised cost | Known constraint |
|---|---|---|---|
| **Etsy Open API v3** | Listing counts, category structure | **Free** — 10k req/day, 10 QPS | App approval; **listings ≠ sales** |
| **Wikipedia Pageviews** | Article pageviews | **Free**, generous | Topic interest; weak purchase intent |
| **Google Trends** | Relative interest | **Free** | **Relative only, never absolute**; fragile access |
| **eBay Browse API** | Listings, sold comps | Free tier | Limits unconfirmed |
| **Reddit API** | Post/comment volume | Free tier | Terms restrict automated use |
| **DataForSEO** | Google Ads search volume, CPC | $0.075/1,000 keywords | **$50 minimum deposit** |
| SerpApi | SERP structure | ~100 free/mo | Too thin for 30–50 attempts |

### Expected cost per candidate

**Free-source pipeline: $0.00 marginal cost per query**, bounded by rate limits rather than
money. Etsy alone permits 10,000 requests/day — far above the ~300–500 candidates implied by
30–50 attempts at a 10:1 screening ratio.

The real cost is **model inference for parsing and scoring**, estimated at well under $0.01
per candidate. The probe will measure this rather than assume it.

### The DataForSEO problem — a capital-constrained opportunity, deliberately not requested

DataForSEO is the best-fit source on paper: real Google Ads search volume — exactly the signal
the Stranger Arrival Test wants — at effectively free per-query rates.

**Its $50 minimum deposit is 100% of owner capital.** Buying it would leave $0 for validation
and gut the protected-bucket principle.

It is recorded as `CAPITAL CONSTRAINED` and **I am not requesting it.** Factory must first
demonstrate whether free sources suffice. Requesting capital for data before knowing whether
free data works is precisely the unjustified escalation `CONSTITUTION.md` §8 exists to
prevent.

### How the probe measures real cost and coverage

Runs at **$0**, free sources only, before any validation capital is spent.

1. Generate a candidate set of **100 real opportunity candidates** in a plausible product
   family.
2. For each candidate, attempt E1 retrieval from each free source, recording: wall-clock time,
   request count, model tokens consumed, HTTP status, whether a **usable** signal returned.
3. "Usable" is defined strictly and in advance: a signal that populates **all seven mandatory
   fields** and actually discriminates between candidates. A source returning the same number
   for every candidate has 0% usable coverage regardless of its response rate.
4. Persist every attempt — **including failures** — to `data_source_probe`. Failure rate is
   the measurement, not an obstacle to it.
5. Compute measured `pct_candidates_with_retrievable_E1`, effective cost per candidate, and
   screening capacity at $1 / $5 / $10.
6. Record terms and rate-limit constraints observed in practice, not as advertised.

### Proposed go/no-go criteria

**PASS** requires at least one pipeline meeting **all** of:

| Criterion | Threshold | Why |
|---|---|---|
| `pct_candidates_with_retrievable_E1` | **≥ 60%** | Below this, most candidates stall or tempt fabrication |
| Effective cost per candidate | **≤ $0.02** | 500 candidates ≤ $10 = the DISCOVERY bucket |
| Screening capacity at $5 | **≥ 250 candidates** | Supports 30–50 attempts at ~10:1 |
| Sustainable rate | **≥ 50 candidates/day** | 500 candidates in ~10 days, inside the 90-day clock |
| Terms | **Automated use permitted** | A source Factory may not operate autonomously fails the mission |
| Discrimination | Signal **varies meaningfully** across candidates | A constant is not evidence |

**FAIL → redesign the search strategy before spending validation capital.** Narrow the
candidate universe, use cheaper first-pass signals, batch, cache, prioritize
higher-information candidates, or mark a data source capital-constrained.

**A failed gate is a legitimate, valuable outcome**, and materially cheaper than discovering
the same fact after spending the validation bucket.

---

## 9. How Value QA benchmarks against alternatives

Before any offer reaches an arm's-length customer (`EXPERIMENTAL_PROTOCOL.md` §9), recorded in
`value_qa_review` with every field `NOT NULL` — the review cannot be skipped by leaving it
blank.

**Benchmarking is retrieval-based, not assertion-based.** For each offer:

1. **Retrieve ≥3 free alternatives and ≥2 paid alternatives** that actually exist, with URLs
   and (for paid) real prices. Not recalled from model memory — retrieved and recorded.
2. Build a comparison across named dimensions: what the customer gets, steps required, time to
   result, coverage, accuracy, update frequency, price.
3. **Require at least one concrete, measurable advantage** over the free alternatives.
   `innovative`, `comprehensive`, `convenient`, `personalized`, `curated`, `premium` are
   rejected as differentiation. Admissible: fewer steps, lower price for comparable utility,
   faster result, unique dataset, better coverage, automation of a manual process.
4. **Automated slop checks:** repetition ratio, filler-phrase density, broken links/output,
   truncation, internal contradiction, unsupported factual claims.
5. **Price justification must name a specific alternative and its price** and explain why a
   reasonable customer would pay the difference.

**The free-alternative comparison is the one that usually kills an offer**, and it is the one
most likely to be skipped. If a free tool does the same job, the offer is rebuilt or dropped
— *before* spending a scarce distribution opportunity, which is more expensive than a rebuild.

**Passing Value QA advances no evidence grade.** It is a minimum quality bar, not proof of
demand.

---

## 10. How the commercial clock is implemented

`commercial_clock` — a single row, enforced by `CHECK (id = 1)`.

Seven boolean conditions plus `started_at`, with a table constraint making a premature start
**physically impossible**:

```sql
CONSTRAINT clock_requires_all_conditions CHECK (
    started_at IS NULL OR (
        financial_control_plane_ok AND money_spine_ok AND campaign_ok
        AND arrival_mechanism_ok AND measurement_attribution_ok
        AND autonomous_launch_ok AND automated_fulfillment_ok
    )
)
```

**Verified:** an attempt to start the clock with unmet conditions was rejected; it succeeded
once all seven were true.

Each flag is set only by a job that **verifies the condition against reality** — the money
spine flag requires an actual completed test transaction, not a passing unit test. `started_at`
is written once and never retroactively adjusted to flatter a checkpoint.

Day-30 and Day-90 checkpoints are scheduled jobs computing from `started_at`, writing their
outcome to `gate_event` **whether they pass or fail**. An absent `gate_event` means a gate
never ran — itself a finding.

---

## 11. How maintenance/debug hours are captured after clock start

This is the metric most easily faked, by omission, and the one the whole autonomy thesis rests
on. Asking the owner to remember to log debugging time would be both unreliable *and* itself a
form of owner labor.

**Design: derive it from evidence Factory already has, and default to counting it.**

1. **Factory logs its own failures automatically** — job failures, unhandled exceptions, stuck
   states, missed heartbeats — each creating a pre-filled `owner_intervention` row of kind
   `MAINTENANCE_DEBUG` in a pending state.
2. **Human repository activity is detected from git history.** A human-authored commit or push
   between a recorded failure and a recovery is strong evidence the owner intervened. Factory
   flags it and attributes the engagement window automatically.
3. **The owner confirms or corrects with a single number.** The default is *counted, not
   omitted* — silence leaves the estimate in place rather than dropping it.
4. **`SETUP` cannot absorb it.** If an intervention type recurs, it is reclassified as
   `MAINTENANCE_DEBUG` by rule. Reclassifying recurring repair as one-time setup is the
   standard way this metric gets faked, and it is prohibited.
5. `after_commercial_clock` is stamped at write time, so pre-clock construction labor is
   reported separately and cannot silently dilute the steady-state figure.

**Bias is deliberately toward over-counting owner labor.** An honest autonomy failure is
recoverable; a false autonomy claim invalidates the entire experiment.

---

## 12. What triggers the Repeatability and Ceiling Phase

A **positive autonomous loop** — all six conditions simultaneously, on one experiment:

1. Factory selected the opportunity (not the owner)
2. Factory produced the offer
3. ≥1 **arm's-length** transaction (`ARM_LENGTH_CUSTOMER`)
4. **Contribution profit > 0** after all attributable costs
5. Fulfillment was automated
6. Owner labor for that experiment stayed within budget

When all six hold, Factory **enters the Repeatability and Ceiling Phase and does not scale**.
It tests three separate questions — **REPEATABILITY** (can it find another?), **DEPTH** (can
this asset absorb more demand profitably?), **BREADTH** (does the pattern replicate cheaply?)
— tracking per-asset and portfolio economics.

**Explicitly prohibited:** inferring $1K/$5K/$10K/$20K potential from one small result. A
positive tiny loop licenses the next experiment, not an extrapolation.

Note conditions 3 and 4 together: a sale that loses money after fees is **not** a positive
loop. At a $5 price point with 5% + $0.50 fees, contribution margin is thin enough that this
is a live risk, not a hypothetical.

---

## 13. Unresolved technical risks

Ordered by how likely they are to kill the project.

**1. Distribution is unsolved.** *(highest)* With $50, paid acquisition is not merely expensive
— it is statistically uninformative. Factory has no audience, domain authority, reputation, or
list. Candidate mechanisms in `DISTRIBUTION.md` are unprobed hypotheses, each with real
objections. **This is the most likely cause of a Day-90 stop recommendation.**

**2. Platform automation permissions are unverified.** Whether any candidate marketplace's
terms permit *autonomous* listing creation is unknown. A surface Factory may not operate
autonomously fails the mission even if it sells. Must be checked before a Campaign locks on.

**3. Attribution across the MoR boundary.** Checkout is hosted externally; an experiment ID
must survive to the transaction record. If it does not, every denominator is unreliable and
the Campaign cannot learn. **Milestone 1 verification item, not an assumption.**

**4. Payout thresholds trap early revenue.** Structural, already understood, no workaround —
only correct accounting so Factory never believes it has cash it cannot spend.

**5. Scheduler reliability.** GitHub Actions disables schedules after ~60 days of inactivity
and lags under load. Mitigated by self-commits and a visible heartbeat; **not eliminated.** A
silently dead scheduler would masquerade as commercial failure — Factory appearing to try and
fail, when it never ran.

**6. Concurrency under contention.** Single-transaction reservation is designed but unproven.
Needs the Capital Authority code and a real concurrency test. **Next implementation step.**

**7. Product quality at zero marginal cost.** Whether Factory can autonomously produce
something that beats free alternatives is untested. Value QA is the gate; it may reject a
large fraction of Factory's own output, which would be Value QA working correctly.

**8. Model inference cost is unmetered.** Currently absorbed by the session. Once Factory runs
autonomously it becomes a real marginal cost against the `DISCOVERY` bucket and must be
metered before the attempt loop runs.

---

## 14. Smallest next implementation step

**Build the Capital Authority module in TypeScript with a concurrency test, against a local
PostgreSQL instance.**

Specifically: `reserve()`, `settle()`, `release()` in `src/capital/`, each executing in a
single serializable transaction that reads the kill switch, checks the bucket balance, and
writes the ledger entry atomically — plus a test firing concurrent reservations against a
bucket with insufficient funds and asserting that exactly the affordable number succeed.

**Why this step:** it is the exit criterion for Milestone 0A, it closes the highest-priority
*technical* risk (#6), it requires **no owner input, no accounts, no credentials, and no
money**, and nothing may incur marginal cost until it exists (`CONSTITUTION.md` §6).

It can begin immediately and in parallel with the owner decisions in §7.

---

## 15. What I need from the owner

Four decisions, ~15 minutes. Everything else on the roadmap is Factory's work.

1. **Capital authorization** — $50, or another figure, or zero for now.
2. **Owner labor budget** — confirm ≤30 min/week + ≤60 min/month, or set your own.
3. **Neon account** → `DATABASE_URL` into GitHub secrets. *(Not a payout credential.)*
4. **Tax residence / country** — determines MoR eligibility.

**I will not ask you to paste bank details, card numbers, payout credentials, or passwords
into this session, now or ever.** When those are needed, you will enter them directly into the
provider's own interface, and I will tell you which one and why.

Items 1 and 2 unblock Milestone 0A completion. Item 3 unblocks a live database. Item 4 is
needed only by Milestone 1.

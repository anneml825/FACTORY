# FACTORY — Codex Bootstrap Instructions, Version 2.1

> **Provenance.** Supplied by the owner on 2026-08-17 by paste into the build session,
> from `Factory_Codex_Bootstrap_Instructions_v2_1.pdf`. The source PDF was not reachable
> from the build container. Text arrived already in Markdown form and is reproduced
> verbatim below.
>
> **Completeness check at transcription time.** All sections referenced by the document's
> own structure are present: governing-file list, AGENTS/CONSTITUTION/EXPERIMENTAL_PROTOCOL
> content requirements, financial control plane, money spine, initial Campaign, owner
> autonomy, commerce/tax, ongoing-obligation rule, milestone order, first-response brief
> requirements, and all four v5.1 addenda (Data Economics Gate, Value QA, Autonomy Failure
> Gate, Repeatability and Ceiling) plus the updated early milestone sequence and the
> additions to the first implementation brief. Assessed structurally complete.
>
> **Known internal conflict.** The `## Milestone order` section lists the pre-v5.1 sequence
> (0–10). The later `## Updated early milestone sequence` section lists 0A/0B–11. The
> updated sequence governs: it appears later, is explicitly labeled as updated, and matches
> Master Codex v5.1 §56. Recorded here rather than silently resolved.
>
> **Relationship to the Master Codex.** This document is the *procedure*. `MASTER_CODEX_v5.1.md`
> is the *specification*. Where the two conflict on a substantive rule, the Master Codex
> governs.

---

You are initializing the Factory repository.

Factory is an autonomous, profit-first internet-business experimentation and operation system.

Its two co-equal objectives are:

1. Maximize sustainable realized profit.
2. Minimize routine owner labor.

The owner should increasingly behave like a board member/capital allocator: check results, review exceptions, approve or reject meaningful decisions, and leave.

Do not design a system that turns the owner into an uploader, prompt runner, publisher, fulfillment worker, analytics reconciler, research assistant, or daily operator.

## Read the governing specification

Read the attached/provided `Factory Master Codex Build Prompt v5` in full.

Treat it as the complete bootstrap specification.

Do not attempt to keep the entire long specification in working context forever. Your first task is to convert its permanent rules and experimental protocol into durable repository documentation.

## Create the governing files first

Create:

- `AGENTS.md`
- `CONSTITUTION.md`
- `EXPERIMENTAL_PROTOCOL.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `FINANCIAL_CONTROLS.md`
- `DISTRIBUTION.md`
- `OWNER_AUTONOMY.md`
- `INTEGRATIONS.md`

Do this before building broad autonomous workers.

## AGENTS.md

Make `AGENTS.md` short and operational.

It must require every Codex task working on Factory to:

1. Read `CONSTITUTION.md` before performing Factory work.
2. Treat `CONSTITUTION.md` as higher priority than conflicting project documentation.
3. Read the relevant subsystem document for the current task.
4. Read both `CONSTITUTION.md` and `EXPERIMENTAL_PROTOCOL.md` before designing, approving, launching, modifying, or evaluating any economic experiment.
5. Never claim an external action occurred unless it actually occurred.
6. Never bypass financial controls or owner-approval requirements.
7. Never place sensitive banking/payment credentials in source code, prompts, logs, GitHub, or ordinary LLM context.
8. Prefer implementations that reduce recurring owner labor.

## CONSTITUTION.md

Keep `CONSTITUTION.md` concise enough to re-read frequently.

Encode at minimum:

- Profit and low owner labor are co-equal objectives.
- Initial maximum owner capital at risk is owner-configured, expected to begin at $50.
- Factory-generated cash may increase deployable cash without increasing owner capital at risk.
- Revenue is not spend authority.
- `MAX_DEPLOYABLE_CASH = AVAILABLE_SETTLED_CASH - REQUIRED_RESERVES - COMMITTED_OR_RESERVED_SPEND - OWNER_WITHDRAWAL_ALLOCATION - OTHER_PROTECTED_BALANCES`.
- Refund/chargeback reserves come before reinvestment.
- Every paid operation routes through Capital Authority.
- Unknown-cost operations use RESERVE -> EXECUTE -> SETTLE.
- Paid operations use idempotency keys and reconciliation.
- Protected budget buckets cannot be transferred by an LLM.
- Only arm's-length customer revenue counts toward commercial stage gates.
- Evidence grades distinguish hypothesis from scaling evidence.
- Global STOP ALL PAID ACTIVITY kill switch.
- LLMs cannot raise financial limits or weaken controls.
- No fake functionality or fake claims of external actions.
- Owner is checker/approver, not routine operator.
- Recurring owner labor is tracked as a constraint.
- Factory may propose capital-constrained opportunities above current authority but cannot spend above authority without explicit approval.
- No artificial profit ceiling.

## EXPERIMENTAL_PROTOCOL.md

This is a first-class governing document, not a loose roadmap.

Encode:

### Stranger Arrival Test

No experiment launches unless Factory can name the specific measurable mechanism by which an unrelated person encounters the offer.

Generic labels such as `social`, `communities`, `SEO`, `organic`, `shareability`, `viral`, or `influencers` are not sufficient.

Require the experiment to specify:

- who the stranger is
- where they are
- exact surface/mechanism
- why Factory can appear there
- measurable evidence that people use it
- how exposure and downstream behavior will be measured

### Quantitative E1

No opportunity advances from E0 to E1 without at least one independently retrieved quantitative demand/distribution signal.

Each signal must store:

- metric name
- numeric value
- unit
- source
- retrieval timestamp
- collection method
- reliability/limitations

Model-invented market metrics are forbidden.

### Evidence grades

Use:

- E0 hypothesis
- E1 quantified external signal
- E2 behavioral validation
- E3 arm's-length commercial validation
- E4 repeatability
- E5 unit economics
- E6 scaling evidence

### Campaign discipline

Create a `Campaign` abstraction.

For the initial experimental run, lock:

- one primary distribution surface/mechanism
- one product family or fulfillment pattern
- one checkout/fulfillment architecture
- a constrained pricing pattern
- common analytics/attribution

Vary opportunities/niches while keeping the operating pattern substantially stable.

Target roughly 30 initial attempts if meaningful attempts can be performed within authorized cash and owner-time budgets. Do not preserve a broken Campaign merely to reach 30.

### Information cost

Optimize `COST_PER_DECISION_USEFUL_SIGNAL`, not the cheapest possible nominal attempt.

An experiment that is cheap but cannot generate a meaningful denominator is not useful.

Seek many cheap, interpretable attempts.

### Mandatory denominators

Track where observable:

QUALIFIED EXPOSURES -> VISITS -> OFFER INTERACTIONS -> CHECKOUT STARTS -> PURCHASES -> REVENUE -> MARGINAL COST -> CONTRIBUTION PROFIT

Do not call an offer `no demand` if it never received meaningful exposure.

### Campaign stop conditions

Stop/redesign when the arrival mechanism repeatedly fails, instrumentation cannot support learning, cost per useful signal is incompatible with capital, platform restrictions block autonomy, owner labor exceeds budget, or repeated attempts produce no meaningful behavioral evidence.

### Commercial clock

Define `COMMERCIAL_CLOCK_START` only when:

- financial control plane works
- money spine works
- one Campaign is operational
- Stranger Arrival Mechanism works
- measurement/attribution works
- autonomous launch capability exists within policy
- automated fulfillment works

### Day-30 checkpoint

By 30 days after `COMMERCIAL_CLOCK_START`, Factory should have meaningful E2 behavioral evidence somewhere.

If not, trigger a mandatory Campaign/distribution review without automatically increasing spending.

### Day-90 system stop-loss

By 90 days after `COMMERCIAL_CLOCK_START`, if arm's-length transactions equal zero, default recommendation:

`STOP FUNDING FACTORY'S AUTONOMOUS-ENTREPRENEUR THESIS`

Continuation requires a materially new mechanism supported by new evidence.

More time, more ideas, better prompts, cosmetic pivots, or "we learned a lot" do not qualify.

## Build the financial control plane before paid workers

Implement Milestone 0 before workers receive paid capabilities:

- Capital Authority
- durable Spend Ledger
- source-tagged cash accounting
- protected budget buckets
- owner-capital-at-risk ceiling
- refund/chargeback reserve
- reserve/execute/settle
- idempotency
- recurring-cost registry
- global paid-activity kill switch
- auditable ledger events

Use code/database/provider enforcement where practical. Do not rely on prompts alone.

## Then prove the money spine

Do not start with a giant opportunity-discovery swarm.

Use one deliberately hand-selected inexpensive offer to prove:

REAL VISITOR -> OFFER -> CHECKOUT -> REAL PAYMENT -> WEBHOOK -> AUTOMATED FULFILLMENT -> TRANSACTION RECORD -> ATTRIBUTED REVENUE -> ATTRIBUTED COST -> PROFIT LINE

Owner/test transactions must be flagged separately and do not count as market validation.

## Then create the initial Campaign

After the money spine works, propose one measurable distribution surface and one repeatable product/fulfillment pattern.

The proposal must pass the Stranger Arrival Test and use real quantitative E1 evidence.

Do not launch until required gates and approvals are satisfied.

## Owner autonomy

Create `OWNER_AUTONOMY.md` listing every expected human action, why it is required, expected frequency, estimated minutes, and whether/how it can later be automated.

Track owner minutes/hours in the product.

A profitable business requiring substantial recurring owner labor is inconsistent with Factory's mission unless the owner explicitly chooses it.

## Commerce and tax setup

`INTEGRATIONS.md` must compare payment processors and merchant-of-record options using current information before implementation.

A merchant of record may simplify sales-tax/VAT administration but does not eliminate income-tax/reporting obligations.

Upon first arm's-length revenue, surface:

`HUMAN_SETUP_REQUIRED: TAX / ACCOUNTING`

Maintain exportable bookkeeping records.

Never ask the owner to paste bank details, card details, passwords, or sensitive payout credentials into Codex.

## Ongoing-obligation rule

During Bootstrap Mode, prefer low-continuing-obligation models when economics are otherwise comparable.

Subscriptions/memberships/SaaS must explicitly account for support, uptime, dunning, cancellations, churn, maintenance, compliance, and owner intervention.

Recurring revenue is not automatically better than one-time revenue.

## Milestone order

0. Governance + financial control plane.
1. Money spine.
2. Campaign + Stranger Arrival Mechanism.
3. Autonomous attempt loop.
4. Arm's-length commercial validation.
5. Opportunity radar expansion.
6. Automated publishing/distribution.
7. Portfolio SCALE / ITERATE / KILL decisions.
8. Self-funding from deployable Factory cash.
9. Scale engines.
10. Portfolio compounding.

## First response to the owner

Do not begin with broad implementation.

First inspect the repository/environment and return a concise implementation brief containing:

- current repo state
- files you will create
- proposed Milestone 0 architecture
- proposed schema for Capital Authority / ledger
- external services that may eventually require accounts
- expected fixed monthly burn
- expected owner actions and estimated time
- unresolved technical risks
- how the commercial clock will be implemented
- the smallest next implementation step

Do not ask the owner technical questions you can investigate and decide yourself.

Ask only for genuinely owner-specific decisions/actions.

The governing principle is:

**I CHECK. FACTORY OPERATES.**

Factory's job is to make money without creating a second job for the owner.

## V5.1: Data Economics Gate

Before relying on high-volume E0/E1 screening, run a Data Economics Probe.

For each proposed quantitative evidence source, measure source, signal type, coverage, queryability, cost/query, effective cost/candidate, rate limits, reliability, freshness, automation/terms constraints, and the percentage of candidates for which useful E1 evidence is retrievable.

Calculate how many candidates can realistically be screened for $1, $5, and $10.

Do not assume "cheap rejection at scale" until this is demonstrated.

If the gate fails, redesign the search strategy before consuming meaningful validation capital. Never fill unavailable quantitative evidence with model-estimated numbers.

## V5.1: Value QA

Add a commercial VALUE QA gate in addition to functional QA.

Before exposing an offer to arm's-length customers, compare it with relevant free and paid alternatives and evaluate promise fulfillment, concrete differentiation, accuracy, usability, presentation, filler/repetition/hallucination, price justification, and obvious AI-slop defects.

Factory may reject/rebuild its own output before spending distribution opportunities.

Value QA is a minimum product-quality gate, not proof of demand.

## V5.1: Autonomy Failure Gate

Track `OWNER_OPERATING_HOURS`, `OWNER_MAINTENANCE_DEBUG_HOURS`, `OWNER_SETUP_HOURS`, and `OWNER_APPROVAL_HOURS`.

After `COMMERCIAL_CLOCK_START`, maintenance/debugging needed to keep Factory alive counts against autonomy.

If operating + maintenance/debugging exceeds the configured owner-labor budget, trigger an `AUTONOMY FAILURE REVIEW` regardless of revenue/evidence grade.

Do not claim Factory is autonomous while the owner is repeatedly debugging, recovering, republishing, or manually keeping the loop running.

## V5.1: Positive Loop -> Repeatability and Ceiling

A small profitable autonomous loop is evidence, not proof of scale.

After the first positive autonomous loop, explicitly test:

- REPEATABILITY: can Factory independently find another profitable loop?
- DEPTH: can the original asset absorb more demand profitably?
- BREADTH: can the pattern be replicated across adjacent opportunities cheaply and with low owner labor?

Track profit/asset, creation cost/asset, maintenance minutes/asset, replication success, decay/failure, channel saturation, aggregate portfolio profit, and concentration/platform risk.

Do not extrapolate one tiny profitable asset into $1K/$5K/$10K/$20K claims.

A positive tiny loop licenses the next experiment, not fictional scaling.

## Updated early milestone sequence

Use this order:

0A. Governance + financial control plane.
0B. Data Economics Probe.
1. Money spine.
2. Initial Campaign + Stranger Arrival Mechanism.
3. Value QA + autonomous attempt loop.
4. Arm's-length commercial validation.
5. Day-30/Day-90 commercial gates + continuous autonomy gate.
6. Opportunity-radar expansion only after data economics are demonstrated.
7. Automated publishing/distribution.
8. Portfolio decisions.
9. Self-funding.
10. Repeatability and Ceiling Phase.
11. Scale engines / portfolio compounding.

## Additions to the first implementation brief

The first implementation brief must also report:

- proposed quantitative data sources for E1
- expected cost per query/candidate
- how the Data Economics Probe will measure real cost and coverage
- proposed Data Economics go/no-go criteria
- how VALUE QA will benchmark products against alternatives
- initial owner-labor budget proposal
- how maintenance/debugging hours will be captured after Commercial Clock Start
- what result would trigger the Repeatability and Ceiling Phase

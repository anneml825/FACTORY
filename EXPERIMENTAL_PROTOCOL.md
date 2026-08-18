# EXPERIMENTAL_PROTOCOL.md

The scientific and economic rules governing opportunity discovery and experimentation.
A first-class governing document, not a roadmap. Second in authority only to
`CONSTITUTION.md`.

**Read this in full — together with `CONSTITUTION.md` — before designing, approving,
launching, modifying, or evaluating any economic experiment.**

---

## 1. The Stranger Arrival Test — a launch gate

**No economic experiment may launch until it passes.** This is a hard gate, not a scoring
dimension. An experiment that cannot pass does not get built cheaply "to see" — it does not
get built.

Every experiment must name the specific, measurable mechanism by which an unrelated person
encounters the offer, answering all six:

| Question | What counts as an answer |
|---|---|
| **WHO** is the stranger? | A describable person with a describable situation, not "people interested in X" |
| **WHERE** are they? | A named place, not a category |
| **WHAT** exact surface exposes the offer? | A specific, nameable surface — this search results page, this marketplace category, this directory |
| **WHY** can Factory appear there? | A concrete, permitted reason. Not "we'll post it" |
| **WHAT** measurable evidence shows people use that surface? | A retrieved number with a source and timestamp (§2) |
| **HOW** will exposure and downstream behavior be measured? | A named instrument that exists and has been verified to record |

### Insufficient by themselves

`social` · `communities` · `SEO` · `organic` · `shareability` · `viral` · `influencers` ·
`content marketing` · `word of mouth` · `Product Hunt` (as a category) · `we'll post it on X`

A channel *category* must resolve to a specific observable *mechanism*. "SEO" fails. "The
query `[specific phrase]`, which returns N results and has retrieved monthly volume V, where
our page can rank because the top results are M" is a mechanism.

### Structurally valid examples

- A named search query with independently retrieved demand data.
- A named marketplace search or category with native discovery evidence.
- Another measurable surface with a concrete arrival mechanism and working instrumentation.

### The honesty rule

The last row of the table is where this gate is usually failed quietly. If exposure cannot
actually be measured, the experiment cannot produce a denominator, and without a denominator
its result is uninterpretable (§6). **An unmeasurable mechanism fails the gate even if it is
otherwise plausible.**

---

## 2. Quantitative E1 — no prose-only advancement

No opportunity advances from **E0 → E1** without **at least one independently retrieved
quantitative demand or distribution signal**.

Every quantitative E1 signal persists all seven fields:

- `metric_name`
- `numeric_value`
- `unit`
- `source`
- `retrieved_at` (timestamp)
- `collection_method`
- `reliability_limitations`

### Model-invented market numbers are forbidden

A model may **summarize** retrieved numbers. A model may **never** originate search volume,
listing counts, sales estimates, rankings, traffic, review counts, conversion rates, or
market size.

This includes numbers that feel safe: "roughly 10,000 searches," "a few hundred sellers,"
"typically 2–3% conversion." If it was not retrieved, it does not exist. Record the absence.

Qualitative evidence may **supplement** E1. It may never **replace** the required
quantitative signal.

---

## 3. Evidence grades

| Grade | Meaning | What it requires |
|---|---|---|
| **E0** | Hypothesis | Someone believes it may be true |
| **E1** | Quantified external signal | ≥1 independently retrieved numeric demand/distribution signal, with source and timestamp |
| **E2** | Behavioral validation | Unrelated real humans took meaningful action |
| **E3** | Commercial validation | ≥1 arm's-length customer paid real money |
| **E4** | Repeatability | Multiple independent arm's-length customers converted |
| **E5** | Unit economics | Enough observed transactions to estimate economics meaningfully |
| **E6** | Scaling evidence | Increased acquisition produced predictably increased profitable output |

**Evidence grade is not model confidence.** Observed evidence supersedes model estimates
always. A grade may be lowered by new evidence; it is never raised by argument.

Owner and internal test transactions never advance a grade (`CONSTITUTION.md` §10).

---

## 4. Campaign discipline

A **Campaign** locks the operating pattern so that repetition produces learning instead of
noise. For a defined run it fixes:

- one primary distribution surface/mechanism
- one product family or fulfillment pattern
- one checkout/fulfillment architecture
- a constrained pricing pattern
- common analytics and attribution
- common experiment schema

Within the Campaign, **vary the opportunity/niche/problem**. Keep the machinery stable.

**Target ≈30 attempts** in the initial Campaign before changing the core surface/product
pattern — *if* meaningful attempts are possible within authorized cash and owner-time
budgets. 30–50 attempts is the planning objective (Master Codex §17).

Two failure modes this rule exists to prevent, in both directions:

- **Do not pivot the entire architecture after every failed idea.** One failed niche is not
  evidence that the mechanism is wrong.
- **Do not preserve a broken Campaign merely to reach 30.** The attempt count is a planning
  target, not a quota. If a stop condition (§8) fires at attempt 6, the Campaign stops at
  attempt 6.

---

## 5. Information cost, not cheap theater

Optimize **`COST_PER_DECISION_USEFUL_SIGNAL`** — not the cheapest nominal attempt.

Before spending, estimate whether the experiment can realistically generate enough exposure
and behavior to *update evidence*. **A cheap experiment with insufficient exposure is not
efficient; it is uninformative**, and it consumes capital, owner attention, and a
distribution opportunity while returning nothing.

No universal per-attempt price ceiling is constitutionalized. An experiment whose cost
materially reduces the portfolio's ability to run repeated tests requires stronger evidence
and explicit justification.

**Corollary, and the practical form this usually takes:** an attempt whose realistic maximum
exposure is a handful of impressions cannot distinguish "no demand" from "no distribution."
Do not run it and do not count it as an attempt. Fix the exposure or drop the attempt.

---

## 6. Denominators are mandatory

A sale without a denominator is not enough. A failure without a denominator is not evidence.

Track wherever observable:

```
QUALIFIED EXPOSURES → VISITS → OFFER INTERACTIONS → CHECKOUT STARTS
                    → PURCHASES → REVENUE → MARGINAL COST → CONTRIBUTION PROFIT
```

**Every E2+ conclusion must preserve the denominator that produced it.** "It converted" is
not a result; "2 of 340 visits converted" is.

### Funnel failure taxonomy

Every failed attempt is classified into exactly one primary cause:

| Class | Signature |
|---|---|
| `NO_DISTRIBUTION` | Exposure never happened or was negligible |
| `WEAK_CLICK_THROUGH` | Exposure occurred, visits did not follow |
| `WEAK_OFFER_ENGAGEMENT` | Visits occurred, no meaningful interaction with the offer |
| `CHECKOUT_FRICTION` | Interaction occurred, checkout starts did not follow |
| `WEAK_PURCHASE_CONVERSION` | Checkout started, purchase did not complete |
| `FULFILLMENT_FAILURE` | Purchase completed, delivery failed |
| `NEGATIVE_UNIT_ECONOMICS` | It sold, and lost money |

**Do not label an offer `no demand` when it never received a meaningful test.** Almost every
early failure will be `NO_DISTRIBUTION`, and misfiling it as absent demand destroys the
learning value of the whole Campaign — it produces a confident conclusion about a market
that was never actually shown the offer.

### Minimum meaningful denominator

Every experiment declares, **before launch**, the minimum exposure below which its result is
uninterpretable. If the experiment ends below that threshold, the outcome is recorded as
`INSUFFICIENT_EXPOSURE` — **not** as a demand failure — and the attempt does not count as
evidence about the offer.

---

## 7. Data Economics Gate

**Before Factory relies on high-volume E0/E1 screening, it must run a Data Economics Probe
and pass this gate.** Cheap rejection at scale is an assumption to be tested, not a property
of computation.

For every candidate quantitative evidence source, measure and persist:

`source/provider` · `signal_type` · `coverage` · `queryability` · `cost_per_query` ·
`effective_cost_per_candidate_screened` · `rate_limits` · `reliability_limitations` ·
`freshness` · `automation_terms_constraints` · **`pct_candidates_with_retrievable_E1`**

Calculate practical screening capacity at **$1, $5, and $10** of marginal data/model spend.

### Pass condition

The gate passes only when Factory demonstrates **at least one evidence pipeline** whose cost,
coverage, reliability, and automation constraints are **compatible with available capital and
the intended Campaign search volume** — measured, not projected.

The binding term is usually `pct_candidates_with_retrievable_E1`. A source that is free and
fast but returns usable evidence for 4% of candidates is a failed pipeline, because the
other 96% either stall or get advanced on invented numbers.

### On failure

Redesign the search strategy **before** consuming material validation capital. Legitimate
responses: narrow the candidate universe, use cheaper first-pass signals, batch, cache,
prioritize higher-information candidates, or propose a capital-constrained data source.

**Never substitute model-estimated numbers for unavailable data** (§2).

---

## 8. Campaign stop conditions

Stop or redesign the Campaign when **any** of these holds:

- the Stranger Arrival Mechanism repeatedly fails to produce measurable exposure
- the surface cannot be instrumented well enough to learn
- cost per decision-useful signal is incompatible with available capital
- platform restrictions make autonomous operation impractical
- owner labor exceeds budget (see §12)
- repeated attempts produce no meaningful behavioral signal
- a materially better mechanism is discovered and documented

---

## 9. Value QA — a pre-launch quality gate

Functional QA proves the thing works. **Value QA proves the thing is worth money.** Both are
required before an offer is exposed to arm's-length customers.

Value QA evaluates:

- whether the product actually fulfills the promise made by the offer
- quality relative to relevant **free** alternatives
- quality relative to relevant **paid** alternatives
- concrete differentiation
- accuracy and internal consistency
- usability and presentation
- repetition, filler, hallucination, broken output, obvious AI slop
- whether the asking price has a defensible value proposition
- whether claims are supported
- whether a reasonable customer can understand what is being purchased

### Adjective-only differentiation fails

`innovative` · `comprehensive` · `convenient` · `personalized` · `curated` · `premium` —
unless tied to a concrete measurable feature.

Prefer observable comparisons: fewer required steps, lower price for comparable utility,
faster result, unique dataset, better coverage, automation of a manual process.

**Factory may reject or rebuild its own product** before spending a scarce distribution
opportunity on it. Distribution opportunities are more expensive than rebuilds.

**Value QA is not evidence that customers will buy.** It is the minimum quality bar for
asking strangers to pay. Passing it advances nothing on the evidence scale.

---

## 10. COMMERCIAL_CLOCK_START

The economic-validation clock starts when **all** of the following are genuinely
operational — not coded, not mocked, **operational**:

- [ ] financial control plane
- [ ] money spine
- [ ] one Campaign
- [ ] working Stranger Arrival Mechanism
- [ ] measurement/attribution
- [ ] autonomous launch capability within policy
- [ ] automated fulfillment for the Campaign

**The clock does not start when coding begins.** It is set once, recorded durably with the
evidence for each condition, and never retroactively adjusted to make a checkpoint look
better.

---

## 11. Commercial checkpoints

### Day 30 — behavioral evidence checkpoint

By 30 days after `COMMERCIAL_CLOCK_START`, Factory should have meaningful **E2** behavioral
evidence somewhere in the Campaign.

If not: **mandatory distribution/Campaign review**. Do **not** automatically increase
spending. The review must identify the concrete cause — opportunity selection, Stranger
Arrival Mechanism, instrumentation, offer quality, or another named cause — not "needs more
time."

### Day 90 — system stop-loss

By 90 days after `COMMERCIAL_CLOCK_START`, if `ARM_LENGTH_TRANSACTIONS = 0`, the default
recommendation is:

> **STOP FUNDING FACTORY'S AUTONOMOUS-ENTREPRENEUR THESIS.**

Continuation requires a **materially new mechanism**: a substantive change supported by new
evidence — a newly available measurable distribution surface, a previously unavailable
integration, or external evidence invalidating the failed Campaign's core assumption.

**These do not qualify:** more time · more ideas · better prompts · we learned a lot ·
a cosmetic strategy rewrite · a renamed Campaign · trying the same mechanism harder.

The owner may override the stop recommendation. **Factory must not manufacture justification
for continuation.** Producing a strained "materially new mechanism" to avoid recommending
stop is a governance failure, and a more serious one than the commercial failure it conceals.

---

## 12. Autonomy Failure Gate — continuous

The commercial checkpoints do **not** override the owner-autonomy objective. Both run.

Track separately: `OWNER_OPERATING_HOURS` · `OWNER_MAINTENANCE_DEBUG_HOURS` ·
`OWNER_SETUP_HOURS` · `OWNER_APPROVAL_HOURS`.

One-time build/setup labor is reported separately. **After `COMMERCIAL_CLOCK_START`, all
human maintenance and debugging required to keep Factory functioning counts against the
autonomy thesis.**

If operating + maintenance/debug labor exceeds `OWNER_LABOR_BUDGET` during autonomous
commercial operation, trigger an **AUTONOMY FAILURE REVIEW** — *regardless of revenue or
evidence grade*. A profitable Factory that the owner is manually keeping alive has failed
half its mission, and the review is mandatory even when the numbers look good.

**Threshold: 60 minutes/week. A single week above it triggers the review** (owner decision,
2026-08-18). An advisory target of 30 min/week is shown on the dashboard and gates nothing.

**A review is a diagnosis, not a verdict.** The trigger is deliberately sensitive and the
consequence deliberately mild: crossing the line never terminates anything automatically.
The review's purpose is to distinguish an anomalous week from a structural burden —
*recurring or structural owner labor is the actual concern*. Pausing or stopping is one
possible **outcome** of the review, reached by argument from evidence, never a mechanical
result of one bad week. Triggering on a single week means a structural problem surfaces in
its first week rather than its third.

The review must identify: the recurring source of owner labor; whether it is temporary or
structural; the automation/redesign path; the cost and expected benefit of fixing it;
whether commercial evidence justifies the repair; and whether experimentation should pause
until the burden is removed.

**Factory may not claim low owner labor by excluding debugging, recovery, or repeated
intervention needed to keep the loop alive.**

---

## 13. Money spine ≠ autonomous-entrepreneur success

These are different claims and must never be conflated in any report.

**Money spine success** means commerce plumbing works: a real visitor can reach an offer, pay,
trigger a webhook, receive automated fulfillment, and produce an attributed profit line. An
owner test purchase is sufficient to verify this. **It proves nothing about demand.**

**Autonomous-entrepreneur success** requires:

- a Factory-selected opportunity
- a Factory-produced offer
- a measurable Stranger Arrival Mechanism
- unrelated humans reached without routine owner promotion
- behavioral evidence
- arm's-length purchase(s)
- automated fulfillment
- attributable costs and revenue
- positive or plausibly improving contribution economics
- owner labor within budget

**The first arm's-length transaction is a commercial milestone, not proof of the thesis.**
One sale is informative. Denominator and repeatability are what make it evidence.

---

## 14. Positive loop ≠ scalable loop

When Factory closes a positive autonomous economic loop, it enters the **Repeatability and
Ceiling Phase** before making any scaling claim.

Three distinct questions, tested separately:

- **REPEATABILITY** — Can Factory independently identify and close *another* profitable loop
  using the same or closely related machinery?
- **DEPTH** — Can the original asset absorb additional qualified demand while preserving or
  improving contribution economics?
- **BREADTH** — Can the pattern be replicated into adjacent opportunities at low incremental
  cash cost and low owner labor?

Track individual-asset **and** portfolio economics: contribution profit per asset · marginal
creation cost per asset · maintenance minutes per asset · failure/decay rate · time to first
arm's-length transaction · replication success rate · aggregate portfolio profit ·
concentration risk · channel saturation · cannibalization · platform dependency.

A low ceiling per asset is not necessarily fatal if assets can be created, operated, and
maintained cheaply at portfolio scale.

**Do not infer $1K, $5K, $10K, or $20K potential from one $50/month result.** A positive tiny
loop licenses the next experiment — repeatability, depth, breadth. It does not license
extrapolation.

---

## 15. Rules against endless pivots and cosmetic extension

- A Campaign is not "new" because it was renamed, restyled, or repriced.
- A mechanism is not "materially new" because it is being attempted again with more effort.
- An experiment that ended below its minimum denominator did not fail — it did not run.
- Evidence grades never rise by argument, only by observation.
- A stop recommendation is a legitimate, successful output of this system. Producing one on
  time is the protocol working, not the protocol failing.

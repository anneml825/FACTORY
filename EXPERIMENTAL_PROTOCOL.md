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

### A commercial candidate is a complete system, not an asset idea

Candidate generation must produce this entire tuple:

```
BUYER + PROBLEM + OFFER + MAKE + PUT + ARRIVE + WATCH
```

A missing element makes the candidate incomplete. In particular, Factory must not manufacture
an asset and only afterward ask where customers might come from. Before production work begins,
the candidate must name a credible stranger-arrival hypothesis and the measurement path that
could test it.

At E0 the elements are hypotheses and need no evidentiary weight (§17). Structural completeness
does not pass the Stranger Arrival Test, advance an evidence grade, or authorize launch. The
ARRIVE hypothesis must still satisfy this section's evidence and instrumentation gate before
external exposure.

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

A Campaign may fix one primary ARRIVE mechanism for clean learning while the portfolio runs
other Campaigns through other provider-neutral ARRIVE adapters. Factory should seek a
diversified mechanism portfolio over time, not one universal channel or one provider coupled
to MAKE, PUT, or WATCH.

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
- **SCALING DEPTH** — After commercial validation, can the original asset absorb additional
  qualified demand while preserving or improving contribution economics?
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

---

## 16. Evidence Semantics Gate

**No quantitative metric may be used as E1 evidence until its semantics are examined.**

Origin: three separate wrong conclusions, each drawn from a *real number from a real source*.
A search endpoint returning a count for every query read as "100% coverage" while returning
zero for most candidates. `active_installs` read as niche demand when the API loose-matches and
one generic plugin was the "top incumbent" for 16 unrelated verticals. A distinct-value ratio
read as poor discrimination when it was at its mathematical ceiling.

The common failure was never bad data. It was **unexamined semantics**.

Every material metric must answer, and persist:

1. What exactly does this metric measure — mechanically, not aspirationally?
2. What proposition is Factory using it to support?
3. What is the causal/inferential distance between the two?
4. **Does the retrieved item actually correspond to the entity being analysed?**
5. What alternative interpretations produce the same number?
6. **Was semantic relevance verified independently of search rank or keyword matching?**
7. Is this DIRECT, PROXY, or INFERRED evidence?
8. What is this metric explicitly *not* sufficient to support?

Plus a mandatory **adversarial check**:

> **What would have to be true for this metric to be technically accurate but economically
> misleading?**

Every past failure passed a plausibility check and would have failed this one.

### Rules

- **Store the type: `DIRECT` / `PROXY` / `INFERRED`. Never silently promote a proxy to direct.**
- Questions 4 and 6 are **blocking**. Unverified entity correspondence is the exact defect that
  invalidated the WordPress opportunity scan.
- **A real number from a real source is not valid evidence if it does not measure the
  proposition Factory claims it measures.**
- The gate blocks on *absence of examination*, not merely on bad results — the failure mode is
  not looking.

Implemented in `src/evidence/semantics.ts`.

---

## 17. H0 — divergent hypothesis generation is REQUIRED, not merely permitted

**Factory must generate speculative commercial hypotheses freely and in volume.**

This section exists because Factory spent its entire early history without a single populated
E0, and produced no product ideas at all. §2 forbids advancing E0 → E1 without retrieved
evidence — correct — but that rule was misapplied to the *generation* of ideas rather than
their *promotion*. The consequence: the dataset generated the ideas, and **datasets describe
platforms, not offers.** Every candidate produced was a marketplace rather than a thing to sell.

### The corrected loop

```
DIVERGENT IDEA GENERATION (H0, free, zero evidentiary weight)
  → CHEAP REJECTION (stated constraints, no evidence needed)
  → EVIDENCE RETRIEVAL (survivors only)
  → EVIDENCE SEMANTICS CHECK (§16)
  → COMMERCIAL ATTRACTIVENESS
  → EXPERIMENTABILITY
  → TINY REAL-WORLD TEST
  → KILL / ITERATE / SCALE
```

### Rules

- **Generating an H0 requires no evidence.** It is E0 by definition: "a model believes
  something may be true."
- **An H0 carries zero evidentiary weight and may never be cited as evidence** — including as
  evidence for itself. Generating a plausible idea is not discovering a market.
- **Promotion out of E0 requires retrieved, semantically-verified external evidence.** §2 and
  §16 apply in full at that boundary and nowhere earlier.
- Generate broadly across product *and* customer types. A portfolio of one shape is a portfolio
  of one bet.
- **Cheap rejection precedes evidence retrieval**, because rejection on stated constraints costs
  nothing and evidence costs something.

Implemented in `src/ideas/h0.ts`.

---

## 18. Pre-Revenue Experiment Cost Discipline

**The $50 is a maximum-loss reserve, not a budget to spend.**

Before arm's-length revenue exists, Factory optimizes:

```
(experiments × information per experiment) / owner capital consumed
```

**The denominator should approach zero.** The objective is not to spend the $50 — it is to
preserve it while producing as many legitimate contacts with economic reality as possible.
**Ideally Factory reaches first revenue having spent almost none of the owner capital.**

This is an information-efficiency objective, not a prohibition on useful spending. The $50 is
risk capital, not a museum exhibit. A bounded $5–15 platform, data, distribution, or
infrastructure expense can be rational when it unlocks many experiments or materially improves
decision-useful signal. It is never automatically authorized: Capital Authority, protected
buckets, the kill switch, and the thresholds below still govern every cent.

### The rule

| | |
|---|---|
| Default target marginal cost per pre-revenue experiment | **≤ $1** |
| Strongly preferred | **~$0** |
| Above target | Permitted **only with explicit justification** |
| **> 10% of remaining owner capital** | **Requires owner authorization. Exceptional.** |

An experiment above $1 must state all four:

1. why materially cheaper falsification is unavailable;
2. why the expected information gain justifies consuming finite capital;
3. **how many alternative experiments are sacrificed by funding it**;
4. why the opportunity merits concentration *before Factory has demonstrated any ability to
   generate revenue*.

### Why this exists

Factory nearly committed **30–59% of the entire capital base** to a single Etsy shop setup
fee. The error was anchoring on an outlier: **Etsy's upfront charge is unusual.** Most digital
surfaces — KDP, Gumroad, itch.io, Payhip, Draft2Digital, print-on-demand — charge **nothing
until a sale occurs**, taking a revenue share instead.

A surface that is paid only when Factory is paid converts a fixed capital risk into a variable
cost, which is exactly the right shape before any revenue exists.

Once arm's-length profit exists, `CONSTITUTION.md` §42 reinvestment rules govern larger
experiments funded from **realized** available cash.

Implemented in `src/experiments/cost-discipline.ts`.

---

## 19. Declared ≠ populated — the field meaning test

**A provider schema declaring a field is not evidence that the field is operationally
populated.** Any external data field that a research design materially depends on must pass a
live, minimal-cost meaning test before Factory allocates a batch of requests around it.

### The rule

Before a research design spends a batch of metered requests, it must:

1. **Name the load-bearing field** — the one whose absence would make the whole run
   worthless — and say so in the script.
2. **Declare, in code, what a correct answer looks like**, written *before* the first request
   goes out. Not a comment: a value the script checks.
3. **Check it after the FIRST response**, and abort the run if it fails.

A criterion written after seeing the data is one the model can talk itself into. The ordering
is the control, not the criterion.

### Why this exists

Factory spent 48 metered requests on the Amazon book market and produced no usable
competition measure, across two designs that were sound on paper:

- **Design 1** rested on `bestSellersRank` from a subcategory chart. The endpoint accepts only
  41 top-level slugs. Handed a subcategory id it returned a browse listing *without erroring* —
  16 titles carrying two ratings each, which passed silently for a bestseller chart. The run
  completed with **zero failures** and produced 35 confident, meaningless rows. Cost: **36
  requests.**
- **Design 2** rested on `pageInfo.totalResults` from the category endpoint, a field the
  generated OpenAPI types plainly declare. It returns **0** for a category containing thousands
  of books. Cost: **1 request**, because by then the gate existed.

The difference between 36 and 1 is the entire value of this section.

### The subtler failure it also covers

The probe that cleared Design 1 asked *"does this call return products?"* It did. It never
asked whether they were the **right** products. **A test of mechanism is not a test of
meaning.** A gate that only proves a response arrived, parsed, and had a non-zero length
proves nothing about whether the numbers mean what the design assumes.

### What a meaning test looks like

Not "did the response parse" but "is this value consistent with the world it describes":

- a category of books contains more than zero products
- the leaders of a mainstream bestseller chart carry more than two ratings each
- a page of search results for a common term returns more than a handful of matches

Cheap, obvious, and each one would have caught a real failure above on its first request.

---

## 20. Demand Magnitude Gate — ARRIVE is necessary; DEPTH decides production

### Purpose

Determine whether an opportunity has enough observable marketplace demand to justify building
it. Evidence that one or more strangers have purchased a similar product is necessary but is
not sufficient evidence of an economically attractive market.

A product must pass two separate questions:

1. **ARRIVE — Does paid demand exist?** Is there credible evidence that unrelated buyers
   purchase this type of product?
2. **DEMAND DEPTH — Is the observable demand pool large enough to justify a production slot?**
   Is there evidence that enough buyers shop for, discover, and purchase this product category
   to support meaningful revenue rather than occasional isolated sales?

Demand DEPTH is a pre-production market-magnitude gate. It is distinct from **SCALING DEPTH**
in §14, which is evaluated after commercial validation.

### DEPTH research

For every candidate, investigate the marketplace at the level of the buyer problem and
realistic search behavior, not merely one exact keyword.

Examine:

- number and diversity of relevant competing listings
- number of independent sellers showing meaningful traction
- review counts and other available sales or traction signals on relevant listings
- whether traction is distributed across multiple sellers or concentrated in one anomalous
  incumbent
- whether multiple products in the category have accumulated meaningful buyer activity
- whether successful listings are recent or current enough to indicate ongoing demand
- breadth of plausible buyer search terms and adjacent searches expressing the same purchase
  intent
- size and breadth of the underlying buyer population
- whether the target buyer would plausibly search Etsy for this solution specifically
- evidence of current marketplace activity versus merely listings existing
- price levels at which actual traction appears to occur
- competition density relative to observable demand
- whether the opportunity appears capable of generating repeatable monthly sales or merely
  occasional long-tail purchases

Do not infer strong demand merely because Etsy returns many search results. **Supply is not
demand.**

Do not infer strong demand from one successful listing. One seller may have unusual tenure,
external traffic, a large existing shop, historical ranking, or other advantages.

Do not reject a market merely because competition is high. High competition accompanied by
broad, distributed buyer activity may be more economically attractive than a nearly empty
niche with almost no demonstrated purchasing.

### Normalize traction

When using reviews, sales counts, favorites, badges, bestseller indicators, shop sales,
listing age, or similar marketplace signals, distinguish what the evidence actually measures.

For example:

- shop-wide sales do not prove sales of the specific product
- shop-wide reviews do not prove demand for the specific product
- a listing review is stronger product-specific evidence
- a very old listing with modest accumulated activity may imply weak current velocity
- a newer listing accumulating meaningful activity quickly may imply stronger current demand

Never manufacture monthly-sales estimates from weak proxies. Where exact sales or search-volume
data are unavailable, explicitly state that DEPTH is being inferred from observable proxies.

### Market Structure Test

Determine which pattern best describes the opportunity:

| Class | Pattern | Standard |
|---|---|---|
| **A** | **Broad, proven demand** | Many relevant buyers, multiple independent sellers with meaningful traction, multiple viable search intents, and evidence of continuing purchases |
| **B** | **Healthy niche demand** | Smaller buyer population but clear distributed purchasing across several sellers or listings; plausible recurring-sales opportunity |
| **C** | **Thin / uncertain demand** | Stranger-arrival evidence exists, but purchasing appears sparse, concentrated, old, weakly evidenced, or limited to a very small buyer pool |
| **D** | **Existence-only demand** | One or a handful of purchases or listings show that the product can sell, but there is no persuasive evidence that enough buyers exist to justify Factory production |
| **E** | **No credible paid-demand evidence** | No credible evidence that unrelated buyers purchase this type of product |

**ARRIVE can pass while DEPTH fails.**

### Portfolio Ceiling Test

Factory's objective is not to produce products that can theoretically make a sale. It is to
build a portfolio capable of producing meaningful aggregate profit.

Ask:

> If Factory produced multiple independently useful products aimed at this same demand pool,
> is the pool large enough to support them without simply dividing a tiny number of buyers
> among our own listings?

Identify whether the candidate:

- opens a substantial new buyer or search pool
- expands an existing proven buyer pool
- merely creates another SKU competing for the same small audience

Penalize excessive portfolio concentration in tiny buyer populations.

Ten excellent products for ten different sufficiently active buyer populations may have
materially greater portfolio value than ten excellent products serving variations of one
extremely small profession.

### Etsy Channel Fit

Evaluate Etsy demand, not merely general-world demand.

A huge real-world population does not matter if those buyers do not plausibly shop Etsy for
this product. Conversely, a relatively small real-world niche may be attractive if its members
demonstrably purchase this kind of digital product on Etsy.

Explicitly distinguish:

- **underlying population size**
- **Etsy-addressable buyer demand**

The second determines this gate.

### Required decision output

Return every field:

- **ARRIVE:** PASS / FAIL
- **DEPTH:** HIGH / MEDIUM / LOW / INSUFFICIENT EVIDENCE
- **ETSY CHANNEL FIT:** HIGH / MEDIUM / LOW
- **COMPETITION:** LOW / MEDIUM / HIGH
- **DEMAND DISTRIBUTION:** BROAD / MODERATE / CONCENTRATED
- **PORTFOLIO OVERLAP:** LOW / MEDIUM / HIGH
- **CONFIDENCE:** HIGH / MEDIUM / LOW

Then provide:

- **Evidence:** concise factual observations supporting the ratings
- **Counterevidence:** observations that weaken the demand thesis
- **Uncertainty:** what cannot be established from available marketplace evidence
- **Economic interpretation:** whether this looks capable of supporting repeatable sales or
  merely proves that occasional sales occur
- **Recommendation:** BUILD / WATCH / REJECT

### Build standard

Recommend **BUILD** only when all five conditions hold:

1. ARRIVE passes.
2. DEPTH is at least MEDIUM.
3. Etsy Channel Fit is at least MEDIUM.
4. Observable demand is not dependent on one anomalous seller or listing.
5. The product still passes Factory's autonomous-production-cost and product-fit gates.

A LOW or existence-only DEPTH result is not rescued by extremely cheap production unless
Factory is deliberately running a separately authorized low-cost exploration experiment.

Do not recommend BUILD merely because “there is some demand,” “competition appears low,” or
“the niche is underserved.”

**Low competition + low demand is not an opportunity.**

### Comparative selection

When evaluating multiple candidates, do not evaluate them only against an absolute threshold.

Rank them against each other on:

**Demand magnitude × Etsy channel fit × competitive opportunity × autonomous production fit ×
expected owner burden**

Factory has finite production capacity. Passing products therefore compete for production
slots.

Prefer a product with substantially greater addressable marketplace demand even when another
candidate technically passes ARRIVE.

The objective is not maximum SKU count. The objective is maximum expected portfolio profit per
unit of autonomous production capacity and owner attention.

### Required research behavior

- Search broadly enough to test alternative descriptions and buyer vocabulary.
- Do not stop research after finding the first confirming competitor.
- Actively search for evidence that the market is smaller than it initially appears.
- Do not convert missing evidence into positive evidence.
- Do not use invented search volume, invented sales estimates, or unsupported market-size
  numbers.
- If Etsy does not expose enough information to confidently distinguish MEDIUM from LOW
  demand, return **INSUFFICIENT EVIDENCE** rather than manufacturing precision.
- The burden of proof is on **BUILD**.


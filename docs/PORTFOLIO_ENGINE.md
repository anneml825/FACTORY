# Portfolio Engine — reorienting Factory around the volume thesis

**Date:** 2026-08-18 · **Cost: $0.00** · Owner capital: **$50.00 intact**

The thesis is now: *can extremely cheap autonomous production make a large portfolio of small
digital experiments profitable in aggregate?* Individual assets may fail. **The portfolio is
the experiment.**

I accept the mandatory principle and it indicts my behaviour directly:

> **`COST_OF_VALIDATION << COST_OF_BEING_WRONG`**

I have spent many turns and substantial inference researching whether individual ~$5 products
deserve to exist. That was the wrong shape of work.

---

## Two findings that change the economics before anything else

### 1. Model inference is the dominant marginal cost — not platform fees

I had been treating "$0 platform" as "$0 experiment." That is false. Current rates:
**Opus 5 $5/$25 per Mtok · Sonnet 5 $3/$15 ($2/$10 intro through 2026-08-31) · Haiku 4.5 $1/$5.**

A ~30-page asset is roughly 25k output tokens for the artefact, ~5k for QA, ~5k input:

| Generation model | Cost / asset | **100 assets** |
|---|---|---|
| **Haiku 4.5** | **~$0.16** | **~$15.50** |
| Sonnet 5 (intro) | ~$0.31 | ~$31 |
| **Opus 5** | ~$0.78 | **~$77.50 — exceeds the entire reserve** |

**The generation model choice *is* the portfolio economics.** A 100-asset portfolio drafted on
Opus costs more than the owner's entire maximum-loss reserve; on Haiku it costs 31% of it.

**Design consequence — tiered generation is mandatory:** Haiku 4.5 drafts, cheap deterministic
checks filter, and Opus is spent only on the QA gate for candidates that survive. Never draft
100 assets on a frontier model.

**Break-even:** at ~$0.16/asset, one winner earning $10/month covers the creation cost of ~64
assets. A 2% hit rate over 100 assets yields ~2 winners ≈ $20/month against ~$15.50 of
creation — thin, positive, and **winners compound because they keep earning while costing
nothing to carry.**

### 2. Factory's model spend is currently invisible, and that must be fixed first

Every "$0 experiment" so far has consumed inference billed through this session, **not** through
a metered API key under the Capital Authority. `IMPLEMENTATION_BRIEF.md` flagged this as risk
#8 and I never closed it.

At one asset it is noise. **At 100 assets it is the dominant cost line**, and
`CONSTITUTION.md` §6 requires every paid operation to route through the Capital Authority.

**This is now the first blocking item**, ahead of any publishing.

---

## Answers

**Q3 — cheapest formats to generate and QA.** Ranked by cost and by whether QA is *checkable*
rather than a matter of taste: structured reference documents · worksheets and checklists ·
calculators and generators (output verifiable against hand-computed cases) · per-input
personalised documents. **Avoid anything whose quality bar is aesthetic** — that has now killed
three candidates and Factory has no reliable way to self-assess it.

**Q4 — near-zero marginal publishing and carrying cost.** Established earlier: KDP, Gumroad,
itch.io, DriveThruRPG, Payhip, Draft2Digital, print-on-demand, RapidAPI, registries and
galleries. All carry a failed asset at **$0 indefinitely**.

**Q5 — automation, and this is the gating constraint.** Honest status:

| Surface | Programmatic product creation |
|---|---|
| **Gumroad** | **Historically 404 / unsupported. A Product API to create and edit products was announced April 2026 — status evolving. Most promising lead; requires live verification** |
| Lemon Squeezy | **Incomplete** — lacks full CRUD on products/variants; a known limitation |
| itch.io | `butler` CLI uploads builds; project creation less clear |
| KDP | **No public API** |

**Full programmatic publishing is not confirmed available on any $0 surface.** I will not
design the engine assuming it. **Fallback, which the owner explicitly permitted:** Factory
prepares complete batches and the owner performs **one brief publish action per batch, not per
asset**. Batched setup labour is acceptable; per-asset upload is `OPERATING` labour and is the
thing that would defeat the experiment.

**Q1/Q2 — 10 concurrent, then 100.** Concurrency is free because the constraint is not
attention but *state*. Each asset is an independent row with its own pre-registered thresholds
and evaluation date. Nothing blocks on anything else: generation, publication and evaluation
run as separate scheduled passes over the portfolio table. **Waiting 28 days on asset A never
blocks asset B** — A is simply a row with a future evaluation date. Going from 10 to 100 is a
loop bound, not an architecture change.

**Q6 — reusable infrastructure.** Already built and niche-agnostic: H0 schema and generation,
cheap-rejection screen, Evidence Semantics Gate, cost-discipline guard, Capital Authority and
ledger, funnel taxonomy and failure classifier. Still needed: metered model-spend adapter
(**first**), artefact generator per *family*, packaging, publish adapter per *surface*,
analytics poller, revenue attribution, and the kill/keep/iterate evaluator.

**Q7 — ~$0.16 per launched asset** on Haiku 4.5 including a QA pass, plus $0 platform fee on a
revenue-share surface.

**Q8 — preventing research cost exceeding experiment cost.** Encoded as a rule rather than an
intention:

> **Validation spend per asset is capped at the asset's creation cost.** At ~$0.16 to create,
> Factory may not spend more than ~$0.16 of inference deciding whether to create it. Beyond
> that cap the answer is always **build and observe.**

That single rule would have prevented most of the last several turns of work.

**Q9 — killing losers.** Automatic and requiring no owner action: each asset carries
pre-registered thresholds and an evaluation date. At that date the evaluator classifies against
the funnel taxonomy and sets `KILL` / `ITERATE` / `KEEP`. **A killed asset is simply left
dormant** — carrying cost is $0, so deletion is unnecessary work. Only *aggregate* results
reach the owner.

**Q10 — identifying winners and generating adjacents.** Any asset with a real transaction is
tagged a winner; the engine then generates variants along its *nearest* dimensions — adjacent
niche, adjacent format, adjacent price — because a winner is the only evidence Factory has ever
had about what works, and it should be exploited before returning to random search.

**Q11 — preventing spam and duplicate slop.** This is a real obligation, not a formality. Mass
low-quality digital assets are what `EXPERIMENTAL_PROTOCOL.md` §9 Value QA exists to prevent,
and what gets accounts terminated. Guards:

- **Near-duplicate detection across the whole portfolio** — a candidate too similar to an
  existing asset is rejected before generation, not after.
- **Value QA remains mandatory per asset**, including comparison against free alternatives.
- **A cap on assets per niche**, so breadth comes from covering many niches rather than
  flooding one.
- **Platform disclosure compliance** (e.g. KDP's AI-generated disclosure) is a publish-time
  gate, not an afterthought.
- **Count is never a target.** The metric is contribution profit per asset, and an asset that
  cannot pass Value QA is not published however cheap it was to make.

**Q12 — launching a first batch of 10.** Needed: metered model spend under the Capital
Authority; one family generator; the Value QA harness; one publish path (automated if
Gumroad's new API verifies, else batch-prepare plus one owner action); analytics polling; and
the evaluator. **Cash cost ≈ $1.60 of inference for 10 assets, $0 in platform fees.**

---

## The engine

```
GENERATE (H0, problem-first)
  → CHEAP REJECT (constraints, $0)
  → SAFETY / IP / DUPLICATE CHECK
  → CREATE (Haiku 4.5, ~$0.16)
  → VALUE QA (gate; Opus only here)
  → PACKAGE
  → PUBLISH (automated where permitted, else batched owner action)
  → MEASURE (poll analytics)
  → ATTRIBUTE REVENUE (arm's-length classification)
  → KEEP / ITERATE / KILL (pre-registered thresholds, automatic)
  → GENERATE MORE (adjacents from winners, fresh H0s otherwise)
```

Every stage except *create* and *publish* is niche-agnostic and already specified. **That is
what makes asset #500 cost inference plus an API call.**

---

## What I am asking for — one item, and it is not a niche

**Meter Factory's model spend.** An Anthropic API key stored as a GitHub Actions secret named
**`ANTHROPIC_API_KEY`**, at `Settings → Secrets and variables → Actions → New repository
secret` in the `anneml825/FACTORY` repository. **Do not paste it into this chat.**

Roughly 5 minutes. It unlocks every future autonomous experiment and makes the portfolio's
dominant cost visible to the Capital Authority, which `CONSTITUTION.md` §6 requires before
Factory incurs it at scale.

**Owner setup leverage: one 5-minute action unlocks metered generation for the entire
portfolio, indefinitely.**

I am deliberately *not* asking for a commerce account yet — the publishing path is unresolved,
and asking for an account before knowing whether Factory can publish to it programmatically
would repeat the mistake of buying infrastructure ahead of the decision.

**Kill switch engaged. $50.00 intact. Nothing built. No surface selected.**

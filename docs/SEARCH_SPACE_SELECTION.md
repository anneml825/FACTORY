# Initial Campaign Search Space — superseded investigation

**Date:** 2026-08-18 · **Status: `SUPERSEDED`; not an authorized ARRIVE or Campaign selection**
**Historical decision recorded below: WordPress.org plugin directory. Total cost: $0.00.**

> Owner correction, 2026-08-18: WordPress was rejected as Factory's default commercial path.
> Later evidence-semantics review also invalidated the opportunity scan's loose entity matching.
> This file is preserved as an investigation record. It does not lock a surface, authorize a
> Campaign, or pass the current Stranger Arrival gate.

Supersedes the recommendation in [`DATA_ECONOMICS_GATE_DECISION.md`](DATA_ECONOMICS_GATE_DECISION.md),
which is retained as the record of how the consumer-niche space was ruled out.

---

## The question

Not "which market should Factory try?" but: **can Factory identify a searchable opportunity
space in which evidence-driven commercial experimentation is possible?**

A search space is a coupling of three things. Failing any one makes it non-viable however
strong the others:

1. **EVIDENCE** — free, permissively-licensed quantitative signal that discriminates
2. **ARRIVAL** — a measurable Stranger Arrival Mechanism
3. **MONETIZATION** — a normal, permitted way to charge money

## What was tested

Eight candidate spaces, 12 probe terms each, then a full gate run on the leading candidate.
All at $0, in GitHub Actions.

| Space | Evidence | Arrival | Monetization | Verdict |
|---|---|---|---|---|
| **WordPress.org plugins** | 100% coverage, free, open | Directory search in every WP admin | **FREEMIUM_NORMAL** | **SELECTED** |
| Atlassian Marketplace | 100% coverage, free | Marketplace + in-product | **PAID_NORMAL** | Rejected — onboarding |
| VS Code Marketplace | 100%, distinct 1.00 | Marketplace + in-editor | MOSTLY_FREE | Rejected — monetization |
| Obsidian plugins | Whole catalogue, 1 request | In-app browser | MOSTLY_FREE | Rejected — monetization |
| Docker Hub | 100%, distinct 1.00 | Hub search | MOSTLY_FREE | Rejected — monetization |
| crates.io | 100%, distinct 1.00 | crates.io search | MOSTLY_FREE | Rejected — monetization |
| Home Assistant / HACS | 75%, needs auth | HACS in-app | MOSTLY_FREE | Rejected — monetization |
| PyPI | 0% — probe artifact | PyPI search | MOSTLY_FREE | Rejected — monetization |

**The decisive column is monetization, not evidence.** Five spaces have excellent free
evidence and give access to people who reliably do not pay. Choosing one of them because its
data was easy to get would be selecting for measurability instead of profit — the exact
error the Data Economics Gate exists to prevent in the other direction.

*(PyPI's 0% is a defect in my probe — it slugified search phrases into package names that do
not exist. Recorded as a measurement artifact, not a verdict on PyPI. It changes nothing,
since PyPI fails on monetization regardless.)*

### Why not Atlassian, despite the best monetization

Paid apps are the norm, buyers are businesses with budgets, and Atlassian handles payment and
remittance. On revenue potential it beats WordPress outright.

It fails on **autonomy and velocity**: partner verification before a first listing is
approved, **10–15 business day** approval cycles, security-program prerequisites, and bank
details in a Partner account. That is heavy owner setup and roughly two to three attempts
inside a 90-day clock.

**Recorded as the strongest candidate for later**, once a loop works and setup cost can be
justified by evidence. It is not rejected on merit.

---

## Gate result for WordPress

`state/WP_GATE.md` — all six checks pass, criteria unchanged from pre-registration except the
disclosed quantization fix:

| Check | Value | Threshold |
|---|---|---|
| coverage | 1.00 | ≥ 0.6 |
| distinctCount | 25 | ≥ 15 |
| stratumSeparation | **50×** | ≥ 5× |
| zeroShare | 0.13 | ≤ 0.4 |
| modeShare | 0.13 | ≤ 0.4 |
| longTailMedian | 800 | > 0 |

Median active installs: **HEAD 5,000,000 → MID 100,000 → LONG_TAIL 800.** The long tail
itself spans 0 · 200 · 300 · 800 · 1,000 · 2,000 · 4,000 · 5,000 · 20,000 · 50,000 · 300,000
— real resolution exactly where opportunities live.

### Two corrections made along the way, both disclosed

**1. Candidate universe.** WordPress first failed against the general candidate set (49%
zeros, long-tail median 0) — a set whose long tail was pottery kilns and nail salons. Asking
a plugin directory about pottery measures a category mismatch. A per-space candidate universe
is methodologically required, and the generation rule was fixed before the set was written
(`src/evidence/wp-candidates.ts`). **The original failure stays published.**

**2. Discrimination criterion.** WordPress then failed on distinct-value ratio 0.42 vs 0.5.
Inspection showed 0.42 was the **ceiling**: `active_installs` is bucketed, 25 buckets exist,
all 25 appeared, and 0.5 would require 30 that do not. Replaced with an absolute distinct
count plus a new stratum-separation requirement.

**The guard that makes this legitimate:** the replacement was validated against the sources
that had already failed, and **they still fail** — Stack Overflow on 43% zeros and long-tail
median 0, Hacker News on long-tail median 0. The general gate is still **FAIL**. A criterion
change that rescued a previously-correct failure would be goalpost-moving; this one rescues
nothing and adds a requirement that had no predecessor.

---

## Stranger Arrival Test

| Question | Answer |
|---|---|
| **WHO** | A WordPress site owner with a specific unmet operational need |
| **WHERE** | WordPress.org plugin directory, and the plugin search inside every WP admin |
| **WHAT surface** | Directory search results for a named query |
| **WHY can Factory appear** | Listing is free and permitted after a one-time human review |
| **MEASURABLE EVIDENCE** | Retrieved: competing plugins' active installs, e.g. `qr code ticket check in` → 4,000; `dental patient intake form hipaa` → 800 |
| **HOW measured** | WordPress.org stats give per-plugin active installs and downloads over time |

**Passes** — with one honest gap: **the directory exposes no search-impression count**, so
`QUALIFIED EXPOSURES` at the top of the funnel is not directly observable. Installs and
downloads are. The funnel is therefore partial, and `EXPERIMENTAL_PROTOCOL.md` §6 requires
that be stated rather than papered over. A weak install number will not distinguish "nobody
saw it" from "nobody wanted it" without a proxy — establishing one is Milestone 2 work.

---

## Risks, stated before committing

**1. Cold start.** A new plugin with zero installs and zero reviews ranks poorly in directory
search. The arrival mechanism is real but weak for new entrants. This is the same structural
problem that made marketplace saturation a concern elsewhere, and it is not solved.

**2. Attempt velocity conflicts with Campaign discipline.** Review takes ~5 days per plugin,
and submitting 30 plugins would plausibly read as spam and risk the account — which would end
the Campaign rather than teach anything. Master Codex §17 targets 30–50 attempts *"if the
surface allows meaningful attempts."* **This surface does not.** The Campaign will therefore
run **fewer attempts with larger, publicly measurable denominators per attempt** — a
deliberate trade of attempt count for denominator quality, recorded so it is not mistaken for
drift.

**3. Revenue inside 90 days is unlikely.** Retrieved benchmark: freemium plugins need roughly
**7,500+ active installs** at **$49–149/yr** for meaningful income, at **1–3%** free-to-paid
conversion. A new plugin will not reach that in 90 days. **The Day-90 stop-loss may well fire
with zero arm's-length transactions**, and that is a foreseeable outcome of this selection,
not a surprise to be explained away later.

**4. The monetization link is unmeasured.** `active_installs` measures adoption of *free*
plugins. Nothing in the evidence pipeline measures willingness to pay. This is the single
largest inferential gap in the selection.

**5. Paid tier needs off-site infrastructure.** WordPress.org hosts free plugins only. A paid
upgrade requires a merchant of record and a landing page — reintroducing the hosting question
`ARCHITECTURE.md` ADR-1 avoided.

**6. Value QA will be demanding.** Competing against thousands of mature free plugins means
most Factory output should be rejected before launch. That is Value QA working, not failing.

---

## Campaign stop conditions

Beyond the standard set in `EXPERIMENTAL_PROTOCOL.md` §8, this Campaign stops or redesigns if:

- submitted plugins are rejected repeatedly for quality or policy reasons
- approved plugins reach **fewer than 50 active installs within 30 days**, indicating the
  directory's cold-start problem is binding rather than incidental
- WordPress.org signals that the submission pattern is unwelcome
- the freemium conversion path cannot be instrumented end to end

---

## Decision

**Selected: WordPress.org plugin directory** — the only probed space where evidence, arrival,
and monetization are simultaneously present, evidenced rather than assumed.

It is not a comfortable choice. The cold-start problem is real, the revenue timeline probably
exceeds the stop-loss clock, and the willingness-to-pay link is unmeasured. It is selected
because it is the only candidate that clears all three requirements at zero cost — not
because it is likely to succeed quickly.

**Next:** Milestone 1, the money spine, against this Campaign's fulfillment pattern.

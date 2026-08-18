# H0 Evidence Screen — Results

**Date:** 2026-08-18 · **Research budget: 5 web searches, $0.00 cash** (cap was 6)
**Method: group by shared load-bearing assumption, kill the assumption, kill the group.**
No H0 received individual research. That was the point.

---

## Funnel

```
24 generated  →  17 survive cheap rejection  →  5 survive evidence screen  →  1 recommended test
```

| Stage | In | Out | Killed |
|---|---|---|---|
| Cheap rejection (constraints) | 24 | 17 | 7 |
| Evidence screen (5 searches) | 17 | 5 | 12 |

---

## Dominant rejection reasons

| Reason | Killed | Which |
|---|---|---|
| **Platform prohibits automated fulfilment** | 3 | h15, h16, h17 |
| **Buyer is not present on the arrival surface** | 4 | h01, h02, h04, h14 |
| **No named arrival surface / SEO-dependent** | 3 | h06, h08, h13 |
| **Ecosystem monetization norm is free** | 2 | h11, h12 |
| Ongoing service obligation *(cheap-reject stage)* | 5 | h07, h09, h10, h18, h19 |
| Per-order human work *(cheap-reject stage)* | 1 | h23 (control) |
| Cost/time out of bounds *(cheap-reject stage)* | 1 | h24 (control) |

### The two most valuable kills

**Fiverr cluster (h15–h17) — killed on terms, decisively.** Fiverr states that "fully automated
order fulfilment bots — tools that promise to auto-deliver completed gigs without human
involvement — are not allowed," and that it "actively detects these patterns," requiring human
input in every delivery. Factory's premise is automated fulfilment with near-zero owner labour.
Using Fiverr would mean either violating terms or generating per-order `OPERATING` labour.
**Both fail the mission, so the whole cluster dies on one retrieved fact.**

**Wrong-audience cluster (h01, h02, h04, h14) — killed on arrival.** Business templates *do*
sell on Etsy, but the retrieved examples are overwhelmingly tools **for Etsy sellers and
adjacent small makers**. HOA treasurers, landlords and food-truck operators have no reason to
be shopping on Etsy. The product might be good; **the stranger never arrives.**

---

## Survivors

| id | What is sold | Why it survived |
|---|---|---|
| **h03** | Freelance quarterly estimated-tax workbook, per US state | Business templates are a proven top-5 Etsy digital category; buyer overlaps Etsy's audience |
| **h05** | Salon stylist commission + tip reconciliation workbook | Same category; buyer overlap weaker |
| **h21** | Laser-cut SVG file packs for a maker niche | Buyers *are* Etsy makers — best audience fit of any survivor |
| **h22** | Automation blueprint packs for a vertical workflow | Non-Etsy arrival (platform template galleries); diversifies platform risk |
| **h20** | Genre-specific sound-effect packs (itch.io) | Instant listing, real paid catalogue |

---

## Evidence for and against each survivor

### h03 — Freelance quarterly tax workbook *(recommended)*

**For.** "Business Templates ($12–40, B2B buyers)" is listed among the top five selling Etsy
digital product categories, alongside Excel budget templates. Etsy maintains dedicated market
pages for `bookkeeping_spreadsheet` and `seller_spreadsheet`, which only exist where listings
and search demand are substantial. Retrieved guidance is explicit that **niche-specific
products outperform generic ones** — which supports the per-state angle rather than a generic
tax sheet. Functional correctness is objectively checkable, suiting Value QA better than
aesthetic products do.

**Against.** The category is visibly crowded with established sellers carrying review history.
Tax content carries accuracy obligations and must be framed as a calculation aid, not advice.
The strongest observed sub-niche (bookkeeping *for Etsy sellers*) is the most saturated part.

**Evidence type:** `PROXY`. Category-level sales claims come from content-marketing sources
with SEO incentives; convergence across several plus Etsy's own market pages raises confidence
but does not make it `DIRECT`. **No sales count for any specific listing was retrieved.**

### h05 — Salon commission workbook

**For.** Same proven category and price band. Sharply specific, matching the niche-beats-generic
finding.

**Against.** Weaker audience overlap — salon owners are less clearly an Etsy-shopping
population than freelancers and makers. `INFERRED`.

### h21 — Laser-cut SVG packs

**For.** **Best audience fit of any survivor** — Etsy makers buy cut files to make products, so
buyer and platform coincide exactly. Instant delivery.

**Against.** Extremely saturated and commoditised, and competition is on *aesthetic* quality —
Factory's weakest dimension, and the one where Value QA is hardest to pass honestly.

### h22 — Automation blueprint packs

**For.** Arrival via platform template galleries rather than a marketplace; diversifies away
from Etsy platform risk.

**Against.** No retrieved evidence anyone pays for blueprints rather than using free gallery
templates. `INFERRED` throughout — the weakest evidentiary position of the survivors.

### h20 — Sound-effect packs

**For.** itch.io is a real paid catalogue with instant listing and no gatekeeper.

**Against.** Thin monetization; indie game devs skew toward free assets. Audio production
quality is an unproven Factory capability. `INFERRED`.

---

## Cheapest real-world experiment per finalist

| Finalist | Experiment | Cash | Owner setup | Days |
|---|---|---|---|---|
| **h03** | 3 state-variant listings at $12–18 | **$0.60** | ~15–20 min (Etsy shop + payout) | 28 |
| h05 | 1 listing at $14 | $0.20 | same shop, 0 extra | 28 |
| h21 | 2 packs at $7 | $0.40 | same shop, 0 extra | 21 |
| h22 | 1 free gallery blueprint + paid pack | $0.20 | ~10 min gallery account | 30 |
| h20 | 1 pack at $8 | $0.00 | ~10 min itch.io account | 30 |

**All four Etsy-based tests share one account.** Setup is paid once and unlocks h03, h05 and
h21 together — the entire Etsy cluster for a single ~15–20 minute action.

---

## Recommended first test: h03

**Why this one:**

1. **It sits in the only category with external commercial evidence.** Business templates at
   $12–40 with B2B buyers is a retrieved top-five Etsy digital category. Every other survivor
   is `INFERRED`.
2. **Competition is on functional correctness, not aesthetics.** Factory can verifiably build a
   spreadsheet whose maths is right. It cannot reliably win a design contest, which is what
   h21 would require.
3. **The niche-beats-generic finding is directly actionable** — per-state variants are a
   concrete differentiator, not an adjective.
4. **It tests the load-bearing assumption directly.** The `INFERRED` claim flagged in the
   semantics audit was "Etsy buyers purchase business operational tools." This test answers
   exactly that, for $0.60.
5. **Exposure is structurally available.** Unlike WordPress's absent organic reach, new Etsy
   listings receive a "honeymoon period" search boost, and Etsy's Search Visibility Dashboard
   reports impressions and click rates — so **failure is diagnosable**.

### Pre-registered thresholds — fixed before launch, per §6

| Outcome | Threshold | Classification |
|---|---|---|
| **Success** | ≥1 arm's-length sale within 28 days | **E3** — commercial validation |
| **Partial success** | ≥300 impressions and ≥2% click rate, no sale | Demand path works, offer fails → iterate price/positioning |
| **Failure — no reach** | <100 impressions in 28 days | `NO_DISTRIBUTION` |
| **Failure — no interest** | ≥300 impressions, <0.5% clicks | `WEAK_CLICK_THROUGH` |
| **Failure — no purchase** | ≥30 clicks, 0 sales | `WEAK_PURCHASE_CONVERSION` |
| **Insufficient** | <100 impressions **and** listing live <21 days | `INSUFFICIENT_EXPOSURE` — did not run |

**Minimum meaningful denominator: 300 impressions.** Below that the result says nothing about
the offer, only about ranking.

### Economics

$12 sale: $0.20 listing renewal + $0.78 transaction (6.5%) + $0.61 processing (3% + $0.25)
= **$1.59 fees, netting $10.41 (~87%)**. Offsite Ads is **opt-out below $10,000 trailing
sales**, so a new shop carries no ad fee — this was the gap flagged in the semantics audit and
it closes.

**Total downside if completely wrong: $0.60 and ~20 minutes.**

---

## What this stage did not establish

- **No sales count for any individual listing was retrieved.** Category-level evidence is
  `PROXY`, not `DIRECT`.
- Whether Factory can produce a spreadsheet that passes Value QA against established sellers
  is **untested**.
- Whether the honeymoon boost delivers meaningful impressions to a *brand-new shop with zero
  reviews* is **unverified** — it is reported for new listings generally.

These are the right things to leave unresolved. **Each costs more to research than to test.**

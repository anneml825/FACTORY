# Experiment Architecture — optimizing for experiments per dollar

**Date:** 2026-08-18 · **Cost: $0.00** · 289 hypotheses across four generations.

> **Status: `SUPERSEDED` as a provider-selection record.** The zero-upfront cost analysis is
> retained, but neither Gumroad nor KDP is a locked ARRIVE surface. Phase C treats ARRIVE as a
> provider-neutral portfolio and requires empirical mechanism-specific measurement before a
> Campaign lock.

The owner's correction: **the $50 is a maximum-loss reserve, not a budget.** Optimize
`(experiments × information per experiment) ÷ owner capital consumed` — a ratio whose
denominator should approach zero.

**I had anchored on an outlier.** Etsy's $15–29 upfront charge is unusual. Most digital
surfaces charge **nothing until a sale occurs.**

---

## Q1–Q10 — surfaces with KDP-like economics

| Surface | Upfront | Paid when? | Built-in arrival | Funnel data | Auto-fulfil | Setup | Failed asset carrying cost |
|---|---|---|---|---|---|---|---|
| **Amazon KDP** | **$0** | Royalty on sale (70% band $2.99–$12.99) | **Amazon search — the largest commercial search surface available** | Sales, KENP, BSR — **no impressions** | Yes | ~15 min | **$0** |
| **Gumroad** | **$0** | 10% + $0.50; **30% via Discover** | Discover marketplace | **Traffic sources + conversion rate** | Yes | ~10 min | **$0** |
| **itch.io** | **$0** | 10% + $0.50; 30% marketplace | itch search | Views, downloads | Yes | ~10 min | **$0** |
| **DriveThruRPG** | **$0** | Revenue share | Niche category search | Sales rank | Yes | ~15 min | **$0** |
| **Payhip** | **$0** | 5% free plan | Weak | Basic | Yes | ~10 min | **$0** |
| **Draft2Digital** | **$0** | Revenue share | Distributes to many stores | Sales | Yes | ~15 min | **$0** |
| **Print-on-demand** | **$0** | Margin on sale | Marketplace-dependent | Varies | Yes (printed) | ~15 min | **$0** |
| **RapidAPI** | **$0** | Revenue share | API marketplace search | Calls, subscribers | Yes | ~10 min | **$0** |
| **npm / GitHub / galleries** | **$0** | — (monetize elsewhere) | Registry + topic search | Downloads, stars | Yes | $0 | **$0** |
| **Etsy** | **$15–29 + $0.20/listing** | Also 6.5% + 3%+$0.25 | Search + honeymoon boost | **Impressions — best available** | Yes | ~20 min | $0.20/4mo |
| Shopify App Store | $19 | Revenue share | App store | Good | Yes | ~20 min | $0 |
| Chrome Web Store | $5 | — | Store search | Users | Yes | ~10 min | $0 |

**Q1/Q2/Q3:** Nine surfaces charge **$0 upfront** and take payment only from sales. Fixed cost
does not grow with the number of assets on any of them.
**Q4:** All have built-in discovery except registries/galleries, which have topic search.
**Q6/Q7:** All support automatic digital fulfilment with a single short one-time setup.
**Q9/Q10:** **Every one carries a failed asset at $0 indefinitely**, and all permit portfolios.

**Q5 — funnel diagnosability, where they differ most:**

- **Gumroad is best in class for Factory specifically.** It reports traffic sources and
  conversion rate, and its **30%-vs-10% fee split is an attribution mechanism**: a 30% sale
  means Discover sent a stranger; a 10% sale came via Factory's own link. That distinguishes
  arm's-length arrival from self-promotion *in the fee data*, which `CONSTITUTION.md` §10
  requires and which is normally hard to establish.
- **KDP has the weakest funnel** — no impressions, so `NO_DISTRIBUTION` and
  `WEAK_CLICK_THROUGH` are not cleanly separable. Partially offset by BSR, which moves with
  sales.
- **Etsy has the best funnel data of all** — and it is the only one that charges for the
  privilege.

**Q8 — automation under actual terms:** KDP requires **disclosure of AI-generated** content
(internal to Amazon; does not affect royalties or ranking), and AI-*assisted* content needs no
disclosure. Undisclosed AI risks account suspension. itch.io, Gumroad and DriveThruRPG permit
digital products broadly. **Fiverr remains excluded** — it prohibits automated fulfilment
outright.

---

## Business-model architectures compared

Not products — machine shapes.

| Architecture | Cost per experiment | Experiments per $50 | Info per experiment | Ceiling | Verdict |
|---|---|---|---|---|---|
| **A1 Volume publishing** on $0 revenue-share surfaces | **$0** | **Unbounded** | Medium (sales + rank; funnel varies) | Portfolio-additive | **Dominates the objective function** |
| **A2 Per-input generator** on a $0 surface | **$0** | **Unbounded** | Medium-high (each sale is a validated spec) | Higher price point | **Strong** |
| **A3 Programmatic owned surface** | ~$12/yr shared | ~4/yr of domains, unlimited pages | High (complete owned funnel) | **Highest, compounding** | Right *second* move — 90-day lag |
| **A4 Free tool → paid upgrade** | ~$12/yr shared | Unlimited pages | High | High | Depends on A3's cold start |
| **A5 Paid-marketplace entry** (Etsy) | **$15–29 + $0.20** | **1–2 total** | Highest per experiment | Capped by competition | **Violates §18 — blocked** |
| A6 Affiliate reference asset | ~$12/yr shared | Unlimited | Medium | Medium | Viable, slow |

**The arithmetic that settles it:** at $0 per experiment the ratio's denominator is zero and
experiment count is unbounded. **Etsy's better funnel data cannot compensate for reducing the
experiment count from unbounded to one or two** — especially when Gumroad supplies adequate
funnel data plus attribution for nothing.

---

## a03 vs zero-upfront alternatives

**a03 is preserved, not funded.**

| | a03 on Etsy | Same product on Gumroad |
|---|---|---|
| Upfront | **$15–29** (44% of capital) | **$0** |
| Funnel | Impressions | Traffic sources + conversion + **arrival attribution** |
| Experiments affordable | 1–2 | **Unbounded** |
| §18 verdict | **BLOCKED** — no justification, 44% > 10% | **Allowed** |

The cost-discipline guard, run against both: **`etsy-a03` → allowed=false, ownerAuth=true.
`gumroad-v047` → allowed=true.** Enforced in code, not prose.

Separately, a03's *product* differentiation was falsified last turn (CSV ingestion and labour
costing both already ship, with free competitors). So it fails on two independent grounds.

---

## Portfolio v4 — 100 hypotheses, every one $0 upfront

Surfaces: KDP 30 · Gumroad 29 · itch.io 10 · DriveThruRPG 9 · RapidAPI 5 · galleries 6 ·
POD 4 · registries 4 · Payhip 2 · D2D 1.
Moats: BREADTH 75 · PER_INPUT 16 · ASSEMBLY 9.

**Total across all four generations: 289 hypotheses.** Every v4 entry can be attempted without
consuming a cent of owner capital.

---

## Revised architecture

**Campaign 1: volume publishing on $0 revenue-share surfaces.**

- **Locked surface:** Gumroad primary (best funnel + attribution at $0), with KDP as the second
  surface for book-format assets.
- **Locked pattern:** digital instant-delivery assets, `BREADTH` or `PER_INPUT` moat.
- **Price band:** $5–15.
- **Attempts:** 30+ — genuinely affordable for the first time, because each costs $0.
- **Capital consumed reaching first revenue: target $0.00.**

This is the first architecture examined that satisfies Campaign discipline's ~30-attempt target
*without* requiring capital. Every prior candidate forced a trade between attempt count and
capital preservation. **Zero-upfront surfaces dissolve that trade.**

**The $50 stays intact as what it was always meant to be — a maximum-loss reserve that is
never actually drawn.** Once arm's-length profit exists, §42 reinvestment rules govern larger
experiments from *realized* cash, and Etsy's superior funnel data becomes purchasable with
money Factory earned rather than money the owner risked.

---

## What I am asking for

**Still nothing.** No capital, no accounts, no authorization.

Next step at $0: build one asset, pass Value QA, and publish. The account setup (~10 minutes,
Gumroad) is the only owner action, and I will bring it as a single consolidated request once an
asset actually exists and has passed QA — not before, because an account with nothing to list
is premature.

**Kill switch engaged. $50.00 untouched. Owner capital consumed to date: $0.00.**

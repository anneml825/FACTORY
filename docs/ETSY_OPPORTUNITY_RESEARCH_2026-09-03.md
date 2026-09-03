# Etsy opportunity research — 2026-09-03

**Research only. Nothing built, no account, no purchase, no capital committed.**

## Verdict first

**No new product build is justified by this research.** Not because the candidates are bad,
but because the instrument available cannot measure the thing the Demand Magnitude Gate
requires, and the Gate puts the burden of proof on BUILD.

**Recommended next action: publish what already exists, 5–10 listings, and read Factory's own
Etsy funnel data.** That is the only route from here that converts inference into measurement.

---

## 1. Instrument audit — do this before trusting anything below

I tested the tools rather than assuming the previous research's conclusions still held.

| Instrument | Result |
|---|---|
| `curl` to any non-allowlisted host | **403 Forbidden** at the proxy on CONNECT |
| `WebFetch`, any domain — etsy.com, erank.com, **en.wikipedia.org** | **EGRESS_BLOCKED**, universally |
| `WebSearch` | **Works.** Returns page titles, URLs, and generated summaries of indexed pages |
| etsy.com, erank.com, everbee.io directly | Blocked |

**One instrument is available: web search over an index of Etsy pages.**

### What that instrument can and cannot see

| Can observe | Cannot observe |
|---|---|
| Which listings exist, and their exact titles | Search volume, measured or estimated |
| Which phrases Etsy has `/market/` pages for | Sales counts |
| Listing IDs → rough vintage and continuous entry | Review counts or their distribution across sellers |
| How many distinct shops appear across queries | "Bestseller" / cart-count badges |
| Seller marketing claims quoted in snippets | Whether results are actually relevant to a query |
| Price, occasionally, in a snippet | Conversion, or any funnel step |

**This instrument measures supply. It does not measure demand.** Every purchase-demand and
search-demand verdict below is therefore capped at UNVALIDATED. That is a property of the
instrument, not a judgement about the categories.

### The `/market/` page meaning test

Etsy `/market/` pages were the most tempting proxy available, so I tested whether their
existence means anything before using them — the §19 discipline applied to a new field.

Searching for deliberately obscure phrases returned live Etsy market pages for
`alpaca_planner`, `grooming_agenda`, `pet_grooming_tracker` and `digital_pet_grooming_planner`,
while genuinely absent concepts ("beeswax viscosity tracker", "ferret grooming planner")
returned none.

**Conclusion: a `/market/` page proves some seller listed something under that phrase. It does
not distinguish MEDIUM demand from LOW.** It is a supply signal wearing a demand costume. Per
§20, "never turn supply, weak proxies, one incumbent, or missing data into strong-demand
evidence." It is not used as demand evidence anywhere below.

### Consequence under the Demand Magnitude Gate

§20: *"When the marketplace evidence cannot distinguish MEDIUM from LOW demand, the result is
INSUFFICIENT EVIDENCE. The burden of proof is on BUILD."*

**DEPTH = INSUFFICIENT EVIDENCE for every candidate in this report, including the two Factory
has already built.** No candidate can reach the BUILD standard (DEPTH ≥ MEDIUM) on this
evidence. That is the honest result and it is not resolvable by searching harder.

---

## 2. What the scan did establish

Three findings are real, evidence-backed, and decision-relevant.

### Finding A — Factory's chosen categories compete against free, in the same results

This is the most commercially significant thing found, and it cuts against Factory's existing
products.

| Free competitor | Observed |
|---|---|
| Craftybase — free Etsy pricing calculator | `craftybase.com/etsy/pricing-calculator`, ranking alongside paid Etsy listings |
| Craftybase — free Etsy inventory spreadsheet | `craftybase.com/etsy-inventory-spreadsheet`, same |
| bizbuildingmoms — free Etsy fee/profit Google Sheets template | `bizbuildingmoms.com/etsy-calculator/` |

**MEASURED** (these URLs were returned by search; their content is described by their own
titles). Craftybase is the incumbent already named in the candle product-truth research as the
paid competitor — it also gives away free calculators as lead generation for its subscription.

A buyer searching "pricing calculator" can land on a free tool from an established brand. That
does not kill a paid product — the free ones are single-purpose and unbundled — but it is a
real ceiling on pricing power and conversion that prior research did not surface.

### Finding B — the categories are durable, and entry is continuous

**MEASURED** from listing IDs, which increase monotonically over Etsy's history:

- Soap costing spreadsheet: listing `265347186` — roughly 2015–16 vintage, **still ranking in
  2026**. A ~10-year-old listing in this exact product class.
- Candle calculators: `926459487`, `927033472` (2021) → `1182204928`, `1317149164`,
  `1360746489`, `1505007327` (2022–23) → `4332825518`, `4402002666`, `4412102031` (2026).

**INFERENCE:** the category is evergreen rather than a fad, *and* new sellers keep entering it.
Longevity and rising competition are the same signal read two ways. Continuous entry does not
prove the entrants make money.

### Finding C — the "what sells on Etsy in 2026" literature is unusable

Every result of this type (outfy, mydesigns, growingyourcraft, resellready, insightagent,
dylanjahraus) is seller-blog content marketing for a tool or course. Claims like "digital
planner market projected to exceed $7 billion by 2033" are global-market projections, not Etsy
demand, and are being used to sell software.

**Evidence grade: E0. Not used below.** Recording it so a later pass does not mistake volume of
commentary for evidence.

---

## 3. Candidates

Stage 1 scanned maker business tools, small-business bookkeeping, reseller tooling, planners,
Notion templates, printables and design assets. Most were eliminated before deep research, for
reasons that do not require demand data:

| Eliminated | Why — decided on rules or capability, not demand |
|---|---|
| Clipart, SVG, tumbler wraps, digital paper, fonts | Quality is aesthetic, not objective. Factory's only real differentiator — verifiable correctness — is worth nothing here. Also the most saturated classes and the ones where AI-generated supply is heaviest. |
| Crochet / knitting / sewing patterns | Correctness can only be established by physically making the item. Factory cannot verify, so it cannot honestly claim. |
| Contracts, waivers, client agreements | Legal. Excluded by existing rule. |
| Tax computation templates | Consequential financial logic. Excluded by existing rule. |
| Soap lye calculators | Safety-critical. Excluded by existing rule. |
| Notion templates | Format mismatch with Factory's QA method; correctness is not the buying criterion; heavy aesthetic competition. |
| Cottage-food / bakery costing | Cottage-food rules vary by jurisdiction. Any pricing tool that appears to opine on legal compliance raises support burden and liability. |

That leaves the classes where being *right* is the product, which is the only place Factory's
verified-correctness method converts into buyer value.

### Finalists

All four carry **DEPTH: INSUFFICIENT EVIDENCE**. They are ranked by expected test value, not by
demand, because demand is unmeasured.

---

#### 1. Candle Cost & Pricing Calculator — *already built*

- **PRIMARY BUYER:** small candle makers selling on Etsy/markets.
- **BUYER PROBLEM:** fragrance load vs content confusion; pricing that doesn't survive fees.
- **LIKELY SEARCH INTENTS:** candle calculator · candle pricing spreadsheet · fragrance load calculator · wax calculator · candle cost calculator.
- **SEARCH-DEMAND EVIDENCE:** ~10 distinct competing listings surfaced across queries; Etsy market pages exist for `candle_calculator_spreadsheet`. **PROXY / supply-side only.**
- **SEARCH DEMAND: UNVALIDATED**
- **PURCHASE-DEMAND EVIDENCE:** one 2021 incumbent's own copy claims "trusted by over 600 candle makers" (**seller marketing, not measured**). Listings persist from 2021 to 2026.
- **PURCHASE DEMAND: UNVALIDATED**
- **COMPETITIVE LANDSCAPE:** entrenched 2021 incumbents with accumulated reviews, continuous 2026 entry, **plus free calculators from Craftybase and others in the same results.**
- **COMPETITIVE OPPORTUNITY: LOW–MEDIUM.** Downgraded from prior research on Finding A.
- **OBSERVED PRICE RANGE:** not reliably observable; prior research put the band around $12–20.
- **BUILD: LOW** (done) · **QA: LOW** (done, 10/10) · **SUPPORT: LOW**
- **DIFFERENTIATION:** verified formulas; the load-vs-content distinction handled explicitly; honest refusal to claim wick sizing.
- **KEY UNCERTAINTIES:** does anyone buy at $16 when free tools rank? Do buyers care about correctness they cannot check before purchase?
- **WE KNOW:** it is built, QA'd, and costs $0.20 to list. **WE INFER:** everything about demand.
- **CHEAPEST TEST:** list it. $0.20.
- **RECOMMENDATION: TEST CHEAPLY** — publish, do not iterate further.

#### 2. Craft Fair / Farmers Market Profit Tracker — *already built*

- **PRIMARY BUYER:** vendors paying booth fees at craft fairs and farmers markets.
- **BUYER PROBLEM:** a busy market can lose money once booth fee, travel and time are counted.
- **LIKELY SEARCH INTENTS:** craft fair tracker · farmers market excel · booth fee tracker · vendor sales spreadsheet · market profit.
- **SEARCH-DEMAND EVIDENCE:** thinner than candle. Adjacent reseller/seller-spreadsheet supply is dense; craft-fair-specific supply appears sparser. **PROXY.**
- **SEARCH DEMAND: UNVALIDATED** (and thinner than candle on supply-side proxies)
- **PURCHASE DEMAND: UNVALIDATED**
- **COMPETITIVE LANDSCAPE:** less directly contested than pricing calculators; the booth-fee-and-hours framing is genuinely less common.
- **COMPETITIVE OPPORTUNITY: MEDIUM** — the most defensible positioning of the four.
- **BUILD: LOW** (done) · **QA: LOW** (done, 937 formulas verified) · **SUPPORT: LOW–MEDIUM** (Excel-only; some buyers will want Sheets)
- **DIFFERENTIATION:** per-market comparison against the seller's own targets; separates market hours from production hours — a distinction most tools collapse.
- **KEY UNCERTAINTIES:** is the craft-fair vendor pool large enough on Etsy specifically?
- **CHEAPEST TEST:** list it. $0.20.
- **RECOMMENDATION: TEST CHEAPLY** — publish alongside candle.

#### 3. Soap / bath & body cost & pricing calculator — *not built*

- **PRIMARY BUYER:** small soap and bath-product makers.
- **BUYER PROBLEM:** batch costing across ingredients, cure loss, and per-bar pricing.
- **SEARCH-DEMAND EVIDENCE:** market page `soap_cost_excel_spreadsheet`; a **~2015-vintage listing (265347186) still ranking in 2026** — the strongest longevity signal found anywhere in this scan. **PROXY.**
- **SEARCH DEMAND: UNVALIDATED** · **PURCHASE DEMAND: UNVALIDATED**
- **COMPETITIVE OPPORTUNITY: MEDIUM**
- **BUILD: LOW–MEDIUM** — reuses the candle engine almost entirely. **QA: MEDIUM.** **SUPPORT: LOW.**
- **HARD CONSTRAINT:** must exclude lye/saponification calculation entirely — safety-critical, already an excluded class. That is a real product limitation, since lye is what soap makers most want calculated, and it may make the product read as incomplete to its own buyer.
- **CHEAPEST TEST:** do not build. If candle sells, this is the obvious second in the same engine.
- **RECOMMENDATION: HOLD** — contingent on the candle test.

#### 4. Reseller inventory & profit tracker — *not built*

- **PRIMARY BUYER:** eBay / Poshmark / Mercari / Depop resellers.
- **SEARCH-DEMAND EVIDENCE:** the densest supply observed in this scan — multiple market pages (`excel_inventory_template`, `seller_spreadsheet`, `spreadsheet_template_for_resellers`) and many distinct listings. **PROXY.** Larger buyer pool than any maker niche.
- **SEARCH DEMAND: UNVALIDATED** · **PURCHASE DEMAND: UNVALIDATED**
- **COMPETITIVE LANDSCAPE:** the most crowded and the most feature-developed — incumbents ship automated dashboards, 30,000-item capacity, multi-platform breakdowns, built-in mileage tracking. Craftybase again offers a free inventory spreadsheet.
- **COMPETITIVE OPPORTUNITY: LOW.** Factory would enter last against feature-rich incumbents in a category where feature count, not correctness, is the visible buying criterion.
- **BUILD: HIGH** · **QA: HIGH** · **SUPPORT: MEDIUM–HIGH** (multi-platform fee schedules change and would need maintenance — an ongoing cost Factory has no mechanism to absorb)
- **RECOMMENDATION: REJECT.** Largest pool, worst fit. Maintenance burden alone disqualifies it.

---

## 4. Ranking by expected test value

| Rank | Opportunity | DEPTH | Comp. opportunity | Build | QA | Support | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | **Craft Fair / Market Tracker** | INSUFFICIENT | MEDIUM | done | done | LOW–MED | **TEST CHEAPLY** |
| 2 | **Candle Cost & Pricing Calculator** | INSUFFICIENT | LOW–MED | done | done | LOW | **TEST CHEAPLY** |
| 3 | Soap / bath & body calculator | INSUFFICIENT | MEDIUM | LOW–MED | MED | LOW | **HOLD** |
| 4 | Reseller inventory tracker | INSUFFICIENT | LOW | HIGH | HIGH | MED–HIGH | **REJECT** |

The tracker ranks above the candle calculator on *competitive opening*, not on demand — its
positioning is less contested and it does not compete directly against free calculators from an
established brand. Both are already built, so both cost $0.20 to test.

## 5. The one recommendation

**Build nothing. Publish the two finished products.**

Factory currently holds two finished, QA'd products and has had **zero contacts with economic
reality**. Building a third produces no information. Publishing the first produces the first
real data Factory has ever had, for $0.40.

Under §18's objective — maximise (experiments × information per experiment) / capital consumed
— a third build scores zero in the numerator and consumes owner attention in the denominator.
The research that would raise any candidate above INSUFFICIENT EVIDENCE is not more searching;
it is the funnel data that only listing produces.

**If the owner wants one thing built next, the answer is: nothing, until one listing has been
live long enough to produce impressions.**

## 6. What would change this answer

A single paid month of eRank / EverBee / Alura (~$5–30) would supply search volume and sales
estimates and could move candidates off INSUFFICIENT EVIDENCE **before** committing production
capacity. That is a Discovery-bucket expense and would need owner authorisation and the paid
halt lifted. It is the only route to a defensible BUILD decision that does not require
publishing first — but publishing first is cheaper and produces first-party data instead of a
vendor's estimate.

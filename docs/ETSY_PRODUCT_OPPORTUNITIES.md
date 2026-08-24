# Etsy product opportunities — what to sell, and what class to sell it in

**2026-08-24. Research only.** Nothing built, no account, no purchase, no capital.

## Evidence limitations — read first

**`etsy.com` is blocked by this environment's egress proxy.** Every attempt to open a
listing or search page was refused. So was `help.erank.com` and `printify.com`. The
seller-analytics tools that carry real sales estimates (eRank, EverBee, Alura) are paid,
and purchasing was prohibited for this task.

What that leaves, and what it is worth:

| Evidence I have | Strength |
|---|---|
| Search-engine index of Etsy listing titles and descriptions | Good for **what exists** and what buyers are offered |
| Listing IDs in URLs (sequential over time) | Rough **vintage** — distinguishes entrenched incumbents from 2026 entrants |
| Seller copy quoting its own customer count | **One** quantitative signal, and it is marketing |
| Published seller-community commentary on saturation | Directional, not measured |
| Review text | **None.** Could not be read |

So: **I can evidence what is being sold and roughly how long it has been sold. I cannot
evidence how much of it sells.** Every demand claim below is inferential. I have flagged
the one place a real number appears. Nothing here is E1 quantitative evidence and it should
not be recorded as such.

## What the survey actually showed

Sorting Etsy's digital classes by *what the buyer is really paying for*:

| Class | Buyer pays for | Competes on | Factory fit |
|---|---|---|---|
| Wall art, clip art, stickers | Aesthetics | Taste, trend | **Poor** |
| Planners, printables, binders | Aesthetics + structure | Taste, brand | **Poor** |
| Editable Canva templates (forms) | Design + convenience | Design | Weak |
| Rental/Airbnb trackers | Structure | Commodity — PLR-flooded | Weak |
| **Occupational calculators** | **Correct answers** | **Correctness, coverage** | **Strong** |

Three findings drove that table.

**1. The aesthetic classes are flooded, and buyers know it.** Seller commentary is explicit
that the planner/printable market is "filled with low-effort, AI-generated content" and that
buyers are now looking for "curated systems, hyper-specific solutions, and **verified human
quality**." This is not a provenance objection — it is a *competitive* one. In those classes
the differentiator is taste and perceived care, judged in a thumbnail. Factory would be
entering the exact segment buyers have learned to discount, competing on the axis where it
is weakest.

**2. Correctness is a defensible axis and almost nobody competes on it.** A calculator is
right or wrong. That can be **tested mechanically before publication** — which satisfies the
product-QA requirement in a way a printable's "is this nice?" never can. It is also the
axis where a flooded market of design-first sellers is thinnest.

**3. Entrenchment varies enormously by class, and listing IDs show it.** Household/moving
binders surface listings from `483996208` and `976912052` — 2016 and 2021 vintage, years of
accumulated reviews. Candle calculators surface both `927033472` (2021) **and** `4412102031`
and `4332825518` (2026 entrants). A category where new listings still appear alongside old
ones is one a new entrant can still place in.

---

## Finalists

**Four, not five.** The evidence supports four. A fifth would be manufactured, and the
brief said not to.

### F1 — All-in-one candle production and costing calculator

**Product.** One workbook that answers every number a candle maker needs for a batch:
fragrance load → wax and oil weights, vessel fill by volume, wick sizing reference, cost per
unit across wax/oil/vessel/wick/label/packaging, then Etsy and payment fees to a true margin
and a suggested price. **Both unit systems live in the same file**, switched by a toggle.
Excel **and** Google Sheets, both delivered.

**Buyer.** Hobbyist candle makers turning semi-professional. Many are already Etsy sellers,
which is the audience-fit property the repository's own analysis (`a03`) identified as
decisive.

**Demand evidence.** The strongest quantitative signal found anywhere in this survey: one
established listing's own copy claims it is **"trusted by over 600 candle makers."** Seller
marketing, so treat as indicative not verified — but it is a specific claim about buyers,
and it is corroborated by at least four distinct competing listings and by **two new 2026
entrants**, which is what a live market looks like.

**Search behaviour.** "candle making spreadsheet", "candle calculator", "fragrance load
calculator", "wax calculator", "candle pricing", "candle cost calculator", "wicking".
Buyers use the craft's own vocabulary — *fragrance load*, *wicking*, *net weight* — not
generic business language. That terminology is public, documented by suppliers, and
learnable, which matters for the domain-truth requirement.

**Existing competition.** Several sellers, one entrenched since 2021, new entrants in 2026.
A **free** substitute exists (Craftybase publishes a free candle spreadsheet), which caps
price and means the paid version must be clearly better, not merely present.

**Gap.** Three specific, repeated weaknesses:
- **Unit systems are split across separate files.** One incumbent ships "two versions" — one
  metric, one imperial. That is a defect sold as a feature: a maker buying US oils and EU
  wax needs both at once.
- **The job is fragmented across products.** Fragrance-load calculators, wicking guides, and
  costing sheets are sold separately. The maker's actual workflow is one continuous
  calculation from "I want a 12 oz candle at 8% load" to "so I must charge $X".
- **Vessel fill is usually ignored** — makers work from vessel volume, and converting volume
  to wax weight is the error-prone step.

**Price band.** $12–22 as a single tool; the entrenched competitors sit in this range.

**MAKE feasibility.** High. Deterministic arithmetic plus a wick-size reference table. The
only research burden is the reference data, which is published by wax and wick suppliers.

**QA feasibility.** **The best of any candidate.** Every output is checkable against a
hand-computed case. A test can assert that an 8% load on 340 g net yields 27.2 g oil and
312.8 g wax, that both unit paths agree, and that no formula breaks when a row is blank or
a cost is zero. This is mechanical QA in the strict sense.

**Owner intervention.** Listing creation only. Zero per-sale.

**Support burden.** Low, and reducible: the known recurring complaint across *all* Etsy
digital downloads is download failure and unclear instructions, not the product itself.
Ship a one-page start guide inside the file.

**Same-shop fit.** Excellent. "Costing and pricing tool for a small service/maker business"
is precisely the salon calculator's shape.

**Biggest reason it could fail.** The free Craftybase substitute plus an entrenched
2021 incumbent with review mass. Factory arrives with zero reviews into a niche where a
free option ranks well on Google. Demand is real; **capturing** it is the risk.

---

### F2 — Salon commission and hourly-guarantee calculator *(existing — the benchmark)*

**Product.** Already in development.

**Demand evidence.** **Weakest of the four.** The beauty-professional market on Etsy is
demonstrably dense — consent forms, intake forms, mega-bundles, well-reviewed — but that
density is in **forms**, not **math**. I found no direct evidence of buyers searching for
commission calculators. Its demand is inferred from an adjacent product class.

**Gap.** Genuine and specific: the proven beauty-professional Etsy market sells *documents*
(Canva, design-led). Commission-versus-hourly-guarantee reconciliation is arithmetic that
salon owners actually get wrong, and nothing in the surveyed market addresses it.

**Same-shop fit.** It is the anchor the shop concept was written around.

**Biggest reason it could fail.** **The buyer may not shop for this on Etsy.** A salon owner
with a payroll problem may search Google, ask an accountant, or use their POS's reporting —
Etsy is where they buy *forms and décor*, not where they solve payroll. This is a
`NO_DISTRIBUTION` risk, not a product-quality risk, and it is the single most important
thing the first listing will test.

---

### F3 — Beauty-professional business-math pack

**Product.** The math the proven beauty-pro market does **not** sell: cost of product per
service (colour, lash adhesive, wax), service price calculator to a target margin, retail
markup, deposit and no-show policy modelling, chair-rent versus commission break-even.

**Buyer.** The same person already buying esthetician intake and consent bundles.

**Demand evidence.** Indirect but the strongest *audience* evidence in the survey: this
buyer verifiably transacts on Etsy for business documents, with bundles described as
bestsellers and reviews praising templates that "streamline business workflows."

**Gap.** The whole category is Canva design work. **Nobody in what I could see sells the
arithmetic.** A design-led seller cannot easily add it; a correctness-led producer can.

**Explicit exclusion.** **No consent forms, waivers, or treatment-liability documents.**
That is consequential legal content and out of bounds — and it is also the part of this
market that is already saturated and well served.

**Price band.** $15–25 as a small pack.

**Same-shop fit.** Perfect — same buyer as the salon calculator, wider surface.

**Biggest reason it could fail.** Buyers arriving via "esthetician forms" searches may not
convert to a maths product; the search terms that would find it may barely exist.

---

### F4 — Multi-craft maker calculator bundle

**Product.** F1 plus the same treatment for adjacent crafts — resin, bath and body, soy
melts, ceramics — sold as one bundle.

**Demand evidence.** Bundling is a demonstrated Etsy merchandising pattern in this space —
"50 Small Business Forms Bundle", "Professional Esthetician Mega Forms Bundle" — and
bundles command higher prices than singles.

**Gap.** Bundles in the surveyed market are *breadth of documents*. A bundle of genuinely
distinct working calculators is a different value proposition.

**Price band.** $25–40.

**Dependency.** **Only worth building after F1 sells.** It is a merchandising move on a
proven unit, not an independent bet.

**Explicit exclusion.** **No soap lye calculation.** Lye ratios are safety-critical; a
wrong number causes chemical burns. Out of bounds under the consequential-logic rule.

---

## Ranking

Scored on stranger-purchase probability × attainable advantage × manufacturability × low
owner labour × experiment cost.

| # | Opportunity | Demand | Advantage | MAKE | QA | Owner | Verdict |
|---|---|---|---|---|---|---|---|
| **1** | **F1 candle calculator** | Best available | High | High | **Highest** | Listing only | **Build first** |
| 2 | F3 beauty business-math | Indirect, strong audience | High | High | High | Listing only | **Build second** |
| 3 | F2 salon calculator | Weakest | High | Done | High | Listing only | **List it — it is already built** |
| 4 | F4 bundle | Pattern-level | Medium | High | High | Listing only | **Only after F1 sells** |

**F1 outranks the salon calculator**, on one difference: F1 has an observable market with
competing sellers and new entrants; F2's demand is inferred from an adjacent category. The
salon calculator should still be listed — it is built, and listing costs $0.20 — but it
should be treated as **the riskier of the two**, which is the opposite of how a
sunk-cost-anchored reading would rank it.

## The question asked: more spreadsheets, a different class, or a mixture?

**More calculators — but diversify by BUYER, not by file format.**

The next batch should not be "more spreadsheets" in the sense of more generic trackers;
that class is commodity and PLR-flooded. It should be **three to four calculators aimed at
three to four different trades**, because:

- correctness is the one axis where a design-flooded marketplace is thin, and it is the only
  axis Factory can defend;
- it is the only class whose quality can be **proven before publication**, which the
  product-QA rule requires;
- each new trade is a genuinely different product with different domain truth, not a
  recolour — satisfying "multiple genuinely useful products, not superficial variants."

Two cross-cutting merchandising rules, both drawn from observed competitor weaknesses:

1. **Always ship Excel *and* Google Sheets, and both unit systems in one file.** Google
   Sheets reportedly sells better; offering both removes a stated buyer hesitation; and
   splitting metric from imperial across two files is a competitor defect Factory can simply
   not have.
2. **Bundle a one-page printable quick-reference with every calculator.** It widens the
   searchable surface into "printable" terms at zero extra production cost, without entering
   the aesthetic competition as a standalone product.

## Classes to keep out of this shop

Not merely unattractive — **brand-incompatible**. Wall art, clip art, digital stickers,
tarot and spiritual guides, wedding invitation suites. They require a different visual
identity and a different buyer expectation, and mixing them with functional tools makes the
shop read as an undifferentiated download dump, which is the exact perception the umbrella
concept exists to avoid.

Also excluded on rules rather than taste: **consent forms, waivers and contracts** (legal),
**soap lye calculators** (safety), **tax computation** (consequential financial logic).

## What would most improve this analysis

One number: **actual sales counts**. Every ranking above would be firmer with them, and the
cheapest honest route is not more search — it is **listing F1 and F2 and reading Factory's
own Etsy funnel data**, which is first-party, free, and reports impressions → views →
visits → orders. That converts inference into measurement for $0.40.

# Candle calculator — product truth gate

**2026-08-24. Validation pass only. Nothing built.** Findings are candle-specific and are
deliberately not generalised into Factory-wide rules.

## The two findings that decide the product

Both are named, documented industry confusions. Both are pure arithmetic. Both are invisible
in a design-led competitor product, and both are exactly what a correctness-first product can
own.

### 1. "Fragrance load" and "fragrance content" are different numbers

The industry uses two calculation methods interchangeably:

- **Fragrance LOAD** — fragrance as a percentage of **wax weight alone**. 6% load = 6 g oil
  per 100 g wax. This is the dominant maker convention and the one wax manufacturers use when
  publishing a wax's maximum.
- **Fragrance CONTENT** — fragrance as a percentage of **wax + fragrance combined**.

The worked example found in the sources: **20 g oil into 200 g wax is 10% load but 9.09%
content** (20 ÷ 220). Eco Candle Project publishes an article whose title is literally
"fragrance load versus fragrance content" — this is a recognised distinction, not an edge case.

**Why it matters commercially.** A maker following a US recipe at "10%" and a maker reading an
EU wax spec at "10%" are not making the same candle. A calculator that silently picks one
convention is wrong for a large share of its buyers **and they will not know why their candle
is off**. Handling this explicitly is the single strongest differentiator available.

### 2. Markup and margin are confused constantly

From the pricing sources: *"If your cost is $4.50 and you want a 40% profit margin, you don't
just add 40% (that would give $6.30 and only 29% actual margin)."*

Adding a percentage to cost gives a **markup**. Dividing by (1 − rate) gives a **margin**.
Sellers routinely price by the first and believe they achieved the second. Compounding it,
Etsy's fees are a percentage **of the price being solved for**, so the correct price is the
solution to an equation, not an addition.

---

## VALIDATED BUYER

A small-batch container-candle maker, hobbyist through micro-business, who sells or intends to
sell. Not industrial. Characteristics established from the sources:

- Works from **vessels** they have bought, not from arbitrary wax quantities.
- Owns a kitchen scale. Weight, not volume, is the working unit.
- Buys wax by the pound or kilo and fragrance by the ounce or gram, in **whichever units their
  supplier uses**, which is not always their own.
- Typical material cost $3–8 per 8–10 oz soy container candle; all-in $6–15 with labour and
  overhead.
- Sells at 2.5×–4× cost retail, ~2× cost wholesale (keystone).

## VALIDATED JOB

*"I have this jar and this wax. Tell me exactly how much wax and fragrance to melt for a batch,
what each finished candle actually costs me, and what I must charge to make the margin I want
after Etsy takes its cut."*

One continuous calculation. The maker performs it **before every new product and every price
change**, and re-does it whenever a supplier price moves.

## VALIDATED WORKFLOW

Established from supplier and maker sources. Each step's output is the next step's input —
which is what makes it one product rather than five:

1. **Measure the vessel.** Tare the empty jar on a scale, fill with water to the intended fill
   line (leaving headspace for the lid), record the water weight.
2. **Convert to fill weight.** Multiply water weight by the wax's specific gravity — **~0.86**,
   because wax averages 86% the density of water. This yields the total mass that fits.
3. **Split fill into wax and fragrance** at the chosen load, *by the chosen convention*.
4. **Scale to a batch.** Multiply by the number of candles, add a melt-loss allowance.
5. **Cost the candle.** Wax + fragrance at cost-per-gram, plus vessel, wick, lid, label,
   packaging.
6. **Add labour and overhead.** Minutes per candle at an hourly rate; overhead allocated per
   unit.
7. **Price it.** Solve for the price that yields the target margin *after* Etsy's fees.
8. **Derive wholesale**, checking the stockist can still mark up sensibly.

## INPUTS

| Input | Notes |
|---|---|
| Vessel water weight | From the tare-and-fill test |
| Wax specific gravity | Default **0.86**, editable — differs by wax |
| Fragrance percentage | With an explicit **LOAD / CONTENT** selector |
| Wax max fragrance % | **Entered by the user from their wax's spec sheet.** Never predicted |
| Candles per batch | Integer |
| Melt-loss allowance | Default a few %, editable |
| Wax purchase price + pack size | Any unit; converted internally |
| Fragrance purchase price + pack size | Any unit |
| Vessel, wick, lid, label, box, misc | Per-unit costs |
| Minutes per candle, hourly rate | Labour |
| Monthly overhead, monthly volume | Allocation basis |
| Etsy fee rates | **Pre-filled, editable** — see below |
| Shipping charged / shipping cost | Both, they differ |
| Target margin % | The thing being solved for |
| Wholesale multiplier | Default 2.0 |

Etsy fees pre-filled at the 2026 published rates — **$0.20 listing, 6.5% transaction on the
total the buyer pays including shipping, 3% + $0.25 payment processing, optional Offsite Ads
12–15%, 2.5% currency conversion** — but every rate must be **user-editable**, because fees
change and a hard-coded rate turns a correctness product into a stale one.

## CALCULATIONS

Stated precisely so no candle-industry assumption has to be re-invented.

**Fill:** `total_fill = water_weight × specific_gravity` (default 0.86)

**Split — LOAD convention** (% of wax), where `L` is the rate:
```
wax       = total_fill / (1 + L)
fragrance = total_fill × L / (1 + L)
```

**Split — CONTENT convention** (% of total), where `C` is the rate:
```
fragrance = total_fill × C
wax       = total_fill × (1 − C)
```

**Show the other number too, always:** `C = L / (1 + L)` and `L = C / (1 − C)`.
Check: L = 10% → C = 9.09%, matching the sourced example exactly.

**Batch:** each component × candles × (1 + melt_loss)

**Unit cost:**
```
materials = wax_g×wax_cost_per_g + fo_g×fo_cost_per_g + vessel + wick + lid + label + box + misc
labour    = minutes/60 × hourly_rate
overhead  = monthly_overhead / monthly_volume
unit_cost = materials + labour + overhead
```

**Price solving for a target margin after fees.** With `f` = summed percentage fees,
`fixed` = $0.20 + $0.25, `S` = shipping charged, `ship_cost` = actual shipping, `M` = target
margin on price:
```
P = [ fixed + unit_cost + ship_cost − S×(1 − f) ] / (1 − f − M)
```
Guard: refuse and explain when `1 − f − M ≤ 0` — the target margin is unreachable at those fee
rates, which is itself a useful answer.

**Wholesale:** `wholesale = unit_cost × multiplier` (default 2.0), with a displayed check that
the stockist retailing at 2× wholesale lands near the maker's own retail price.

**Markup vs margin, both shown:** `margin = profit / price`, `markup = profit / cost`.

## OUTPUTS

Per candle: wax grams, fragrance grams, fill weight, both load and content percentages,
material cost, unit cost, suggested retail price, actual margin and markup at that price, net
received after Etsy fees, wholesale price.
Per batch: total wax, total fragrance including melt loss, total material cost, total cost.
Warnings: fragrance exceeds the user-entered wax maximum; target margin unreachable; wholesale
below unit cost.

## BUYER BENEFIT

They stop guessing. One file answers "how much do I melt" and "what do I charge" from the jar
they are holding, using their own supplier's units, without moving numbers between five browser
tabs — and it tells them when their intended price cannot produce the margin they want.

## COMPETITOR BASELINE

**Free — Craftybase.** Substantial and must be taken seriously: a fragrance-load calculator, a
candle cost calculator, a wholesale price calculator, an Etsy fee calculator, and a **free
downloadable candle inventory spreadsheet in Excel or Numbers** covering wax, wicks, fragrance,
containers, batch recipes and COGS. These are lead-generation for their paid inventory
software.

Their own published limitations: *"You have to re-enter numbers every time material costs
change, there's no batch history… it doesn't track how much wax and fragrance you actually have
on hand."*

**Paid — Etsy.** One entrenched listing since 2021 claiming *"trusted by over 600 candle
makers,"* plus 2026 entrants. Observed contents: production cost calculator, fees and overhead
calculator, wax/scent percentage calculator, cost-per-candle, revenue and profit. Observed
weaknesses: **two separate files for metric and imperial**, wicking bundled in, and the job
split across products.

## SPECIFIC COMPETITIVE IMPROVEMENT

Four, all concrete, none aesthetic:

1. **The load/content selector, with both figures always displayed.** No competitor observed
   addresses this. It is the difference between a correct candle and a wrong one.
2. **One file, both unit systems, via a single global toggle** — against an incumbent that
   ships two separate files. Genuinely useful because suppliers and scales frequently disagree
   in unit even for one maker.
3. **Vessel-first entry.** The workflow starts where the maker starts: the jar and the water
   test. Free tools start from a wax quantity the maker does not yet know.
4. **Price solved for margin after fees, in closed form**, with markup and margin shown side by
   side. The free tools compute fees and pricing on separate pages that do not compose.

Against the free baseline the honest claim is **composition and persistence**, not novelty:
each individual calculation exists free somewhere; none of them are in one file that remembers
the maker's own costs.

## FEATURES TO EXCLUDE

Excluded outright, not disclaimed:

| Excluded | Why |
|---|---|
| **Wick size recommendation** | **Cannot be calculated.** Sources are unanimous: sizing guides are recommendations, not guarantees, and the only confirmation is burning a finished candle and watching the melt pool. Wax, fragrance load, dye, vessel diameter and shape, and additives all change the answer. A wrong wick tunnels, soots, or overheats glass. An incumbent bundles "wicking" in; Factory should deliberately not copy it |
| Maximum fragrance load for a given wax | Wax-manufacturer chemistry. Accepted as user input, never predicted |
| Flash point, add-at temperature, cure time | Supplier-specific chemical data |
| IFRA or labelling compliance | Consequential regulatory logic |
| Scent throw prediction | Not calculable |
| Soap/lye calculation | Safety-critical, and out of scope |
| Inventory on-hand, order logs, P&L | A different job on a different cadence — and directly Craftybase's paid territory |

## TERMINOLOGY

Use the maker's words, not business-software words: **fragrance load**, **fragrance content**,
**FO** (fragrance oil), **wax weight**, **fill weight**, **water weight**, **specific
gravity**, **melt pool**, **burn test**, **cure**, **vessel** (not "container" in a costing
context), **PPP / per pound**, **wicking**, **cold throw / hot throw**, **keystone**,
**COGS**. The imperial anchor "**1 oz fragrance per 1 lb wax**" (6.25%) should appear as a
recognisable reference point.

## FORMAT RECOMMENDATION

**Google Sheets only for v1. Do not ship a second environment.**

The brief said not to assume Sheets is worth a second QA surface, so here is the reasoning
rather than the assumption:

- The entire product thesis is **verified correctness**. QA'ing two spreadsheet environments
  roughly doubles the surface on which a formula can silently diverge, and a wrong number in an
  unverified export destroys the one advantage being sold.
- The free competitor ships **Excel or Numbers** — so Sheets is the un-served side of the free
  baseline rather than a duplicate of it.
- Sheets costs the buyer nothing to open, on any device, with no licence.
- The evidence that "Sheets sells better on Etsy" is seller-blog assertion, **not measured** —
  so it is a tiebreaker, not the reason.

**Revisit trigger, not a permanent decision:** if buyer messages or funnel data show Excel
demand, add a separately and fully QA'd `.xlsx`. That is a v2 decision made on evidence.

**Companion:** a one-page printable **burn-test log** — the thing that *must* be done by hand
precisely because wick sizing cannot be calculated. It complements the calculator honestly,
adds no correctness risk, and widens the searchable surface.

## PRODUCT-TRUTH SOURCES

Fragrance load vs content and the 20 g/200 g worked example — Eco Candle Project; corroborated
by Craftybase, The Flaming Candle, Midwest Fragrance, PetalMade. Vessel water-weight test and
the 0.86 specific gravity factor — Glassnow, Tinware Direct, CandlePal, RetroWix. Wick sizing
requires burn testing — CandleScience, Lone Star Candle Supply, The Flaming Candle, Candle
Cocoon. Pricing formula, keystone, markup-vs-margin — Craftybase, CandleScience, Armatage
Candle Company, PetalMade. Etsy 2026 fees — Craftybase, Voolist, SellerToolsHQ. Competitor
contents — Etsy listing titles and descriptions via search index.

**Limitation:** `etsy.com` is blocked by this environment's egress proxy. Competitor contents
come from indexed titles and descriptions, not from opening listings, and **no review text was
readable**. Buyer-complaint evidence is therefore absent from this pass.

---

# Proposed product specification

**Name (working):** Candle Batch & Pricing Calculator — Google Sheets

**Shape:** one Google Sheets workbook, four tabs. No macros or Apps Script — they break on
copy and cannot be QA'd the same way.

**Tab 1 — Start Here.** Unit toggle (metric/imperial), the load-vs-content explainer in three
sentences with the 20 g/200 g example, and how to run the water test.

**Tab 2 — Recipe.** Vessel water weight, specific gravity, fragrance % with convention
selector, wax maximum, candles per batch, melt loss. Outputs per candle and per batch, with
both load and content shown.

**Tab 3 — Costs & Price.** Material unit costs, labour, overhead, Etsy fee rates pre-filled and
editable, shipping charged vs actual, target margin. Outputs unit cost, solved retail price,
achieved margin *and* markup, net after fees, wholesale.

**Tab 4 — Reference.** Fee definitions with the 2026 published rates and the date they were
recorded; the "1 oz PPP = 6.25%" anchor; a plain statement that **wick sizing is not
calculated and why**, pointing to the burn-test log.

**Build constraints:** every input cell visually distinct from every calculated cell;
calculated cells protected but unprotectable by the buyer; no hidden sheets; no hard-coded fee
rate anywhere outside the editable cell; division-guarded so a blank input shows a prompt, not
`#DIV/0!`.

**QA — the acceptance tests, fixed before build:**
1. 200 g wax at 10% LOAD → 20 g FO, total 220 g, content displays 9.09%.
2. 220 g fill at 10% LOAD → 200 g wax, 20 g FO.
3. 220 g fill at 10% CONTENT → 198 g wax, 22 g FO. Must differ from test 2.
4. Metric and imperial paths agree to rounding on the same physical candle.
5. 300 g water weight × 0.86 → 258 g fill.
6. Solved price recomputed forward through the fee formula returns the target margin ±$0.01.
7. Target margin ≥ (1 − f) is refused with an explanation, not a negative price.
8. Every blank-input cell shows a prompt rather than an error value.
9. Fragrance above the user-entered wax maximum raises a visible warning.
10. Wholesale below unit cost raises a visible warning.

**Price band:** $14–18. Above the $12 floor because it does more than any single free tool;
below the entrenched incumbent's ceiling because Factory arrives with no reviews.

**Deliberately not in v1:** wick sizing, inventory, order logs, P&L, label design, Excel.

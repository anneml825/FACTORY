# Candle Batch & Pricing Calculator — FROZEN implementation specification

**Status: FROZEN 2026-08-24.** Build to this. Do not add calculations, fields or features not
listed here. Every candle-industry fact is inherited from
`docs/CANDLE_CALCULATOR_PRODUCT_TRUTH.md`, which is the frozen domain model — **do not invent
new candle-industry assumptions, and do not re-derive any from scratch.**

If something needed to build appears missing, that is a specification defect to raise, **not**
a licence to assume.

## Decision recorded at freeze: no marketplace fee preset ships

The requirement was that an Etsy preset may ship **only if** its components are verified from
Etsy primary documentation and clearly dated. **That condition cannot be met.** Both
`etsy.com` and `help.etsy.com` are blocked by this environment's egress proxy; the fee figures
gathered earlier came from third-party blogs, not from Etsy.

Therefore **the workbook ships marketplace-agnostic with fee fields blank.** No preset, no
pre-filled percentages, no marketplace named in a formula.

This is also the better product: the same workbook then serves a maker selling on any
marketplace, at a market stall, or wholesale. It is not a compromise.

> **Builder note — reference only, DO NOT SHIP AS DEFAULTS.** Third-party sources reported
> Etsy 2026 fees as $0.20 listing, 6.5% transaction on the buyer's total including shipping,
> 3% + $0.25 processing, optional Offsite Ads 12–15%. **Unverified against primary
> documentation. Must not appear in the workbook, in any cell, or in any listing copy.**

---

## 1. Structure

Four tabs, in this order. Google Sheets only. **No Apps Script, no macros** — they do not
survive "make a copy" reliably and cannot be QA'd like formulas.

| Tab | Purpose |
|---|---|
| **Start Here** | Units, the load/content explainer, how to run the water test |
| **Your Candle** | Vessel → wax and fragrance, per candle and per batch |
| **Costs & Price** | Costs, optional labour and overhead, fees, price solving |
| **Reference** | Definitions, assumptions register, what this does not do |

### Cell conventions, applied everywhere

- **Input cells**: one fill colour, visible border, unlocked.
- **Calculated cells**: a different fill, locked but the sheet protection must be removable by
  the buyer (warn, do not prevent).
- **Assumption cells**: a third distinct fill, unlocked, each adjacent to a note naming it as
  an editable assumption.
- No hidden tabs, no hidden columns, no white-on-white text.
- Every input cell carries a one-line plain-language note.

---

## 2. Global settings — Start Here tab

| Buyer-facing label | Internal | Type | Default | Editable | Notes |
|---|---|---|---|---|---|
| I weigh things in | `unit_system` | Dropdown: `grams` / `ounces` | `grams` | Yes | One global toggle. All mass fields display in this unit |
| Currency symbol | `currency` | Text | `$` | Yes | Display only. No conversion, no exchange rates |

**Internal storage is always grams.** Conversion constants: `1 oz = 28.349523125 g`,
`1 lb = 453.59237 g`. These are unit definitions, not assumptions, and are not editable.

---

## 3. Your Candle tab

### 3.1 Inputs

| Buyer-facing label | Internal | Type | Default | Editable | Validation |
|---|---|---|---|---|---|
| Water weight of your jar, filled to your line | `water_weight` | Number, mass | blank | Yes | > 0 |
| Water-to-wax factor | `wax_factor` | Number | **0.86** | **Yes — assumption** | > 0 and ≤ 1.5 |
| How you measure fragrance | `fragrance_convention` | Dropdown: `Fragrance load (% of wax)` / `Fragrance content (% of wax + fragrance)` | `Fragrance load (% of wax)` | Yes | Required |
| Fragrance percentage | `fragrance_pct` | Percent | blank | Yes | ≥ 0, < 100 |
| Maximum your wax can hold | `wax_max_pct` | Percent | blank | Yes | Optional. ≥ 0, < 100 |
| How many candles in this batch | `batch_qty` | Integer | 1 | Yes | ≥ 1 |
| Extra wax for what stays in the pitcher | `melt_loss_pct` | Percent | **0%** | Yes | ≥ 0, < 100 |

**On `wax_factor`.** Label it in the workbook as *"a planning assumption, not a physical
constant — different waxes differ, and you can measure your own."* The 0.86 default is
permitted because it is supported by the validated sources (wax averages ~86% the density of
water). Adjacent note must say so and must invite the buyer to replace it.

**On `wax_max_pct`.** Entered by the buyer from their **wax manufacturer's specification
sheet**. The workbook never predicts it. If blank, the over-maximum warning is simply not
shown.

### 3.2 Calculations

```
fill_weight = water_weight × wax_factor
```

**If `fragrance_convention` = load**, with L = `fragrance_pct`:
```
wax_per_candle = fill_weight / (1 + L)
fo_per_candle  = fill_weight × L / (1 + L)
load_pct       = L
content_pct    = L / (1 + L)
```

**If `fragrance_convention` = content**, with C = `fragrance_pct`:
```
fo_per_candle  = fill_weight × C
wax_per_candle = fill_weight × (1 − C)
content_pct    = C
load_pct       = C / (1 − C)
```

**Batch, with melt loss applied to batch totals only:**
```
wax_batch = wax_per_candle × batch_qty × (1 + melt_loss_pct)
fo_batch  = fo_per_candle  × batch_qty × (1 + melt_loss_pct)
```

### 3.3 Outputs

Per candle: wax, fragrance, total fill weight, **both** `load_pct` and `content_pct`.
Per batch: total wax, total fragrance, number of candles.

**`load_pct` and `content_pct` are always both displayed, side by side, both labelled.** The
workbook must never show one percentage without the other and must never silently choose a
convention.

---

## 4. Costs & Price tab

### 4.1 Material costs

For wax and for fragrance, the buyer enters what they actually bought:

| Label | Internal | Type | Default | Validation |
|---|---|---|---|---|
| What you paid for the wax | `wax_pack_price` | Currency | blank | ≥ 0 |
| How much wax that was | `wax_pack_size` | Number | blank | > 0 |
| Unit that wax was sold in | `wax_pack_unit` | Dropdown: g / kg / oz / lb | `kg` | — |

Identical trio for fragrance (`fo_pack_price`, `fo_pack_size`, `fo_pack_unit`, default `oz`).

```
wax_cost_per_g = wax_pack_price / (wax_pack_size converted to grams)
fo_cost_per_g  = fo_pack_price  / (fo_pack_size  converted to grams)
```

Per-unit components, each a single currency input defaulting to blank, treated as 0 if blank:
`vessel_cost`, `wick_cost`, `lid_cost`, `label_cost`, `box_cost`, `other_cost`.

```
wax_and_fo_cost = (wax_batch × wax_cost_per_g + fo_batch × fo_cost_per_g) / batch_qty
materials_cost  = wax_and_fo_cost + vessel + wick + lid + label + box + other
```

Melt loss is costed, because the buyer pays for wax that stays in the pitcher.

### 4.2 Labour and overhead — both optional, both off by default

| Label | Internal | Type | Default |
|---|---|---|---|
| Pay myself for my time | `labour_on` | Yes/No | **No** |
| Minutes to make one candle | `minutes_per_candle` | Number | blank |
| What I pay myself per hour | `hourly_rate` | Currency | blank |
| Include my monthly running costs | `overhead_on` | Yes/No | **No** |
| My monthly running costs | `monthly_overhead` | Currency | blank |
| Candles I make in a month | `monthly_volume` | Integer | blank |

Buyer-facing explanations, in these words:
- Labour — *"Your time is a real cost. If you skip this, your price only covers materials."*
- Overhead — *"Rent, insurance, subscriptions — the costs you pay whether or not you make a
  candle this month. Spread across the candles you make."*

```
labour_cost   = IF(labour_on,   minutes_per_candle / 60 × hourly_rate, 0)
overhead_cost = IF(overhead_on, monthly_overhead / monthly_volume,     0)
unit_cost     = materials_cost + labour_cost + overhead_cost
```

If `overhead_on` and `monthly_volume` is blank or 0 → prompt, not an error value.

### 4.3 Selling fees — marketplace-agnostic, blank by default

| Label | Internal | Type | Default |
|---|---|---|---|
| Where am I selling this | `channel_name` | Text | blank |
| Selling fee % | `fee_pct_1` | Percent | **blank** |
| Payment processing % | `fee_pct_2` | Percent | **blank** |
| Any other % fee | `fee_pct_3` | Percent | **blank** |
| Fixed fee per order | `fee_fixed` | Currency | **blank** |
| Percentage fees apply to | `fee_basis` | Dropdown: `Item price only` / `Item price + shipping` | `Item price only` | 
| Shipping I charge the buyer | `shipping_charged` | Currency | 0 |
| What shipping actually costs me | `shipping_cost` | Currency | 0 |

Adjacent note: *"Fees change. Look up your marketplace's current fees and type them in — this
workbook does not guess them for you."*

```
f     = fee_pct_1 + fee_pct_2 + fee_pct_3     (blanks = 0)
fixed = fee_fixed                              (blank  = 0)
```

### 4.4 Price solver

| Label | Internal | Type | Default | Validation |
|---|---|---|---|---|
| Profit margin I want | `target_margin` | Percent | blank | ≥ 0, < 100 |
| Wholesale multiplier | `wholesale_multiplier` | Number | **2.0** | > 0 |

Margin is defined **on the item price**: `margin = profit / price`.

**If `fee_basis` = Item price + shipping:**
```
price = (fixed + unit_cost + shipping_cost − shipping_charged × (1 − f)) / (1 − f − target_margin)
```

**If `fee_basis` = Item price only:**
```
price = (fixed + unit_cost + shipping_cost − shipping_charged) / (1 − f − target_margin)
```

**Forward check, always computed and displayed** — never trust the solve alone:
```
fee_total       = f × (price + shipping_charged if basis includes shipping, else price) + fixed
net_received    = price + shipping_charged − fee_total
profit          = net_received − unit_cost − shipping_cost
achieved_margin = profit / price
markup          = profit / unit_cost
wholesale_price = unit_cost × wholesale_multiplier
```

`achieved_margin` must equal `target_margin` to within $0.01 of price. Display both, adjacent,
so any divergence is visible to the buyer.

**Margin and markup are displayed together, both labelled**, with a one-line note: *"Margin is
your profit as a share of the price. Markup is your profit as a share of your cost. They are
not the same number."*

### 4.5 Outputs

`unit_cost` · `price` · `achieved_margin` · `markup` · `fee_total` · `net_received` ·
`profit` · `wholesale_price` · a line showing what a shop reselling at 2× wholesale would
charge, for comparison against the maker's own price.

---

## 5. Validation rules and error states

Every one is a **plain-language message in an adjacent cell**. No `#DIV/0!`, `#VALUE!`,
`#REF!` or `#N/A` may ever be visible to the buyer.

| # | Condition | Message |
|---|---|---|
| E1 | Any required input blank | "Enter your jar's water weight to start." (per field) |
| E2 | `1 − f − target_margin ≤ 0` | "**A {margin}% margin isn't reachable with fees of {f}%.** Lower the margin or the fees — there's no price that works." Price cell shows no number |
| E3 | Solved `price ≤ 0` | "Check your shipping and fee figures — this comes out at or below zero." |
| E4 | `fragrance_pct` > `wax_max_pct` | "**Above the maximum you entered for this wax ({wax_max_pct}%).** Your wax may not hold it." Calculations still shown |
| E5 | `wholesale_price < unit_cost` | "**This wholesale price is below what the candle costs you.**" |
| E6 | `overhead_on` and `monthly_volume` blank/0 | "Enter how many candles you make in a month, or switch overhead off." |
| E7 | `batch_qty < 1` | "Batch size must be at least 1." |
| E8 | `wax_factor` outside 0–1.5 | "That factor looks unusual. Most waxes are near 0.86." Not blocked |
| E9 | `fragrance_pct` ≥ 100% | "Fragrance percentage must be under 100%." |
| E10 | Pack size 0 or blank while pack price entered | "Enter how much wax that price bought." |

---

## 6. Assumptions register — Reference tab

Every default appears here, visible and editable at source:

| Assumption | Default | Basis | Editable |
|---|---|---|---|
| Water-to-wax factor | 0.86 | Validated sources: wax averages ~86% the density of water. **A planning assumption, not a constant** | Yes |
| Melt loss | 0% | **No sourced figure exists**, so the default claims nothing | Yes |
| Wholesale multiplier | 2.0 | Validated sources: keystone, 2× cost | Yes |
| Selling fees | blank | Not verifiable from primary documentation here | Yes |
| Labour, overhead | off | Optional by design | Yes |

Also on Reference: the load-vs-content explainer with the 20 g / 200 g worked example, the
"1 oz fragrance per 1 lb wax = 6.25%" reference point, and the exclusion statement below.

**Exclusion statement, verbatim, on the Reference tab and in the listing:**

> **This workbook does not choose your wick.** Wick size cannot be calculated. It depends on
> your wax, fragrance load, dye, and the diameter and shape of your vessel — the only way to
> know is to burn a test candle and watch the melt pool. Use the burn-test log for that.

---

## 7. Terminology — buyer-facing wording is fixed

Use the maker's words. Never the internal names.

| Use | Never |
|---|---|
| fragrance load / fragrance content | "FO ratio", "scent factor" |
| fill weight | "target mass", "output" |
| water weight | "vessel volume proxy" |
| water-to-wax factor | "specific gravity coefficient" |
| wax, fragrance oil (FO) | "component A/B", "inputs" |
| batch | "run", "production lot" |
| your cost per candle | "COGS per unit" |
| what you charge | "SKU price point" |
| burn test, melt pool, cure | — |

---

## 8. Pre-registered acceptance tests

**Fixed before build. All ten must pass before publication.** A failure is a build defect, not
a reason to amend the test.

| # | Test | Expected |
|---|---|---|
| T1 | 200 g wax entered as fill basis, 10% **load** | FO 20 g, fill 220 g, content displays **9.09%** |
| T2 | Fill 220 g, 10% **load** | wax 200 g, FO 20 g |
| T3 | Fill 220 g, 10% **content** | wax 198 g, FO 22 g — **must differ from T2** |
| T4 | Water weight 300 g, factor 0.86 | fill 258 g |
| T5 | Same physical candle entered in ounces and in grams | agree within 0.1 g after conversion |
| T6 | `unit_cost` 5.00, `fixed` 0.45, `f` 9.5%, shipping 0, basis = price only, target margin 40% | price **10.79**; forward check returns achieved margin **40.0%** |
| T7 | `f` 9.5%, target margin 91% | E2 refusal shown, **no number in the price cell** |
| T8 | Every required input left blank | prompts shown; **no `#DIV/0!` or `#VALUE!` anywhere** |
| T9 | `fragrance_pct` 12%, `wax_max_pct` 10% | E4 warning visible; calculations still produced |
| T10 | `wholesale_multiplier` set so wholesale < `unit_cost` | E5 warning visible |

T6 arithmetic, so the builder can verify without re-deriving:
`price = 5.45 / (1 − 0.095 − 0.40) = 5.45 / 0.505 = 10.7921`;
`profit = 10.7921 × 0.905 − 0.45 − 5.00 = 4.3168`; `margin = 4.3168 / 10.7921 = 40.00%`.

---

## 9. Companion deliverable — printable burn-test log

One page, PDF, packaged alongside. It exists **because** wick sizing cannot be calculated.

Columns: date · candle/vessel · wax · fragrance and % · wick tried · hour 1 melt-pool width ·
hour 2 · hour 3 · hour 4 · flame notes · soot/mushrooming · verdict.
Header line: *"Wick choice is found by testing, not by calculation. Record what you burn."*

**It must never be described as determining wick suitability.** It is a record sheet.

---

## 10. Out of scope for V1 — do not build

Wick sizing or recommendation · maximum fragrance load prediction · flash point, pour
temperature, cure time · IFRA or labelling compliance · scent throw prediction · soap or lye
calculation · inventory on hand · order or sales logs · profit-and-loss · customer records ·
label or packaging design · **Excel or `.xlsx` in any form** · currency conversion · any
marketplace named in a formula or default.

**Do not claim Excel compatibility anywhere** — not in the workbook, not in listing copy, not
in the filename.

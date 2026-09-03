# New Etsy opportunity research — 2026-09-03

**Research only. Nothing built, no account, no purchase, no capital.**
Scope: new opportunities only.

## Evidence labelling

- **OBSERVED FACT** — directly returned by search: a URL, a title, a listing ID, a price.
- **PROXY** — real but indirect; supports comparison, not magnitude.
- **INFERENCE** — my reasoning from the above.
- **UNKNOWN** — not observable with the tools available.

Search volume, sales counts, review counts, conversion and CTR are **UNKNOWN throughout** and
are never estimated. Listing existence, `/market/` pages, indexed results, seller marketing and
favourites are treated as supply signals only.

Listing IDs increase monotonically over Etsy's history, so they are used as **OBSERVED FACT**
about approximate vintage and category continuity — nothing else.

---

## The structural finding that shaped the screen

Testing candidates one at a time surfaced a repeating mechanism worth stating before the
results, because it eliminated more candidates than any other single criterion.

**Any product whose core is one well-known formula is commoditised by free web calculators.**
A web page can host a formula for free and monetise with ads. A paid file cannot beat free on
that axis.

Three candidates died on this, and the third died hardest:

| Candidate | Free competition observed | Verdict |
|---|---|---|
| Quilt yardage / backing / binding | 6+ dedicated free calculators — fabricmathtools.com, designedtoquilt.com, Quilter's Paradise, Omnicalculator, DuckaDilly, Nebraska Quilt Co. **No Etsy listings surfaced at all.** | **REJECT** |
| Laser / Glowforge pricing | Free tools at makersmath.com, priceprofittools.com, kandgmakeit.com, plus lasercalcpro and convertcalculator. Only 2 Etsy listings surfaced (`847196302` ≈2020, `1857171056` ≈2024). | **REJECT** |
| 3D printing cost | **9 free calculators**, several *functionally superior to any spreadsheet*: Filamath estimates filament weight from an uploaded STL; Calc3DPrint parses G-code from Cura/Prusa and computes Etsy fees; Printpal includes machine depreciation and failure-rate markup; SpoolMath ships 30+ filament presets. | **REJECT** |

3D printing is the important one. It had the **densest Etsy-native supply of anything screened**
— market pages for `3d_printing_cost_calculator`, `3d_print_price_calculator`,
`3d_printer_cost_calculator`, `3d_printing_excel_sheet`, `spreadsheet_for_3d_printing` and more,
with listings from `1156937390` (≈2022) to `4419225435` (≈2026). On supply signals alone it
looked like the winner. It is disqualified because free tools do things a spreadsheet
structurally cannot: read an STL, parse a G-code file. Factory would enter with a worse product
at a higher price.

**INFERENCE, and the screen's organising principle:** the defensible position is not a formula.
It is **persistent, multi-entity data that a stateless web calculator cannot hold** — many
records, related to each other, revisited over time.

---

## Stage 1 — breadth

40+ candidates were generated across trades, food service, agriculture, maker production,
property, creative services, education and hobby. Those rejected cheaply, with reason:

| Group | Rejected | Reason |
|---|---|---|
| Maker production | 3D printing, laser/Glowforge, quilting, woodworking board-foot, jewellery metal weight | Single-formula → free substitutes (verified for the first three; same structure for the rest) |
| Property | BRRRR / rental analysis, house-flip budget | Consequential financial logic; heavy free tooling from established property brands |
| Education / care | Homeschool records, daycare billing | Jurisdiction-specific reporting → recurring maintenance Factory cannot absorb |
| Legal-adjacent | Contracts, waivers, client agreements | Excluded class |
| Chemistry / safety | Lye and saponification | Safety-critical, excluded class |
| Print-on-demand | POD profit calculators | Depends on provider fee schedules that change → recurring maintenance |
| Design-led | Clipart, SVG, tumbler wraps, fonts, branding kits, wall art | Quality is aesthetic. Mechanical verifiability is worth nothing; heaviest AI-supply saturation |
| Textiles / craft patterns | Crochet, knitting, sewing patterns | Correctness requires physically making the item. Factory cannot verify, so cannot claim |
| Short-term rental | Airbnb turnover / cleaning checklists | **OBSERVED:** dense and recent supply (`1468627568`, `1688643637`, `1718712830`, `1869148129`, all ≈2023–25) but overwhelmingly **Canva editable templates** — customisation required, design-led, subjective quality |
| Agriculture | Livestock / flock / herd records | **OBSERVED:** genuine Etsy-native category with continuity (`682987033` ≈2019 → `1499391203` ≈2023) and many market pages. **But the format is printable PDF log books and binders** — design-led, not computational. Factory's edge does not apply |

---

## Stage 3 — the survivors

Two candidates survived. I am not padding to three.

---

### FINALIST 1 — Recipe & Menu Costing Workbook *(recommended)*

**PRODUCT CONCEPT.** A costing workbook for small food businesses that handles what
single-recipe calculators do not: **sub-recipes**, **actual versus theoretical yield**, and
**purchase-unit to recipe-unit conversion**.

**TARGET BUYER.** Caterers pricing event trays, food-truck operators, small bakeries, and
meal-prep businesses. **OBSERVED** — these four buyer types are named explicitly in the
practitioner sources returned.

**BUYER PROBLEM.** Ingredients are bought in one unit (case, kilo, litre) and used in another
(gram, cup, portion). A component like a sauce, dough or spice blend is made in batch and used
across several menu items, so its cost has to be derived before any dish can be costed. Yield
is never the theoretical number. Get any of these wrong and every price on the menu is wrong in
the same direction.

**PROPOSED PRODUCT.** An ingredient sheet (purchase unit, purchase cost, recipe unit,
conversion factor entered by the buyer), a sub-recipe sheet that costs a batch and emits a
cost-per-recipe-unit, a dish sheet that pulls both, and a menu sheet showing food-cost
percentage and margin per dish and across the menu.

**WHY SOMEONE WOULD PAY.** The buyer re-prices a menu every time ingredient costs move. This is
recurring work with money attached, not a one-time lookup.

**OBSERVABLE MARKETPLACE EVIDENCE.**
- **OBSERVED FACT:** Etsy market pages exist for `food_costing_spreadsheet`,
  `restaurant_food_cost_spreadsheet`, `menu_cost_spreadsheet`, `recipe_cost_calculator`,
  `meal_cost_calculator`.
- **OBSERVED FACT:** listing `1367626909` — "Recipe Costing Calculator for Google Sheets &
  Excel… Profit Margin Tool" (≈2023).
- **OBSERVED FACT (the differentiation evidence):** practitioner sources independently name the
  same failure modes — sub-recipes needing their own unit and cost from batch yield; using
  theoretical rather than actual yield ("trim, breakage, items that don't rise"); and
  **packaging as "the single most common omission that hits retail lines hardest."**
- **OBSERVED FACT:** incumbents advertise converting between Sheets and Excel "within 24 hours"
  on request.

**WHAT THAT ESTABLISHES.** An established, Etsy-native category with multiple sellers and
continuity; a documented, specific list of things practitioners get wrong; and that at least one
incumbent absorbs manual customisation work per order.

**WHAT IT DOES NOT ESTABLISH.** That anyone buys these, how often, at what price, or that
buyers know they need sub-recipe handling before they own the product. **Purchase demand is
UNKNOWN.**

**COMPETITIVE LANDSCAPE / FREE ALTERNATIVES.** **OBSERVED:** free spreadsheets from Craftybase
("Free Bakery Costing Spreadsheet"), foodcostchef.com, sheetrix.com, getjelly.co.uk and
RestaurantOwner.com. This is real competition and the main risk. **INFERENCE:** it is a
materially weaker threat than the 3D-printing case, because these are *free spreadsheets
competing on the same axis* rather than web apps doing something a spreadsheet cannot — and the
ones observed are single-recipe, which is precisely the gap.

**OBSERVED PRICE RANGE.** UNKNOWN — prices were not reliably returned.

**FUNCTIONAL DIFFERENTIATION.** One level of sub-recipe; a yield field separating theoretical
from actual; packaging as a first-class cost line rather than an afterthought; conversion
factors entered and shown by the buyer rather than guessed by the sheet.

**BUILD: MEDIUM** · **QA: MEDIUM–HIGH** · **SUPPORT: MEDIUM** · **MAINTENANCE: LOW**

Maintenance is the strong suit: no fee schedules, no provider APIs, no jurisdictions, no
safety-critical output, nothing to physically test.

**MAJOR RISKS.** (1) Free spreadsheets from an established brand. (2) Unit conversion is the
single largest QA and support surface — mitigated by requiring the buyer to enter the
conversion factor rather than the sheet inferring density. (3) Sub-recipe depth is where a
naive build becomes a circular-reference bug.

**KNOWS vs INFERS.** *Knows:* the category exists on Etsy with multiple sellers and continuity;
the failure modes are documented; free competition exists. *Infers:* that the gap matters to
buyers at purchase time.

**CONFIDENCE: MEDIUM** on category reality; **LOW** on purchase magnitude.
**RECOMMENDATION: PROMISING**

---

### FINALIST 2 — Cleaning Business Quote & Pricing Workbook

**TARGET BUYER.** Solo and small residential/commercial cleaning operators.
**BUYER PROBLEM.** Quoting an unseen property fast, without underpricing labour.

**OBSERVABLE EVIDENCE.** **OBSERVED FACT:** market pages for `cleaning_estimate_templates`,
`residential_cleaning_calculator`, `cleaning_estimate_template`, `house_cleaning_quote_sheet`,
`estimate_for_cleaning`, `commercial_cleaning_calculator`; listing `4388244254` (≈2026).

**WHAT IT ESTABLISHES.** A live, recent, Etsy-native category with several distinct query
framings. **DOES NOT ESTABLISH:** purchases, volume or price.

**COMPETITIVE LANDSCAPE.** **OBSERVED:** the incumbent at `4388244254` already computes labour
from area, cleaner count and productivity rate, applies supply cost with markup, handles tax and
discounts, and emits a client-ready printable quote. Free templates exist (Bookipi) and SaaS
substitutes exist (Method and similar).

**FUNCTIONAL DIFFERENTIATION: WEAK.** The incumbent is competent and covers the obvious ground.
Improvement would be quality-of-execution, which is close to adjective-only differentiation.

**BUILD: LOW–MEDIUM** · **QA: MEDIUM** · **SUPPORT: LOW** · **MAINTENANCE: LOW**
**CONFIDENCE: MEDIUM** on category; **LOW** on opening.
**RECOMMENDATION: POSSIBLE** — good category, no clear opening.

---

## Ranking and the choice

| | Recipe & Menu Costing | Cleaning Quote Workbook |
|---|---|---|
| Observable marketplace evidence | 5 market pages, continuity | 6 market pages, 2026 listing |
| Buyer problem specificity | **High — named failure modes** | Moderate |
| Competitive opening | **Documented functional gap** | Weak — incumbent competent |
| Functional differentiation | **Sub-recipes, yield, packaging** | Execution quality only |
| Build / QA / Support / Maintenance | MED / MED-HIGH / MED / **LOW** | LOW-MED / MED / **LOW** / **LOW** |

**Winner: the Recipe & Menu Costing Workbook.**

It beat the cleaning workbook on the criterion that separates a product from a commodity: a
**nameable functional gap supported by observed evidence** rather than a promise to do the same
job more nicely. Practitioner sources independently identify sub-recipes, actual-versus-
theoretical yield and omitted packaging as the errors that quietly destroy margin — and the free
and paid tools observed are single-recipe, so they cannot address the first of those at all.

It beat 3D printing — which had the strongest supply signals of anything screened — because a
spreadsheet cannot compete with a free tool that reads a G-code file, whereas it competes
perfectly well with a free single-recipe spreadsheet.

Its maintenance profile is the best of any survivor: nothing in it expires, depends on a
provider, varies by jurisdiction, or is safety-critical.

**The honest caveat:** purchase demand is UNKNOWN and is not established by anything above. The
case is that this is the **best-evidenced comparative bet available**, not that demand is proven.

---

## Smallest commercially useful version

Deliberately scoped to contain the two things that would blow up QA and support.

| | |
|---|---|
| **Format** | Single `.xlsx` workbook + a one-page PDF start guide |
| **Sheets** | **4** — Ingredients · Sub-Recipes · Dishes · Menu Summary |
| **Scope caps** | **One level of sub-recipe nesting** (a sub-recipe may be used in a dish, but not inside another sub-recipe) — this removes circular-reference risk entirely. ~100 ingredients, ~30 sub-recipes, ~60 dishes |
| **Conversions** | Buyer enters the conversion factor per ingredient. **The sheet never infers density or assumes cups-to-grams.** This is the single most important scope decision: it converts the largest support surface into a visible, editable input |
| **Listing images** | 6–8 |
| **QA requirements** | Independent-model cross-check of every formula; sub-recipe cost propagation verified end to end; a deliberate circular-reference attempt that must fail safely; blank-state check for `#DIV/0!` and `#VALUE!`; yield-of-zero and yield-below-theoretical cases; packaging present in the dish cost roll-up; `fullCalcOnLoad` set |
| **Owner review burden** | Comparable to a previous single-workbook review: one pass on buyer-facing copy, one on the listing. No account setup, no sharing step, no external service |

**Not in V1:** inventory on hand, purchase orders, supplier management, waste logging, nutrition,
allergen labelling (regulatory), and anything touching cottage-food or food-safety law.

---

**STOPPED FOR OWNER APPROVAL. Nothing built, nothing published, no existing asset modified, no
money spent.**

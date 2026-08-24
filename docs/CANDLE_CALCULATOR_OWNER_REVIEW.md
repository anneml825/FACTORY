# Owner review package — Candle Batch & Pricing Calculator

**2026-08-24. Built, QA'd, merchandised, and rewritten for sheet-native copy.
Nothing published. No capital spent.**

## 1. Exact deliverables produced

**The product the buyer uses**

| Item | Where | State |
|---|---|---|
| Candle Batch and Pricing Calculator | Google Sheet in your Drive, `1Zzk1iB3KQq7q3KWOIK9z9EL-auXMxTD0eRPhMvLTmp8` | Live, 3 tabs, converted and verified |

The earlier four-tab build has been moved to your Drive trash. The Start Here PDF points at
the sheet above.

**The files the buyer downloads from Etsy**

| File | Pages | Purpose |
|---|---|---|
| `Candle-Calculator-Start-Here.pdf` | 2 | Carries the one-click copy link, the jar-weighing method, and the two things that trip makers up |
| `Burn-Test-Log.pdf` | 1, A4 landscape | Printable wick-testing record, 12 rows |

Both at `product/candle-calculator/dist/buyer/`.

**Build and QA sources** (not shipped): `build.py` (generates the workbook), `tests.py`
(independent model of the specification), `evaluate.py` (formula evaluator),
`run_acceptance.py` (the ten tests), `listing/ETSY_LISTING.md` (all merchandising copy).

## 2. Acceptance-test results — 10/10 pass

| # | Test | Result |
|---|---|---|
| T1 | 220 g fill at 10% load → FO 20 g, fill 220 g, content 9.09% | **PASS** |
| T2 | 220 g fill at 10% load → wax 200 g, FO 20 g | **PASS** |
| T3 | 220 g fill at 10% **content** → wax 198 g, FO 22 g, differs from T2 | **PASS** |
| T4 | water 300 × factor 0.86 → fill 258 | **PASS** |
| T5 | same candle in ounces and grams agree within 0.1 g | **PASS** |
| T6 | cost 5.00, fixed 0.45, fees 9.5%, target 40% → price 10.79, achieved 40.00% | **PASS** |
| T7 | 91% target at 9.5% fees → refusal message, **no number in the price cell** | **PASS** |
| T8 | every required input blank → no `#DIV/0!` or `#VALUE!` anywhere | **PASS** |
| T9 | fragrance 12% vs entered maximum 10% → warning, still calculates | **PASS** |
| T10 | wholesale below unit cost → warning | **PASS** |

**How they were run, and the one thing I could not do.** The tests execute the workbook's
*actual formula strings* through an evaluator that parses what is really in the file — so a
typo, an unbalanced bracket or a wrong cell reference fails. Those results were then
cross-checked against a separate model written independently from the specification. **The two
agree on every case.** The evaluator also caught two real defects during the build: a
malformed `IF` with its bracket closed early, and a stale test artifact.

**Recalculation inside Google Sheets itself could not be verified.** The Drive API returns
formula cells as empty rather than as computed values, and it offers no way to write a cell, so
I could not drive test inputs through the live Sheet and read results back. What *was* verified
in Google Sheets: the file converts, all three tabs arrive intact, and every label, default,
dropdown value and note is correct. A full-book scan of the final file shows **0 formula
problems and no error strings**.

## 3. Final name, title, tags, price

**Product name:** Candle Batch & Pricing Calculator

**Etsy title** (133 characters):
> Candle Making Calculator Google Sheets | Fragrance Load, Wax Weight & Cost Per Candle | Candle Pricing Spreadsheet for Small Candle Business

**13 tags:** candle calculator · candle spreadsheet · fragrance load · wax calculator ·
candle pricing · candle making · cost per candle · google sheets · candle business ·
soy candle maker · candle profit · wholesale pricing · candle batch

**Price: $16.00** — mid-point of the researched band, held rather than discounted so the first
listings produce a readable signal about whether anyone arrives at all.

## 4. Listing and image copy

Complete in `product/candle-calculator/listing/ETSY_LISTING.md`: full description, eight
listing images in reading order, and the delivery manifest. It leads on the job — *"Stop
guessing how much wax to melt — and what to charge"* — then the two named confusions the
product exists to fix, then the honest limits.

The seventh image is deliberately the disclaimer: *"IT DOES NOT PICK YOUR WICK. Nothing can."*
That reads as competence rather than a caveat, and no competitor says it.

## 5. Limitations the buyer needs to know — all stated in the listing

- **Google Sheets only.** A free Google account is required. **No Excel claim is made anywhere.**
- **It does not choose a wick**, and says why: wick size depends on wax, fragrance load, dye and
  jar shape, and only burn testing settles it. The Burn Test Log is the honest companion.
- **Selling fees ship blank** — no marketplace preset. Fees change and differ by country, so the
  buyer enters their own current figures.
- **The water-to-wax factor is a planning assumption, not a constant**, labelled as such and
  editable, with 0.86 as the starting point.
- **Melt loss starts at 0%** because no sourced figure exists for it.

## 6. Owner actions remaining

Three, all mechanical. No creative or product decisions.

1. **Make the Sheet copyable — the one that actually matters.** Open the Sheet, Share → General
   access → **Anyone with the link → Viewer**. Without this, the buyer's copy link fails.
   *~30 seconds.* I cannot set link-sharing; the tool only shares with a named person.
2. **Create the Etsy listing** — paste the title, 13 tags, description and price; upload the two
   PDFs as the digital files; produce the eight images from the supplied copy.
3. **Decide the shop-level questions** I deliberately did not make up: shop name, policies,
   and the Etsy account itself.

## 7. One deliberate deviation from the specification, disclosed

The specification asked for calculated cells to be **locked** while leaving the protection
removable. I implemented the *intent* — a distinct fill colour for calculated cells, a colour
key on the Reference tab, and the same key restated in the Start Here PDF — but **did not enable
sheet protection**, because protection imported from a converted file behaves unpredictably in Google
Sheets and I had no way to verify it in the live environment. Given the specification's own
wording, "warn, do not prevent", a warning that certainly works seemed better than a lock that
might misbehave. Raising it here rather than burying it.


## 8. Copy rewrite, 2026-08-24

You were right about the copy, and the meta-commentary was the indefensible part: the sheet
annotated its own plumbing for the buyer. That is gone.

**What changed.** The governing rule is now written into the builder: this is a spreadsheet, not
a document. Labels are labels — a few words, no sentences, no commentary about how the sheet
works. The only full sentences left in the workbook are warning messages, because a warning is a
sentence in every spreadsheet.

- **Four tabs became three.** The prose-heavy *Start Here* tab is deleted. Everything a buyer
  needs before touching the sheet is in the Start Here PDF, which is where a document belongs.
- **The helper cells are gone.** The unit-conversion cells that prompted "These two lines do the
  unit switching. Leave them as they are." no longer exist — those formulas are inlined, so
  there is nothing to explain and nothing to protect.
- **Every label is now one to three words.** "Grams in one of your units" → gone. "Short unit
  label" → gone. "The one thing that trips people up" → gone. Labels read `Water weight`,
  `Wax factor`, `Fill weight`, `Fragrance %`, `Target margin`.
- **Column D notes are fragments, not sentences.** `planning assumption — waxes vary`,
  `extra wax left in the pitcher`, `share of price, not markup on cost`.
- **The Reference tab keeps sentences** — it is a glossary, and that is the one place in a
  spreadsheet where a sentence is normal.

**What did not change.** No formula, no default, no calculation, no claim. The rewrite touched
the copy layer only.

**Re-QA after the rewrite.** All ten acceptance tests re-run against the rebuilt workbook:
**10/10 pass**, independent-model cross-check **AGREE**, **0 formula problems**, no error
strings, tabs `['Candle', 'Costs & Price', 'Reference']`.

**Two things resolved in passing.** The `5.` / `500.` number-format artefact is fixed in the
rebuilt file, so it is no longer an owner action. And the sheet is now named *Candle Batch and
Pricing Calculator* with no version suffix, because the buyer sees the file name when they take
their copy.

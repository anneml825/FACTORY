# Owner review package — Candle Cost & Pricing Calculator

**2026-08-25. Built, QA'd, merchandised, language-passed, and rendered.
Nothing published. No capital spent.**

## 1. Exact deliverables produced

**The product the buyer uses**

| Item | Where | State |
|---|---|---|
| Candle Cost and Pricing Calculator | Google Sheet in your Drive, `1Zzk1iB3KQq7q3KWOIK9z9EL-auXMxTD0eRPhMvLTmp8` | Live, 3 tabs — **content one revision behind, see action 1** |

The earlier four-tab build is in your Drive trash. The Start Here PDF links to the sheet above,
and that link is correct and does not change.

**The files the buyer downloads from Etsy**

| File | Pages | Purpose |
|---|---|---|
| `Candle-Calculator-Start-Here.pdf` | 1, A4 portrait | The copy link, the jar-weighing method, the load/content and margin/markup distinctions, and the cell-color key |
| `Burn-Test-Log.pdf` | 1, A4 landscape | Printable burn-test record sheet, 12 rows |

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

**Product name:** Candle Cost & Pricing Calculator

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
- **The water-to-wax factor is an editable assumption, not a constant**, labeled as such and
  editable, with 0.86 as the starting point.
- **Melt loss starts at 0%** because no sourced figure exists for it.

## 6. Owner actions remaining

Four, all mechanical. No creative or product decisions.

1. **Load the current workbook into the existing Sheet.** Open the Sheet, then
   **File → Import → Upload**, choose `product/candle-calculator/dist/candle-calculator.xlsx`,
   and select **Replace spreadsheet**. *~1 minute.*

   Why this is yours and not mine: the Drive API this session can reach updates a file's *title*
   but not its *contents*, and its create-file call rejects a payload this size, so I could not
   push the language-passed workbook into Drive. The live Sheet is therefore one revision behind
   — it still reads "Labour", "Cell colours", "Type here", "Starting assumptions", "Watch out"
   and "Fee boxes". **Replace spreadsheet** keeps the same document ID, so the link already
   printed in the Start Here PDF stays valid and no file needs re-rendering. Do this before
   action 2.

2. **Make the Sheet copyable — the one that actually matters.** Open the Sheet, Share → General
   access → **Anyone with the link → Viewer**. Without this, the buyer's copy link fails.
   *~30 seconds.* I cannot set link-sharing; the tool only shares with a named person.
3. **Create the Etsy listing** — paste the title, 13 tags, description and price; upload the two
   PDFs as the digital files; produce the eight images from the supplied copy.
4. **Decide the shop-level questions** I deliberately did not make up: shop name, policies,
   and the Etsy account itself.

## 7. One deliberate deviation from the specification, disclosed

The specification asked for calculated cells to be **locked** while leaving the protection
removable. I implemented the *intent* — a distinct fill color for calculated cells, a color
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


## 9. Language pass and final render, 2026-08-25

**Copy.** Removed the AI-writing mannerisms across all four buyer-facing surfaces: the punchy
fragment stacks ("How much wax. How much fragrance. What to charge."), the dramatic fragments
("Nothing can.", "Every time."), the vague universals ("the thing that trips everyone up", "the
only way to know"), and the folksy filler ("either way", "whenever you like", "work themselves
out"). British spellings became US ones for the Etsy audience — colour/grey/labour to
color/gray/labor. `labour_on` survives as an internal dictionary key the test suite references;
it is not buyer-facing.

**The invented support promise is gone.** "Message me through Etsy and I will help" in the Start
Here PDF, and "message me and I will sort it out" in the refund paragraph, were both written by
me and never authorized. They would have committed you to unpaid buyer troubleshooting on a $16
digital download. Deleted with no replacement.

**Listing description.** Replaced wholesale with your rewrite. Every claim in it was checked
against the built workbook before adoption. One line changed on accuracy grounds: "Reference
guide with explanations…" sat in a WHAT YOU RECEIVE list beside two actual files and would have
read as a third download, so it now says it is a tab inside the calculator.

**Renders and visual QA.** Both PDFs were rasterised and inspected page by page — the real buyer
files, not a browser approximation of them.

| Check | Result |
|---|---|
| Clipping or overflow | None |
| Illegible text | None |
| Stale copy | None in the shipped files |
| Broken or wrong links | None — the PDF link resolves to the live sheet ID |
| Rendering errors | None |
| Orphan pages | **One found and fixed** |

The Start Here PDF broke across two pages with the four-line "Cell colors" section stranded
alone on a near-empty page two. A buyer printing it got a wasted sheet. Fixed in CSS only —
tighter page margins, leading and block spacing — and the body markup was diffed before and
after to prove not one word of the approved copy changed. It is now a single balanced A4 page.

The delivery manifest said the Start Here PDF was 2 pages, then 1; it now says 1, matching the
file.

**Re-QA after all of it.** 10/10 acceptance tests pass against the shipped workbook,
independent-model cross-check AGREE, 34 formulas with no unbalanced brackets or quotes, no error
strings anywhere in the book, tabs `['Candle', 'Costs & Price', 'Reference']`.

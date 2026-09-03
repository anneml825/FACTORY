# Craft Fair & Farmers Market Profit Tracker — Revised Etsy Assets

Status: ready for owner review; not published.

## September 2, 2026 (revision c) — review findings corrected

Two defects found in review, both cases where a claim did not match the artifact.

- **"Clearly marked sample data" was not true.** The phrase appeared in the listing, the
  Read-Me and listing image 9, but only three cells were marked (Market Days H5:H7). Product
  Sales shipped six unmarked sample rows and Market Comparison five unmarked names, and Product
  Sales drives every calculated result — so a buyer who cleared the marked sheet and missed the
  unmarked ones would have blended their own figures with the samples. Added a labelled banner
  in row 3 of Market Days, Product Sales and Market Comparison naming the exact sample rows.
  The market names were deliberately NOT renamed: they are the matching keys for the SUMIFS and
  COUNTIFS across three sheets, and renaming them would both break matching and contradict the
  listing images.
- **The workbook opened in a state the listing images do not show.** Market Comparison A8 and A9
  shipped as literal "Market 4" and "Market 5", so those rows rendered MARKET NOT FOUND and
  NEEDS REVIEW, and Dashboard rows 14-15 mirrored them. Image 8 shows a clean three-row
  dashboard. These are the same rows removed from the hero image in revision b for reading as
  errors; the image was corrected then but the workbook was not. A8 and A9 are now empty, and
  the stale cached values on those rows were cleared so no viewer can render the old text.
- Added `fullCalcOnLoad="1"` to `calcPr`. The shipped cache was internally inconsistent
  (Dashboard D15/F15/G15 cached as 0 while the structurally identical D14/F14/G14 cached as
  empty), which means revision b's "2,900 of 2,900 values identical" diff compared two equally
  stale caches. Excel now recalculates on open regardless.
- The AI disclosure sentence and the C2PA content credentials in the images are both unchanged,
  at the owner's direction.

### Verification

- 937 formulas present before and after; formula strings byte-identical.
- Full cell-by-cell diff against revision b: exactly 5 changed cells, all intended
  (three banner cells, plus Market Comparison A8 and A9). Zero unexpected changes.
- `xl/charts/chart1.xml` and `xl/drawings/drawing1.xml` byte-identical — the Dashboard chart
  survived, which is why these were raw XML edits rather than an openpyxl round-trip.
- `xl/styles.xml` untouched.
- Listing copy, listing.json, the AI disclosure and all ten images are unchanged; the
  image manifest hashes therefore still verify.
- Scanned every file and every internal .xlsx part for personal data: no name, no email
  address, no path. `docProps` remain blank.

---

# Craft Fair & Farmers Market Profit Tracker — Revised Etsy Assets

Status: ready for owner review; not published.

## September 2, 2026 — naming correction and asset rebuild

- Renamed workbook tabs `Batch Sales` to `Product Sales` and `Market Scorecard` to
  `Market Comparison`, matching the names already used in the listing copy.
- Updated all 68 cross-sheet formula references, plus the instructional text on
  Start Here and Market Days that named the old tabs in prose (including the
  uppercase forms `BATCH SALES` and `MARKET SCORECARD`).
- Performed the rename as raw XML edits rather than an openpyxl round-trip, to
  preserve the embedded Dashboard chart.
- Corrected `Read-Me.txt`, whose numbered walkthrough sent buyers to the retired
  tab names.
- Rebuilt the buyer package, which had been shipping the pre-rename workbook.
- Rebuilt all ten listing images at 2000 x 1600 using values read from the
  workbook: removed empty canvas, fixed the duplicated header on image 3,
  enlarged tables for carousel legibility, removed the unpopulated Market 4 /
  Market 5 error rows from the hero, unified the accent palette, replaced the
  abstract cost diagram on image 5 with a worked example, showed real target
  values on image 7, and made the scope note subordinate on image 10.
- Resolved two divergent `listing.json` files by adopting the owner-approved
  description; the superseded draft carried no AI disclosure.
- Added a `workbookSheets` field to `listing.json` so tab names have one source
  of truth.
- Cleared the LibreOffice build fingerprint from `docProps/app.xml` and normalised
  archive timestamps.
- CORRECTION (2026-09-02c): this entry previously also claimed that Chromium `caBX`
  chunks were stripped from the PNGs. That did not happen, and the chunk is not a
  Chromium artefact. All ten images carry a 5,758-byte `caBX` C2PA content-credentials
  manifest. It contains no personal data. It is being kept deliberately — see below.
- Preserved the required AI-benefit sentence exactly, unchanged.
- Preserved the listing title, $12.99 price, and 13 tags.
- No workbook formulas or calculated values were changed.

## Verification

- 937 formulas recalculate with 0 errors.
- Cell-by-cell diff against the pre-rename workbook: 2,900 of 2,900 values identical.
- Dashboard chart present after rename.
- Zero occurrences of the retired tab names across the workbook, Read-Me,
  listing copy and listing.json.
- Read-Me walkthrough steps match the six workbook tabs.
- Ten images verified as 2000 x 1600 PNGs and re-hashed in image-manifest.json.
- Listing remains unpublished with `OWNER_REVIEW_REQUIRED` status.

---

# Craft Fair & Farmers Market Profit Tracker — Revised Etsy Assets

Status: ready for owner review; not published.

## September 2, 2026

- Replaced the prior ten-image marketing copy with the owner-approved revised image copy.
- Reframed the hero around the buyer’s central question: “You made sales. But was the market actually worth it?”
- Rebuilt Image 2 around the Riverside Pop-Up versus Night Bazaar comparison.
- Rewrote Images 3–10 to explain comparison, workflow, entered costs, time, goals, dashboard, workbook contents, and buyer fit in plain language.
- Added a small illustrated bazaar stall to Image 1 at the owner’s request.
- Corrected Image 1’s hierarchy so the tracker name is the main headline and “You made sales…” is the supporting hook.
- Rewrote Image 3’s headline to “See which markets made you the most profit” and restored the `%` symbol in the supporting comparison list.
- Replaced the Etsy description with the owner-approved direct-response version.
- Preserved the required AI-benefit sentence exactly: “Every workbook is developed and rigorously quality-checked with assistance from frontier AI models, helping catch errors, test calculations and deliver a more reliable tool for your business.”
- Preserved the existing listing title, $12.99 price, and 13 tags.
- Preserved the audited Excel workbook and buyer download contents; no workbook formulas or buyer-facing workbook files were changed.

## Verification

- Ten images generated as valid 2000 × 1600 PNG files.
- Etsy image ZIP contains exactly the ten expected PNG files.
- Combined image preview regenerated from the final image files.
- Listing description is generated from the approved plain-text copy to prevent copy drift.
- Listing remains unpublished with `OWNER_REVIEW_REQUIRED` status.

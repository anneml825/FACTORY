# Craft Fair & Farmers Market Profit Tracker

**This is the current version. Revision 2026-09-02c. It supersedes every earlier copy of these
assets, including anything still sitting in a local folder, a download, or an unpushed branch.**

If you find another `listing.json`, `Read-Me.txt`, or image set anywhere outside this repo,
it is stale. Delete it rather than merging it.

---

## What changed in this revision (c)

Two review findings, both cases where a buyer-facing claim did not match the artifact:

1. **Sample data is now actually marked.** Row 3 of Market Days, Product Sales and Market
   Comparison carries a banner naming the exact sample rows. Previously only three cells were
   marked, while Product Sales — the sheet that drives every calculated result — shipped six
   unmarked sample rows.
2. **Market Comparison A8/A9 are empty.** They shipped as literal "Market 4" and "Market 5",
   which rendered MARKET NOT FOUND and NEEDS REVIEW on both Market Comparison and the Dashboard.
   Listing image 8 shows a clean three-row dashboard, so the buyer's file did not match the
   picture. Stale cached values on those rows were cleared too.
3. `fullCalcOnLoad="1"` added to `calcPr`, because the shipped cache was internally inconsistent.

The AI disclosure sentence and the images' C2PA content credentials are unchanged, by owner
decision. The CHANGELOG's earlier claim that `caBX` chunks were stripped has been corrected —
they were not, and the chunk is C2PA provenance, not a Chromium artefact. It carries no
personal data.

## What changed in revision b

Two workbook tabs were renamed so the file matches what the listing promises:

| Old tab name       | Current tab name    |
|--------------------|---------------------|
| `Batch Sales`      | `Product Sales`     |
| `Market Scorecard` | `Market Comparison` |

The old names had leaked into four places. All four are corrected here:

1. the workbook tabs themselves, and 68 cross-sheet formula references
2. the Start Here and Market Days instructional text (including uppercase forms)
3. `Read-Me.txt`, whose numbered walkthrough sent buyers to tabs that no longer existed
4. the superseded `listing.json` draft, which named both retired tabs under WHAT YOU RECEIVE

All ten listing images were rebuilt at 2000 x 1600 from values read out of the workbook.
See `etsy/CHANGELOG.md` for the full list.

## Source of truth for sheet names

`etsy/listing.json` now carries a `workbookSheets` field. It is the authoritative list of tab
names. Anything that references a sheet by name — the Read-Me, the image copy, the description —
should be checked against that field, not against another document.

Verify before publishing:

```bash
python3 - <<'PY'
import json, openpyxl
declared = json.load(open('etsy/listing.json'))['workbookSheets']
actual = openpyxl.load_workbook('buyer-download/Craft-Fair-Farmers-Market-Profit-Tracker.xlsx').sheetnames
print('match' if declared == actual else f'MISMATCH\n  declared: {declared}\n  actual:   {actual}')
PY
```

## Layout

```
etsy/
  listing.json        <- title, price, tags, description, workbookSheets
  Craft-Fair-Farmers-Market-Etsy-Copy.txt
  image-manifest.json <- sha256 per image
  images/             <- 10 PNGs, 2000 x 1600
  CHANGELOG.md
buyer-download/       <- exactly what the buyer receives
archive/              <- superseded drafts, kept for reference only. Do not publish.
```

## Status

`publicationStatus` is `OWNER_REVIEW_REQUIRED`. Not published.

## Known open items

- The hero illustration is AI-generated and sits awkwardly against the data-led design of the
  other nine images. Replacing it is a design job, not an edit.
- AI disclosure wording is unchanged from the approved draft and has not been re-reviewed
  against Etsy's current Creativity Standards at `etsy.com/legal/creativity`.
- Confirm whether Etsy requires a listing *attribute* alongside the description text. If it is
  a two-part requirement, description copy alone does not satisfy it.

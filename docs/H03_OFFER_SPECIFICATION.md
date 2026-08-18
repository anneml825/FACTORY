# h03 Offer Specification — and why it fails

**Date:** 2026-08-18 · **Conclusion: do not build h03.** Corrected recommendation below.

Writing the full specification is what killed it. Questions 7–10 cannot be answered
acceptably, and question 17 corrected a cost error of roughly 25–50×.

---

## The h03 specification, as asked

**1. What is the product?** A spreadsheet (Excel + Google Sheets) that helps a US freelancer
calculate and track quarterly estimated tax payments, sold as one file per state.

**2. Who exactly is the buyer?** A US sole-proprietor freelancer in their first profitable
year receiving 1099 income, who has never filed estimated taxes and is worried about penalties.

**3. What does it do?** Tracks income and deductible expenses by month, estimates
self-employment tax and federal income tax, adds state liability, compares against the
safe-harbour amount, and outputs what to pay by each quarterly deadline.

**4. Buyer inputs.** Monthly income, expenses by category, filing status, prior-year total tax,
state of residence, any W-2 withholding.

**5. Outputs.** Quarterly payment amount, safe-harbour comparison, year-to-date estimated
liability, projected year-end position.

**6. State-specific content.** State income tax rates and brackets, state estimated-payment
thresholds, state quarterly due dates, and the relevant state form numbers.

**7. What depends on facts that change — and this is where it breaks.**

Nearly everything: the self-employment tax rate and the Social Security wage base (annual), the
federal income tax brackets (annual), the standard deduction (annual), QBI deduction rules,
safe-harbour percentages, federal quarterly due dates, and **the tax rates, brackets,
thresholds and deadlines of every state sold**.

**8. What sources would verify each rule?** IRS Publication 505, the annual IRS revenue
procedure for inflation adjustments, and each state's department of revenue.

**Factory cannot retrieve any of them.** This container's egress policy blocks general internet
hosts, and WebFetch is blocked as well. Only search summaries are reachable, and a search
summary is not an authoritative tax source.

**Therefore any tax rate in this workbook would come from model memory — which
`EXPERIMENTAL_PROTOCOL.md` §2 explicitly forbids as a model-invented number.** Tax tables are
exactly the class of fact the rule exists to prohibit.

**9. How would Value QA prove the outputs correct?** **It could not.** Arithmetic can be
verified against hand calculations, but arithmetic correctness is worthless if the underlying
rates are wrong. Value QA cannot certify a number whose source cannot be checked.

**10. Maintenance when rules change?** Annual, mandatory, and per state. Every workbook needs
updating each January across every state sold, sourced from authorities Factory cannot reach.
That is **recurring `MAINTENANCE_DEBUG` labour that grows linearly with the number of assets
sold** — the exact inverse of the portfolio property that makes this model attractive.

**11. Why preferable to free alternatives?** Honestly — it may not be. The IRS publishes the
Form 1040-ES worksheet free, and free estimated-tax calculators are abundant. The intended
differentiator was state-specific integration, which is precisely the part Factory cannot
verify.

**12–15.** Moot. A listing would have to promise accuracy Factory cannot deliver.

---

## Why this fails, generalised

**h03 requires Factory to be an authority on facts it cannot verify from primary sources.**

That is not a fixable detail — it is a category. It also carries real harm: a freelancer who
underpays on Factory's numbers faces genuine financial penalties. The downside lands on a
customer, not on Factory.

### Proposed new rule: the Verifiable Correctness Constraint

> **Factory may not sell a product whose correctness depends on external facts it cannot verify
> against primary sources.**
>
> **Prefer products where the CUSTOMER supplies the facts and Factory supplies the structure,
> computation and presentation.**

This prunes tax, legal, medical, regulatory-compliance and safety products across the whole
portfolio — including `f06` (lease clause flags), `f07` (nutrition-label compliance), `p03`
(jurisdiction legal templates) and `d01` (state licensing requirements). Several were already
killed on legal risk; this is the sharper and more general reason.

---

## Corrected recommendation: `a03`

**Etsy shop bookkeeping and true-margin workbook for Etsy sellers.**

It satisfies the new constraint by inverting the information flow: **the buyer's own Etsy data
is the source of truth, so Factory never asserts an unverifiable fact.**

**1. Product.** A Google Sheets / Excel workbook that turns an Etsy seller's own order CSV
export into true per-item profit.

**2. Buyer.** An Etsy seller with roughly 10–200 listings who knows their revenue but not their
actual margin after fees, materials and time. **They are already on Etsy** — which was the
audience-fit failure that killed four earlier hypotheses.

**3. What it does.** Ingests the seller's exported order CSV, joins it to their own
per-product material and labour costs, and reports true net profit per order and per listing,
ranks listings by margin, and computes a break-even price per item.

**4. Inputs.** The seller's Etsy CSV export (they download it themselves), material cost per
product, their own labour rate, and any overhead they wish to allocate.

**5. Outputs.** Net profit per order, margin ranked by listing, total fees paid, break-even
price, and which listings lose money once labour is counted.

**6. Platform-specific content.** Etsy's fee structure — **but entered by the buyer with dated
defaults, and where possible derived from the actual fee columns in their own CSV.**

**7. What can change?** Etsy's fee rates. **Mitigated by design:** the workbook reads the fees
Etsy actually charged from the seller's export rather than assuming a rate. If Etsy changes its
pricing, the workbook keeps working because it never hard-coded the old rate.

**8. Verification sources.** The buyer's own Etsy statement. Factory is not the authority — the
customer's data is, and they can check every figure against the platform themselves.

**9. Value QA.** Fully achievable. Construct synthetic CSV exports with known values, compute
expected outputs by hand, assert the workbook matches. Every formula is checkable because every
input is supplied.

**10. Maintenance.** Near zero. No annual update cycle, no external rate tracking.

**11. Versus free alternatives.** Etsy's own Shop Stats report **revenue, not profit** — they
do not know the seller's material or labour costs. Free templates generally require manual
transcription rather than ingesting the CSV, and few compute per-listing margin after labour.
The concrete differentiator is *ingesting the seller's own export* and *costing labour* — both
observable features, not adjectives.

**12. Listing promise.** Precisely: "Turn your Etsy order export into true profit per item.
Enter your material and labour costs; see which listings actually make money after Etsy fees.
Works with your own CSV export." **No tax, legal or accounting claims of any kind.**

**13. Delivered immediately.** The workbook file plus a one-page instruction sheet for
exporting the CSV.

**14. Fully automated?** Yes — Etsy instant download, zero touch per sale.

**15. Price.** $15.

---

## 16–18. Cost and time — corrected

**My "$0.60 experiment" figure was wrong, and materially so.**

**16. What I previously claimed:** 3 listings × $0.20 = $0.60. That covered listing fees only.

**17. What Etsy also charges — the correction:**

| Item | Amount |
|---|---|
| **One-time shop setup fee** | **$15–29**, introduced 2024, varies by country and currency, **non-refundable** |
| Listing fee | $0.20 per listing, ~4 months, renews $0.20 on sale |
| Transaction fee | 6.5% per sale |
| Payment processing | 3% + $0.25 (US) |
| Offsite Ads | 15% — **opt-out available below $10k trailing sales** |
| Regulatory operating fee | **Not applicable to US sellers** |

**Corrected experiment cost: ~$15.20–29.60**, not $0.60. That is **30–59% of the entire $50
capital base**, so this is a genuine capital decision requiring Capital Authority
authorisation — not the trivial spend I described. **I should have verified this before quoting
a figure, and the portfolio arithmetic in the previous analysis inherits the error:** with a
fixed entry cost of $15–29, roughly two to three sales are needed simply to recover setup
before any asset is profitable.

The good news is that the setup fee is **paid once for the whole shop**, so it is amortised
across every subsequent listing. The marginal cost of asset number two remains $0.20. The
portfolio logic survives; the entry cost does not.

**18. Is 15–20 minutes one-time?** The account creation, identity verification and payout setup
are one-time, and 15–20 minutes is a fair estimate for that.

**But I have to disclose something I under-weighted: Etsy has a buyer-message surface.**
Buyers can message sellers, Etsy tracks response rates, and slow responses affect shop standing.
That is a **recurring `OPERATING` labour surface** — the same category of problem that killed
the Fiverr cluster. It is much smaller here, since instant downloads generate far fewer
messages than commissioned work, but it is **not zero**, and I previously presented owner labour
as zero after setup. Message volume should be measured as part of the experiment rather than
assumed away.

---

## What I recommend

Run `a03`, not `h03`. One listing at $15.

- **Cash:** ~$15.20–29.60 (setup, one-time and shop-wide) **+ $0.20** for the listing
- **Owner setup:** 15–20 minutes, one-time, plus an unquantified message-response burden to be
  measured
- **Success:** ≥1 arm's-length sale within 28 days
- **Minimum meaningful denominator:** 300 impressions
- **Failure classification:** <100 impressions → `NO_DISTRIBUTION`; ≥300 impressions with
  <0.5% clicks → `WEAK_CLICK_THROUGH`; ≥30 clicks and no sale → `WEAK_PURCHASE_CONVERSION`

**This now requires explicit capital authorisation.** At 30–59% of the capital base it is not a
rounding error, and the kill switch remains engaged until you decide.

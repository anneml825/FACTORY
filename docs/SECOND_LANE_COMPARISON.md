# Where the next unit of attention, owner minutes and capital should go

**2026-08-24. Bounded comparison. Nothing built, no account created, no capital requested.**
All prior KDP work is treated as sunk.

## The axis the KDP failure added

Factory's existing survivor ranking (`docs/BROADENED_SEARCH_ANALYSIS.md`) scored lanes on
distribution cost and time-to-signal. Both were right and both are unchanged. This week added
a third axis that outranks them, because it decides whether a *failed* experiment is worth
anything:

> **Can Factory see the market, and classify its own failures, for $0?**

`EXPERIMENTAL_PROTOCOL.md` §6 requires a failed attempt to be classified —
`NO_DISTRIBUTION` (nobody saw it) versus `WEAK_CLICK_THROUGH` (they saw it and scrolled past)
versus `WEAK_PURCHASE_CONVERSION` (they clicked and didn't buy). A lane that cannot separate
those produces failures that teach nothing, and a portfolio of uninformative failures is just
expense.

## The four lanes

Scored on what is **verified in this repository or this session**. Unverified items are marked
and listed at the end rather than smoothed over.

| | **KDP** | **Etsy digital** | **itch.io** | **Registry / gallery** |
|---|---|---|---|---|
| Entry cost | **$0** | **$15–29 one-time** ⚠ | **$0** | $0 |
| Cost per attempt | $0 | $0.20 | $0 | $0 |
| 30 attempts | $0 | ~$6 + entry | $0 | $0 |
| Free market evidence | **None — $276/yr** ✅verified | None natively; **Envato substitutes at $0** | Public catalogue + prices | Public metrics |
| Failure classification | **Sales only — cannot separate "unseen" from "unwanted"** | **impressions → views → visits → orders** | partial | installs/downloads |
| Owner minutes, setup | account + tax interview | ~15–20 | small | ~0 |
| Owner minutes, **per attempt** | **~10 min × every title** ⚠ | ~0 after setup ⚠ | ~0 ⚠ | ~0 |
| Payout trap | threshold applies | **none — Etsy is merchant of record** | direct ⚠ | n/a |
| Buyer intent at arrival | **highest** | high | moderate | low/indirect |
| Time to signal | 30 d | **28 d** | 30 d | 45–120 d |

## KDP — drop it

Not "defer". The two disqualifying properties are structural, not fixable with more work:

1. **A failed KDP title teaches almost nothing.** KDP reports sales. It does not report
   impressions, so a title that sells nothing cannot be distinguished between "never surfaced"
   and "surfaced and rejected". That is precisely the classification §6 requires, and it is the
   single thing that makes a portfolio of cheap failures valuable rather than merely cheap.
2. **Owner minutes scale linearly with attempts.** ~10 minutes per title is fine for one title
   and is **5 hours across 30** — and `OWNER_AUTONOMY.md` treats per-asset owner labour as an
   autonomy defect, not a cost to be tolerated.

The $276/year market-data problem proven this week is real but is the *third* reason, not the
first. Even with free Amazon data, the impression blindness would remain.

**Amazon's search intent is the best of any lane examined.** That is what made KDP attractive
and it is genuinely lost by dropping it. It is not worth 5 owner-hours spent on experiments
that cannot explain their own failures.

## Etsy — the strongest lane, with one honest problem

Etsy wins the axis that matters. It reports **impressions → views → visits → orders**, which
maps directly onto the §6 taxonomy; listings go live with no review gate; fulfilment of an
instant download is fully automated; Etsy is merchant of record, so the payout-threshold trap
that `FINANCIAL_CONTROLS.md` calls "the dominant cash-flow fact" does not apply.

**The problem is the entry fee.** `EXPERIMENTAL_PROTOCOL.md` §18 records that Factory nearly
committed **30–59% of the entire capital base** to Etsy's one-time shop setup fee — $15–29
against a **$30 validation bucket**. Thirty listings then cost ~$6. So the lane is roughly
**$21–35 all-in for 30 well-instrumented experiments**, against $30 available. That is
affordable at the low end and **not affordable at the high end.**

The fee is regional, and which end applies to this owner is unverified.

One constraint carried forward unchanged: **Etsy's API may not be used for market research**
(prohibited analytics use). Etsy is a *selling* surface only. Evidence must come from
elsewhere — which is exactly what the next section is for.

## The evidence layer is separable, and that is the real unlock

The deepest mistake in the KDP effort was assuming the selling surface must also be the
evidence surface. It doesn't. `docs/COMMERCIAL_EVIDENCE_INVESTIGATION.md` already established
the cheapest verified source of **actual willingness-to-pay**:

> **Envato / CodeCanyon API — free token, ~10 owner minutes — returns per-item sales counts
> and prices.**

Real units sold, at real prices, per item. Not rank, not ratings, not a vendor's model —
**counts of purchases**. Nothing in the Amazon ecosystem offered that at any price examined.
CodeCanyon is closed as a *selling* surface ("entry effectively closed"), which is precisely
why it is uncontaminated as an *evidence* surface.

**Envato for evidence, Etsy or itch.io for selling.** That decoupling is the answer to the
question KDP could not answer.

## Recommendation

**Machine attention** → the Envato evidence screen first, then a listing-and-fulfilment
pipeline targeting Etsy, written so the publication step is swappable. Both are already
scoped in this repository. No new provider research.

**Owner minutes** → **~10 minutes, once**: an Envato account and API token into a GitHub
secret. That is the whole ask, it costs nothing, and it unlocks real purchase-count screening
regardless of which selling lane is chosen later. The Etsy shop decision can wait until the
evidence screen has named something worth listing.

**Capital** → **$0 now.** DISCOVERY ($10) is untouched because Envato is free. VALIDATION
($30) is untouched until a listing exists. The Etsy entry fee is the first real decision and
should be taken **after** the evidence screen, not before — spending 50–98% of the validation
bucket to enter a market Factory has not yet screened is the same ordering error that has
already cost this project a week.

**itch.io runs alongside at $0** as the pipeline's proving ground: it costs nothing to publish
to, so it can validate that Factory's make → publish → measure loop works end to end before
any fee is paid.

## Load-bearing assumptions — unverified, per §19

Stated plainly because two designs already died on fields that "obviously" worked:

1. **Etsy's setup fee in this owner's region** — $15–29, or $0. Decides whether the lane fits
   the validation bucket at all.
2. **Whether Etsy's API permits autonomous listing creation** for a new seller. If listings
   must be created by hand, Etsy's "~0 owner minutes per attempt" collapses and its advantage
   over KDP narrows sharply. **This is the single assumption most likely to invalidate the
   recommendation.**
3. **itch.io payment mechanics** — direct-to-seller is assumed, not confirmed.
4. **KDP's ~10 minutes per title** — an estimate from earlier discussion, never measured.

Each is cheap to settle and none was settled here, because settling them is provider research
and this was a comparison.

## Not done, deliberately

No KDP infrastructure. No API-provider research. No Capital Authority implementation. No
marketplace account. Paid activity remains HALTED.

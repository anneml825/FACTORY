# v047 Review, and a Surface Correction

**Date:** 2026-08-18 · **Cost: $0.00** · **v047 is killed. Gumroad is demoted. itch.io wins.**

---

## Part 1 — v047, answered honestly. It fails on five grounds.

**Q1/Q2 — what is it?** A knit/crochet pattern regraded to the buyer's own measured gauge and
body measurements. **Personalized**, not static: discover → buy → submit measurements →
receive a custom PDF.

**Q5 — rights and provenance. This is a serious problem I had not examined.**

There were two possible constructions and I never specified which:

- **Regrading a customer-supplied pattern.** Knitting and crochet patterns are copyrighted, and
  licences routinely prohibit derivative works and redistribution. Regrading someone else's
  pattern likely creates an **unauthorised derivative work**. Not viable.
- **Selling Factory's own original pattern with customisable gauge.** Legally clean — but it
  requires Factory to *design an original garment*, which is a design capability, not a
  computation.

I had been sliding between the two. The first is an IP problem; the second is a different
product than the one whose "functional quality bar" I was praising.

**Q6 — the quality bar. My classification was wrong, and inconsistently so.**

I claimed v047 competes on *functional* correctness (does it fit?). That is false. **People buy
a knitting pattern because they want that garment.** Design appeal is the purchase driver;
correct grading is table stakes that only becomes visible after purchase.

This is exactly the aesthetic-quality weakness for which I **demoted h21 (laser-cut SVG packs)
two turns ago.** I applied the standard to h21 and then failed to apply it to v047. That is an
inconsistency, not a judgement call.

**Q7 — retrieved evidence for the problem. There is none.**

I have **zero retrieved evidence** that knitters or crocheters want to pay for regrading. v047
was an H0 promoted on plausibility alone — precisely what §17 forbids.

**Q8 — alternatives.** Free gauge calculators are abundant, most commercial patterns already
ship multiple sizes, and knitting communities answer grading questions for free.

**Q3/Q4 — the fulfilment workflow, which I assumed.**

I asserted Gumroad supports collect-input → generate → deliver. **I did not verify it.**
Gumroad is built for *static file delivery*. A per-order generated artefact would require
checkout custom fields plus a webhook plus Factory-side generation plus programmatic delivery —
**Factory-built infrastructure, not a Gumroad feature.** Presenting it as "Gumroad supports
this" was an assumption stated as a fact.

**Verdict: v047 killed.** IP provenance risk · wrong quality-bar classification · no retrieved
evidence · unverified fulfilment path · and no arrival mechanism (below).

---

## Part 2 — Q10/Q11/Q15. Gumroad cannot supply a denominator at $0.

**This is the decisive finding and it invalidates the Campaign 1 architecture I proposed last
turn.**

Retrieved Gumroad Discover eligibility:

| Requirement | Detail |
|---|---|
| Payout settings | Complete |
| **Account balance** | **≥ $10 from genuine sales — self-purchases excluded** |
| **Risk verification** | **~3 weeks after passing the $10 threshold** |
| **Product level** | **At least one successful sale**, category set, ratings enabled |

**A zero-sale product cannot appear on Gumroad Discover at all.** Sales are required *before*
exposure is granted.

**Q15 — answering directly, as asked: no. Gumroad cannot plausibly provide a meaningful
denominator at $0, and I am saying so before building anything.**

Listing on Gumroad without Discover is a URL nobody visits. **This is the WordPress error
repeated** — "listed in the directory" is not "the directory sends strangers." I made that
error, had it falsified, and then rebuilt the same assumption on a different platform.

---

## Part 3 — the surface that actually works

**itch.io**, retrieved:

- **$0** entry, no listing fee
- **Public projects are listed in browse and search** — indexing available to all accounts in
  good standing, **no sales gate**
- **Project analytics report IMPRESSIONS and CTR**, where an impression counts each time the
  title and thumbnail are shown while browsing (homepage, feed, recommendations, browse pages)
- Paid products permitted, automatic digital fulfilment
- **Honest caveat, also retrieved:** "Most Recent" pages generate very little traffic and
  should not be depended on for discovery; indexing can be delayed

**That last caveat is a feature for Factory's purposes.** Impressions may well be low — but
they are *measured*, so a null result is diagnosable rather than ambiguous.

**itch.io delivers the impression-level funnel data I believed was exclusive to Etsy, at $0
instead of $15–29.**

### Q13/Q14 — corrected failure classification

The owner's correction is right and my earlier table was wrong.

| Observation | Correct classification |
|---|---|
| **0 impressions** | `NO_DISTRIBUTION` — the surface never showed it |
| **Impressions, ~0 clicks** | `WEAK_CLICK_THROUGH` — title/thumbnail/positioning failed |
| **Clicks, no downloads/purchases** | `WEAK_OFFER_ENGAGEMENT` — the page failed to convince |
| **Checkout started, abandoned** | `WEAK_PURCHASE_CONVERSION` |
| Impressions below minimum | `INSUFFICIENT_EXPOSURE` — did not run |

**Impressions without purchases is never automatically `WEAK_PURCHASE_CONVERSION`.** If nobody
clicked through, the offer was never evaluated, and conclusions about the offer are unsupported.

---

## Part 4 — Q16/Q17/Q18. Comparison on P(informative stranger interaction at $0)

| Finalist | Surface | Sales gate? | Impressions visible? | P(informative interaction @ $0) |
|---|---|---|---|---|
| ~~v047 knit pattern~~ | Gumroad | **Yes — blocks entirely** | No (no traffic to measure) | **~0. Killed** |
| **Game-dev asset/template** | **itch.io** | **No** | **Yes — impressions + CTR** | **Highest** |
| Dev utility | npm / GitHub | No | Downloads only, no impressions | Medium |
| HA blueprint | HA exchange | No | Weak analytics | Medium |
| KDP title | Amazon | No | **No impressions** | Medium — sales-or-silence |
| a03 workbook | Etsy | No | Yes | Blocked by §18 cost discipline |

**Q17 — yes, and this reframes the choice.** On itch.io a **free** asset participates in its
own arrival: it is indexed, appears in browse and recommendation surfaces, accrues impressions,
and its page can link to a larger paid pack. The free artefact *is* the discovery mechanism,
rather than depending on passive marketplace goodwill.

**Q18 — yes, and this is now the design.** Test the *arrival* before building the *product*.

---

## The experiment, resolved autonomously

**Publish one small, genuinely useful FREE asset on itch.io and measure whether strangers
arrive at all.**

- **Product:** a functional game-dev asset where correctness beats beauty — a starter template
  or utility, **not** textures or sprites. Factory's aesthetic weakness is real and I will not
  repeat the v047 error of ignoring it.
- **Cost: $0.00.** Owner setup: one itch.io account, ~10 minutes, when an asset exists.
- **Duration:** 28 days.
- **Minimum meaningful denominator (Q12): 200 impressions.** Below that the result describes
  itch.io's cold start, not the offer.

| Result | Meaning |
|---|---|
| 0 impressions in 28 days | `NO_DISTRIBUTION` — a new itch account gets no reach. Kill cheaply, surface disproved |
| ≥200 impressions, <1% CTR | `WEAK_CLICK_THROUGH` — presentation problem, iterate title/thumbnail |
| ≥200 impressions, ≥1% CTR, downloads | **Strangers reached at $0.** Proceed to build the paid pack |
| <200 impressions | `INSUFFICIENT_EXPOSURE` — did not run |

**Why this is the right experiment:** it isolates the single variable that has killed every
candidate so far — *can Factory get strangers at all?* — and answers it for **zero capital**,
before any product investment. Monetization is deliberately deferred; it is the easier
question and depends entirely on this one.

---

## Status

**Owner capital consumed: $0.00. Kill switch engaged. Nothing built. No accounts created.**

Three surfaces have now been disproved as $0 arrival mechanisms — WordPress.org (no organic
reach for new plugins), Etsy (works, but $15–29 violates §18), and Gumroad Discover (sales
gate). **Each was disproved by retrieval before any capital was committed**, which is the
Data Economics Gate operating as designed.

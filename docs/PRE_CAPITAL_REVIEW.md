# Pre-Capital Review — a03 demoted, finalists, and the $20 question

**Date:** 2026-08-18 · **Cost: $0.00** · No capital spent, no accounts, nothing built.

---

## Q5 — a03's competitive evidence. The differentiation claim is FALSE.

The owner asked me to verify specifically: *do few alternatives ingest Etsy CSV exports and
calculate per-listing margin including buyer-supplied material and labour costs?*

**They do not. Both claimed differentiators already ship.**

| Claimed differentiator | Reality |
|---|---|
| Ingests the seller's Etsy CSV export | **Paperless Books' calculator already "breaks down Etsy CSV into a more readable format by simply copying and pasting the CSV into the worksheet"** |
| Costs materials **and labour time** | **BulkListingPro already includes "materials costs, shipping, labor time, and discounts"** |

And the category is crowded with **free** competitors: EverBee (free Chrome extension),
Craftybase, Yotpo, Bench, omniprofitcalculator, listingprofitcalculator.com, a free
etsy-fee-calc site, and **a free Google Sheets template** from bizbuildingmoms. Etsy itself
maintains market pages for `etsy_profit_calculator_spreadsheet` and `profit_calculator_spreadsheet`.

**a03 is demoted from finalist.** It is a paid product in a saturated category whose two
distinguishing features already exist elsewhere, at least one of them free.

### The generalisable lesson

> **Anything easy for Factory to build is easy for everyone to build. Competition is fiercest
> exactly where the opportunity is most obvious.**

Etsy sellers are a visible, addressable audience with an obvious need — which is precisely why
twenty people have already served it. My generation process kept producing *obvious tools for
obvious audiences*, and that is a structural flaw, not bad luck.

---

## Q1 — why 24 H0s was not enough breadth

It wasn't, and the number understates the problem. **The failure was not quantity but
generative principle.** All 24 came from one question — "what could Factory sell?" — which
reliably produces obvious answers. Generating 240 the same way would have produced 240 obvious
answers.

**Portfolio now totals 189 hypotheses** across three generations: v1 (24), v2 (105 across 16
families), v3 (60 from a new principle, below).

---

## Q2/Q3 — v3, generated from a different principle

> **Generate only where the barrier is VOLUME OF WORK — the one barrier AI marginal cost
> actually removes. If one clever person could build it in a weekend, someone already has.**

Four moat types: **BREADTH** (value needs N variants nobody will hand-make) · **ASSEMBLY**
(collating scattered sources) · **FRESHNESS** (value decays, must regenerate) · **PER_INPUT**
(value unique to the customer's own data).

60 generated · 60 survive · **43 need $0 entry** · **33 give signal within 30 days**.
Moats: BREADTH 25 · ASSEMBLY 15 · PER_INPUT 15 · FRESHNESS 5.

**PER_INPUT is doubly attractive** — it satisfies the Verifiable Correctness Constraint by
construction, because the customer supplies the facts.

---

## Q6/Q7/Q8 — is Etsy even the right arrival, and is there a cheaper test?

**No, and yes.** The retrieved finding that changes everything:

**Gumroad and itch.io are free to start — no setup fee, no listing fee, no monthly fee.**
10% + $0.50 per sale, 30% for marketplace-sourced sales. Both handle payment and file delivery.
Gumroad's analytics report traffic sources and conversion rates.

And a detail that is genuinely valuable to Factory specifically:

> **Gumroad's 30%-vs-10% fee split is an attribution mechanism.** A sale charged 30% means
> Gumroad Discover sent the buyer — an arm's-length stranger. A sale charged 10% came through
> Factory's own link. **The fee data itself distinguishes stranger arrival from self-promotion**,
> which is exactly the distinction `CONSTITUTION.md` §10 requires and which is usually hard to
> establish.

So the answer to Q7 is unambiguous: **Factory can test a value proposition end-to-end,
including real payment, for $0.**

---

## Q9/Q10 — marketplace vs Factory-owned asset

| | Marketplace (Etsy/Gumroad/itch) | Factory-owned page + programmatic arrival |
|---|---|---|
| Entry cost | $0 (Gumroad/itch) — $15–29 (Etsy) | ~$12/yr domain, $0 hosting |
| Cold start | **Solved by the platform.** Etsy adds a documented new-listing boost | **Unsolved.** 90+ days to index and rank |
| Measurement | Platform-defined; Etsy reports impressions, Gumroad reports sources + conversion | **Complete and owned** — every stage, no platform limits |
| Time to signal | **21–30 days** | 90–120 days |
| Payment | Handled | Must be built |
| Maintenance | ~0 | Hosting, uptime, dependency drift |
| Platform risk | **High** — rules change, accounts close | **None** |
| Ceiling | Capped by platform take rate and competition | **Higher, compounding, owned** |

**They are complements, not alternatives.** Marketplaces buy *speed and cold-start*;
owned assets buy *ceiling and independence*. With a 90-day commercial clock, speed dominates
first. **The programmatic asset is the right second move, not the first.**

**Q9 — why hasn't Factory built landing-page generation?** It should, and it remains the
biggest capability gap. But the honest reason it is not the *first* move is that a
Factory-owned page has **no cold-start solution** — and cold start is precisely what has killed
every candidate so far.

---

## Finalists

All $0 entry, all signal ≤30 days, all Verifiable-Correctness-safe.

| # | id | What is sold | Moat | Surface | Capability risk |
|---|---|---|---|---|---|
| **1** | `v047` | Knit/crochet pattern regraded to the buyer's measured gauge | PER_INPUT | Gumroad + Etsy | Can Factory generate a *correct* graded pattern? |
| **2** | `v001` | Seamless tileable texture packs, 200 material variants | BREADTH | itch.io | **Aesthetic** quality — Factory's weakest axis |
| **3** | `v048` | Cut list optimised to the buyer's actual stock sizes | PER_INPUT | Gumroad | Optimiser correctness — verifiable |
| **4** | `v017` | Dockerfile/compose presets per stack combination | BREADTH | npm/GitHub | Devs may not pay |
| — | `a03` | Etsy profit workbook | — | — | **DEMOTED — differentiation falsified** |

`v047` leads because the quality bar is **functional, not aesthetic** (does the garment fit?),
the customer supplies the facts, grading across sizes is genuinely tedious skilled work, and
ill-fitting patterns are a real and widely-voiced complaint. Its risk is squarely a **Factory
capability** question — which is the useful kind, because it is answerable by building one.

---

## If Factory had one $20 bill left

**I would not spend it. Not yet — and that is the answer, not an evasion.**

The reasoning:

**1. The core unknown is testable for $0.** The single biggest open question is *can Factory
produce a digital artefact a stranger will pay for?* Gumroad and itch.io answer that with real
payment, real strangers and real attribution at **zero entry cost**. Spending $20 to ask a
question that $0 answers is a poor allocation regardless of how good the $20 surface is.

**2. Etsy's $15–29 buys distribution, which is genuinely the scarce input** — the documented
new-listing boost and per-listing impression reporting are the best stranger exposure found
anywhere in this search. **But distribution is only worth buying for a product that deserves
it.** a03 did not, and I nearly spent 30–59% of capital finding that out the expensive way.

**3. So the correct sequence inverts my earlier recommendation:**

> **Run $0 tests first to find a product showing any signal. THEN spend the $20 buying Etsy
> distribution for that specific product.**

That way the $20 buys *amplification of a validated thing* rather than a simultaneous bet on
both product and distribution — which is two unknowns for one payment, and unresolvable if it
fails.

**4. And if forced to spend it right now, on one thing:** Etsy, with `v047` — not a domain. A
domain buys a 90-day wait during which the commercial clock runs and nothing is learned. Etsy
buys measured stranger exposure inside 30 days with diagnosable failure. **Speed of information
beats ceiling while the clock is running.**

---

## What I am asking for

**Nothing yet.** No capital, no accounts.

The next step costs $0 and needs no authorisation: build one `v047` artefact, run Value QA
against it, and list it on a free surface. If it produces impressions and no sale, that is
`WEAK_PURCHASE_CONVERSION` and cheap. If it produces neither, that is `NO_DISTRIBUTION` — and
*then* the $15–29 for Etsy's boost becomes a well-posed question rather than a guess.

**Kill switch remains engaged. $50 remains untouched.**

# Commercial Evidence Investigation

**Date:** 2026-08-18 · **Cost: $0.00** · No accounts created, nothing built.

WordPress is **withdrawn as the initial Campaign recommendation but not rejected**; all
findings are preserved in `docs/SEARCH_SPACE_SELECTION.md` and
`docs/WORDPRESS_CHALLENGE_RESPONSE.md`.

---

## The structural finding

Separating the owner's three concepts produces the result that explains everything that went
wrong earlier:

> **Searchability, commercial attractiveness, and experimentability are largely
> ANTI-CORRELATED across platforms.**

| | Publishes rich data | Money clearly changes hands | New entrant can act cheaply |
|---|---|---|---|
| Open-source catalogues (npm, WordPress.org, crates, Docker) | **Yes** | No | Partly |
| Government spending (USAspending) | **Yes** | **Yes** | **No** |
| CodeCanyon | Partly | **Yes** | **No** |
| Etsy / Fiverr / Gumroad | **No** | **Yes** | **Yes** |

Platforms publish catalogue data when the goods are free — data is cheap to give away when
nobody is paying. Platforms guard it when the goods are paid, because it is competitively
valuable. **My earlier method could only ever return the top-left cell**, because it selected
on retrievability. That is not a flaw in execution; it is what the method optimizes for.

### The escape

**When an experiment costs $0.20, screening stops being the constraint.**

I had been optimizing screening on the assumption that experiments are expensive. On Etsy a
digital-download listing costs **$0.20** and exposes a complete funnel. At that price,
**experimentation substitutes for screening** — Factory can afford to be wrong repeatedly and
let reality do the selecting, which is exactly what Master Codex §50 describes.

This inverts the priority. **Experimentability, not searchability, should have been the
leading criterion all along.**

---

## Q1. Where can Factory observe actual purchases, prices, or paid demand?

| Source | Signal kind | What it shows | Access | Setup |
|---|---|---|---|---|
| **CodeCanyon / Envato** | Price × units sold | Per-item **sales counts** and prices — direct willingness to pay | Free API token | ~10 min |
| **USAspending.gov** | Settled transactions | Literal award records: buyer, vendor, dollar amount, description | Free, no auth | 0 |
| **Etsy Shop Stats** *(as a seller)* | Own funnel | Impressions → views → visits → **orders** | Seller account | ~15 min |
| **Fiverr seller analytics** | Own funnel | Impressions → clicks → **orders** | Seller account | ~15 min |
| **Meta Ad Library** | Advertiser spend | Who is *paying* to advertise what, right now | Free API, FB account | ~10 min |
| **Open Collective** | Money committed | Public ledgers of funds actually raised | Free GraphQL | 0 |
| **Kickstarter** | Money committed | Pledged totals per project | Public | 0 |
| **Steam / itch.io** | Price + proxy | Paid catalogues with real prices | Public | 0 |
| **Upwork / freelance boards** | Paid demand | Businesses posting budgets for named problems *right now* | Public listings | 0 |

## Q2. Which are legitimate and economical?

**Clean:** USAspending (open-government, published for programmatic use), Open Collective,
Envato API (official, free token), Meta Ad Library (official), and **first-party seller
analytics for Factory's own listings** — which are not scraping at all, but Factory's own data
about its own experiments.

**Not clean:** Etsy's API for market research (prohibited analytics use — established earlier
and unchanged), and scraping Fiverr/Upwork/Shopify listings.

**The important distinction:** Etsy is barred as an *evidence source* but entirely permitted as
a *selling surface*. Those are different uses, and conflating them was an earlier error.

## Q3. What do they show that adoption data does not?

Adoption data answers "did someone take a free thing?" Commercial data answers **"did someone
part with money, how much, and how often?"** — which is the only question the Master Codex
actually cares about.

Concretely, from CodeCanyon (retrieved): **2.3 million WordPress plugin sales, $70M+ gross**.
That is proof people pay for WordPress functionality — something `active_installs` could never
have told me, and which I had been asserting without evidence.

## Q4. Can Factory identify problems from commercial evidence rather than from an idea?

**Yes, and there is a triangulation available that neither source supports alone.**

The WordPress gate data (retrieved, `state/WP_GATE.md`) shows real demand for specific
small-business operational jobs:

| Operational job | WordPress installs of the leading solution |
|---|---|
| equipment rental availability + deposit | 50,000 |
| veterinary appointment reminders | 20,000 |
| trade show exhibitor floor plan | 20,000 |
| restaurant allergen labelling | 5,000 |
| QR ticket check-in | 4,000 |
| salon stylist commission tracking | 2,000 |
| dental patient intake (HIPAA) | 800 |
| gym class waitlist | 300 |
| **HOA dues tracking / brewery tap list / farm CSA / marina slips / school permission slips** | **0 — nobody has built it** |

**Those install counts prove the PROBLEM is real.** Separately, Etsy proves people **pay for
documents and templates** at 80–90% margins. The product hypothesis follows from combining
them, rather than from an idea I made up.

## Q5. Measurable Stranger Arrival Mechanism for a new entrant?

| Surface | Arrival | New-entrant reach |
|---|---|---|
| **Etsy search** | Marketplace search with buyer intent | Real, and **impressions are reported to the seller** |
| **Fiverr search** | Marketplace search | Real, impressions reported |
| WordPress.org directory | Directory search | **Reportedly does not give new plugins organic reach** |
| CodeCanyon | Marketplace search | **Entry effectively closed** |

## Q6. Can failure teach us anything?

**This is where Etsy and Fiverr decisively beat everything examined so far.**

Etsy Shop Stats report **impressions → views → visits → orders**. Fiverr reports
**impressions → clicks → orders**. Both expose the top-of-funnel stage that WordPress.org does
not publish at all.

That means a failed attempt can be *classified*: zero impressions is `NO_DISTRIBUTION`;
impressions without clicks is `WEAK_CLICK_THROUGH`; clicks without orders is
`WEAK_PURCHASE_CONVERSION`. `EXPERIMENTAL_PROTOCOL.md` §6 requires exactly this, and WordPress
could not deliver it.

## Q7. Meaningful evidence within 30–90 days?

**Etsy: plausibly yes.** Listings are live immediately with no review gate. Impressions
accumulate within days. Thirty listings can run concurrently rather than sequentially.

**Fiverr: probably**, though gig ranking needs ~30 days of impression data per the platform's
own guidance.

**WordPress: probably not** — ~5-day review, no organic reach for new plugins, 3–5 attempts
maximum.

## Q8. Multiple experiments without spam, capital, or owner labour?

**Etsy: yes, and this is the strongest single fact in this investigation.**

- **$0.20 per listing** → **30 attempts costs $6.00**, inside the $30 validation bucket
- Listings are a normal seller behaviour, not spam — shops routinely carry dozens
- **Instant digital download = fully automated fulfilment**, zero delivery labour
- Etsy processes payment, so **no merchant of record and no payout-threshold trap**

Compare WordPress: 3–5 attempts, each requiring a build, a review wait, and a support
obligation that grows with success.

## Q9. Smallest sellable offer per space

- **Etsy** — one instant-download document or spreadsheet solving one operational job for one
  trade, priced $4–12. Buildable and listable in a day.
- **Fiverr** — one productized micro-service with a generated deliverable, $10–25.
- **WordPress** — a free plugin plus a paid tier. Weeks of work, and the largest offer of the
  three, which is the wrong shape for a first test.

## Q10. One-time owner setup per space

| Space | Owner action | Minutes | Sensitive? | Unlocks |
|---|---|---|---|---|
| **Etsy seller** | Create shop, verify identity, set payout **at Etsy** | **~15–20** | Bank details — **entered at Etsy, never here** | Instant listing, full funnel analytics, payment processing, automated fulfilment |
| **Envato token** | Free account, generate API token → GitHub secret | **~10** | API token only | Per-item **sales counts** — real willingness-to-pay screening |
| **Meta Ad Library** | FB account, API token → GitHub secret | ~10 | Token only | Advertiser-spend evidence across any niche |
| Fiverr seller | Create account, verify | ~15 | Payout details at Fiverr | Instant gigs, funnel analytics |

---

## Paid evidence sources — assessed, not requested

Still the same picture, now with better framing:

| Source | Cost | What it buys | Verdict |
|---|---|---|---|
| **Envato API** | **$0** (free token) | Actual per-item sales counts | **Best value available — costs nothing but 10 minutes** |
| DataForSEO | $50 deposit | Google search volume | 100% of capital. Not requested |
| Keywords Everywhere | $10 | Search volume | No API → requires a human → fails autonomy |

**No capital request is justified yet.** The highest-value commercial evidence — Envato sales
counts — costs $0 and ten minutes. Requesting money before using the free source would be
premature.

---

## The strongest commercial hypotheses

### Hypothesis A — Operational documents for specific trades, sold on Etsy *(strongest)*

**What Factory might sell.** A single instant-download document or spreadsheet that does one
operational job for one specific kind of small business — for example an HOA dues tracking
workbook, a brewery tap-list sheet, a marina slip reservation log, or a salon stylist
commission calculator. Not generic printables; a working tool for a named trade.

**Who already spends money on this problem.** Two distinct groups, and the evidence for each
is different. Small businesses in these trades already pay to solve these jobs — proven by
WordPress install counts on the software versions (50,000 installs for equipment rental
scheduling; 20,000 for veterinary reminders; 2,000 for salon commission tracking). Separately,
Etsy buyers already pay for digital documents at scale, with 80–90% margins.

**What evidence proves it.** The install counts above are retrieved from
`api.wordpress.org` with timestamps. Etsy's fee structure and instant-download mechanics are
retrieved. **Notably, five of the twenty long-tail jobs returned ZERO matching plugins** — HOA
dues, brewery tap lists, farm CSA boxes, marina slips, school permission slips — meaning
nobody has built software for them, while the businesses plainly still do the job somehow.

**How Factory reaches a stranger.** Etsy search. A shop owner searching "HOA dues tracker
spreadsheet" sees the listing among results, and **Etsy reports the impression count back to
Factory**, so exposure is measured rather than assumed.

**How quickly it can be tested.** Days. Listings go live immediately with no review gate,
impressions accumulate within days, and thirty listings run concurrently for **$6.00 total**.

**What would have to be true for it to make money.** That Etsy buyers — a population skewing
toward crafts and consumer goods — also buy *business operational tools*. **That is the load-
bearing assumption and I have not verified it.** It is also precisely the sort of thing a
$0.20 experiment answers better than any amount of research.

---

### Hypothesis B — Productized micro-service on Fiverr

**What.** One narrow service with a generated deliverable — a formatted document, a data
extract, a converted file — priced $10–25.

**Who pays.** Fiverr buyers are already transacting; every order is a real purchase.

**Evidence.** Fiverr reports impressions, clicks and orders to sellers, so the funnel is
measurable. Payment is handled by the platform.

**Reach.** Fiverr search, with impressions reported.

**Speed.** Gigs list instantly; the platform's own guidance suggests ~30 days of impression
data before ranking stabilises.

**What must be true.** That the deliverable can be produced without a human in the loop, and
that buyer messages and revision requests do not become recurring owner labour. **The
messaging burden is the real risk** — it is `OPERATING` labour, the category that must stay
near zero, and it is why this ranks below Hypothesis A.

---

### Hypothesis C — Paid WordPress plugin *(retained, deprioritised)*

**Now with real willingness-to-pay evidence**, which is what was missing before: CodeCanyon
has processed **2.3 million WordPress plugin sales** grossing **$70M+**. People definitely pay
for WordPress functionality.

**But the same data kills it as a first move.** **97.6% of WordPress plugins on CodeCanyon
earn under $1,001/month** (4,743 of 4,861). Average annual sales are **$3,838**, and only
**7 items** exceed $10,000/month. Marketplace sales fell **70% between 2018 and 2023**, Envato
moved all authors to a **flat 50% cut** from July 2026, and new submissions are reported as
**hard-rejected within hours with no feedback**.

So: a real market, in decline, with worsening economics and a closed front door. Worth
revisiting if Factory ever has a validated product needing a distribution channel. Wrong place
to start.

---

## What I recommend

**Pursue Hypothesis A**, on the strength of experimentability rather than certainty. It is the
only candidate found where thirty real commercial experiments cost **$6.00**, fulfilment is
automatic, payment is handled, and **failure is diagnosable** because impressions are reported.

Its central assumption is unproven — and that is acceptable precisely because testing it is
cheap. The prior approach spent enormous effort screening in order to avoid expensive
experiments; this inverts that, which is what Master Codex §50 asks for.

**Before requesting any account, two things should happen first, both $0:**

1. **Get the Envato token** (10 minutes) and run real willingness-to-pay screening on actual
   sales counts. This is the highest-value free measurement available and it tests Hypothesis A
   and C simultaneously.
2. **Verify Etsy's current seller policies directly** — AI disclosure requirements, the August
   2026 "original design" rules, and listing limits for new shops. Retrieved evidence says AI-
   assisted digital products are permitted **with disclosure** under "Designed by a seller,"
   but that **12,000 listings were removed in one quarter** for getting disclosure wrong. An
   account suspension would end the Campaign, so this must be read at source rather than from
   summaries.

**Nothing has been spent, created, or committed to.**

# Canopy has failed as the KDP demand-research source

**Verdict: 2026-08-24.** Canopy cannot supply either half of what the research
needs. 49 of 90 metered requests were spent establishing this; **41 are
preserved**, and the spending workflow is disarmed.

## What was tried, and what it cost

| # | Attempt | Requests | Outcome |
| --- | --- | ---: | --- |
| 1 | Schema-confirmation probe | 4 | Passed — endpoints reachable, sales estimates real |
| 2 | Bestseller walk of Books subcategories | 36 | **Silent garbage.** Wrong data, zero errors |
| 3 | Diagnose the addressing | 3 | By-id wrong, by-url empty |
| 4 | Four alternative addressing forms | 4 | All four returned 0 products |
| 5 | Category-endpoint walk | **1** | Gate fired: `totalResults` = 0 |
| 6 | Keyword search screen | **1** | Gate fired: `totalResults` = 0 |
| | **Total** | **49** | 41 preserved |

The shape of that table is the point. The second attempt cost 36 requests
because nothing defined in advance what a correct answer looked like. Once the
gate existed, the same class of failure cost **one request, twice.**

## Why it failed

Two fields the research depended on are declared by the schema and not populated
by the service:

- **Subcategory bestseller rank.** `/api/amazon/bestsellers` accepts only the 41
  top-level slugs. Handed a subcategory id it does not error — it returns a
  browse listing. Six addressing forms were tried; five returned nothing.
- **`pageInfo.totalResults`.** Returns **0** on both the category and the search
  endpoint. Arts & Photography reported 0 total results while returning 20 real
  books and `totalPages: 400` — a number that is very likely Amazon's pagination
  ceiling rather than a count, and which one observation cannot distinguish.

## What Canopy *can* still do

Worth recording, because it is not nothing and the free tier renews monthly:

- **Sales estimates work.** `/api/amazon/product/sales` returned 1,155 weekly /
  5,000 monthly / 60,000 annual units for the #1 Books title. This is the only
  working **demand** measure found anywhere in this exercise. It is a vendor
  model, not observed sales.
- Top-level bestseller charts (41 categories) with real rank and rating counts.
- Real product records, category trees, and a `sponsored` flag.

What it lacks is the **competition** half: rank below the top level, and any
count of how many titles compete.

## Recommended next route — verified, not remembered

Every figure below was read from the vendor's own pages by a zero-cost
reconnaissance run, because recommending from memory is the same error this
whole sequence was about. Nothing has been purchased, signed up for, or
implemented.

### Recommendation: Rainforest API, Hobbyist tier — $23/month

> **SUPERSEDED 2026-08-24 — see `docs/RAINFOREST_CAPITAL_RECONCILIATION.md`.**
> The Hobbyist tier is **"$23/month Billed Annually"** — a **$276/year**
> commitment, 5.5× the entire authorized capital base, not the $23 this section
> implies. The billing term was not captured when this was written. A free trial
> exists and a $18/month entry point is advertised; both should be tried first.

The cheapest verified source that returns the exact thing Canopy could not.
Its own documentation for `type=bestsellers` shows a response containing:

```
"bestsellers": [ { "rank": 1, "position": 1, "title": "...",
                   "ratings_total": 42742, "price": {...} } ],
"bestsellers_info": { "current_category": {...}, "child_categories": [...] }
```

and states plainly: *"rank — the bestseller rank of the product; position — the
position of the product on the page (not the same as rank)."* It documents
support for "all types of amazon bestseller pages", and takes a `category_id`
from a companion Categories API or a plain URL — the addressing problem that
defeated Canopy is a documented, supported path here.

Pricing read from their page: **Hobbyist $23/month**; Starter $83/month billed
annually for 10,000 credits.

**Pair it with Canopy's still-working free tier for demand.** Rainforest supplies
competition (subcategory rank, field composition); Canopy's 100 free monthly
requests supply unit estimates on a shortlist. Combined cost: **$23/month.**

### Alternatives considered

| Source | Cost | Verified capability | Why not first |
| --- | --- | --- | --- |
| **Keepa** | **not verified** — pages are client-rendered and yielded no text | `best_sellers_query(category_id)`, `search_for_categories`, product finder, `stats_parsed.current.SALES`, price/rank **history** | Strictly better data — rank *history* beats any snapshot — but its price could not be confirmed, and an unverified price is exactly what this document refuses to assert |
| **DataForSEO** | $50 minimum payment, pay-as-you-go | Amazon merchant API exists with categories and rating distribution | BSR capability not confirmed by the recon; would need its own meaning test |
| **Publisher Rocket** | $199 one time | 19,000+ categories, Competition Analyzer, unlimited searches | **Disqualifying: it is a desktop GUI.** Every query costs owner minutes, which fails the autonomy thesis regardless of how good the data is |

**If the owner authorizes spend, the honest sequencing is: confirm Keepa's actual
price first.** Rank history would answer "does this sell *steadily*" — the
question every snapshot in this exercise has been unable to touch. If Keepa is
near Rainforest's $23, it is the better buy. If it is materially more, Rainforest
is the recommendation.

## Standing rule this produced

`EXPERIMENTAL_PROTOCOL.md` §19 — *Declared ≠ populated*. A provider schema
declaring a field is not evidence that the field is operationally populated. Any
external data field a research design materially depends on must pass a live,
minimal-cost meaning test before Factory allocates a batch of requests around it.

## Current state

- **41 Canopy requests preserved.** Rolling window: 49 of 90. Earliest spends age
  out 2026-09-24.
- **Spending workflow disarmed** — the push trigger is removed, not redirected.
  It is `workflow_dispatch` only, and a test fails if a push trigger returns.
- **No purchase made. No account created. No credential requested.**

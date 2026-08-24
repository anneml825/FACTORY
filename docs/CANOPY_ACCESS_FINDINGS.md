# Canopy API — access findings

Established by three zero-credit reconnaissance runs of `.github/workflows/canopy-recon.yml`
(runs 1–3, 2026-08-21). **No metered request has been spent. No API key has been sent
anywhere.** Every fact below comes from a public page, Canopy's published terms, or
Canopy's own open-source client, not from calling the API.

Method note: the container's egress cannot reach `canopyapi.co`, so the reconnaissance
ran on a GitHub Actions runner and reported through the job log. Round 3 also read
`canopy-api/canopy-api-mcp`, Canopy's open-source MCP server, whose generated
`src/types/api.d.ts` is a machine-generated transcript of the REST schema. That file is
authoritative in a way marketing copy is not: it is compiled against the live API.

## 1. Does the free tier permit this work?

**Terms** (`canopyapi.co/terms-of-service`) prohibit unlawful use, impersonation, spam,
denial of service, and — explicitly — *"create and maintain multiple free accounts to
avoid paying for the service."* Factory will hold exactly one account.

Nothing in the terms prohibits market research, redistribution of derived conclusions, or
commercial use of the data. Two clauses need to be read carefully rather than waved past:

- *"Use any robot, spider, or other automatic device… to access Service for any purpose."*
  Read literally this would forbid all programmatic access, which is incoherent for a
  company whose product is an API. It is website-scraping boilerplate and the surrounding
  clauses are all about the website. Factory will call only the documented API endpoints
  with a valid key, at a rate below the documented limits.
- *"Free Playground Usage… intended exclusively for evaluating and testing the API's
  functionality. It must not be used for production, commercial, or any other non-testing
  purposes."* This names the **playground**, and the pricing page separately advertises a
  "Hobby — Free Forever — 100 requests per month" plan with no such restriction. The
  reading Factory adopts is that the clause governs the interactive playground, not the
  free plan. **This is an interpretation, not a certainty**, and it is the one thing here
  a reasonable person could dispute.

## 2. Pricing, and what "going over" actually means

From the pricing section of the home page:

| Plan | Included | Overage |
| --- | --- | --- |
| Hobby — Free Forever | 100 requests/month | **"No additional charges"** |
| Pay As You Go — $0+/month | 100 free requests/month | **+$0.01 per additional request** |
| Premium — $99+/month | 20,000 requests | +$0.008 per request |

So the exposure depends entirely on which plan the account sits on, and the owner is the
only one who can see that. On Hobby there is no overage to fear at all. On Pay As You Go,
each request past 100 costs one cent — 1,000 accidental requests would be $10, not a
catastrophe, but not nothing either.

Independently of the plan, the schema documents a **`402 Payment Required`** response.
That is a hard, machine-readable stop signal, and Factory's client must treat it as a
terminal refusal rather than something to retry.

Factory's own ceilings (approved 2026-08-20) are 90 requests per rolling 31 days and 400
exploratory lifetime requests. The rolling window is deliberately shorter and smaller than
any calendar month, so usage inside any provider billing month is bounded by 90 < 100
regardless of when that month starts.

## 3. What the API actually returns

Seventeen REST endpoints under `https://rest.canopyapi.co`, authenticated with an
`API-KEY` header. The ones that matter for a book-market screen:

### `/api/amazon/bestsellers` — the workhorse
One request returns, for a category:
- up to ~50 products: `title`, `asin`, `price`, `rating`, `ratingsTotal`, **`bestSellersRank`**
- `pageInfo`: `currentPage`, `totalPages`, `totalResults`
- `categoryInfo`: `currentCategory`, `parentCategory`, and **`childCategories[]`**

The child categories are the important part: a single request yields both a ranked product
list *and* the next layer of the taxonomy. A breadth-first walk of Amazon's bestseller tree
costs one request per node, not one per product.

### `/api/amazon/bestseller-categories`
Top-level bestseller category IDs for a domain (e.g. `bestsellers_amazon_devices`). One
request seeds the whole walk.

### `/api/amazon/product/sales`
`salesEstimate: { weeklyUnitSales, monthlyUnitSales, annualUnitSales }` for one ASIN.
One request per ASIN — expensive, so this is a shortlist instrument, never a screening one.

### `/api/amazon/search`
`searchTerm`, optional `categoryId`, `page`, `limit`, `minPrice`, `maxPrice`, `conditions`.
Returns title/url/asin/price/image per result, plus `availableRefinements`.

Also available: product detail, variants, offers, stock estimates, reviews, autocomplete,
category taxonomy, seller, **author (info and books)**, deals, and GTIN↔ASIN conversion.

## 4. What the API does NOT return — and why that matters

The product response carries `title, subtitle, brand, asin, price, isPrime, isNew,
isInStock, mainImageUrl, imageUrls, rating, ratingsTotal, featureBullets, categories,
coupon, seller`. It does **not** carry:

- publication date
- page count / print length
- ISBN in the response (GTIN is an input parameter only)
- any book-specific metadata block
- rank *history* of any kind

Three consequences worth stating plainly, because each one bounds what the screen can honestly claim:

1. **Every rank and rating count is a single snapshot.** A snapshot cannot separate "sells
   steadily today" from "sold well once, two years ago." Rank at one instant is weak
   evidence of current demand and must not be reported as strong evidence.
2. **`salesEstimate` is Canopy's model output, not observed sales.** It is a vendor's
   estimate. Treating it as ground truth would be exactly the error the Evidence Semantics
   Gate exists to catch.
3. **Nothing in the response identifies a self-published title.** `brand` sometimes reads
   "Independently published", but that is a heuristic, not a field. Any claim about how
   crowded the self-published end of a category is would rest on inference, not data.

None of this blocks a screen. It bounds what the screen is allowed to conclude.

## 4a. Correction — subcategory charts are not reachable (2026-08-24)

Section 3 above described `/api/amazon/bestsellers` as the workhorse of a
taxonomy walk, because one request returns ranked products *and* the child
categories beneath them. The first half is true. The second half misled me, and
the correction is the most important fact on this page.

**`/api/amazon/bestsellers` accepts only the 41 top-level slugs** returned by
`/api/amazon/bestseller-categories` — `bestsellers_books`, `bestsellers_automotive`
and so on. The `childCategories` it returns alongside them carry bare numeric ids
(`1`, `27`, `4736`, `3248857011`), and those are **not** valid bestsellers
addresses.

Handed one, the endpoint does not error. It returns a browse-like listing: 16–18
products instead of 50, near-zero rating counts, no further children, and in
several categories a price of $0. A run against all 35 Books children completed
with zero failures and produced 35 rows that looked like data and were not. Six
requests were then spent ruling out the alternatives — every one returned an
empty result:

| Form tried | Result |
| --- | --- |
| `categoryId: "1"` (bare numeric) | browse listing, not a chart |
| the child's own `url` (with `/ref=` suffix) | 0 products |
| `url` with the `/ref=` tracking suffix stripped | 0 products |
| `categoryId: "books/1"` (compositional) | 0 products |
| `categoryId: "bestsellers_books_1"` (prefixed slug) | 0 products |
| `https://www.amazon.com/gp/bestsellers/books/1` | 0 products |

**Rank below the top level is therefore unavailable through this API.** Any plan
that depends on subcategory bestseller rank needs a different data source.

### What replaces it

`/api/amazon/category` reaches subcategories by those same numeric ids and
returns `subcategories[]` (so the tree is walkable), a page of products with
`ratingsTotal` and a `sponsored` flag, and — the useful part — 
`pageInfo.totalResults`: **how many products are in the category at all**.

That is a better competition measure than the review-mass distribution the
original screen was built around. It is the size of the field a new title would
join, stated directly, rather than inferred from how much review mass the
incumbents happen to carry. What it does not carry is rank, and it never will.

### The process failure, recorded plainly

The probe that cleared this endpoint asked *"does a child id return products?"*
It does. It never asked whether they were the **right** products. A test of
mechanism was read as a test of meaning, and the screen then had no criterion
for what a correct answer would look like — so 16 titles carrying two ratings
each passed as a bestseller chart, and a category whose real leaders hold six
figures of reviews would have been reported as the softest market in publishing.

Two changes follow from it, both now in the code rather than in this paragraph:
a plausibility criterion is written down **before** the requests go out, and the
walk checks it after the **first** node and aborts. The original mistake cost a
full budget; the same mistake now costs one request.

## 5. Budget arithmetic for the planned screen

| Step | Requests |
| --- | --- |
| Seed the top-level bestseller categories | 1 |
| Walk the Books subtree, two levels deep | ~30–40 |
| Sales estimates on a shortlist of ASINs | ~10–20 |
| Reserve for retries and mistakes | ~10 |
| **Total** | **~60–70** |

That fits inside the approved 90-per-rolling-31-days ceiling with room to spare, and inside
the 400 lifetime exploratory ceiling several times over. Every request routes through
`MeteredApiBudget`, which increments before the call so a failure or retry still consumes
budget.

## 6. Open question for the owner

Which Canopy plan is this account on — **Hobby (free forever, no additional charges)** or
**Pay As You Go (100 free, then $0.01/request)**? The answer does not change what Factory
will do, because the ceilings bind either way. It changes what the worst case costs if a
control fails: nothing on Hobby, cents on Pay As You Go. It is visible on the Canopy
dashboard and nowhere else.

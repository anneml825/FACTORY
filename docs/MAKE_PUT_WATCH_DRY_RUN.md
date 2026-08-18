# MAKE + PUT + WATCH — portfolio infrastructure dry run

**Date:** 2026-08-18  
**Status:** architecture dry run; no assets generated; no listings created; no credentials requested; **$0 spent**  
**Owner capital:** **$50.00 intact**

> **Phase B correction, 2026-08-18:** Managed Payments is documented as testable for eligible
> downloadable digital documents, but account eligibility still requires a real sandbox call.
> Stripe metadata propagation is not universal: Payment Link metadata reaches the Checkout
> Session, while PaymentIntent metadata must be set separately. Stripe also does not guarantee
> webhook ordering. The credential-free implementation and corrected boundary are recorded in
> `docs/PHASE_B_STRIPE_SANDBOX.md`.

## Decision

Factory can credibly solve the three reusable primitives without making the owner an uploader:

1. **MAKE:** semantic family design is paid once; deterministic generators and cheap, batched
   inference produce later assets. Mandatory Value QA stays in the loop, but frontier-model
   review moves primarily to the family and exception level rather than blindly reviewing every
   comma of every asset.
2. **PUT:** a Factory-owned generated catalog deploys to Cloudflare. Stripe products, prices,
   and Payment Links are created by API. Stripe Managed Payments supplies Merchant-of-Record
   checkout. A signed webhook unlocks an R2 download or a deterministic/personalized output.
3. **WATCH:** first-party events record exposure and engagement; Stripe metadata carries the
   immutable `experiment_id` into checkout; signed webhooks record payment, fulfillment,
   refund, and dispute events. The evaluator can then apply KEEP / ITERATE / KILL.

This architecture solves **hosting, checkout, fulfillment, and measurement**. It does **not**
solve stranger arrival. `ARRIVE` remains a separate adapter and the Stranger Arrival Test in
`EXPERIMENTAL_PROTOCOL.md` remains a hard live-launch gate.

The proposed primary path is:

```text
family specification
  -> asset manifest
  -> deterministic renderer/generator
  -> deterministic QA + model Value QA
  -> artifact in private R2
  -> generated catalog page on Cloudflare
  -> Stripe Product + Price + Payment Link (Managed Payments)
  -> qualified exposure / view / CTA events
  -> Stripe checkout
  -> signed webhook
  -> signed download or generated result
  -> revenue + cost + fulfillment ledger
  -> KEEP / ITERATE / KILL
```

## What is verified

- Current Claude API base prices are Opus 5 **$5/$25**, Sonnet 5 **$2/$10**, and
  Haiku 4.5 **$1/$5** per million input/output tokens. Sonnet's $2/$10 pricing is now
  permanent. The Anthropic Message Batches API discounts both input and output by **50%**.
  Sources: [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing),
  [batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing).
- Stripe explicitly supports API/CLI creation of large product and price catalogs and API
  creation of Payment Links. Sources: [products and prices](https://docs.stripe.com/products-prices/manage-prices),
  [Payment Links API](https://docs.stripe.com/payment-links/create).
- Stripe Managed Payments is a Merchant-of-Record flow for digital content/downloads and is
  available in Checkout and Payment Links. It handles indirect tax in more than 80 countries,
  subject to eligibility. Sources: [how Managed Payments works](https://docs.stripe.com/payments/managed-payments/how-it-works),
  [Managed Payments on Payment Links](https://docs.stripe.com/changelog/dahlia/2026-03-25/adds-support-for-managed-payments-on-payment-links).
- Stripe's US standard domestic-card fee is **2.9% + $0.30**; Managed Payments adds **3.5%**.
  Therefore the modeled domestic Managed Payments fee is **6.4% + $0.30**, before any
  international-card or currency-conversion premium. Source: [Stripe pricing](https://stripe.com/us/pricing).
- Stripe webhooks deliver real-time events to an HTTPS endpoint. Metadata propagates into
  checkout sessions and can support fulfillment and attribution. Sources:
  [webhooks](https://docs.stripe.com/webhooks), [metadata](https://docs.stripe.com/metadata),
  [metadata use cases](https://docs.stripe.com/metadata/use-cases).
- Cloudflare's free limits are sufficient for an initial catalog: static requests are free and
  unlimited, Workers include 100,000 requests/day, Analytics Engine includes 100,000 data
  points/day and 10,000 queries/day, D1 includes 5 million rows read/day and 100,000 written/day,
  and R2 includes 10 GB-month, one million Class A requests, ten million Class B requests, and
  free egress. Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
  [Analytics Engine pricing](https://developers.cloudflare.com/analytics/analytics-engine/pricing/),
  [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
  [R2 pricing](https://developers.cloudflare.com/r2/pricing/).
- Cloudflare Pages Free permits 20,000 files per site. Source:
  [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).
- Standard GitHub-hosted Actions runners are free for this public repository. Source:
  [GitHub Actions billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions).

## What remains unknown

- Whether this owner/account and every proposed product tax code will pass Stripe Managed
  Payments eligibility. Cheapest resolution: build the adapter against Stripe test mode, then
  perform account activation once the code is ready. Do not infer approval from documentation.
- Whether Stripe will accept a `pages.dev` site for business verification or require a custom
  domain. Domain price is therefore **UNKNOWN** and is not included in the $0 architecture.
- Real token counts, renderer CPU minutes, failure/retry rates, and Value-QA pass rates. All
  figures below are **engineering design estimates**, not observed bills. The first ten dry
  executions must replace them with metered values before scale authority is granted.
- Distribution volume for any first-batch hypothesis. No live experiment launches until the
  Stranger Arrival Test has a retrieved quantitative signal and a minimum meaningful
  denominator.

## Governing-document reconciliation

This proposal changes two provisional assumptions in the current repository architecture;
it does not silently override them:

- `INTEGRATIONS.md` correctly rejects **Stripe direct** because it is not a Merchant of
  Record. Stripe's newer **Managed Payments** product is a separate MoR offering and is the
  component proposed here. Eligibility and live behavior remain unverified.
- `ARCHITECTURE.md` currently avoids a commercial web host by using MoR-hosted offer pages.
  The owned Cloudflare catalog is a proposed ADR change because it adds first-party
  exposure/engagement measurement and a generated catalog while retaining $0 fixed burn.
  It must not become the implementation baseline until commercial-use terms, provider
  verification requirements, and an end-to-end test are recorded.

Until those changes are accepted and implemented, the repository's existing architecture
remains authoritative. This document is a researched design and dry run, not a report of a
working integration.

---

## 1. Asset-family cost model

### Cost convention

All model costs below assume the asynchronous Batch API because no human is waiting for these
portfolio jobs. Effective rates used:

| Model | Batch input / MTok | Batch output / MTok | Role |
|---|---:|---:|---|
| Haiku 4.5 | $0.50 | $2.50 | constrained instance generation |
| Sonnet 5 | $1.00 | $5.00 | family design, model QA, code generation |
| Opus 5 | $2.50 | $12.50 | family-level semantic/value audit and exceptions |

`asset #1` includes the one-time family establishment. `asset #10` and `asset #100` are the
incremental cost of those ordinal assets after the family machinery exists. They do not hide
the fixed cost by amortizing it backward.

### Inference path by family

| Family | Fixed semantic/generator work | Per-asset generation | Per-asset model QA | Fixed inference | Asset #1 | Asset #10 | Asset #100 |
|---|---|---|---|---:|---:|---:|---:|
| Short PDF / checklist / worksheet / reference pack | Sonnet 20k in / 8k out; Opus audit 16k in / 3k out | Haiku 3k in / 2k out | Sonnet 4k in / 0.6k out | $0.138 | **$0.151** | **$0.014** | **$0.014** |
| Guide / workbook / mini-book | Sonnet + Opus family pass | Haiku 6k in / 10k out | Sonnet 14k in / 1.2k out | $0.180 | **$0.228** | **$0.048** | **$0.048** |
| Spreadsheet / calculator | Sonnet 60k in / 30k out; Opus audit 30k in / 7k out | Haiku parameter/schema pass 4k in / 1.5k out | Sonnet 4k in / 0.4k out plus formula tests | $0.373 | **$0.384** | **$0.012** | **$0.012** |
| Structured data product / automated report | Sonnet 100k in / 40k out; Opus audit 40k in / 8k out | Deterministic transformer: 0 model tokens | Sampled Sonnet QA, amortized | $0.500 | **$0.501** | **~$0.001** | **~$0.001** |
| Generator / micro-tool / web utility | Sonnet 160k in / 60k out; Opus audit 70k in / 12k out | Haiku parameter/metadata pass 3k in / 1k out | Sonnet sampled regression/value pass | $0.785 | **$0.794** | **$0.009** | **$0.009** |
| KDP-length book | Sonnet + Opus outline/family audit | Haiku about 12k in / 30k out | Sonnet about 40k in / 2.5k out | $0.300 estimated fixed | **~$0.434** | **~$0.134** | **~$0.134** |
| Personalized output from an existing generator | Generator cost belongs to the family | Haiku 3k in / 2k out if semantic output is required | deterministic validation + sampled model QA | already established | **$0.013 realtime** or **$0.0065 batched** | same | same |

The KDP family is costed but is **not** selected for the first Campaign because no public KDP
publishing API has been verified. Cheap MAKE does not rescue linear PUT.

### Deterministic compute, packaging, maintenance, carrying

| Family | Deterministic production | Deterministic QA | Packaging | Maintenance | Carrying |
|---|---|---|---|---|---|
| Documents | HTML/Markdown -> PDF; form fields as needed | schema, link, page, repetition, claim, and render checks | PDF/ZIP + manifest | $0 for timeless content; current-fact updates **UNKNOWN** | $0 inside R2 free tier |
| Spreadsheets | schema -> XLSX/ODS/CSV formulas and formatting | formula invariants, boundary cases, recalculation, corruption checks | workbook + sample + instructions | event-driven regression when engine changes | $0 inside R2 free tier |
| Data/report | source -> normalized records -> report | schema, freshness, row-count, checksum, outlier, and golden-record tests | CSV/JSON/PDF/ZIP | source/API fee and schema drift **UNKNOWN** | $0 inside R2 free tier |
| Generator/tool | tested code + parameter pack -> deployed utility | unit, property, snapshot, accessibility, and security tests | static bundle or Worker route | dependency/security updates; measured, never assumed zero | static requests $0; dynamic use inside Worker free limits |
| Personalized output | validated customer input -> deterministic or semantic renderer | input validation, output schema, policy, and sample audit | signed result URL | per-family | storage/compute inside free limits initially |

At an assumed average artifact size of 2 MB, 1,000 downloadable assets occupy about 2 GB,
inside R2's 10 GB free tier. That size is an assumption and must be measured. Assets are never
committed to this public repository; Actions packages them and writes private artifacts to R2.

### Result

Model inference is still an important marginal cost for prose-heavy guides and books. It is
**not necessarily the dominant marginal cost** for spreadsheets, data products, deterministic
reports, and generators after the family is established. For those families, the next binding
cost is more likely distribution, platform transaction fees after a sale, or maintenance—not
generation.

The correct design objective is therefore:

> **pay for semantics once; make correctness executable; sample exceptions; never generate
> repeated structure token by token.**

---

## 2. PUT architectures and owner-labor curve

Owner-minute figures are implementation estimates. They are separated from provider approval
elapsed time. `Operating` means scheduled owner work. Exceptional KYC, disputes, security
incidents, or policy reviews remain **UNKNOWN**, are logged, and never get silently called zero.

| Architecture | Setup labor | Operating labor: 1 | 10 | 100 | 1,000 | Recurring owner maintenance | Decision |
|---|---:|---:|---:|---:|---:|---|---|
| **Cloudflare + Stripe Managed Payments** | **60–90 min once** | 0 | 0 | 0 | 0 | 0 scheduled; exceptional UNKNOWN | **Primary** |
| Cloudflare + Paddle | 75–120 min once; live approval can take days | 0 | 0 | 0 | 0 | 0 scheduled; exceptional UNKNOWN | Alternate MoR |
| Etsy Open API v3 | 45–90 min once; shop setup fee UNKNOWN | 0 | 0 | 0 | 0 | OAuth/policy exceptions UNKNOWN | Optional ARRIVE adapter |
| Shopify + digital-product fulfillment | 45–90 min once | 0 | 0 | 0 | 0 | low scheduled; app/platform changes | Reject pre-revenue: $29/mo |
| WooCommerce REST + hosting | 90–180 min once | 0 | 0 | 0 | 0 | **30–120 min/month estimated** security/plugin upkeep | Reject as first path |
| Manual marketplace upload at 5 min/asset | 0–30 min | **5** | **50** | **500** | **5,000** | grows linearly | **Architectural failure** |

### Capability separation

| Architecture | Hosting | Checkout | Fulfillment | Discovery | Analytics/WATCH | Marginal publication cost |
|---|---|---|---|---|---|---|
| Cloudflare + Stripe MP | yes | yes, API | Factory webhook + R2 | **no** | full first-party funnel + payment webhooks | $0 before sale |
| Cloudflare + Paddle | yes | yes, API | Factory webhook + R2 | **no** | first-party funnel + Paddle webhooks/reports | $0 before sale |
| Etsy API | Etsy | Etsy | Etsy instant download | native marketplace, magnitude unproven | paid-order webhook + financial API; impression/view API **unverified** | $0.20/listing plus unknown shop setup fee |
| Shopify | Shopify | Shopify | free digital-products app or custom webhook | **no** | orders/webhooks + store analytics | $29/month before apps |
| WooCommerce | self-hosted | gateway-dependent | native downloadable product | **no** | orders/reports/webhooks | hosting/domain UNKNOWN |

Paddle is technically credible: its API can create products/prices, it provides transaction
webhooks and reporting, and it is a Merchant of Record. Its headline fee is 5% + $0.50, but
Paddle says separate fees apply below $10 without publishing the amount. Its live account also
requires business, identity, and domain approval. Sources:
[Paddle digital products](https://developer.paddle.com/get-started/how-paddle-works/digital-products/),
[go-live checklist](https://developer.paddle.com/build/go-live-checklist/),
[pricing](https://www.paddle.com/paddle-101).

Etsy is no longer hypothetical PUT. The official API tutorial documents draft creation,
digital-file upload, listing-image upload, and activation with `state=active`; Etsy webhooks
include `order.paid`, and its payment/ledger APIs expose transaction details. Sources:
[listing tutorial](https://developer.etsy.com/documentation/tutorials/listings/),
[webhooks](https://developers.etsy.com/documentation/essentials/webhooks/),
[payments tutorial](https://developers.etsy.com/documentation/tutorials/payments/).
The $0.20 listing fee applies whether or not an item sells, and US processing is 3% + $0.25 in
addition to Etsy's 6.5% transaction fee. Sources: [fee basics](https://help.etsy.com/hc/en-us/articles/360035902374-Etsy-Fee-Basics),
[payment processing](https://help.etsy.com/hc/en-us/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy).

Etsy therefore solves PUT and contributes ARRIVE, but it cannot become the primary Campaign
until Factory verifies a programmatic exposure/visit denominator. Marketplace presence is not
a distribution result.

---

## 3. Reusable contracts

### Asset manifest

Every candidate is a typed record, not a folder of mystery files:

```ts
type AssetManifest = {
  experimentId: string;
  familyId: string;
  buyer: string;
  problem: string;
  promise: string;
  format: string;
  price: { amount: number; currency: string };
  artifactSha256: string;
  valueQa: { status: "PASS" | "FAIL"; evidence: string[] };
  arrival: { mechanism: string; evidenceGrade: string; minDenominator: number };
  attribution: { ownerTest: boolean; sourceTags: Record<string, string> };
};
```

### Three adapters

```ts
interface MakeAdapter {
  estimate(manifest: AssetManifest): CostReservation;
  build(manifest: AssetManifest): Promise<Artifact>;
  verify(artifact: Artifact): Promise<QaResult>;
}

interface PutAdapter {
  publish(manifest: AssetManifest, artifact: Artifact): Promise<Publication>;
  update(publication: Publication, patch: Patch): Promise<Publication>;
  deactivate(publication: Publication): Promise<void>;
}

interface WatchAdapter {
  ingest(event: FunnelEvent): Promise<void>;
  snapshot(experimentId: string): Promise<FunnelSnapshot>;
  evaluate(experimentId: string): Promise<"KEEP" | "ITERATE" | "KILL" | "INSUFFICIENT_SIGNAL">;
}
```

All mutating calls carry idempotency keys. Publication is a state machine, never a blind retry:

```text
CANDIDATE -> BUILT -> FUNCTIONAL_QA_PASS -> VALUE_QA_PASS -> STAGED
          -> PUBLISHED -> OBSERVING -> KEEP | ITERATE | KILL
```

### WATCH event spine

Each event contains `experiment_id`, `asset_id`, `occurred_at`, `source`, and a deduplication
key. Minimum event vocabulary:

```text
qualified_exposure
product_view
offer_interaction
checkout_start
purchase_completed
fulfillment_succeeded | fulfillment_failed
refund | dispute
cost_reserved | cost_settled
```

`experiment_id` is stored in the catalog URL/event, Stripe Product/Payment Link metadata, the
Checkout Session, the webhook ledger, and the fulfillment record. An owner/internal purchase is
flagged before it reaches commercial evidence. A sale without exposure data remains a plumbing
success, not an interpretable conversion result.

---

## 4. First-batch dry run: ten distinct commercial experiments

These are E0 portfolio experiments, not validated businesses. No individual market research
was performed. Prices are hypotheses. Every ARRIVAL item must pass the repository's existing
Stranger Arrival Test before a live launch.

All ten use the same PUT/WATCH spine: generated Cloudflare catalog page -> Stripe Managed
Payments link -> signed webhook -> R2 download or generator result -> first-party funnel and
transaction ledger. Global owner setup is 60–90 minutes once; owner action per asset is **0**.

| # | Buyer / problem | Proposed asset | Price hypothesis | Why someone might pay | Creation family | Generation | QA | Total first-family cost |
|---:|---|---|---:|---|---|---:|---:|---:|
| 1 | Independent restaurant; menu prices drift from ingredient cost | Recipe margin and repricing workbook | $19 | turns ingredient changes into target menu prices and flags margin loss | spreadsheet | $0.216 | $0.168 | **$0.384** |
| 2 | Small cleaning company; bids omit labor/overhead | Bid floor and crew-hour workbook | $29 | makes the minimum profitable quote explicit | spreadsheet | $0.216 | $0.168 | **$0.384** |
| 3 | Small fabricator; jobs are quoted without setup/scrap burden | Job-cost and quote workbook | $29 | exposes underpriced work before a quote is sent | spreadsheet | $0.216 | $0.168 | **$0.384** |
| 4 | Solo bookkeeper; month-end exceptions live across notes | Month-end exception and handoff pack | $12 | creates a repeatable client-by-client close trail | short document pack | $0.067 | $0.085 | **$0.151** |
| 5 | Small freight broker; lane quote margin is inconsistent | Lane margin and quote micro-tool | $19 | applies a consistent fuel/accessorial/margin calculation | micro-tool | $0.464 | $0.330 | **$0.794** |
| 6 | Small contractor; permit fees are assembled manually | Parameterized local permit-fee report | $9 | consolidates a defined jurisdiction's published fee schedule | structured data/report | $0.300 | $0.201 | **$0.501** |
| 7 | Renter/homeowner; insurance inventory is incomplete | Room-by-room inventory capture and export pack | $12 | converts phone capture into a claim-ready organized export | short document pack | $0.067 | $0.085 | **$0.151** |
| 8 | Niche collector; auction comps require repetitive cleanup | Auction-comparable normalization report | $9 | normalizes buyer premium, condition, currency, and unit | structured data/report | $0.300 | $0.201 | **$0.501** |
| 9 | Small caterer; event counts do not become prep quantities cleanly | Event prep and purchasing workbook | $19 | converts guest/menu inputs into prep and purchase quantities | guide/workbook | $0.108 | $0.120 | **$0.228** |
| 10 | Freelancer/studio; scope and exclusions are rebuilt each quote | Scope, assumptions, and change-order generator | $12 | produces a consistent editable scope from structured inputs | micro-tool | $0.464 | $0.330 | **$0.794** |

**Modeled first-batch inference: $4.27.** This is not spend authority and no request is made to
incur it.

### Delivery and measurement for the ten

| # | PUT | ARRIVAL hypothesis (E0 only) | Checkout / fulfillment | Measurement | First signal |
|---:|---|---|---|---|---|
| 1 | owned catalog | exact-query page around `restaurant recipe cost calculator`, with a useful free preview | Stripe MP; XLSX from signed R2 URL | exposure -> view -> preview use -> checkout -> purchase | events immediate; decision signal after preregistered denominator; calendar UNKNOWN |
| 2 | owned catalog | exact-query page around `cleaning business bid calculator` | Stripe MP; XLSX | same funnel | same |
| 3 | owned catalog | exact-query page around `manufacturing job cost calculator` | Stripe MP; XLSX | same funnel | same |
| 4 | owned catalog | exact-query page around `bookkeeper month end close checklist` | Stripe MP; PDF/ZIP | same funnel | same |
| 5 | owned catalog | exact-query page around `freight broker margin calculator` | Stripe MP; paid tool token | same funnel + tool completion | same |
| 6 | owned catalog | jurisdiction-specific query; only after a retrievable fee source and demand signal exist | Stripe MP; generated PDF/CSV | same funnel + report success/failure | same |
| 7 | owned catalog; Etsy mirror eligible only after WATCH gate | exact-query page around `home inventory insurance spreadsheet` | Stripe MP; ZIP/XLSX/PDF | same funnel | same |
| 8 | owned catalog | collection-specific query; source rights and freshness must pass before launch | Stripe MP; generated CSV/PDF | same funnel + report freshness | same |
| 9 | owned catalog | exact-query page around `catering prep sheet calculator` | Stripe MP; XLSX/PDF | same funnel | same |
| 10 | owned catalog | exact-query page around `freelance scope of work generator` | Stripe MP; DOCX/PDF | same funnel + generated-output success | same |

The cheapest way to resolve each ARRIVAL hypothesis is not another long model debate. It is one
batched retrieval pass that records a real quantitative signal and the actual result surface.
Candidates with no retrievable E1 signal remain E0 and do not launch.

---

## 5. Scale simulation

### Workload assumptions

- 10 assets: ten first-of-family experiments, using the exact dry-run mix above.
- 100 assets: 20 validated family engines, averaging five legitimate assets per family.
- 1,000 assets: 50 family engines, averaging twenty legitimate assets per family.
- Mix at 100/1,000: 20% short documents, 15% guides, 30% spreadsheets, 15% data/report,
  20% tools.
- Each listing is a distinct buyer/problem/offer with its own experiment ID. Parameter changes
  that do not produce meaningfully different utility are rejected as duplicates, not counted.
- Average downloadable artifact size: 2 MB.
- Deterministic build estimates: short 1, guide 2, spreadsheet 5, data 10, tool 15 standard
  runner-minutes. These are workload estimates; GitHub's standard public-repo runners currently
  cost $0.

| Scale | Generation inference | QA inference | Total inference | Avg / asset | Deterministic compute | Platform fixed cost | Platform creation cost | Owner setup | Owner operating | Independent experiments |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | $2.42 | $1.86 | **$4.27** | $0.427 | ~69 runner-min | $0 before optional domain | $0 | 60–90 min | 0 scheduled | 10 |
| 100 | $5.28 | $4.21 | **$9.50** | $0.095 | ~650 runner-min | $0 inside free limits | $0 | 60–90 min | 0 scheduled | 100 |
| 1,000 | $19.12 | $15.94 | **$35.05** | $0.035 | ~6,500 runner-min | $0 at 2 GB and stated traffic limits | $0 | 60–90 min | 0 scheduled | 1,000 |

These are creation totals, not a recommendation to create 1,000 assets. At the current $50
maximum-loss reserve, the 1,000-asset simulated MAKE cost technically fits but leaves too little
room for error, maintenance, or distribution. Capital Authority should release small tranches
only after measured costs and Value-QA pass rates replace estimates.

### Transaction marginal costs

At the documented domestic-card Managed Payments rate of 6.4% + $0.30:

| Sale price | Modeled Stripe fee | Contribution before Factory production/maintenance |
|---:|---:|---:|
| $9 | $0.88 | $8.12 |
| $19 | $1.52 | $17.48 |
| $29 | $2.16 | $26.84 |

International cards, currency conversion, refunds, and disputes can cost more. Observed
settlement values supersede this table.

### Recurring maintenance

Scheduled owner maintenance is designed to be zero. Factory itself performs:

- daily webhook/fulfillment reconciliation;
- weekly dead-link and artifact-integrity checks;
- dependency and source-freshness checks;
- monthly cost/revenue/owner-labor reporting;
- automatic deactivation when a policy, source, or quality gate fails.

Any human repair is logged as `MAINTENANCE_DEBUG`, not reclassified as setup. Exceptional owner
minutes remain UNKNOWN until observed.

### Anti-spam and anti-slop controls

Portfolio count is never a target. Publication requires:

1. distinct buyer, costly problem, promise, and measurable experiment;
2. portfolio-wide semantic duplicate check before expensive generation;
3. deterministic correctness tests and mandatory Value QA;
4. concrete comparison with relevant free and paid alternatives;
5. provenance/rights and factual-source manifest;
6. family and niche rate caps;
7. no superficial color/title/parameter variants counted as assets;
8. publish throttles and provider-policy gates;
9. automatic deactivation on fulfillment, accuracy, or policy failures.

### First bottleneck by scale

| Scale | Likely first failure |
|---:|---|
| 10 | live Stripe Managed Payments eligibility and end-to-end webhook fulfillment |
| 100 | **ARRIVE**: producing enough qualified exposure for independent experiments |
| 1,000 | distribution dilution, Value-QA throughput, policy/account concentration, and possibly Pages' 20,000-file limit—not raw generation |

The result is important: after the architecture is optimized, **PUT is not the expected scale
bottleneck and inference is not universally the marginal-cost bottleneck. ARRIVE is.**

---

## 6. Implementation sequence with no capital and no credentials

### Phase A — executable dry infrastructure, $0, no owner action

1. Add the typed asset manifest and experiment state machine.
2. Implement one deterministic short-document renderer and one spreadsheet renderer using
   fixture inputs; do not generate commercial content.
3. Implement a provider-neutral `PutAdapter` with a local fake provider.
4. Generate a static catalog from manifests and deploy only a noncommercial test catalog.
5. Implement the WATCH event spine in a local database/fixture path.
6. Replay signed synthetic checkout and refund events; prove attribution, fulfillment,
   idempotency, arm's-length exclusion, and KEEP/ITERATE/KILL classification.
7. Add cost-estimate versus actual-token fields so estimates cannot become facts.

### Phase B — live provider sandbox verification

Only after Phase A passes should Factory request one-time Stripe setup. The exact reusable
capability unlocked is:

- API creation/update/deactivation of products and prices;
- API creation of Managed Payments Payment Links;
- a hosted Merchant-of-Record checkout;
- transaction metadata carrying `experiment_id`;
- signed checkout/refund/dispute webhooks;
- real provider test-mode reconciliation without generating a commercial asset.

### Phase C — metered MAKE

Only after Phase B proves that an artifact can traverse STAGED -> PUBLISHED -> CHECKOUT ->
FULFILLED -> WATCHED should Factory request `ANTHROPIC_API_KEY`. At that moment the key unlocks
an executable capability rather than a file pile:

```text
authorized inference reservation
  -> metered family design / generation / Value QA
  -> automatic publication through a proven PUT adapter
  -> automatic fulfillment
  -> automatic observation and evaluation
```

---

## 7. API-key decision

**Do not provision `ANTHROPIC_API_KEY` yet.**

Publishing is no longer architecturally hypothetical, but it is not yet executable in this
repository and no live provider account has verified eligibility. The next highest-leverage
action is **Factory work, not owner work**: implement Phase A with fixture assets and synthetic
commerce events at $0.

After Phase A, the next highest-leverage **owner** action is Stripe account verification and
Managed Payments/API authorization—not Anthropic—because it converts the currently documented
PUT/WATCH path into a tested one. No commerce account is requested by this document; the request
should be made only when the adapter is ready to consume the credentials immediately.

After Phase B succeeds, `ANTHROPIC_API_KEY` becomes the next highest-leverage owner action. It
will then make the complete portfolio pipeline materially closer to launch: Factory will be
able to meter MAKE under Capital Authority and send passing assets directly into a proven
commercial deployment and observation path.

**Kill switch engaged. No capital spent. No asset generated. No listing created.**

# INTEGRATIONS.md

External services Factory may depend on, and the comparisons required before committing to
any of them.

**Status:** historical provider research below; Phase B Stripe sandbox proof passed in run
`32173279299`. Managed Payments Product/Price/Payment Link creation, two owner-test checkouts,
signed webhooks, fulfillment, refund, dispute recovery, full provider reconciliation, zero
commercial settlement, and deactivation were observed. Current Stripe-primary findings are in
`docs/PHASE_B_STRIPE_SANDBOX.md`. Every figure
below was retrieved from public sources on **2026-08-17** and carries the reliability caveat in
§5.

---

## 1. Payment processing and merchant of record

Required by Bootstrap Instructions v2.1 (*Commerce and tax setup*) and Master Codex §35
before implementation.

### Why merchant of record, not a bare processor

A **processor** (e.g. Stripe direct) moves money; the seller remains the merchant and carries
sales-tax/VAT registration, collection, and remittance obligations across jurisdictions.

A **merchant of record** is the legal seller. It calculates, collects, and remits sales tax,
VAT, and GST worldwide on the seller's behalf.

For Factory this is decisive, and not primarily for cost reasons: **the owner is the
constraint being optimized.** Sales-tax administration across jurisdictions is exactly the
kind of recurring, unautomatable owner labor that `CONSTITUTION.md` §2 exists to prevent. An
MoR converts a compliance obligation into a percentage fee. At Factory's scale, paying a few
points to eliminate a recurring owner task is the correct trade every time.

**An MoR does not eliminate income-tax or reporting obligations.** It handles *sales* tax.
The owner still owes income tax on earnings and still receives tax documents. `HUMAN_SETUP_REQUIRED:
TAX / ACCOUNTING` is raised on first arm's-length revenue regardless of provider.

### Comparison

| Provider | Headline fee | Payout minimum | MoR | Notes |
|---|---|---|---|---|
| **Gumroad** | 10% + $0.50, card fees separate | **$100** | Yes (full MoR since Jan 2025) | Individual sellers, no business entity required. Weekly Friday payouts, ACH for US. **Has a built-in discovery marketplace** — 30% fee on Discover-sourced sales |
| **Lemon Squeezy** | 5% + $0.50 | **$50** | Yes | Acquired by Stripe (2024). Fast approval, indie-friendly |
| **Paddle** | 5% + $0.50 | — | Yes | Deeper API, stronger subscription tooling. Aimed at scaling SaaS; heavier approval |
| **Polar** | 5% + $0.50 (Starter, 2026) | **$100** | Yes | Was 4% + $0.40; the cheaper economics now sit behind paid plans ($20/$100/$400 mo) — **a paid plan is disqualifying at $0 burn** |
| **Creem** | ~3.9% + $0.40 at volume | not found | Yes | Cheapest headline; newer, thinner track record. Individual-seller requirements **not established** |
| **Stripe (direct)** | ~2.9% + $0.30 | low | **No** | Cheapest to transact, but leaves all tax compliance with the owner. Rejected on owner-labor grounds |

### The payout-minimum problem

This is the most important finding in this document and it constrains Milestone 1 directly.

**Every surveyed MoR holds a payout minimum at or above the entire $50 capital base.** Under
`CONSTITUTION.md` §4, money below that threshold is not `AVAILABLE_SETTLED_CASH` — it is not
deployable, not reinvestable, and not capital recovery. Factory can be genuinely earning and
still have zero spendable cash.

Consequences that must not be papered over:

- Early revenue is **real evidence** (E3/E4) but **not usable capital**. These are different
  claims and the dashboard must show them separately.
- Self-funding (Milestone 9) cannot begin until cumulative net revenue clears a payout
  threshold — a materially higher bar than "first sale."
- **Lemon Squeezy's $50 minimum is half Gumroad's and Polar's $100.** At this scale that
  difference is not a rounding detail; it roughly halves the time to first deployable dollar.

### Provisional recommendation — not yet a decision

**Gumroad or Lemon Squeezy**, decided at Milestone 1 against these criteria:

- **Gumroad's advantage is distribution, not price.** Its Discover marketplace is a genuine,
  instrumentable Stranger Arrival Mechanism — a named surface with native discovery, which is
  exactly what `EXPERIMENTAL_PROTOCOL.md` §1 demands and what is otherwise very hard to obtain
  with $0 of ad budget. The 30% Discover fee buys distribution that Factory cannot buy
  elsewhere at this capital level.
- **Lemon Squeezy's advantage is economics and cash timing** — half the take rate, half the
  payout minimum.

The choice is therefore *not* "which is cheaper." It is **whether Factory needs to purchase
distribution through fees because it cannot purchase it with capital.** That question belongs
to the Campaign design in Milestone 2, informed by the Data Economics Probe, and is
deliberately left open here.

**Both require owner account creation and identity/payout setup.** Neither can be created by
Factory. See `OWNER_AUTONOMY.md`.

---

## 2. Quantitative evidence sources for E1

Candidates for the Data Economics Probe (`EXPERIMENTAL_PROTOCOL.md` §7). **None probed yet** —
the numbers below are advertised terms, not measured coverage.

| Source | Signal | Cost | Constraint |
|---|---|---|---|
| **Etsy Open API v3** | Listing counts, category/search structure | Free | 10,000 req/day, 10 QPS. Requires app registration + approval. **Listings ≠ sales** |
| **Google Trends** | Relative interest over time | Free | **Relative only, never absolute volume.** Unofficial access is fragile and terms-constrained |
| **Wikipedia Pageviews API** | Article pageviews | Free | Genuinely open, generous limits. Topic interest proxy — weak purchase intent |
| **eBay Browse API** | Listings, sold comps | Free tier | Requires developer account. Limits not yet confirmed |
| **Reddit API** | Post/comment volume | Free tier, limited | Terms restrict automated use; rate limits tightened in recent years |
| **DataForSEO** | Google Ads search volume, CPC, competition | $0.075 / 1,000 keywords | **$50 minimum deposit** — see below |
| **SerpApi** | SERP structure | ~100 free searches/mo | Free tier too thin for 30–50 attempts |
| **Keywords Everywhere** | Search volume | Credit packs | Cheap per credit; requires prepayment |

### The DataForSEO problem

DataForSEO is the best-fit source on paper: real Google Ads search volume, the exact signal
the Stranger Arrival Test wants, at $0.075 per 1,000 keywords — effectively free per query.

**Its $50 minimum deposit is the entire owner capital base.**

Spending 100% of capital on one data source, before a single experiment, would leave $0 for
validation and violate the protected-bucket principle (`FINANCIAL_CONTROLS.md`). This is a
textbook **CAPITAL CONSTRAINED** opportunity: attractive economics, inaccessible under current
authority.

It is recorded as capital-constrained, **not requested**. Factory must first demonstrate
through the Data Economics Probe whether free sources are sufficient. Asking for capital to
buy data before knowing whether free data works would be exactly the sort of unjustified
request `CONSTITUTION.md` §8 is meant to prevent.

---

## 3. Infrastructure

| Need | Choice | Cost | Constraint |
|---|---|---|---|
| Postgres | **Neon free tier** | $0 | 0.5 GB storage, 100 CU-hours/mo, scale-to-zero. Vastly more than Factory needs |
| Scheduler | **GitHub Actions** | $0 | 2,000 min/mo on Free for private repos. **Scheduled workflows disable after ~60 days of repo inactivity**; `schedule` is best-effort and can lag |
| Dashboard | **Markdown committed to repo** | $0 | Read on GitHub from any device. No hosting, no ToS question |
| Web hosting | **None at bootstrap; superseded by ADR-5** | $0 | Vercel Hobby is non-commercial-use; Pro is ~$20/mo = 40% of capital monthly. Phase E replaced the MoR-page assumption with a Factory-owned Cloudflare edge at $0 fixed burn — see `ARCHITECTURE.md` ADR-5 |
| Model inference | Provider-neutral adapter registry | $0 through Phase E | Per-task capability/quality/micro-cost routing; no provider or credential selected. Nonzero calls are mediated by Capital Authority against the **`discovery`** bucket, reserved per tranche and settled on the aggregate (`docs/PHASE_E_REMEDIATION.md`) |
| Edge hosting + object storage | **Cloudflare Workers + R2 + D1** (built, **not deployed**) | $0 within free limits | Supersedes "no web hosting at bootstrap": MoR pages give no first-party measurement and cannot deliver a file. Owner setup E1–E2 in `OWNER_AUTONOMY.md` |

**Target fixed monthly burn at bootstrap: $0.00.**

---

## 4. Credential handling

Bank credentials, card details, payout passwords, and sensitive financial credentials **never**
enter prompts, source code, GitHub, logs, or ordinary model context (`CONSTITUTION.md` §13).

The owner is **never** asked to paste them into an agent session. They are entered directly
into the provider's own interface. Factory receives, at most, scoped API keys via environment
secrets — and only where a scoped key is genuinely required.

---

## 5. Reliability of this document

Every figure here came from **web search summaries retrieved 2026-08-17**, not from provider
contracts, and not from accounts Factory holds. Fees, payout minimums, free-tier limits, and
plan structures change — Polar's 2026 repricing away from 4% + $0.40 is a live example within
this very table.

**Before any provider is integrated or any figure is relied on for a spend decision, it must
be re-verified against the provider's own current documentation.** Treat this document as a
shortlist and a set of hypotheses, not as settled fact.

Specifically unverified: Creem's individual-seller requirements and payout minimum; eBay
Browse API limits; Vercel's current ToS language; whether Etsy's API terms permit Factory's
intended use.

**Sources:** [Gumroad fees](https://checkoutpage.com/blog/gumroad-fees) ·
[Gumroad payouts](https://insightraider.com/en/answers/when-does-gumroad-pay-out) ·
[Lemon Squeezy getting paid](https://docs.lemonsqueezy.com/help/getting-started/getting-paid) ·
[Paddle vs Lemon Squeezy](https://fungies.io/paddle-vs-lemon-squeezy/) ·
[Polar review 2026](https://fungies.io/polar-sh-review-2026/) ·
[Polar pricing](https://polar.sh/resources/pricing) ·
[Polar vs Creem vs Dodo](https://fungies.io/polar-sh-vs-creem-vs-dodo-payments-mor-2026/) ·
[Etsy rate limits](https://developers.etsy.com/documentation/essentials/rate-limits/) ·
[DataForSEO pricing](https://dataforseo.com/update/pricing-update-in-dataforseo-apis) ·
[DataForSEO guide](https://nextgrowth.ai/dataforseo-api-guide/) ·
[Neon vs Supabase free tiers](https://agentdeals.dev/neon-vs-supabase)

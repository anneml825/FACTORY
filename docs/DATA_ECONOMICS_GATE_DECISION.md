# Data Economics Gate — Decision

**Date:** 2026-08-18 · **Milestone:** 0B · **Verdict: FAIL**
**Cash cost of reaching this conclusion: $0.00**

Governing rule: `EXPERIMENTAL_PROTOCOL.md` §7. Raw measurements:
[`state/DATA_ECONOMICS_PROBE.md`](../state/DATA_ECONOMICS_PROBE.md).

---

## The question

Can sufficiently reliable quantitative E1 evidence be obtained cheaply enough to support
the intended search process — roughly 300–500 candidates screened to yield 30–50 attempts?

## The answer

**No, not from free sources, for the candidates that matter.**

100 candidates, stratified HEAD/MID/LONG_TAIL, against six sources. 600 requests, $0.

### What the long tail looks like

Long-tail candidates are the real target — "pottery kiln firing log glaze results," "nail
salon client allergy record." A generic product for "budgeting" competes with everything; a
specific product for a specific job is where a small operation can win.

| Source | Intent | Long-tail coverage | Long-tail median |
|---|---|---|---|
| `wikipedia_pageviews` | WEAK | **0%** | — |
| `npm_weekly_downloads` | INDIRECT | **0%** | — |
| `stackexchange_questions` | INDIRECT | 100% | **0** |
| `hn_algolia_mentions` | INDIRECT | 100% | **0** |
| `wikipedia_search_hits` | WEAK | 100% | 5 |
| `etsy_active_listings` | **DIRECT** | **0%** | — (no credential) |

**Every free source returns either nothing or zero for long-tail candidates.** The single
exception is Wikipedia search hits, whose median of 5 counts *encyclopedia articles mentioning
the phrase* — commercially meaningless, and rated WEAK for exactly that reason.

**The only DIRECT commercial-intent source returned nothing at all**, because it requires a
credential nobody has registered.

### The false pass, and how it was caught

Run 1 **passed** on `stackexchange_questions` and `hn_algolia_mentions`, both at 100%
coverage. That pass was spurious and the pre-registered criteria were too weak to catch it.

A search endpoint always returns a count. Asking Stack Overflow about "nail salon client
allergy record" returns `0` — which is a successful response containing no information.
Coverage measured *whether a source answered*, not *whether the answer distinguished
anything*.

The tell was visible in run 1's own output: distinct-value ratios of **0.53** and **0.59**,
against **0.98** and **1.00** for the two sources measuring genuinely varying quantities.

Three criteria were added — disclosed as post-hoc, and strictly tightening:

| Criterion | Threshold | Catches |
|---|---|---|
| `maxZeroShare` | ≤ 0.4 | Metrics piling up at zero |
| `maxModeShare` | ≤ 0.4 | Metrics where most candidates share one value |
| `requireNonZeroLongTailMedian` | required | Sources that only separate head terms |

Under these, both sources fail: 43%/38% zeros, 43%/38% mode share, **long-tail median 0**.

The original thresholds were left untouched. Only the informativeness test was added, and it
made the gate harder rather than easier.

### Where free evidence *is* excellent

One genuinely positive finding, and it points somewhere specific.

| Source | Distinct | Zero share | HEAD median | MID median |
|---|---|---|---|---|
| `npm_weekly_downloads` | **1.00** | **0%** | 15,818,249 | 2,014,027 |
| `stackexchange_questions` | — | — | 2,523 | 5 |

For **developer-facing** candidates, free sources discriminate almost perfectly — npm returns
a distinct value for every single candidate it covers, with no zeros. The problem is coverage:
npm answered for only 19% of candidates, because only 19% were package-mapped.

The constraint is not that free data is bad. It is that **free data is excellent for
developer tools and absent for consumer niches.**

---

## Cheapest credible next options

Per the owner's instruction to quantify rather than weaken the E1 standard.

### A. Register free marketplace API credentials — $0 cash, ~30 min owner time

| Source | Cash | Signal | Why it matters |
|---|---|---|---|
| **Etsy Open API v3** | $0 | Active listing counts | The only **DIRECT** source. 10,000 req/day free |
| **eBay Browse API** | $0 | Listings + **sold comps** | Sold comps are the closest free proxy for actual demand |

**Cheapest by a wide margin: no cash, one owner action each, and both are permanent.**

Etsy also doubles as a candidate **Stranger Arrival Mechanism** (`DISTRIBUTION.md`) — a
marketplace with native discovery that Factory would not have to buy traffic for. Registering
it serves Milestone 0B and Milestone 2 at once.

**Unverified and blocking:** whether Etsy's and eBay's developer terms permit this use.
Their APIs are aimed at building apps for their own sellers and buyers; automated market
research may fall outside that. **This must be read before a Campaign depends on it** — a
source Factory is not permitted to operate autonomously fails the mission even if the data is
good (`EXPERIMENTAL_PROTOCOL.md` §7).

Also: listing counts measure **supply, not demand**. High counts may indicate a healthy
market or a saturated one, and the number alone cannot tell them apart. eBay sold comps are
the stronger signal for that reason.

### B. Bing Webmaster Tools keyword research — $0 cash, higher setup

Free with a verified site, and reports **exact** organic search volumes rather than the
bucketed ranges Google Keyword Planner gives without ad spend. Legacy SOAP/POX APIs retire
2026-08-31; the REST API is the target.

Requires a verified site, which Factory does not have — though a GitHub Pages site would cost
$0. More setup than option A and not yet validated end to end.

### C. Narrow the candidate universe to where free evidence works — $0, no owner action

Follow the data: restrict the search space to **developer-facing products**, where npm and
Stack Overflow already discriminate cleanly at zero cost.

This is a **material strategic fork**, not a technical tweak. It would mean Factory searches
for developer tools rather than consumer digital products — different customers, different
surfaces, different price points, different competition. It is genuinely cheaper and the
evidence pipeline is already proven to work. It is also a narrower market with more
sophisticated buyers and more free alternatives.

**Owner decision. I am not making it unilaterally.**

### D. Paid search-volume data — rejected, quantified

| Provider | Minimum | As % of capital | Verdict |
|---|---|---|---|
| **DataForSEO** | **$50** deposit | **100%** | Ideal signal, has an API. **Disqualified on capital** |
| **Keywords Everywhere** | **$10** / 100k credits | 20% | **Disqualified on autonomy** — no API or bulk export, so it cannot be automated |

Keywords Everywhere is affordable and would fit the $10 `DISCOVERY` bucket exactly. It fails
for a different reason: without programmatic access, using it means a human running lookups
by hand. That is precisely the recurring owner labor `CONSTITUTION.md` §2 forbids. Cheap data
that requires a human is not cheap.

**Neither is requested.** Options A and C cost nothing, and paid data should not be bought
before free data has been genuinely exhausted.

---

## Recommendation

**Pursue A now; hold C for the owner.**

Option A is free, is the cheapest credible path by a wide margin, unlocks the only DIRECT
commercial signal, and doubles as distribution groundwork. It costs ~30 minutes of owner time
once.

Option C is real and arguably stronger on evidence quality — but it changes what Factory is
looking for, and that is the owner's call.

**Until the gate passes, Factory does not proceed to high-volume autonomous screening**
(`EXPERIMENTAL_PROTOCOL.md` §7). The gate exists to prevent spending validation capital on a
search process that cannot see. It did its job here, for $0, before any capital was at risk.

## What did not happen

No capital was spent. No paid service was subscribed to. No E1 standard was weakened. No
model-estimated number was substituted for missing data — where evidence was absent, the
absence is recorded as the finding.

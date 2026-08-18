# Data Economics Probe — Results

**Run:** 2026-08-18T12:09:49.371Z  
**Candidates:** 100 (HEAD 34 / MID 33 / LONG_TAIL 33)  
**Marginal cash cost:** $0.00 — all sources free or credential-blocked

## Gate verdict: **FAIL**

No pipeline met the pre-registered criteria. Per `EXPERIMENTAL_PROTOCOL.md` §7, the
search strategy must be redesigned before material validation capital is spent.

## Pre-registered criteria

| Criterion | Threshold |
|---|---|
| Coverage | ≥ 60% |
| Cost per candidate | ≤ $0.02 |
| Candidates at $5 | ≥ 250 |
| Sustainable rate | ≥ 50/day |
| Distinct-value count | ≥ 15 |
| Stratum separation | ≥ 5x, ordered |
| Zero share | ≤ 0.4 |
| Mode share | ≤ 0.4 |
| Long-tail median > 0 | Required |
| WEAK signals carry the gate | No |

## Coverage

| Source | Intent | Coverage | HEAD | MID | LONG_TAIL | Median latency | Counts |
|---|---|---|---|---|---|---|---|
| `wordpress_active_installs` | INDIRECT | **100%** | 100% | 100% | 100% | 298ms | no |
| `wikipedia_pageviews` | WEAK | **57%** | 100% | 70% | 0% | 53ms | no |
| `wikipedia_search_hits` | WEAK | **100%** | 100% | 100% | 100% | 211ms | no |
| `stackexchange_questions` | INDIRECT | **100%** | 100% | 100% | 100% | 85ms | no |
| `hn_algolia_mentions` | INDIRECT | **100%** | 100% | 100% | 100% | 215ms | no |
| `npm_weekly_downloads` | INDIRECT | **19%** | 26% | 30% | 0% | 111ms | no |
| `etsy_active_listings` | DIRECT | **0%** | 0% | 0% | 0% | 0ms | no |

## Informativeness

Coverage says a source answered. This says whether the answer distinguishes anything.

| Source | Distinct | Zero share | Mode share | Median HEAD | MID | LONG_TAIL |
|---|---|---|---|---|---|---|
| `wordpress_active_installs` | 0.28 | 49% | 49% | 40000 | 1000 | 0 |
| `wikipedia_pageviews` | 0.98 | 2% | 4% | 7371 | 2733 | — |
| `wikipedia_search_hits` | 0.80 | 11% | 11% | 11495 | 660 | 5 |
| `stackexchange_questions` | 0.53 | 43% | 43% | 2523 | 5 | 0 |
| `hn_algolia_mentions` | 0.58 | 37% | 37% | 550 | 17 | 0 |
| `npm_weekly_downloads` | 1.00 | 0% | 5% | 15818249 | 2014027 | — |
| `etsy_active_listings` | 0.00 | 0% | 0% | — | — | — |

## Failure breakdown

Failures remain in the denominator. A source that cannot answer has low coverage.

| Source | Failures by reason |
|---|---|
| `wordpress_active_installs` | none |
| `wikipedia_pageviews` | NOT_FOUND=43 |
| `wikipedia_search_hits` | none |
| `stackexchange_questions` | none |
| `hn_algolia_mentions` | none |
| `npm_weekly_downloads` | NOT_FOUND=81 |
| `etsy_active_listings` | NO_CREDENTIAL=100 |

## Notes and limitations

### `wordpress_active_installs`

- **Signal:** active installs of the leading plugin matching the query
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** active_installs is bucketed, so values are coarse at high volume. Measures adoption of FREE plugins, not willingness to pay; the freemium upgrade is the unmeasured link. A high number can mean healthy demand or an already-solved problem.
- **Terms:** Open documented API, no key, no registration. Serves the plugin directory itself, so programmatic querying is its intended use — unlike marketplace APIs restricted to first-party app building.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** 49% of candidates return exactly zero — mostly-zero is not signal.
- **Note:** 49% of candidates share one value — the metric barely separates them.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.

### `wikipedia_pageviews`

- **Signal:** article pageviews, trailing 12 months
- **Purchase-intent proximity:** WEAK
- **Limitations:** Measures encyclopedic curiosity about a topic, not commercial demand or purchase intent. Only exists where a Wikipedia article exists, which excludes most long-tail commercial phrasings.
- **Terms:** Public API, attribution-friendly UA requested. No commercial-use restriction known.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** Stratum medians are not ordered head > mid > long-tail with the required separation.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.
- **Note:** WEAK purchase-intent proximity: may supplement but cannot carry the gate.

### `wikipedia_search_hits`

- **Signal:** search result count for the term
- **Purchase-intent proximity:** WEAK
- **Limitations:** Counts encyclopedia articles mentioning the term. Essentially unrelated to commercial demand. Included to quantify how weak it is, not because it is expected to qualify.
- **Terms:** Public API. Rate limits apply to anonymous use.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** WEAK purchase-intent proximity: may supplement but cannot carry the gate.

### `stackexchange_questions`

- **Signal:** matching question count across Stack Overflow
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** Developer-facing topics only. Consumer niches return near-zero regardless of real demand, so a zero here is uninformative rather than negative evidence.
- **Terms:** Anonymous quota is ~300 requests/day per IP. A registered key raises it to ~10,000/day. Anonymous quota is the binding constraint for repeated probing.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** 43% of candidates return exactly zero — mostly-zero is not signal.
- **Note:** 43% of candidates share one value — the metric barely separates them.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.

### `hn_algolia_mentions`

- **Signal:** story count mentioning the term
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** Audience is overwhelmingly technical. Consumer and craft niches are systematically under-represented, so low counts do not indicate low demand.
- **Terms:** Public API, no key. Documented soft limit ~10,000 requests/hour.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.

### `npm_weekly_downloads`

- **Signal:** weekly downloads for a related package
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** Only applies where a candidate maps to an npm package. Downloads include CI and mirrors, so absolute values overstate human users. Says nothing about willingness to pay.
- **Terms:** Public API, no key, generous limits.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.

### `etsy_active_listings`

- **Signal:** active listing count for a keyword
- **Purchase-intent proximity:** DIRECT
- **Limitations:** Listing counts measure SUPPLY, not demand. High counts may mean a healthy market or a saturated one; the number alone does not distinguish them.
- **Terms:** Requires a registered app and approved API key. Commercial/automation terms must be verified against Etsy developer policy BEFORE any Campaign depends on this.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** Only 0 distinct values — too little resolution to rank candidates.
- **Note:** Stratum medians are not ordered head > mid > long-tail with the required separation.
- **Note:** Long-tail median is zero: discriminates only among head terms, where opportunities are not.
- **Note:** Blocked on a credential requiring owner setup — coverage unmeasured, not zero.

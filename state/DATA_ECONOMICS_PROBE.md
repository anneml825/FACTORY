# Data Economics Probe — Results

**Run:** 2026-08-18T00:24:08.504Z  
**Candidates:** 100 (HEAD 34 / MID 33 / LONG_TAIL 33)  
**Marginal cash cost:** $0.00 — all sources free or credential-blocked

## Gate verdict: **PASS**

Qualifying pipeline(s): `stackexchange_questions`, `hn_algolia_mentions`

## Pre-registered criteria

| Criterion | Threshold |
|---|---|
| Coverage | ≥ 60% |
| Cost per candidate | ≤ $0.02 |
| Candidates at $5 | ≥ 250 |
| Sustainable rate | ≥ 50/day |
| Distinct-value ratio | ≥ 0.5 |
| WEAK signals carry the gate | No |

## Per-source results

| Source | Intent | Coverage | HEAD | MID | LONG_TAIL | Distinct | Median latency | Counts |
|---|---|---|---|---|---|---|---|---|
| `wikipedia_pageviews` | WEAK | **57%** | 100% | 70% | 0% | 0.98 | 27ms | no |
| `wikipedia_search_hits` | WEAK | **100%** | 100% | 100% | 100% | 0.80 | 235ms | no |
| `stackexchange_questions` | INDIRECT | **100%** | 100% | 100% | 100% | 0.53 | 101ms | YES |
| `hn_algolia_mentions` | INDIRECT | **100%** | 100% | 100% | 100% | 0.59 | 212ms | YES |
| `npm_weekly_downloads` | INDIRECT | **19%** | 26% | 30% | 0% | 1.00 | 22ms | no |
| `etsy_active_listings` | DIRECT | **0%** | 0% | 0% | 0% | 0.00 | 0ms | no |

## Failure breakdown

Failures remain in the denominator. A source that cannot answer has low coverage.

| Source | Failures by reason |
|---|---|
| `wikipedia_pageviews` | NOT_FOUND=43 |
| `wikipedia_search_hits` | none |
| `stackexchange_questions` | none |
| `hn_algolia_mentions` | none |
| `npm_weekly_downloads` | NOT_FOUND=81 |
| `etsy_active_listings` | NO_CREDENTIAL=100 |

## Notes and limitations

### `wikipedia_pageviews`

- **Signal:** article pageviews, trailing 12 months
- **Purchase-intent proximity:** WEAK
- **Limitations:** Measures encyclopedic curiosity about a topic, not commercial demand or purchase intent. Only exists where a Wikipedia article exists, which excludes most long-tail commercial phrasings.
- **Terms:** Public API, attribution-friendly UA requested. No commercial-use restriction known.
- **Observed rate:** No 429 at 4/s over 100 requests.
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

### `hn_algolia_mentions`

- **Signal:** story count mentioning the term
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** Audience is overwhelmingly technical. Consumer and craft niches are systematically under-represented, so low counts do not indicate low demand.
- **Terms:** Public API, no key. Documented soft limit ~10,000 requests/hour.
- **Observed rate:** No 429 at 4/s over 100 requests.

### `npm_weekly_downloads`

- **Signal:** weekly downloads for a related package
- **Purchase-intent proximity:** INDIRECT
- **Limitations:** Only applies where a candidate maps to an npm package. Downloads include CI and mirrors, so absolute values overstate human users. Says nothing about willingness to pay.
- **Terms:** Public API, no key, generous limits.
- **Observed rate:** No 429 at 4/s over 100 requests.

### `etsy_active_listings`

- **Signal:** active listing count for a keyword
- **Purchase-intent proximity:** DIRECT
- **Limitations:** Listing counts measure SUPPLY, not demand. High counts may mean a healthy market or a saturated one; the number alone does not distinguish them.
- **Terms:** Requires a registered app and approved API key. Commercial/automation terms must be verified against Etsy developer policy BEFORE any Campaign depends on this.
- **Observed rate:** No 429 at 4/s over 100 requests.
- **Note:** Blocked on a credential requiring owner setup — coverage unmeasured, not zero.

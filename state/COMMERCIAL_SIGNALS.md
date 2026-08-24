# Commercial Signal Probe

**Retrieved:** 2026-08-24T20:44:15.724Z · **Terms:** 8 · **Cost:** $0.00

Targets sources where **money changing hands is observable**, unlike the adoption
metrics (installs, downloads, stars) that dominated earlier reconnaissance.

| Source | Signal kind | Coverage | Non-zero | Distinct | Median | Max | Auth | Setup |
|---|---|---|---|---|---|---|---|---|
| `usaspending_awards` | ACTUAL_TRANSACTIONS | 100% | 88% | 1.00 | 12602867.95 | 71624148.01 | no | 0m |
| `opencollective_money` | MONEY_COMMITTED | 100% | 25% | 0.38 | 0 | 7160 | no | 0m |
| `steam_store` | PRICE_PLUS_VOLUME | 100% | 0% | 0.13 | 0 | 0 | no | 0m |
| `itch_io` | PRICE_PLUS_VOLUME | 100% | 100% | 0.50 | 16 | 36 | no | 0m |
| `envato_codecanyon` | PRICE_PLUS_VOLUME | 0% | 0% | 0.00 | — | — | **yes** | 10m |

## What each proves

### `usaspending_awards` — USAspending.gov federal award transactions

- **Signal kind:** ACTUAL_TRANSACTIONS
- **Proves:** Literal purchase records: a buyer paid a named vendor a specific dollar amount to solve a named problem. Not a proxy for demand — it IS demand, settled.
- **Terms:** Public open-government API, explicitly published for programmatic use.
- **HTTP:** {"200":8}
- **Sample:** 10 awards returned
- **Values:** [5074822.58,6688147.82,10411504.96,16112355.72,12602867.95,71624148.01,19949984.32,0]

### `opencollective_money` — Open Collective — money actually raised by projects

- **Signal kind:** MONEY_COMMITTED
- **Proves:** Real money moved to solve a problem, with public ledgers. Shows what people and companies voluntarily fund.
- **Terms:** Public GraphQL API, no key for public data.
- **HTTP:** {"200":8}
- **Sample:** 10 collectives
- **Values:** [0,0,2239,0,0,0,7160,0]

### `steam_store` — Steam store — paid products with prices

- **Signal kind:** PRICE_PLUS_VOLUME
- **Proves:** Paid catalogue with real prices; reviews act as a purchase proxy.
- **Terms:** Public storefront search endpoint used by the store itself.
- **HTTP:** {"200":8}
- **Values:** [0,0,0,0,0,0,0,0]

### `itch_io` — itch.io — indie paid digital goods

- **Signal kind:** PRICE_PLUS_VOLUME
- **Proves:** Instant listing, paid digital products, no gatekeeper review.
- **Terms:** Public search page; JSON availability unverified — measured here.
- **HTTP:** {"200":8}
- **Values:** [6,8,36,6,16,16,16,8]

### `envato_codecanyon` — Envato / CodeCanyon — per-item SALES COUNTS and prices

- **Signal kind:** PRICE_PLUS_VOLUME
- **Proves:** The highest-value missing measurement: actual units sold x actual price, per niche product. Direct willingness-to-pay at item level.
- **Terms:** Official API with documented endpoints; token is free.
- **Credential:** Envato API personal token — free account, entered as a GitHub secret. (~10 min owner setup)
- **HTTP:** {"401":8}
- **Values:** [null,null,null,null,null,null,null,null]

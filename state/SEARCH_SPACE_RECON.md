# Search-Space Reconnaissance

**Run:** 2026-08-24T20:48:08.975Z  
**Spaces probed:** 10 · **Probe terms:** 12  
**Marginal cash cost:** $0.00

Answers "which opportunity spaces can Factory screen at all?" — the question that
should precede choosing what to sell.

## Evidence availability

| Space | Reachable | Auth | Coverage | Distinct | Zero share | Median signal | Latency |
|---|---|---|---|---|---|---|---|
| `shopify_app_store` | yes | none | **100%** | 0.08 | 0% | 24 | 154ms |
| `firefox_addons` | yes | none | **100%** | 0.92 | 0% | 18067 | 301ms |
| `wordpress_plugins` | yes | none | **100%** | 0.50 | 0% | 5000000 | 315ms |
| `vscode_extensions` | yes | none | **100%** | 1.00 | 0% | 19675 | 659ms |
| `atlassian_marketplace` | yes | none | **100%** | 1.00 | 0% | 1077 | 148ms |
| `pypi_packages` | yes | none | **33%** | 1.00 | 0% | 454 | 47ms |
| `obsidian_plugins` | yes | none | **100%** | 1.00 | 0% | 7433664 | 100ms |
| `dockerhub_images` | yes | none | **100%** | 1.00 | 0% | 1413230 | 125ms |
| `crates_rust` | yes | none | **100%** | 1.00 | 0% | 49478 | 209ms |
| `homeassistant_hacs` | yes | **required** | **75%** | 0.89 | 11% | 10 | 278ms |

## Structure

Evidence alone is not a search space. Monetization norm is assessed by research, not HTTP.

| Space | Signal | Arrival mechanism | Monetization norm |
|---|---|---|---|
| `shopify_app_store` | matching app listings and their review counts | App Store search, and in-admin app discovery inside every Shopify store | **PAID_NORMAL** |
| `firefox_addons` | average daily users per add-on — a REAL usage number, rare among public catalogues | addons.mozilla.org search | **MOSTLY_FREE** |
| `wordpress_plugins` | active installs + total downloads + rating for matching plugins | WordPress.org plugin directory search, and the in-admin plugin search inside every WordPress site | **FREEMIUM_NORMAL** |
| `vscode_extensions` | install count for matching extensions | Marketplace search, and the in-editor extension search inside every VS Code install | **MOSTLY_FREE** |
| `atlassian_marketplace` | matching paid app listings | Marketplace search, plus in-product app discovery inside Jira/Confluence | **PAID_NORMAL** |
| `pypi_packages` | recent download counts | PyPI search and Google queries for library problems | **MOSTLY_FREE** |
| `obsidian_plugins` | per-plugin download counts (single public JSON, whole catalogue) | In-app community plugin browser, searched by every Obsidian user | **MOSTLY_FREE** |
| `dockerhub_images` | pull counts for matching images | Docker Hub search | **MOSTLY_FREE** |
| `crates_rust` | crate download counts | crates.io search | **MOSTLY_FREE** |
| `homeassistant_hacs` | GitHub stars on integration repos as a usage proxy | HACS in-app browser inside Home Assistant installs | **MOSTLY_FREE** |

## Per-space detail

### `shopify_app_store` — Shopify App Store

- **Note:** Strongest monetization of any candidate: Shopify Billing API charges merchants directly, Factory keeps 100% of the first $1M, and there is NO merchant of record to set up and NO payout threshold to clear. Buyers are businesses with revenue. Costs $19 one-time to register. Open question probed here: is there ANY free quantitative signal to screen with?
- **HTTP statuses:** {"200":12}
- **Values:** backup=24, invoice=24, booking calendar=24, seo=24, inventory=24, form builder=24, analytics dashboard=24, image optimization=24, membership=24, csv import=24, time tracking=24, pdf export=24

### `firefox_addons` — Firefox Add-ons (AMO)

- **Note:** Included as an EVIDENCE CONTROL, not a candidate. AMO publishes true daily-user counts, so it shows what a high-quality catalogue signal looks like. Monetization is near zero, so it cannot be selected — it exists here to calibrate the others.
- **HTTP statuses:** {"200":12}
- **Values:** backup=6680, invoice=212075, booking calendar=36452, seo=12410, inventory=8814, form builder=18067, analytics dashboard=47, image optimization=65814, membership=6758, csv import=78872, time tracking=18067, pdf export=4044

### `wordpress_plugins` — WordPress.org plugin directory

- **Note:** Open documented API, no key. Freemium (free plugin in directory, paid upgrade off-site) is the established norm, so evidence and monetization may both be available.
- **HTTP statuses:** {"200":12}
- **Values:** backup=5000000, invoice=300000, booking calendar=70000, seo=10000000, inventory=7000000, form builder=5000000, analytics dashboard=5000000, image optimization=7000000, membership=300000, csv import=100000, time tracking=10000000, pdf export=300000

### `vscode_extensions` — VS Code Marketplace

- **Note:** Install counts are real usage. Paid extensions are rare, which is a monetization problem.
- **HTTP statuses:** {"200":12}
- **Values:** backup=19625, invoice=76, booking calendar=44040, seo=4498, inventory=135, form builder=71041683, analytics dashboard=97488, image optimization=4215548, membership=3189, csv import=23295677, time tracking=19675, pdf export=2709

### `atlassian_marketplace` — Atlassian Marketplace

- **Note:** Paid apps are the NORM here, not the exception — the strongest monetization profile of any candidate. Business buyers with budgets. Question is whether Factory can build and publish to it autonomously.
- **HTTP statuses:** {"200":12}
- **Values:** backup=104, invoice=100, booking calendar=512, seo=372, inventory=56, form builder=1348, analytics dashboard=1400, image optimization=1077, membership=46, csv import=1569, time tracking=3153, pdf export=1460

### `pypi_packages` — PyPI / Python ecosystem

- **Note:** Free API. Same monetization weakness as npm — paying for a Python library is unusual.
- **HTTP statuses:** {"200":4,"404":8}
- **First failure:** HTTP 404
- **Values:** backup=185, invoice=454, booking calendar=null, seo=20, inventory=491, form builder=null, analytics dashboard=null, image optimization=null, membership=null, csv import=null, time tracking=null, pdf export=null

### `obsidian_plugins` — Obsidian community plugins

- **Note:** Entire catalogue with download counts in one public file — near-zero screening cost. Small audience and a strong free norm.
- **HTTP statuses:** {"200":1}
- **Values:** backup=7433664

### `dockerhub_images` — Docker Hub

- **Note:** Pull counts are real usage but heavily inflated by CI. Monetization is very weak.
- **HTTP statuses:** {"200":12}
- **Values:** backup=3092592, invoice=630132, booking calendar=459546, seo=2564, inventory=1280473, form builder=14713389, analytics dashboard=23726849, image optimization=897340538, membership=120341, csv import=1413230, time tracking=898467, pdf export=98209801

### `crates_rust` — crates.io / Rust ecosystem

- **Note:** Confirmed reachable. Strong free norm; paid Rust crates are essentially nonexistent.
- **HTTP statuses:** {"200":12}
- **Values:** backup=88084, invoice=1386, booking calendar=3432, seo=578, inventory=117848151, form builder=2624120, analytics dashboard=20354, image optimization=1828383, membership=805393, csv import=18865, time tracking=49478, pdf export=2659

### `homeassistant_hacs` — Home Assistant custom integrations (HACS)

- **Note:** Prosumer audience that already spends money on hardware, which is unusual among the code-adjacent spaces. Stars are a weak usage proxy.
- **HTTP statuses:** {"200":10,"403":2}
- **First failure:** HTTP 403 — authentication or policy required
- **Values:** backup=3561, invoice=854, booking calendar=2, seo=10, inventory=45, form builder=null, analytics dashboard=251, image optimization=0, membership=1, csv import=1, time tracking=null, pdf export=null

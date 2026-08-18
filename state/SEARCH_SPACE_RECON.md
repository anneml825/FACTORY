# Search-Space Reconnaissance

**Run:** 2026-08-18T12:06:19.455Z  
**Spaces probed:** 10 · **Probe terms:** 12  
**Marginal cash cost:** $0.00

Answers "which opportunity spaces can Factory screen at all?" — the question that
should precede choosing what to sell.

## Evidence availability

| Space | Reachable | Auth | Coverage | Distinct | Zero share | Median signal | Latency |
|---|---|---|---|---|---|---|---|
| `shopify_app_store` | yes | none | **100%** | 0.08 | 0% | 24 | 154ms |
| `firefox_addons` | yes | none | **100%** | 0.92 | 0% | 17797 | 253ms |
| `wordpress_plugins` | yes | none | **100%** | 0.58 | 0% | 5000000 | 301ms |
| `vscode_extensions` | yes | none | **100%** | 1.00 | 0% | 19629 | 799ms |
| `atlassian_marketplace` | yes | none | **100%** | 1.00 | 0% | 1072 | 144ms |
| `pypi_packages` | yes | none | **25%** | 1.00 | 0% | 164 | 30ms |
| `obsidian_plugins` | yes | none | **100%** | 1.00 | 0% | 7294943 | 316ms |
| `dockerhub_images` | yes | none | **100%** | 1.00 | 0% | 1411650 | 107ms |
| `crates_rust` | yes | none | **100%** | 1.00 | 0% | 43965 | 227ms |
| `homeassistant_hacs` | **no** | **required** | **0%** | 0.00 | 0% | — | 19ms |

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
- **Values:** backup=6663, invoice=210664, booking calendar=36104, seo=12339, inventory=8809, form builder=17797, analytics dashboard=46, image optimization=64205, membership=6722, csv import=78289, time tracking=17797, pdf export=3986

### `wordpress_plugins` — WordPress.org plugin directory

- **Note:** Open documented API, no key. Freemium (free plugin in directory, paid upgrade off-site) is the established norm, so evidence and monetization may both be available.
- **HTTP statuses:** {"200":12}
- **Values:** backup=3000000, invoice=300000, booking calendar=70000, seo=10000000, inventory=7000000, form builder=5000000, analytics dashboard=5000000, image optimization=7000000, membership=300000, csv import=100000, time tracking=10000000, pdf export=300000

### `vscode_extensions` — VS Code Marketplace

- **Note:** Install counts are real usage. Paid extensions are rare, which is a monetization problem.
- **HTTP statuses:** {"200":12}
- **Values:** backup=19603, invoice=73, booking calendar=44008, seo=4495, inventory=125, form builder=70883575, analytics dashboard=97355, image optimization=4207161, membership=3189, csv import=23153912, time tracking=19629, pdf export=2707

### `atlassian_marketplace` — Atlassian Marketplace

- **Note:** Paid apps are the NORM here, not the exception — the strongest monetization profile of any candidate. Business buyers with budgets. Question is whether Factory can build and publish to it autonomously.
- **HTTP statuses:** {"200":12}
- **Values:** backup=101, invoice=99, booking calendar=510, seo=365, inventory=54, form builder=1340, analytics dashboard=1394, image optimization=1072, membership=45, csv import=1560, time tracking=3142, pdf export=1451

### `pypi_packages` — PyPI / Python ecosystem

- **Note:** Free API. Same monetization weakness as npm — paying for a Python library is unusual.
- **HTTP statuses:** {"200":3,"404":4,"429":5}
- **First failure:** HTTP 404
- **Values:** backup=164, invoice=456, booking calendar=null, seo=31, inventory=null, form builder=null, analytics dashboard=null, image optimization=null, membership=null, csv import=null, time tracking=null, pdf export=null

### `obsidian_plugins` — Obsidian community plugins

- **Note:** Entire catalogue with download counts in one public file — near-zero screening cost. Small audience and a strong free norm.
- **HTTP statuses:** {"200":1}
- **Values:** backup=7294943

### `dockerhub_images` — Docker Hub

- **Note:** Pull counts are real usage but heavily inflated by CI. Monetization is very weak.
- **HTTP statuses:** {"200":12}
- **Values:** backup=3092506, invoice=257041, booking calendar=459455, seo=2560, inventory=1276795, form builder=14709212, analytics dashboard=23569395, image optimization=897087408, membership=118633, csv import=1411650, time tracking=883838, pdf export=97904478

### `crates_rust` — crates.io / Rust ecosystem

- **Note:** Confirmed reachable. Strong free norm; paid Rust crates are essentially nonexistent.
- **HTTP statuses:** {"200":12}
- **Values:** backup=86686, invoice=1316, booking calendar=3183, seo=578, inventory=115386578, form builder=2577969, analytics dashboard=20353, image optimization=61706, membership=799557, csv import=18864, time tracking=43965, pdf export=2596

### `homeassistant_hacs` — Home Assistant custom integrations (HACS)

- **Note:** Prosumer audience that already spends money on hardware, which is unusual among the code-adjacent spaces. Stars are a weak usage proxy.
- **HTTP statuses:** {"403":12}
- **First failure:** HTTP 403 — authentication or policy required
- **Values:** backup=null, invoice=null, booking calendar=null, seo=null, inventory=null, form builder=null, analytics dashboard=null, image optimization=null, membership=null, csv import=null, time tracking=null, pdf export=null

# Search-Space Reconnaissance

**Run:** 2026-08-18T00:57:19.721Z  
**Spaces probed:** 8 · **Probe terms:** 12  
**Marginal cash cost:** $0.00

Answers "which opportunity spaces can Factory screen at all?" — the question that
should precede choosing what to sell.

## Evidence availability

| Space | Reachable | Auth | Coverage | Distinct | Zero share | Median signal | Latency |
|---|---|---|---|---|---|---|---|
| `wordpress_plugins` | yes | none | **100%** | 0.58 | 0% | 5000000 | 12ms |
| `vscode_extensions` | yes | none | **100%** | 1.00 | 0% | 19625 | 643ms |
| `atlassian_marketplace` | yes | none | **100%** | 1.00 | 0% | 1072 | 108ms |
| `pypi_packages` | yes | none | **17%** | 1.00 | 0% | 458 | 23ms |
| `obsidian_plugins` | yes | none | **100%** | 1.00 | 0% | 7294943 | 27ms |
| `dockerhub_images` | yes | none | **100%** | 1.00 | 0% | 1411650 | 77ms |
| `crates_rust` | yes | none | **100%** | 1.00 | 0% | 43733 | 74ms |
| `homeassistant_hacs` | yes | **required** | **75%** | 0.89 | 11% | 10 | 249ms |

## Structure

Evidence alone is not a search space. Monetization norm is assessed by research, not HTTP.

| Space | Signal | Arrival mechanism | Monetization norm |
|---|---|---|---|
| `wordpress_plugins` | active installs + total downloads + rating for matching plugins | WordPress.org plugin directory search, and the in-admin plugin search inside every WordPress site | **FREEMIUM_NORMAL** |
| `vscode_extensions` | install count for matching extensions | Marketplace search, and the in-editor extension search inside every VS Code install | **MOSTLY_FREE** |
| `atlassian_marketplace` | matching paid app listings | Marketplace search, plus in-product app discovery inside Jira/Confluence | **PAID_NORMAL** |
| `pypi_packages` | recent download counts | PyPI search and Google queries for library problems | **MOSTLY_FREE** |
| `obsidian_plugins` | per-plugin download counts (single public JSON, whole catalogue) | In-app community plugin browser, searched by every Obsidian user | **MOSTLY_FREE** |
| `dockerhub_images` | pull counts for matching images | Docker Hub search | **MOSTLY_FREE** |
| `crates_rust` | crate download counts | crates.io search | **MOSTLY_FREE** |
| `homeassistant_hacs` | GitHub stars on integration repos as a usage proxy | HACS in-app browser inside Home Assistant installs | **MOSTLY_FREE** |

## Per-space detail

### `wordpress_plugins` — WordPress.org plugin directory

- **Note:** Open documented API, no key. Freemium (free plugin in directory, paid upgrade off-site) is the established norm, so evidence and monetization may both be available.
- **HTTP statuses:** {"200":12}
- **Values:** backup=3000000, invoice=300000, booking calendar=70000, seo=10000000, inventory=7000000, form builder=5000000, analytics dashboard=5000000, image optimization=7000000, membership=300000, csv import=100000, time tracking=10000000, pdf export=300000

### `vscode_extensions` — VS Code Marketplace

- **Note:** Install counts are real usage. Paid extensions are rare, which is a monetization problem.
- **HTTP statuses:** {"200":12}
- **Values:** backup=19601, invoice=72, booking calendar=44002, seo=4494, inventory=125, form builder=70868925, analytics dashboard=97346, image optimization=4206417, membership=3189, csv import=23139618, time tracking=19625, pdf export=2706

### `atlassian_marketplace` — Atlassian Marketplace

- **Note:** Paid apps are the NORM here, not the exception — the strongest monetization profile of any candidate. Business buyers with budgets. Question is whether Factory can build and publish to it autonomously.
- **HTTP statuses:** {"200":12}
- **Values:** backup=101, invoice=98, booking calendar=510, seo=365, inventory=54, form builder=1339, analytics dashboard=1392, image optimization=1072, membership=45, csv import=1558, time tracking=3141, pdf export=1448

### `pypi_packages` — PyPI / Python ecosystem

- **Note:** Free API. Same monetization weakness as npm — paying for a Python library is unusual.
- **HTTP statuses:** {"200":2,"404":4,"429":6}
- **First failure:** HTTP 429
- **Values:** backup=null, invoice=458, booking calendar=null, seo=null, inventory=454, form builder=null, analytics dashboard=null, image optimization=null, membership=null, csv import=null, time tracking=null, pdf export=null

### `obsidian_plugins` — Obsidian community plugins

- **Note:** Entire catalogue with download counts in one public file — near-zero screening cost. Small audience and a strong free norm.
- **HTTP statuses:** {"200":1}
- **Values:** backup=7294943

### `dockerhub_images` — Docker Hub

- **Note:** Pull counts are real usage but heavily inflated by CI. Monetization is very weak.
- **HTTP statuses:** {"200":12}
- **Values:** backup=3092506, invoice=257041, booking calendar=459455, seo=2560, inventory=1276056, form builder=14709212, analytics dashboard=23569395, image optimization=897087408, membership=118425, csv import=1411650, time tracking=882737, pdf export=97904478

### `crates_rust` — crates.io / Rust ecosystem

- **Note:** Confirmed reachable. Strong free norm; paid Rust crates are essentially nonexistent.
- **HTTP statuses:** {"200":12}
- **Values:** backup=86648, invoice=1308, booking calendar=3146, seo=578, inventory=115213818, form builder=2576662, analytics dashboard=20352, image optimization=61705, membership=799383, csv import=18864, time tracking=43733, pdf export=2596

### `homeassistant_hacs` — Home Assistant custom integrations (HACS)

- **Note:** Prosumer audience that already spends money on hardware, which is unusual among the code-adjacent spaces. Stars are a weak usage proxy.
- **HTTP statuses:** {"200":10,"403":2}
- **First failure:** HTTP 403 — authentication or policy required
- **Values:** backup=3560, invoice=853, booking calendar=2, seo=10, inventory=44, form builder=null, analytics dashboard=245, image optimization=0, membership=1, csv import=1, time tracking=null, pdf export=null

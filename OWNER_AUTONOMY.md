# OWNER_AUTONOMY.md

Every action expected of the owner, why it needs a human, how long it takes, how often, and
how it gets eliminated.

`CONSTITUTION.md` §2: **owner time is capital.** This document is the register of that
capital's consumption. A Factory that is profitable and consumes hours of weekly owner labor
has failed half its mission.

---

## The standard

The owner is a **checker and approver**. Not an uploader, prompt runner, publisher,
fulfillment worker, analytics reconciler, research assistant, or daily operator.

The mature target is: open a dashboard, read it in a few minutes, approve or reject a small
number of meaningful decisions, leave.

---

## Labor categories

Owner clarification, 2026-08-18: autonomy means eliminating human work that scales with
assets, customers, posts, or sales. It does **not** mean the owner may never touch anything.

| Policy category | What it is | Treatment |
|---|---|---|
| `SETUP` | Account creation, identity verification, developer/API enrollment, OAuth authorization, secure key provisioning, payout configuration, domain/DNS, social-account creation | Acceptable when brief, one-time, and it unlocks reusable automation. Measure separately |
| `BATCH_APPROVAL` | An occasional review or authorization affecting many experiments | Acceptable when brief, consequential, and batched; never turn it into a per-asset ritual |
| `EXCEPTION` | Rare KYC, dispute, provider, legal, safety, or technical intervention | Acceptable but measured. If it repeats predictably, reclassify it as operating or maintenance/debug labor |
| `OPERATING` | Routine research, creation, publication, posting, prospecting, customer messaging, fulfillment, monitoring, reconciliation, or data movement | Strongly disfavored; must remain near zero and is subject to the owner-hours gate |

The Phase C schema now stores `EXCEPTION` distinctly. `APPROVAL` remains the database spelling
for policy-level `BATCH_APPROVAL`; `SETUP`, `OPERATING`, and `MAINTENANCE_DEBUG` map directly.

### Setup labor is an investment, not a cost to minimize

**Do not reject an otherwise superior search space, data source, distribution mechanism,
commerce provider, or integration merely because it requires one-time owner setup.**

Working assumption: **~5–20 minutes** of owner setup per integration is acceptable when it
buys substantial ongoing autonomous capability. Multiple such requests across Factory's life
are legitimate when each is justified. Still avoid unnecessary accounts, and consolidate
requests where practical.

**The optimization target is maximum ongoing autonomous economic capability per minute of
one-time owner setup** — not the absence of setup.

Every such request must state: exactly what the owner does; estimated setup minutes;
recurring owner minutes at 1, 10, 100, and 1,000 relevant units where applicable; monetary
cost; whether sensitive credentials are involved; where they are entered securely; what the
platform permits Factory to automate; the measurable funnel events; and what reusable
capability it unlocks.

**This does not relax the recurring-labor constraint.** `OPERATING` stays near zero and
`MAINTENANCE_DEBUG` still counts against the autonomy thesis. A one-time 20-minute account
setup can be excellent; five minutes per asset, customer, post, or sale is catastrophic at
portfolio scale.

After `COMMERCIAL_CLOCK_START`, **all human maintenance and debugging required to keep
Factory functioning counts against the autonomy thesis** (`EXPERIMENTAL_PROTOCOL.md` §12).

Factory may not claim low owner labor by excluding the time the owner spent fixing Factory.
That exclusion is the single easiest way to fake this metric, and it is prohibited.

---

## Owner labor budget — set by owner

Authorized 2026-08-17, revised 2026-08-18 (`db/migrations/002_owner_labor_threshold.sql`):

| Metric | Value | Role |
|---|---|---|
| Advisory target | **30 min/week** | Dashboard warns above this. **Gates nothing** |
| Hard threshold | **60 min/week** | Operating + maintenance/debug after clock start |
| Review trigger | **1 week above threshold** | Sensitive by design |
| Approvals | **≤ 60 min/month** | Batched, never daily |

### Why two lines

The advisory target reflects Master Codex §8 — the mature target is brief checking, "not
hours of weekly execution." The hard threshold is what actually gates. Tracking both means
drift is visible early rather than only at the point where it triggers.

### A review is a diagnosis, not a verdict

The trigger is deliberately sensitive; the consequence is deliberately mild. **Crossing 60
minutes in one week terminates nothing.** It opens a review whose only job is to answer: was
this an anomalous week, or is this structural?

**Recurring or structural owner labor is the real concern.** A one-off hour spent on a
genuinely novel problem is not an autonomy failure. The same hour spent every week on the
same recurring breakage is. Triggering on a single week means the structural case is caught
in week one instead of week three — which is the whole point of catching it at all.

Pausing experimentation or recommending a stop is one possible **outcome** of a review,
argued from evidence. It is never automatic.

---

## Required owner actions

### Now — blocking Milestone 0A

| # | Action | Why a human | Est. | Recurring | Automatable |
|---|---|---|---|---|---|
| 1 | Authorize capital exposure ($50 or other) | Constitutional: only the owner may set capital at risk | 1 min | No | **Never** — by design |
| 2 | Confirm owner labor budget | Defines the autonomy gate's threshold | 2 min | No | No |
| 3 | Create Neon account, provide `DATABASE_URL` as a GitHub secret | Account creation requires identity | 10 min | No | No |
| 4 | Confirm tax residence / country | Determines MoR eligibility and tax treatment | 1 min | No | No |

**Item 3 note:** the connection string is a scoped infrastructure credential, entered into
GitHub's secret store — **not pasted into an agent session**. It is not a bank or payout
credential.

### Phase E — always-on commerce edge (not yet requested)

Phase E built the edge but did not deploy it. Deploying is owner setup, and it is stated here
so the next agent inherits a known quantity rather than a discovery.

| # | Action | Why a human | Est. | Recurring | Automatable |
|---|---|---|---|---|---|
| E1 | Create a Cloudflare account and an API token scoped to Workers + R2 | Account creation requires identity | 10–15 min | No | No |
| E2 | Provision one R2 bucket and one D1 database, then set four Worker secrets | Provisioning is bound to the account | 5–10 min | No | No |

**What it unlocks:** a permanent product page, a first-party exposure/view/click denominator
for every future ARRIVE mechanism, an always-on Stripe webhook endpoint, and signed
post-payment file delivery. Per-asset owner action stays **zero** at any portfolio size: assets
are published by API into the same edge.

**Credentials:** a Cloudflare API token is a scoped infrastructure credential entered into the
provider's own interface or GitHub's secret store. It is **not** a bank, card, or payout
credential, and it must never be pasted into an agent session.

**Not yet requested.** It is only worth spending when the next agent is ready to consume it
immediately — the same rule that deferred the inference credential.

**D1, not KV, for the download counter.** KV cannot enforce a download limit atomically;
`KvEdgeStateStore.consumeDownload` throws rather than silently handing out unlimited downloads.

### Milestone 1 — money spine

| # | Action | Why a human | Est. | Recurring | Automatable |
|---|---|---|---|---|---|
| 5 | Create merchant-of-record account | Identity verification, legal seller agreement | 15–25 min | No | **Never** |
| 6 | Complete payout/identity setup **in the provider's interface** | Bank details. Never touches Factory | 10 min | No | Never |
| 7 | Approve the money-spine offer before publication | First external action | 5 min | No | Later, by policy |
| 8 | Make one owner test purchase | Verifies the real payment path end to end | 5 min | No | No |

**Item 6 is the hard credential boundary.** Factory never sees, requests, stores, or logs
these values. The owner enters them at the provider, directly.

**Item 8 caveat:** an owner test purchase costs real money in fees and proves plumbing only.
It is `OWNER_TEST` and never counts as demand (`CONSTITUTION.md` §10).

### Milestone 2+ — campaign operation

| # | Action | Why a human | Est. | Recurring | Automatable |
|---|---|---|---|---|---|
| 9 | Approve initial Campaign surface + product pattern | Major strategic fork | 10 min | No | No |
| 10 | Weekly dashboard check | The core owner function | **5 min/week** | **Yes** | No — this *is* the job |
| 11 | Batched approvals | Meaningful financial decisions | ~15 min/month | Yes | Partly, by policy graduation |
| 12 | Tax/accounting setup on first arm's-length revenue | Legal obligation | 30–60 min once | No | Never |

### Should never appear — and are treated as defects if they do

Uploading files · running prompts to make Factory work · publishing assets by hand ·
fulfilling orders manually · checking whether a sale happened · reconciling analytics between
services · moving data between tools · re-running a failed job.

**If any of these recurs, it is logged as `MAINTENANCE_DEBUG`, counts against the autonomy
thesis, and becomes an automation candidate.** It is not absorbed quietly as "just how it
works."

---

## Estimated routine owner minutes by milestone

Estimates, to be replaced by measured `owner_intervention` data. Setup is excluded from the
routine figure and shown separately.

| Milestone | Routine/week | One-time setup | Note |
|---|---|---|---|
| 0A Governance + financial plane | ~0 min | ~15 min | Capital + budget authorization, DB account |
| 0B Data Economics Probe | ~0 min | 0 min | Fully automated; zero-cost sources only |
| 1 Money spine | ~5 min | ~45 min | MoR account, payout setup, test purchase |
| 2 Campaign + arrival mechanism | ~5 min | ~10 min | Campaign approval |
| 3 Value QA + attempt loop | **~5–10 min** | 0 min | **The real autonomy test begins here** |
| 4 Commercial validation | ~5–10 min | ~45 min | Tax setup on first revenue |
| 5+ | Should **decline** | — | If it rises with revenue, that is an Autonomy Failure |

**The number that matters is Milestone 3 onward.** Everything before it is construction.
Autonomy is a claim about the steady state, and it cannot be evaluated until there is one.

---

## Honesty rules

1. **Log the intervention even when it was fast.** Five minutes twice a week is 8.7 hours a
   year of a system that claims to need nothing.
2. **Log debugging as `MAINTENANCE_DEBUG`, not `SETUP`.** Reclassifying recurring repair as
   one-time setup is how an autonomy metric gets faked. If it happened twice, it is not setup.
3. **The dashboard reports owner-time economics separately from cash economics.** Profit per
   owner hour is a first-class metric, not a footnote.
4. **An Autonomy Failure Review is mandatory when the budget is exceeded, regardless of
   revenue.** Especially when revenue is good — that is precisely when the temptation to
   ignore it is strongest.

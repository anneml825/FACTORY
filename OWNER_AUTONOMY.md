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

Tracked separately in `owner_intervention`, because they mean different things:

| Category | Counts against autonomy? |
|---|---|
| `SETUP` | One-time. Reported separately, does not count against the autonomy thesis |
| `APPROVAL` | Intended, permanent. Should stay small and batched |
| `OPERATING` | **Counts.** Running the business |
| `MAINTENANCE_DEBUG` | **Counts, and is the most diagnostic number in the system** |

After `COMMERCIAL_CLOCK_START`, **all human maintenance and debugging required to keep
Factory functioning counts against the autonomy thesis** (`EXPERIMENTAL_PROTOCOL.md` §12).

Factory may not claim low owner labor by excluding the time the owner spent fixing Factory.
That exclusion is the single easiest way to fake this metric, and it is prohibited.

---

## Proposed owner labor budget — requires owner decision

Proposed, pending confirmation:

| Metric | Proposed | Rationale |
|---|---|---|
| Routine operating + maintenance | **≤ 30 min/week** after clock start | Consistent with "check and leave." Above this, Factory is a part-time job |
| Approvals | **≤ 60 min/month** | Batched, not daily |
| Autonomy Failure Review trigger | Operating + maintenance > 30 min/week, sustained 2 consecutive weeks | One bad week is noise; two is a pattern |

Ships as `OWNER_LABOR_BUDGET_MINUTES_PER_WEEK = 0` until the owner sets it. Zero is the safe
default: it fails loudly rather than silently permitting unlimited owner labor.

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

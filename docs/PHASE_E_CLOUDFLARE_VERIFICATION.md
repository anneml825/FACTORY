# Phase E — Cloudflare deployment facts, verified against official documentation

**Date:** 2026-08-19
**Method:** GitHub Actions runs [`32264682095`](https://github.com/anneml825/FACTORY/actions/runs/32264682095)
and [`32265619781`](https://github.com/anneml825/FACTORY/actions/runs/32265619781), fetching
`developers.cloudflare.com` directly. No credential, no Cloudflare account, no deployment, $0.

## Why this document exists

The Phase E owner-setup brief cited secondary sources (blogs, community posts) for the free-tier
limits, payment-method requirements, and API-token permission names the owner would act on. That
was not good enough for facts a person is about to make an account decision on.

This build container cannot reach Cloudflare at all: the egress gateway answers **403 to CONNECT**
for `developers.cloudflare.com`, `www.cloudflare.com`, `api.cloudflare.com`, and
`blog.cloudflare.com`. `ARCHITECTURE.md` ADR-2a already established the remedy — retrieve evidence
from an Actions runner — so that is what was done. The second run fetches the `index.md` rendering
of each page, because HTML tag-stripping destroys the tables that carry the numbers.

Full extracted Markdown is attached to each run as the `cloudflare-docs` artifact.

---

## Verified facts

### D1 — Workers Free plan

Source: <https://developers.cloudflare.com/d1/platform/pricing/> and
<https://developers.cloudflare.com/d1/platform/limits/>

| Item | Workers Free | Note |
|---|---|---|
| Rows read | **5 million / day** | |
| Rows written | **100,000 / day** | |
| Storage, account total | **5 GB** | |
| **Maximum database size** | **500 MB** | Paid is 10 GB |
| **Databases per account** | **10** | Paid is 50,000 |
| **Queries per Worker invocation** | **50** | Paid is 1,000 |
| Time Travel (point-in-time recovery) | 7 days | Paid is 30 days |
| Maximum columns per table | 100 | Both plans |

> "Yes, the Workers Free plan will always include the ability to prototype and experiment with D1
> for free."

At the cap: "you will not be able to run queries against D1. D1 API will return errors... Once you
have reached your included storage limit, you will need to delete unused databases or clean up
stale data before you can insert new data, create or alter tables or create indexes and triggers."

**No payment method is mentioned anywhere in D1's pricing or limits documentation.** Combined with
the Workers Free plan being the default for every account, D1 is usable with no card on file. This
is the basis for recommending Option A.

### Workers — Free plan

Source: <https://developers.cloudflare.com/workers/platform/limits/>

- Daily requests: **100,000**, resetting at midnight UTC; exceeding returns **Error 1027**.
- **Subrequests per invocation: 50** (Paid: 10,000). Subrequests to internal services: 1,000.
- Number of Workers per account: 100 (Paid: 500).
- "A subrequest is any request a Worker makes using the Fetch API **or to Cloudflare services like
  R2, KV, or D1**."

### workers.dev

Source: <https://developers.cloudflare.com/workers/configuration/routing/workers-dev/>

- "Cloudflare Workers accounts **come with** a `workers.dev` subdomain that is configurable in the
  Cloudflare dashboard."
- **"Your `workers.dev` subdomain is treated as a Free website and is intended for personal or
  hobby projects that aren't business-critical."**

### R2 — pricing and payment

Source: <https://developers.cloudflare.com/r2/pricing/> and
<https://developers.cloudflare.com/billing/understand/billing-policy/>

- Standard storage $0.015/GB-month; Class A $4.50/million; Class B $0.36/million; **egress free**.
- Billing policy: "For services subject to usage-based billing, Cloudflare may **preauthorize your
  credit card** at any point in a billing period... In the case of **R2**, you will not be able to
  access your R2 buckets and requests will return errors" if the payment method fails.

**Precision note:** the official documentation establishes that R2 is a usage-based billing service
subject to card preauthorization. It does **not** contain an explicit sentence saying "a payment
method is required to enable R2." That specific claim remains secondary-source and is the reason
Option A avoids R2 rather than asserting a hard requirement.

### API token permission names — exact, verbatim

Source: <https://developers.cloudflare.com/fundamentals/api/reference/permissions/>

| Permission | Official description |
|---|---|
| `Account Settings Read` | "Grants read access to Account resources, account membership, and account level features" |
| `Workers Scripts Edit` | "Grants write access to Cloudflare Workers scripts" |
| `D1 Edit` | "Grants write access to D1" |
| `Workers R2 Storage Edit` | "Grants write access to Cloudflare R2 Storage" *(Option B only)* |

The permissions page lists each capability twice, once as **Edit** and once as **Write**, for the
two token families. The dashboard may present either word; they are the same capability.

### Wrangler credentials

Source: <https://developers.cloudflare.com/workers/wrangler/system-environment-variables/>

`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are the official environment variable names —
"can be used for authentication for situations like CI/CD, and other automation."

---

## Corrections to the earlier owner-setup brief

1. **D1 free-plan database size is 500 MB, not 5 GB.** 5 GB is the account-wide storage cap across
   at most 10 databases. This makes "store artifact bytes in D1" viable for fixtures (~1 KB each)
   and clearly wrong for real 2 MB artifacts, which would exhaust a Free database at roughly 250
   objects. D1-for-bytes is a fixture-only expedient; the `ObjectStore` port exists so the
   production binding becomes R2 without a redesign.

2. **D1 allows only 50 queries per Worker invocation on Free**, not the 1,000 that the general
   "subrequests to internal services" row suggests. The webhook path must batch its statements and
   stay well inside 50. This is a real design constraint on the D1 WATCH store, whose cold-start
   replay must be a single query returning many rows rather than many queries.

3. **workers.dev is officially "not business-critical."** Fine for a noncommercial fixture proof.
   A custom domain will be required before real commerce, which reverses the earlier claim that no
   domain would ever be needed and reintroduces a cost the owner has not authorized.

4. **The R2 payment-method claim is weaker than stated.** Official docs confirm preauthorization
   for usage-based services including R2, not an explicit enable-time card requirement.

## Confirmed against the live provider — preflight run 32286922617, 2026-08-19

The decisive unknown is now answered by Cloudflare itself, not by documentation:

- **A brand-new Workers Free account created a D1 database with no payment method on file.**
  `wrangler d1 create factory-edge` returned `Successfully created DB 'factory-edge' in region
  WNAM`, and `d1 list` confirms exactly one database, `3fa6df57-8c13-4bd1-af87-756a089049b0`,
  created `2026-08-19T18:22:31.528Z`. No card was entered anywhere. Option A holds.
- **The least-privilege token works.** `/user/tokens/verify` returned `success: true`,
  `status: active`, "This API Token is valid and active" — with only Account Settings Read,
  Workers Scripts Edit, and D1 Edit, and no Zone permissions.
- **Scope is exactly one account**, and it matches the configured account ID.

Cost: $0.00. Owner setup consumed: the account, subdomain, token, and two GitHub secrets.

## Not verified, and why
- **Whether `wrangler` can register a workers.dev subdomain non-interactively.** Docs say accounts
  come with one and it is configured in the dashboard, so the owner step remains.
- The presence of `STRIPE_TEST_SECRET_KEY` in the repository secret store. Phase B run
  `32173279299` consumed it successfully; its value has not been read, displayed, or copied, and
  the deploy workflow will fail closed if it is absent.

## Incidental finding — an unintended external trigger

Pushing the Phase E remediation commit fired the **Data Economics Probe**, which ran live external
retrieval and committed `6bf2557` back to this branch. The cause is that probe's `push` path filter
including `package.json`, which Phase E edited to register new test scripts.

**Resolved 2026-08-20:** the Data Economics Probe is now manual-only. Provider-changing edge
deploy/preflight workflows are also manual-only. A repository push has no provider mutation or
probe-state commit side effect.

This is the same hazard Phase E removed from the Phase B Stripe workflow: a provider probe running
as a side effect of committing unrelated code. It cost $0 and touched only free sources, so nothing
was harmed. The trigger is now removed; future probe execution requires an explicit manual action.

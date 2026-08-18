# Phase C — provider-neutral ARRIVE + durable WATCH

**Date:** 2026-08-18  
**Status:** `BUILT`, awaiting the one real noncommercial provider probe  
**Cash spent:** $0.00  
**Commercial products:** none  
**Phase D / metered MAKE:** not started

## Scope and decision

Phase C does not select one universal distribution provider. It adds a reusable ARRIVE
contract and proves the first adapter cheaply enough to learn from reality:

```text
named public surface
  -> provider analytics baseline
  -> noncommercial fixture publication
  -> post-baseline exposure / visit / interaction deltas
  -> attributed Stripe sandbox checkout
  -> signed webhook
  -> PostgreSQL WATCH inbox
  -> restart replay / evaluation / deactivation
```

The first empirical adapter is **DEV Community**, narrowly for a software-practitioner
fixture. This is a pilot, not a default commercial channel. Its official API supports article
publication plus authenticated per-article analytics. DEV's terms require substantial,
on-topic, good-faith content and prohibit posts designed primarily for promotion or backlinks.
Factory therefore refuses superficial promotional variants.

Public identity is a fail-closed publication gate. The adapter requires an owner-configured
Factory display name and username, verifies both the authenticated account and public profile,
rejects any unapproved public GitHub username and checks
the created article author again before accepting activation. It never derives public identity
from GitHub, repository ownership, email, credentials, or provider defaults. Email is not part of
DEV's documented public article/user representation and is never copied into fixture content.
For this Phase C probe, the owner explicitly approved the existing `anneml825` link after reviewing
who could see it and why; the adapter accepts that exact value only in DEV's GitHub field and still
rejects it in the public display name, DEV username, or other returned identity metadata.

Official references checked 2026-08-18:

- <https://developers.forem.com/api/v1>
- <https://dev.to/terms>
- <https://docs.stripe.com/payment-links/url-parameters>

## Why not Pinterest first

Pinterest remains a legitimate future adapter candidate because its official metrics include
impressions, Pin clicks, and outbound clicks. It was not selected for the first probe because:

- Trial-created Pins are visible only to their creator, so they cannot prove stranger arrival.
- Public Standard access requires an approved Trial app, a public privacy policy, and a demo
  video showing OAuth—even for a single-account integration.
- Pinterest's current developer rules require the user to specifically choose publishing
  actions; a batch-approval design is possible but must be implemented explicitly.

That is a poor first empirical probe, not a permanent rejection.

Official references checked 2026-08-18:

- <https://developers.pinterest.com/docs/key-concepts/access-tiers/>
- <https://developers.pinterest.com/docs/api/v5/pins-create/>
- <https://developers.pinterest.com/docs/analytics-and-reports/metrics-glossary/>
- <https://policy.pinterest.com/en/developer-guidelines>

## What is implemented

- `ArriveAdapter` now owns gate evaluation, activation, cumulative measurement, and
  deactivation without coupling MAKE, PUT, or WATCH to one provider.
- `DevToArriveAdapter` performs an authenticated measurement preflight, retrieves one small
  current tag-feed sample as quantitative surface evidence, creates exactly one substantial
  noncommercial article, retrieves per-article analytics, recovers a create-time timeout by a
  stable content marker, and deactivates the article.
- `ArrivalWatchBridge` converts cumulative provider metrics into idempotent deltas. A lost
  metric checkpoint cannot duplicate exposure, visit, or interaction counts because WATCH
  owns stable provider effect IDs.
- `JsonJournalWatchStore` proves credential-free crash recovery with fsynced, atomically
  renamed event records.
- `PostgresWatchStore` is the unattended boundary. Raw signed events are append-only,
  payload-hashed, event-ID unique, and provider-effect unique; snapshots rebuild by replay.
- Stripe webhook inbox and transaction references have a PostgreSQL implementation, so a
  restart does not re-fulfill an already processed checkout or lose refund/dispute attribution.
- `checkout.session.created` records checkout starts and
  `checkout.session.async_payment_failed` records an attributed failure without inventing a
  transaction or revenue.
- The article appends a deterministic, non-secret `client_reference_id` to its Stripe sandbox
  link. Stripe copies it to the Checkout Session, and WATCH carries that ARRIVE publication
  reference through checkout, transaction, fulfillment, refund, and dispute effects.
- Owner labor now has an explicit `EXCEPTION` category in TypeScript and PostgreSQL.

## Metric semantics — deliberately conservative

DEV exposes article views, reactions, comments, and referrer analytics. It does **not** expose
feed impressions or outbound-link clicks through the documented API used here.

| Funnel stage | Phase C instrument | Semantics |
|---|---|---|
| Qualified exposure | Post-baseline article view | `PROXY`; a page load is lower-funnel than a feed impression and may contain automated traffic |
| Visit | The same article-view count | `DIRECT`; not an independent count from exposure |
| Offer interaction | Reaction + comment | `DIRECT`; not a link-click measure |
| Checkout start | Stripe `checkout.session.created` plus `client_reference_id` | `DIRECT`, provider test only and linked to the ARRIVE publication |
| Transaction | Stripe completed Session / PaymentIntent | `DIRECT`, permanently `OWNER_TEST` in this probe |

Activation captures a baseline after article creation. Known setup traffic is excluded before
post-baseline deltas are labeled stranger traffic. The report preserves the automated-traffic
limitation. No metric advances commercial evidence during the provider-test run.

The controlled owner checkout uses a separately emitted sandbox URL containing the same ARRIVE
reference; it does not open the article and therefore cannot manufacture the post-baseline DEV
view required by the probe. This proves attribution plumbing, not a stranger purchase or an
organic article-to-checkout conversion.

## Durable guarantees

Tests cover:

- process restart after WATCH acknowledgement;
- duplicate event ID with identical bytes;
- duplicate provider effect under a different event ID;
- changed payload/effect semantics on retry;
- metric checkpoint loss after some/all deltas are durable;
- PostgreSQL append-only enforcement;
- PostgreSQL webhook-inbox and transaction-reference restart recovery;
- no second fulfillment after a processed webhook is redelivered after restart;
- explicit failed checkout visibility;
- owner/internal exclusion and zero eligible arm's-length revenue.

Local verification on the build workspace discovered 28 tests: 26 passed and the two tests
requiring PostgreSQL were skipped because no local server is installed. The final pre-commit
combined suite reported 2.23 s; TypeScript completed with no errors. The GitHub Actions core job is
the required PostgreSQL verification boundary.

## Owner labor curve — DEV pilot

The implementation has no per-article owner action. One credential setup unlocks programmatic
publication, analytics polling, and deactivation. Any future commercial use still requires
content quality and platform-policy gates.

| Units | Setup | Batch approval | Operating | Exception |
|---:|---:|---:|---:|---:|
| 1 | 5–10 min once | 0 for approved fixture | 0 | measured if it occurs |
| 10 | same setup | 0 in current adapter | 0 | measured if it occurs |
| 100 | same setup | policy may require a batch gate | 0 | UNKNOWN |
| 1,000 | same setup | policy/spam review mandatory before scale | 0 | UNKNOWN |

The table is an architecture curve, not permission to publish 1,000 posts. Platform quality,
rate limits, audience fit, and spam risk are expected to fail before owner upload labor does.

## External proof gate

The workflow `.github/workflows/phase-c-arrive-watch.yml` first runs the complete suite against
a disposable PostgreSQL 16 service. If both existing Stripe sandbox access and `DEVTO_API_KEY`
are present, it then:

1. publishes one noncommercial DEV fixture;
2. creates one Stripe Managed Payments sandbox fixture;
3. records post-baseline public views;
4. completes one test-only checkout;
5. proves one ARRIVE publication ID across exposure, visit, checkout start, transaction,
   fulfillment, and zero commercial settlement;
6. deactivates both provider publications.

Until that run passes, Phase C is `BUILT`, not `DONE`, and no stranger exposure is claimed.

### First external attempt — provider schema correction

Runs `32180403256` and `32180836478` authenticated successfully but failed closed before
publication. The first parser required a populated totals object during the account-level
preflight; adding DEV's documented live field aliases did not change the failure. That established
the actual issue: a new account with no articles can return an empty aggregate result.

The adapter now separates endpoint reachability from scoped measurement. The gate requires an
authenticated JSON response; the just-created article is then measured separately, with an empty
scoped result represented explicitly as zero until DEV's analytics pipeline materializes it. It
still rejects nonempty unrecognized or multi-record aggregate responses. Neither failed run
created an article or opened a checkout.

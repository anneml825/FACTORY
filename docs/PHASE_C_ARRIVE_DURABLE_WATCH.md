# Phase C — provider-neutral ARRIVE + durable WATCH

**Date:** 2026-08-18  
**Status:** `DONE` as an engineering proof; genuine commercial ARRIVE `UNPROVEN`
**Cash spent:** $0.00  
**Commercial products:** none  
**Phase D / metered MAKE:** not started

## Scope and decision

Phase C does not select one universal distribution provider. It adds a reusable ARRIVE
contract and exercises one adapter as infrastructure only:

```text
named public surface
  -> provider analytics baseline
  -> noncommercial fixture publication
  -> controlled visit plus provider analytics retrieval
  -> attributed Stripe sandbox checkout
  -> signed webhook
  -> PostgreSQL WATCH inbox
  -> restart replay / evaluation / deactivation
```

The first engineering adapter is **DEV Community**, narrowly for a software-practitioner
fixture. This is not a commercial channel selection. Its official API supports article
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
| Qualified exposure | DEV article-view delta | `OWNER_INTERNAL` in this fixture; never stranger evidence |
| Visit | The same DEV article-view delta | Provider counter only; the controlled load did not appear within ten minutes |
| Offer interaction | Reaction + comment | `DIRECT`; not a link-click measure |
| Checkout start | Stripe `checkout.session.created` plus `client_reference_id` | `DIRECT`, provider test only and linked to the ARRIVE publication |
| Transaction | Stripe completed Session / PaymentIntent | `DIRECT`, permanently `OWNER_TEST` in this probe |

Activation captures a baseline after article creation. Controlled-fixture mode classifies every
reported DEV view as owner/internal, so neither views nor interactions can advance stranger or
commercial evidence. Run `32185055925` retrieved the live per-article analytics shape repeatedly,
but DEV continued to report zero after a controlled browser page load. Retrieval worked; timely
visit observation did not.

The controlled owner checkout used the exact sandbox URL embedded in the temporary article and
carried the same ARRIVE reference into the completed PaymentIntent. This proves reference
propagation, not a stranger purchase or an organic article-to-checkout conversion.

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

Local verification discovered 33 tests: 31 passed and the two PostgreSQL tests skipped because no
local server is installed; duration was 1.353 s. GitHub Actions run `32185055925` passed all 33,
including both PostgreSQL restart tests, in 489.558 ms. TypeScript and database invariant checks
also passed.

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

## External engineering proof

The workflow `.github/workflows/phase-c-arrive-watch.yml` first runs the complete suite against
a disposable PostgreSQL 16 service. If both existing Stripe sandbox access and `DEVTO_API_KEY`
are present, it then:

1. publishes one noncommercial DEV fixture;
2. creates one Stripe Managed Payments sandbox fixture;
3. retrieves scoped provider analytics after a controlled page load;
4. completes one test-only checkout;
5. proves one ARRIVE publication ID from the article checkout URL through transaction,
   fulfillment, and zero commercial settlement;
6. deactivates both provider publications.

The provider run's old acceptance expression required DEV to increment within ten minutes and a
`checkout.session.created` event carrying usable attribution. Both assumptions were false, so the
job concluded failure despite the engineering boundaries succeeding. The corrected runner treats
valid analytics retrieval separately from a counter increment, never invents a checkout-start
event, and uses the fulfilled attributed owner-test transaction as the commerce proof. The workflow
is manual-only now; publishing closeout documentation cannot launch another fixture.

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

Run `32183291790` reached article creation and disproved two further assumptions. DEV's totals
payload nests counts as `page_views.total`, `reactions.total`, and `comments.total`, rather than
returning scalar fields. More importantly, activation measured its baseline before persisting the
arrival publication, so the schema exception left the newly created fixture outside the runner's
normal `finally` cleanup handle. The public profile confirmed one orphaned fixture. The correction
parses both nested and legacy scalar shapes, scans for exact Phase C fixture markers and unpublishes
orphans before every gate, wraps creation through persistence in emergency unpublish, and prevents
concurrent probes. Run `32185055925` verified cleanup before publishing its fresh fixture.

## Closeout evidence — run 32185055925

The owner changed the gate before this run: the dummy article was explicitly an engineering
fixture, not a demand test, and genuine stranger engagement was no longer required or meaningful.
One controlled browser visit and one Stripe sandbox checkout were performed.

Observed external results:

- DEV created article `4429061` programmatically under Factory94 and returned scoped analytics on
  every poll. The controlled load was not reflected in its totals within the ten-minute window.
- The article contained ARRIVE reference
  `factory_arrive_890beacca7def09ea4cf63550087ed3e` in the Stripe checkout URL.
- Stripe created and fulfilled owner-test PaymentIntent `pi_3U5u7o0pEa3CWQlP11tpAGdr` for USD
  12.00 and preserved that exact ARRIVE reference.
- WATCH recorded the transaction as `OWNER_TEST`, with `armLengthGrossRevenueCents: 0` and
  `eligibleArmLengthRevenueCents: 0`; no commercial clock started.
- `checkout.session.created` did not produce a usable attributed WATCH start. Factory does not
  synthesize one; the funnel honestly reports `checkoutStarts: 0` while preserving the completed
  transaction.
- The PostgreSQL CI boundary passed 33/33 tests, including WATCH and webhook restart recovery.
- The runner deactivated the DEV article and Stripe Product, Price, and Payment Link. Direct checks
  then returned DEV `404 / page not found` and Stripe `The link is no longer active.`
- Cash spent was $0. Owner operating labor was zero; the single Pay confirmation was controlled
  test approval, not recurring commercial operating labor.

The run's job conclusion is `failure` only because the then-current acceptance expression still
required a prompt DEV counter increment and an attributed checkout-start event. Its result artifact
is retained as the honest provider record. The acceptance logic is corrected after the run and was
not rerun, honoring the instruction not to begin another DEV experiment.

## Phase C decision

Phase C is complete as an engineering proof of programmatic publication, provider analytics
retrieval, ARRIVE-reference propagation, attributed sandbox commerce, durable WATCH behavior, and
automatic deactivation. Genuine commercial ARRIVE remains **UNPROVEN**. DEV is not selected as a
commercial distribution provider, and its article totals are not accepted as a timely visit
instrument.

The next commercial experiment must start from a real `BUYER + PROBLEM + OFFER` and choose an
appropriate ARRIVE adapter concurrently with MAKE and PUT. It needs a reliable first-party redirect
or comparable event source if per-visit attribution matters. Phase D, metered MAKE, and any request
for `ANTHROPIC_API_KEY` remain outside this closeout and require owner review.

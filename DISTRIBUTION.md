# DISTRIBUTION.md

How strangers reach Factory's offers. The hardest problem Factory has, and the one most
likely to kill it.

Operational companion to `EXPERIMENTAL_PROTOCOL.md` §1. Read both before designing any
acquisition mechanism.

---

## Why this is the binding constraint

Factory can build a product. Factory can take a payment. Factory can deliver a file. None of
that matters if no unrelated human ever sees the offer.

With **$50 of total capital**, broad paid acquisition is usually statistically weak: a few
dollars of undifferentiated ad spend may buy too few qualified impressions to distinguish
"nobody wants this" from "almost nobody saw it." `EXPERIMENTAL_PROTOCOL.md` §5 forbids an
attempt that cannot return decision-useful signal.

Factory should prefer reusable, compounding, or pay-on-success distribution, but **$0 is not
the objective at the expense of learning or revenue**. A modest platform fee, subscription,
data source, or tightly bounded acquisition test may be proposed when evidence indicates it
can improve information or commercial value across multiple experiments. Every cent remains
subject to Capital Authority; a proposal is not spend authorization.

ARRIVE is still the central strategic problem of the project, and it is not solved. Pretending
otherwise is explicitly prohibited.

---

## The gate

No experiment launches without a Stranger Arrival Mechanism answering all six questions with
a **measurable, instrumented** mechanism. The full gate, including the failure modes, is in
`EXPERIMENTAL_PROTOCOL.md` §1.

Two points bear repeating because they are where the gate gets quietly evaded:

**Generic channel labels are not mechanisms.** `social`, `SEO`, `organic`, `communities`,
`viral`, `influencers`, `shareability`, `content marketing`, `we'll post about it`. A
category must resolve to a specific, nameable, observable surface.

**An unmeasurable mechanism fails the gate even when it is plausible.** If exposure cannot be
counted, the experiment cannot produce a denominator, and its result cannot be interpreted
(§6). Plausibility is not a substitute for instrumentation.

---

## Structurally viable mechanism families at $0 acquisition budget

Candidates only. **None is validated. None has been probed.** Each carries a real objection,
stated rather than glossed.

### Marketplace-native discovery

A marketplace where buyers already arrive with purchase intent and browse a searchable
catalogue — Gumroad Discover, Etsy search, an app/plugin directory.

*Why it fits:* the surface has native discovery, the platform supplies the traffic, exposure
and conversion are instrumentable via the platform's own reporting, and demand evidence
(listing counts, category structure) is often retrievable through an API before committing.

*Objections, unresolved:* platform ToS may restrict automated listing creation, which is the
whole autonomy claim. Marketplaces are saturated with low-quality digital goods, so ranking
without reviews or history is genuinely hard. Discovery fees are steep — Gumroad Discover
takes 30%. Platform dependency is a concentration risk (`EXPERIMENTAL_PROTOCOL.md` §14).

### Named-query search demand

A specific search query with independently retrieved volume, where the existing results are
weak enough that a genuinely better page could rank.

*Why it fits:* it is the cleanest possible Stranger Arrival Mechanism — a named query, a
retrieved number, a measurable position.

*Objections, unresolved:* ranking takes months, which sits badly against a 90-day stop-loss.
Absolute volume data costs money Factory does not have (see the DataForSEO problem in
`INTEGRATIONS.md`). And it requires hosting a page, which reintroduces the hosting cost
`ARCHITECTURE.md` ADR-1 was designed to avoid.

### Existing ecosystem discovery

A surface inside a product people already use, with its own catalogue and its own search.

*Why it fits:* the ecosystem supplies qualified traffic; listing is often free.

*Objections, unresolved:* review/approval processes are slow and human-gated, which is
owner labor. Build requirements may exceed what Factory can produce autonomously.

---

## ARRIVE is a provider-neutral adapter portfolio

Factory must not couple candidate generation or commerce infrastructure to one universal
channel. Each ARRIVE adapter owns acquisition-specific publication, attribution, metrics,
permission constraints, retry/idempotency behavior, and deactivation. MAKE, PUT, checkout,
fulfillment, and WATCH remain independently replaceable.

An ARRIVE mechanism is not rejected merely because it needs **5–20 minutes of one-time owner
setup**. Candidate surfaces may include social platforms, visual discovery, marketplaces,
newsletters, communities, advertising accounts, search/data services, directories, ecosystem
galleries, and mechanisms not yet identified. Naming a platform is not evidence that it works.

Every ARRIVE proposal must state:

- setup labor and batch-approval labor;
- recurring owner labor at 1, 10, 100, and 1,000 experiments/posts where applicable;
- fixed, marginal, and recurring monetary cost;
- the platform's verified automation permissions and rate limits;
- qualified-exposure, visit, offer, checkout, and transaction events actually measurable;
- the reusable capability the setup or cost unlocks;
- failure, deactivation, concentration, and account-spam controls.

Daily owner posting, manual prospecting, per-listing upload, routine customer messaging, and
other human execution that scales with normal revenue are not ARRIVE adapters. They are
`OPERATING` labor and fail the owner-hours objective.

---

## What is explicitly not solved

Recorded plainly so no later document can imply otherwise:

- **Organic distribution is not solved.** Factory has no audience, no domain authority, no
  reputation, no email list, and no social presence.
- **Broad, underpowered paid acquisition is not evidence.** A bounded paid mechanism may be
  proposed only when its expected denominator and information value are explicit.
- **No commercial mechanism has been validated.** Phase C exercised a DEV Community adapter with
  one temporary noncommercial fixture. Programmatic publication, analytics retrieval, attribution,
  and deactivation worked, but the controlled browser load did not appear in DEV totals within ten
  minutes. This is engineering evidence only, not product demand or channel validation.
- **Automation permissions are adapter-specific.** DEV's documented article API and content
  policy have been checked for the fixture. Pinterest's public-access and batch-approval
  requirements have been checked and deferred. Every later adapter must repeat this work before
  a Campaign uses it.
- **WordPress.org is not selected.** Its earlier data investigation is historical and was
  rejected as Factory's default commercial/ARRIVE path.

---

## Measurement

Every mechanism must, before launch, have a named instrument **verified to actually record**.
`stranger_arrival_mechanism.measurement_verified_at` stays `NULL` until an observation has
been confirmed end to end.

Full funnel where observable:

```
QUALIFIED EXPOSURES → VISITS → OFFER INTERACTIONS → CHECKOUT STARTS
                    → PURCHASES → REVENUE → MARGINAL COST → CONTRIBUTION PROFIT
```

**Attribution must survive the MoR boundary.** Checkout is hosted by the merchant of record,
so Factory must carry an experiment identifier through to the transaction — via a per-offer
product, a URL parameter the provider preserves, or provider metadata. **This is a Milestone 1
verification item, not an assumption**: if attribution breaks at the MoR boundary, every
downstream denominator is unreliable and the Campaign cannot learn.

---

## The most likely failure, and the discipline it requires

**Almost every early attempt will fail as `NO_DISTRIBUTION`.** Exposure will not happen, or
will be too small to interpret.

The discipline that makes this survivable:

- Record it as `NO_DISTRIBUTION` or `INSUFFICIENT_EXPOSURE` — **never** as "no demand."
  Mislabeling a distribution failure as a demand failure produces a confident, false
  conclusion about a market that was never shown the offer, and it poisons every subsequent
  decision in the Campaign.
- An attempt that ended below its minimum meaningful denominator **did not run**. It does not
  count as an attempt against the ~30 target and it is not evidence about the offer.
- If the mechanism repeatedly fails to produce measurable exposure, that is a **Campaign stop
  condition** (§8) — the mechanism is wrong, not the niches.

The Campaign structure exists precisely so that repeated failure teaches something about the
*mechanism* rather than generating thirty unrelated anecdotes.

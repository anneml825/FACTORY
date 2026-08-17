# DISTRIBUTION.md

How strangers reach Factory's offers. The hardest problem Factory has, and the one most
likely to kill it.

Operational companion to `EXPERIMENTAL_PROTOCOL.md` §1. Read both before designing any
acquisition mechanism.

---

## Why this is the binding constraint

Factory can build a product. Factory can take a payment. Factory can deliver a file. None of
that matters if no unrelated human ever sees the offer.

With **$50 of total capital**, meaningful paid acquisition is statistically weak to the point
of uselessness: a few dollars of ad spend buys too few impressions to distinguish "nobody
wants this" from "almost nobody saw it." Master Codex §24 states this plainly and
`EXPERIMENTAL_PROTOCOL.md` §5 forbids running the attempt anyway.

**Factory must therefore find distribution it does not have to buy with cash.** That is the
central strategic problem of the entire project, and it is not solved. Pretending otherwise
is explicitly prohibited.

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

## What is explicitly not solved

Recorded plainly so no later document can imply otherwise:

- **Organic distribution is not solved.** Factory has no audience, no domain authority, no
  reputation, no email list, and no social presence.
- **Paid acquisition is not viable at $50.** Not "expensive" — statistically uninformative.
- **No mechanism above has been probed.** The Data Economics Probe (Milestone 0B) is the
  first real test of whether *any* of these can be evidenced cheaply enough to search.
- **Automation permissions are unverified.** Whether any candidate platform's terms permit
  autonomous listing creation is unknown and must be checked before a Campaign locks onto it.
  A mechanism Factory is not permitted to operate autonomously fails the mission even if it
  sells.

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

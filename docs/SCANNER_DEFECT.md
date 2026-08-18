# Scanner Defect — WordPress opportunity scan, run 1

**Date found:** 2026-08-18 · **Status: results invalid, not to be used.**

## What happened

`src/evidence/wp-opportunities.ts` scanned 160 systematic queries and ranked 21 as
opportunities. **The ranking is meaningless.**

The scanner assumed that the top search result for a query is the incumbent solving that
problem. `api.wordpress.org` does **loose keyword matching**, so a query like
`auto repair shop intake form` returns whatever generic form or booking plugin ranks for
"form" — not a plugin serving auto repair shops.

## The evidence

Across 114 queries that returned a plugin:

- only **55 distinct plugins** were returned at all
- one generic booking plugin (**LatePoint**) was the "top incumbent" for **16 different
  verticals**
- `school inventory tracking` returned **Optima Express IDX**, a real-estate plugin
- `farm booking` returned **Location Weather**, a weather plugin
- `photographer intake form`, `auto repair shop intake form`, and `auto repair shop staff
  scheduling` all returned the identical plugin

Every derived figure — installs, rating, staleness, "only N plugins compete" — described a
generic plugin, not the niche. The competitor count was especially misleading: it counted
keyword matches, so a low number meant *the search returned few results*, not that a niche was
uncontested.

## Wider consequences

**This defect also affects `state/WP_GATE.md`.** That run used the same API and the same
"top plugin active installs" logic. Its numbers therefore very likely measure generic-plugin
popularity rather than niche-specific demand.

So the Data Economics Gate PASS for WordPress must be read narrowly: it demonstrated that
**a discriminating number can be retrieved cheaply**, not that the number means what the
opportunity analysis assumed. The stratum separation (5,000,000 / 100,000 / 800) may largely
reflect that broad terms match large generic plugins and narrow terms match smaller ones.

**It also damages a claim made in `docs/COMMERCIAL_EVIDENCE_INVESTIGATION.md`.** Hypothesis A
argued that WordPress install counts prove specific operational problems are real — "50,000
installs for equipment rental scheduling", "2,000 for salon stylist commission tracking". If
those counts belong to generic booking plugins, **they prove nothing about those verticals**.

That leg of the triangulation is withdrawn. What survives is the Etsy side: people demonstrably
buy digital documents at ~82% margin. What does not survive is any validated basis for choosing
*which* niche to make one for.

## Fix

A relevance check now requires a returned plugin to mention the vertical in its own name or
description before counting as an incumbent. **Unverified until re-run.**

## What this changes about the plan

Factory currently has **no validated method for selecting a niche**. The WordPress-derived
substitute has failed.

That raises the value of the **Envato/CodeCanyon API** considerably: it returns per-item sales
counts and prices for actual products, so relevance is not inferred from a search ranking —
the item either sold or it did not. It is free, needs a ~10 minute token, and is now the only
credible niche-selection evidence source identified.

## Note on method

Three times now, retrieved evidence has overturned a conclusion I had drawn: the spurious
first gate pass, the WordPress commercial case, and this. Each was caught by checking data
rather than by reasoning about it. The cost of all three corrections was $0, which is the
Data Economics Gate doing its job — but it is worth recording that **my failure mode is
consistently over-trusting a metric before verifying what it actually measures.**

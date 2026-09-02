# OWNER_AMENDMENTS.md

Authoritative Factory decisions issued by the owner after the immutable
`docs/spec/MASTER_CODEX_v5.1.md` record dated 2026-08-17.

## Authority

The master specification remains an unedited historical record. A dated explicit owner
amendment in this file supersedes earlier specification text where the two conflict. Derived
governance and operating documents must implement the newest applicable owner amendment.

---

## 2026-09-02 — Repository persistence is a completion gate

The Factory GitHub repository is authoritative shared state. Final and owner-review artifacts
must not remain only in chat, Library, an agent workspace, or a temporary filesystem.

Before work may be reported as complete, every file needed to reproduce, inspect, publish,
operate, audit, or continue it must be stored at a stable documented repository path,
committed, successfully pushed, and verified on the remote. A local file or local commit is
insufficient. Secrets and prohibited credentials remain excluded. If an artifact cannot be
stored safely or within technical limits, completion is blocked until the owner explicitly
approves a durable alternative.

Implemented in `CONSTITUTION.md` §14 and `AGENTS.md` completion rule 10.

---

## 2026-09-02 — Demand Magnitude Gate

Stranger-arrival evidence establishes only the existence of paid demand. It is necessary but
no longer sufficient to justify building a product.

Every production candidate must separately pass:

1. **ARRIVE:** credible evidence that unrelated buyers purchase this type of product.
2. **DEMAND DEPTH:** evidence that the observable Etsy-addressable demand pool is large enough
   to justify a finite Factory production slot and support meaningful, plausibly repeatable
   revenue rather than isolated long-tail sales.

BUILD requires ARRIVE = PASS, DEPTH of at least MEDIUM, Etsy Channel Fit of at least MEDIUM,
and demand evidence that is not dependent on one anomalous seller or listing. Candidates must
also pass autonomous-production-cost and product-fit gates and compete comparatively for
finite production capacity.

Demand research must test buyer-problem language and realistic adjacent searches; normalize
listing-specific versus shop-wide traction; examine recency, distribution, pricing,
competition density, portfolio overlap, and Etsy-specific buyer behavior; search actively for
counterevidence; and never turn supply, weak proxies, one incumbent, or missing data into
strong-demand evidence.

When the marketplace evidence cannot distinguish MEDIUM from LOW demand, the result is
INSUFFICIENT EVIDENCE. The burden of proof is on BUILD. Low competition plus low demand is not
an opportunity.

The complete binding research procedure, market-structure classes, decision fields, build
standard, portfolio ceiling test, comparative-selection rule, and required research behavior
are transcribed in `EXPERIMENTAL_PROTOCOL.md` §20.

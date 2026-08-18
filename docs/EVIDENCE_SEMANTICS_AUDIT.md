# Retroactive Evidence Semantics Audit

**Date:** 2026-08-18 · Applying `EXPERIMENTAL_PROTOCOL.md` §16 to evidence that survived the
WordPress withdrawal. **Surviving a different failure is not the same as being valid.**

---

## 1. Etsy platform economics

**Metrics:** $0.20 listing fee · 6.5% transaction fee · 3% + $0.25 payment processing ·
instant download delivery · Shop Stats reporting impressions/views/visits/orders.

| Question | Answer |
|---|---|
| **Measures** | Etsy's published fee schedule and documented platform mechanics |
| **Proposition** | "Factory can run ~30 commercial experiments for ~$6 with full-funnel visibility and automated fulfilment" |
| **Inferential distance** | Short for cost and mechanics. **Very long** for "these experiments will produce sales" |
| **Entity correspondence** | ⚠️ **PARTIAL.** Fees verified as Etsy's. **Not verified: that Etsy's buyer population purchases business operational tools** |
| **Alternatives** | Fee figures come from third-party summaries, not Etsy's own docs, and may be stale or incomplete |
| **Relevance verified independently?** | ❌ **No.** Retrieved from search summaries, not from Etsy documentation directly |
| **Type** | **`DIRECT`** for cost/mechanics · **`INFERRED`** for commercial suitability |
| **Not sufficient for** | That Etsy buyers want business tools · that a new shop gets impressions · that $6 buys 30 *informative* attempts |

**Adversarial check — technically accurate but economically misleading if:**

- **Offsite Ads fees** apply. Etsy charges 12–15% on offsite-ad-attributed sales, mandatory
  above a revenue threshold. **I never examined this**, and it would materially change unit
  economics.
- The $0.20 listing fee is accurate but **not the cost of an experiment**. A listing with zero
  impressions costs $0.20 and teaches nothing about the product — only about ranking. The true
  cost per *informative* attempt is unknown.
- "30 experiments for $6" is arithmetic, not a claim that 30 listings get 30 exposures.

**Verdict: NOT ADMISSIBLE as commercial evidence.** Admissible as cost/mechanics evidence
only, and even then must be re-verified at Etsy's own documentation. The load-bearing
commercial claim is `INFERRED` and unsupported.

---

## 2. CodeCanyon / Envato marketplace figures

**Metrics:** 2.3M WordPress plugin sales · $70M+ gross since 2009 · 97.6% of plugins earn
<$1,001/month · average annual sales $3,838 · 7 items >$10k/month · 70% sales decline
2018–2023 · flat 50% author share from July 2026.

| Question | Answer |
|---|---|
| **Measures** | Aggregate historical sales on **one marketplace**, as reported in a **Freemius blog analysis** |
| **Proposition** | Used earlier as "people pay for WordPress functionality" |
| **Inferential distance** | Short for "people have bought WP plugins on CodeCanyon." **Long** for "a Factory plugin would sell" |
| **Entity correspondence** | ⚠️ **Weak.** Not retrieved from Envato's API — second-hand from a vendor's blog. Item-level correspondence unverifiable |
| **Alternatives** | $70M **since 2009** is ~$4–5M/year across thousands of items. "Average $3,838" is a **mean skewed by top sellers**; the median is likely far lower and was not reported |
| **Relevance verified independently?** | ❌ **No.** Single secondary source |
| **Type** | **`PROXY`** — and it was used as though `DIRECT` |
| **Not sufficient for** | Current market conditions · what any *specific* niche earns · that a new entrant can sell anything |

**Adversarial check — technically accurate but economically misleading if:**

- **All of it is historical.** 2.3M sales span 15+ years, and the same source reports a **70%
  decline**. A true cumulative figure can describe a market that no longer exists.
- **Freemius sells WordPress monetization services.** Their analysis has an obvious interest in
  the WordPress plugin economy looking substantial.
- The **50% commission change post-dates the earnings data**, so historical author earnings
  overstate what a new author would now receive by roughly half.
- "97.6% earn under $1,001/month" is the number that should have dominated the reading, and I
  led with the $70M instead.

**Verdict: ADMISSIBLE ONLY as `PROXY` evidence for the narrow claim** that a paid market for
WordPress plugins has historically existed on one marketplace. **Not admissible** for current
market size, niche-level demand, or new-entrant prospects. My earlier use overstated it.

---

## 3. Freemius conversion benchmarks

**Metrics:** 2.1% feature-gated freemium conversion · 2–4% typical · 18.78% free-trial
conversion · 7,500 installs for "meaningful income."

| Question | Answer |
|---|---|
| **Measures** | Aggregate conversion rates across Freemius-hosted products |
| **Proposition** | "~48 installs yields a first paying customer" |
| **Entity correspondence** | ❌ **Not verified.** No niche-level correspondence whatsoever |
| **Alternatives** | Benchmarks come from **established plugins with tuned onboarding**, not new entrants. Survivorship bias: failed plugins may not appear in the denominator at all |
| **Relevance verified independently?** | ❌ No. Single vendor source |
| **Type** | **`INFERRED`** |
| **Not sufficient for** | Any specific product's conversion · a new plugin's conversion · anything niche-level |

**Adversarial check:** 2.1% could be perfectly accurate *as an average over surviving products*
while a new unknown plugin converts at zero. Averages over survivors say nothing about
entrants — and I used it to compute "48 installs per sale," which is exactly that error.

**Verdict: `INFERRED` only.** Usable to size a hypothesis, never to support one.

---

## What survives the audit

| Evidence | Verdict |
|---|---|
| Etsy fees and platform mechanics | `DIRECT`, but **re-verify at source** |
| Etsy suitability for business tools | ❌ **`INFERRED`, unsupported** — the load-bearing gap |
| CodeCanyon historical market existence | `PROXY`, narrow claim only |
| CodeCanyon as current opportunity | ❌ **Not admissible** |
| Freemius conversion benchmarks | `INFERRED`, sizing only |
| WordPress `active_installs` as niche demand | ❌ **Invalid** (`docs/SCANNER_DEFECT.md`) |
| WordPress directory reach for new plugins | `PROXY`, adverse, single source |

**Net: Factory currently holds no `DIRECT` evidence of demand for anything.** It holds cost
and mechanics evidence, and proxies about markets in general.

That is the honest position, and it is exactly why H0 generation plus cheap real-world tests is
the right next move rather than more desk research. **The missing evidence is the kind that
only a real listing in front of real strangers produces.**

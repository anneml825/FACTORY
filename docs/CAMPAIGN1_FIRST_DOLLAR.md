# Campaign 1, reconsidered around the first arm's-length dollar

**Date:** 2026-08-18 · **Cost: $0.00** · Owner capital consumed: **$0.00**

---

## Part 1 — the charge is correct. Three times, same error.

**Q19/Q2/Q20 — yes, this was streetlight bias, and I can trace the pattern precisely:**

| Round | Surface chosen because | Product then derived to fit |
|---|---|---|
| 1 | WordPress.org exposed free `active_installs` | WordPress plugins |
| 2 | Gumroad looked like free marketplace discovery | Etsy-seller workbook |
| 3 | **itch.io exposes free impressions + CTR** | **game-development asset** |

**Q20 — what independent evidence produced the game-dev hypothesis before itch.io was
selected? None.** I selected the measuring instrument and reverse-engineered the business from
it. Three times.

**Q4/Q21 — you have written the answer, and I accept it: itch.io is a distribution primitive,
not a product determinant.** It stays in the toolkit awaiting an independently promoted H0
whose buyer genuinely lives there. **Q3 — no current H0 independently points to itch.io.**

**Q5–Q9 — I withdraw "monetization is the easier question."** Factory has zero arm's-length
revenue and therefore no empirical basis for it. **Q6 — 200 impressions and free downloads
would establish nothing about willingness to pay.** **Q8 — no, Factory has never demonstrated
anywhere that a stranger will pay for something it autonomously created.** **Q9/Q22 — so
designing Campaign 1 to avoid testing that, and spending 28 days of the commercial window
doing so, was exactly backwards.**

---

## Part 2 — Q10–Q14. itch.io *can* do it, and that still doesn't justify it.

**Retrieved:** itch.io supports paid products from new sellers at **$0 upfront**, with
**pay-what-you-want where the minimum can be $0 plus a suggested price**, payouts direct to
Stripe/PayPal. First-time sellers face longer review and some new-account limits.
**30% of all money spent on itch.io is paid *above* the minimum.**

**Q12/Q13/Q23 — yes: PWYW tests arrival and payment concurrently**, measuring impressions →
CTR → downloads → voluntary payment in one structure.

**But answering Q11 as asked: this does not make a game-dev asset the right product.** The
mechanism is sound; the product selection was still backwards. **Q4 governs.**

---

## Part 3 — Q15/Q16. Which H0s have $0 arrival *and* a path to payment?

The discriminating property, added to generation rather than filtering:

> **The buyer must ARRIVE INTENDING TO PAY.** Free-norm surfaces (itch.io assets, npm,
> galleries, WordPress.org) produce adoption. Surfaces where the visitor is mid-purchase
> produce transactions.

Two independently-generated families qualify — both from the **volume-of-work** principle,
generated *before* any of this surface analysis:

**DriveThruRPG (v4 `w061`–`w068`, refined as v5 `z01`–`z03`).** Retrieved: **no publisher
account required — a regular customer account is enough to publish.** $0 upfront, **65–70%
royalty**, instant PDF fulfilment. Visitors are browsing a paid TTRPG PDF store.

**Amazon KDP (v4 `w001`–`w030`, refined as v5 `z04`–`z07`, `z09`, `z10`).** $0 to publish, 70%
royalty band $2.99–$12.99, immediate search indexing with no sales gate. Amazon searchers are
buyers. Weakness: **no impressions data**, so `NO_DISTRIBUTION` and `WEAK_CLICK_THROUGH` are
not cleanly separable.

**Ranked by expected time to first informative *commercial* interaction:**

| # | id | Offer | $ | Arrival | Entry | Signal |
|---|---|---|---|---|---|---|
| **1** | `z01` | Ready-to-run one-shot adventure for a named system + level band | $4.95 | DriveThruRPG system/category search | **$0** | **30d** |
| 2 | `z02` | 500-entry random-table supplement, one genre | $3.95 | DriveThruRPG supplement search | $0 | 30d |
| 3 | `z03` | Solo-play conversion supplement for a named system | $5.95 | DriveThruRPG solo category | $0 | 30d |
| 4 | `z05` | Practice question bank for a low-volume certification | $9.99 | Amazon search by cert name | $0 | 45d |
| 5 | `z07` | Consolidated maintenance reference for one equipment model | $6.99 | Amazon search by model | $0 | 45d |
| — | `z08` | Battlemap packs | — | — | — | **KILLED — aesthetic bar** |

`z08` was killed by the generator's own screen on the aesthetic quality bar — the standard I
failed to apply to v047, now applied consistently.

---

## Part 4 — the answer to the central question

> **What is the smallest legitimate experiment Factory can run that could result in a stranger
> giving Factory its first arm's-length dollar?**

**Publish one ready-to-run TTRPG one-shot adventure PDF on DriveThruRPG at $4.95.**

| | |
|---|---|
| **Buyer** | A GM running a named system who needs a session in hand this week |
| **Problem** | Session prep is hours of work; ready-to-run material is scarce for less-popular systems |
| **Offer** | Complete one-shot: hooks, encounters, stat blocks valid for the system, handouts, GM notes |
| **Price** | $4.95 — Factory receives 65–70% |
| **Arrival** | DriveThruRPG category + system search. **The visitor is inside a paid PDF store, mid-purchase-decision** |
| **Fulfilment** | Instant PDF download, fully automated, zero owner touch |
| **Cash cost** | **$0.00** |
| **Owner setup** | **~15 min, one-time** — DriveThruRPG account + payout. No recurring work |
| **Signal** | 30 days |
| **Factory advantage** | Producing many system × level × genre variants is pure volume work no single author will do |
| **Value QA** | **Functional and checkable**: do the stat blocks conform to the system's rules? Is the adventure internally consistent? Does it run in the stated time? Not an aesthetic judgement |
| **Cheapest falsification** | Publish 3 variants. Zero sales in 30 days → kill the family |

**Why this is the smallest experiment that can produce a dollar:** it is $0, fulfilment is
automatic, the buyer arrives intending to purchase, and **the outcome measured is a
transaction, not an impression.**

### Evidence classification, stated honestly

| Claim | Type |
|---|---|
| DriveThruRPG is $0, no publisher account, 65–70% royalty | **DIRECT** — retrieved from the platform's own help pages |
| TTRPG buyers habitually purchase PDFs | **PROXY** — the store's existence and paid-category structure |
| **A new publisher gets meaningful category visibility** | **INFERRED — NOT VERIFIED** |
| This specific adventure will sell | **SPECULATIVE — pure H0** |

**The unverified item is the known risk, and it is precisely what the experiment measures.**
Further desk research on it now costs more than the experiment, which is $0 — so per the
owner's instruction, the experiment wins.

---

## Part 5 — Q25–Q30. The real answer: build the pipeline, not the product.

**Q27 — why hasn't Factory treated offer generation and deployment as core capability?**
Because I kept treating each candidate as *the business* and infrastructure as overhead. That
is inverted. **Q25 — what makes distribution part of the architecture?** Products whose
*arrival is intrinsic*: a catalogue entry in a paid store where search is the discovery
mechanism, not a page hoping to be found.

**Q28/Q29 — the pipeline, and what is reusable:**

```
H0 → OFFER SPEC → ARTIFACT GEN → VALUE QA → PUBLISH → INSTRUMENT → ATTRIBUTE → KILL/ITERATE/SCALE
     [reusable]   [per-family]   [reusable]  [per-surface] [reusable] [reusable]  [reusable]
```

**Already built and reusable across every future experiment:** H0 schema and generation
(`src/ideas/`), cheap-rejection screen, Evidence Semantics Gate (`src/evidence/semantics.ts`),
cost-discipline guard (`src/experiments/cost-discipline.ts`), Capital Authority
(`src/capital/`), funnel taxonomy and failure classifier, pre-registered threshold evaluator.

**Not yet built:** artifact generator (one per product *family*, not per experiment), publish
adapter (one per *surface*), funnel recorder per surface.

**Q30 — yes.** With one family generator and one surface adapter, the marginal cost of H0 #100
or #500 is **model inference plus one API call**. That is the compounding asset, and it is why
`z01`–`z03` sharing one generator and one adapter matters more than which of them sells.

---

## Part 6 — Q24 and search state

**Q24 — I am not weakening the experiment.** Finalists exist that satisfy the full constraint
set: **$0 entry + purchase-intent arrival + paid offer + automated fulfilment + measurable
outcome + low maintenance.** No standard was lowered to produce them.

**Search state: `NOT YET FOUND`** — explicitly not `SEARCH EXHAUSTED` and not
`AUTONOMOUS THESIS FAILED`. 299 H0s generated; the search budget is nowhere near spent, and
three surfaces disproved is a method result, not a verdict on the thesis.

**Failure patterns recorded for generation:** free-norm surfaces produce adoption not payment ·
obvious tools for obvious audiences are already served · aesthetic quality bars are a Factory
weakness · unverifiable external facts are a product killer · surfaces gating discovery on
prior sales are unusable cold.

---

## Recommendation

**Run `z01`.** $0 cash, ~15 minutes of one-time owner setup, 30 days, and the measured outcome
is an arm's-length transaction rather than an impression.

**The single owner action, when requested:** create a DriveThruRPG account and complete payout
setup **at DriveThruRPG's own site**. No credential ever enters this session. I will bring that
request only once an artefact exists and has passed Value QA — an account with nothing to
publish is premature.

**Kill switch engaged. $50.00 intact.**

# Answering the WordPress Challenge

**Date:** 2026-08-18 · **Status: the WordPress selection does not survive this review intact.**

The owner asked twenty questions about whether WordPress is genuinely a money-making
opportunity or merely a data-rich search space. Answering them honestly changed my position.

---

## The headline

**I over-weighted data availability, and I cannot currently defend WordPress as a commercial
opportunity on retrieved evidence.**

Three things went wrong in my reasoning:

1. **I passed a search-cost test and treated it as a business selection.** The Data Economics
   Gate asks whether Factory can *search* cheaply. It does not ask whether the space is
   *profitable*. WordPress passing it means Factory can screen WordPress niches for $0. I
   allowed that to stand in for "WordPress is a good business," and those are different
   claims.

2. **Monetization was asserted, not retrieved.** I rated WordPress `FREEMIUM_NORMAL` as a
   hand-entered constant in my own probe, sourced from one blog summary, then let that
   constant decide the outcome. Every evidence figure in the selection is an *install* count.
   I had no retrieved evidence that anyone pays.

3. **I searched where the light was.** I probed platforms with public catalogues because
   catalogues are queryable — and platforms with public catalogues are disproportionately
   free-software ecosystems. The bias is structural, not incidental. Spaces where money sits
   closer to the surface (services, information products, direct response) were never probed
   *because they are hard to screen*, which is precisely the bias the owner is asking about.

And one new retrieved fact that damages the selection directly, below in Q11.

---

## 1. What exactly would Factory sell?

**I cannot answer this with retrieved per-niche evidence yet, and I will not invent plugin
ideas to fill the gap.** The opportunity scanner that produces incumbent-weakness data is
queued in GitHub Actions and has not run; Actions has been queuing with multi-hour delays,
and this container's egress policy blocks direct retrieval.

What I *do* have is the WordPress gate run (2026-08-18, `state/WP_GATE.md`) — real retrieved
top-plugin install counts per query:

| Query | Top plugin active installs |
|---|---|
| photographer client proofing gallery download | 300,000 |
| equipment rental availability calendar deposit | 50,000 |
| veterinary appointment reminder sms | 20,000 |
| trade show exhibitor floor plan booth | 20,000 |
| allergen labels restaurant menu items | 5,000 |
| qr code ticket check in door scanning | 4,000 |
| salon stylist commission tracking | 2,000 |
| church sermon archive audio series | 1,000 |
| dental patient intake form hipaa | 800 |
| gym class capacity waitlist booking | 300 |
| library book lending due date | 200 |
| recurring donation receipt annual statement nonprofit | **0** |
| school parent permission slip signature | **0** |
| winery wine club shipment scheduling | **0** |
| boat marina slip reservation | **0** |
| farm csa share subscription box weekly | **0** |
| auto repair shop service history vehicle | **0** |
| brewery tap list beer abv update | **0** |
| hoa dues payment tracking resident | **0** |

**8 of 20 long-tail queries return zero matching plugins.** That is genuinely interesting —
nobody has built for them — and genuinely ambiguous: an unserved niche and a niche nobody
wants look identical from here.

**What I am missing to name a product:** incumbent quality, staleness, and support-resolution
data. Demand without incumbent weakness is a solved problem, not an opportunity. Naming
products before I have that would be exactly the "plausible business ideas" failure mode the
Master Codex prohibits.

## 2. Who specifically would pay?

Unanswerable for the same reason. Naming a buyer persona without the incumbent-weakness data
would be fiction dressed as analysis.

## 3. How does a WordPress plugin actually make money?

Plain English, complete path:

A site owner has a problem. They search the plugin directory — either on WordPress.org or,
more commonly, from inside their own WordPress admin. They see results ranked largely by
active installs and ratings. They install a free plugin, try it, and either keep it or delete
it within minutes. If they keep it and later hit a limit — a feature the free version does
not include — they click an upgrade link that takes them **off WordPress.org** to the
developer's own site. There they pay by card. A licensing service (Freemius, EDD, or similar)
issues a licence key, the plugin validates it, and the paid features unlock. Money reaches
the developer after the payment processor's fees and payout schedule.

**Two structural facts follow from that path, and both hurt:**

- WordPress.org hosts free plugins only. **All payment infrastructure is off-platform** and
  must be built and paid for separately — unlike Shopify or Atlassian, which bill on the
  developer's behalf.
- The upgrade moment happens *after* install, *after* sustained use, and *after* hitting a
  deliberate limit. It is a long causal chain, and each link is a place the funnel dies.

## 4. Free vs paid — and why not stay free?

The honest answer is that this is the hardest design problem in the model, and I have not
solved it. Feature-gating has to be severe enough that a real user hits the wall, and
generous enough that they install and keep the plugin at all. Get it wrong in one direction
and nobody upgrades; wrong in the other and nobody installs.

I have no retrieved evidence about which gates work in which niches. This is a genuine gap.

## 5. Evidence of willingness to PAY — the gap you identified

You are right, and this was the weak joint.

**What I now have (retrieved 2026-08-18, via search):**

- **2.1%** — feature-gated freemium free-to-paid conversion, the low-single-digit industry
  benchmark
- **2–4%** — typical freemium conversion range
- **18.78%** — average conversion for a WordPress plugin free trial without a payment method
- **7,500 installs at $49–149/yr** — the level at which a freemium plugin produces
  "meaningful supplemental income"

**Recalculation this forces:** at 2.1%, a **first** paying customer needs roughly **50
installs**, not 7,500. The 7,500 figure is for meaningful income, not first evidence. That
materially *improves* the case for reaching E3 inside 90 days, and I had it wrong earlier.

**What this evidence is NOT:** all of it comes from Freemius, a company that sells WordPress
monetization services and has an obvious interest in the numbers looking good. It is
vendor-published, not independent. And **none of it is niche-specific** — I have no evidence
that anyone pays for *veterinary appointment reminders* specifically.

**The strongest willingness-to-pay evidence available would be CodeCanyon sales counts**,
which publish actual purchase numbers per item. I have not retrieved them. That is the single
most valuable missing measurement in this whole analysis.

## 6. Existing paid/freemium competitors and what they gate

Not retrievable from the WordPress.org API, which exposes no pricing or upgrade data. Would
require retrieving competitor pricing pages per niche. Not done. **Unanswered.**

## 7. What weakness would Factory exploit?

The intended answer is the scanner's opportunity signature: incumbents that are unmaintained
18+ months, rated below 80/100, resolving under 50% of support threads, or facing three or
fewer competitors. Those are concrete, retrievable weaknesses rather than "better UX."

**But I do not have the data yet**, so I cannot name a real one. Asserting a weakness without
it would be the generic claim you're warning against.

## 8. What quantitative evidence identified these opportunities?

Everything numeric above comes from `api.wordpress.org/plugins/info/1.2` with retrieval
timestamps, in `state/WP_GATE.md` and `state/wp-gate.json`. The stratum separation was
5,000,000 (head) / 100,000 (mid) / 800 (long tail).

**That evidence identifies where demand exists. It does not identify an opportunity**, because
it says nothing about whether incumbents are beatable or whether anyone pays.

## 9. Realistic conversion funnel

```
directory search impression   → NOT OBSERVABLE (WordPress.org publishes no impression data)
→ plugin page view            → NOT OBSERVABLE
→ install                     → observable (active_installs, bucketed and lagging)
→ retained active use         → partially observable (installs net of churn)
→ encounters paid feature     → observable only with own telemetry
→ clicks upgrade              → observable on own site
→ purchase                    → observable
```

**The top two stages are invisible.** `EXPERIMENTAL_PROTOCOL.md` §6 requires denominators,
and this funnel cannot produce the top one. A failed attempt could not be classified between
`NO_DISTRIBUTION` and `WEAK_OFFER_ENGAGEMENT` — the exact distinction that makes a Campaign
informative rather than a sequence of anecdotes.

## 10. Installs needed per paying customer

**Retrieved benchmark:** 2.1% feature-gated conversion → **~48 installs per paying customer**.
**Retrieved benchmark:** 7,500 installs → meaningful income.

**My estimate, clearly labelled as mine:** a brand-new plugin from an unknown author with no
reviews will convert *worse* than 2.1%, because that benchmark comes from established plugins
with tuned onboarding. I would plan on **100–300 installs for a first sale** and treat 48 as
a floor, not an expectation.

## 11. Time to reach that denominator — and the finding that undercuts the selection

**Retrieved, and this is the damaging one:** new WordPress plugins are reported as **not
passing install thresholds, with the directory not giving new plugins organic reach**.
Directory ranking is driven substantially by active installs relative to search frequency —
so a plugin with zero installs cannot rank, and therefore cannot get installs. Rich gets
richer.

Also retrieved: the normal pattern is a download spike followed by active installs **stalling
or declining**, because users install, try briefly, and delete without hesitation.

**This is not a magnitude problem. It is a threat to the mechanism itself.** My Stranger
Arrival Test passed on structure — named surface, retrieved usage evidence, measurable
outcome. But the retrieved evidence now says *that surface does not deliver reach to new
entrants*, and a new entrant is precisely what Factory is. Under `EXPERIMENTAL_PROTOCOL.md`
§1, a mechanism that cannot actually expose the offer fails the gate regardless of how well it
is documented.

## 12. Could Factory get arm's-length commercial evidence within 90 days?

**Honest answer: probably not, and I should not have implied otherwise.**

The chain is: build a plugin (days) → submit (queued) → review ~5 days, up to 10 → published
with zero installs → fight a ranking system that rewards existing installs → accumulate
50–300 installs → some fraction hit a paywall → ~2% convert.

Every stage is slow and the first is gated by a ranking mechanism documented as unfriendly to
new plugins. Reaching a *first sale* in 90 days would require the cold-start problem to be
milder than the retrieved evidence says it is.

## 13. How many independent experiments in 90 days?

**3–5, not 30.**

Constraints: ~5 days review each (1–10 observed range); bulk submission risks being read as
spam and losing the account, which would end the Campaign rather than teach anything; each
plugin needs 30–60 days of exposure before its install count means anything.

`EXPERIMENTAL_PROTOCOL.md` §4 targets ~30 attempts to build a meaningful denominator.
**This surface supports roughly a sixth of that**, and each attempt has an unobservable
top-of-funnel. That is a weak experimental programme by the protocol's own standard.

## 14. Cost of one meaningful experiment

| Item | Cost |
|---|---|
| Plugin hosting on WordPress.org | **$0** |
| Evidence/screening | **$0** (free API) |
| Scheduler / CI | **$0** |
| Model inference to generate + QA a plugin | **My estimate: $1–5** (currently unmetered — a real gap) |
| Licensing/payments infrastructure (Freemius or MoR + landing page) | shared across attempts; **$0 upfront**, percentage on sale |
| Domain for the upgrade page | **~$10–12/yr** if required |
| Payment fees | only on a sale |

**Marginal cash cost per attempt is genuinely low — plausibly under $5.** This is the
strongest thing about WordPress, and it is not nothing. Cheap attempts are what the Master
Codex asks for. But §5 also warns that a cheap attempt that cannot generate a meaningful
denominator is uninformative rather than efficient, and that is the risk here.

## 15. Maintenance and support burden

**This is a serious autonomy problem and I under-weighted it.**

WordPress users file support threads in public forums, on the plugin's own listing, and rate
plugins publicly based partly on responsiveness. My own opportunity signature *uses* poor
support resolution as a weakness to exploit — which means support responsiveness is
competitively material in this ecosystem. Factory would inherit that obligation.

Support requests are unpredictable, often require judgement, and arrive on the public record
where ignoring them damages ranking. WordPress also updates core regularly, and plugins must
be maintained for compatibility.

**Under `EXPERIMENTAL_PROTOCOL.md` §12, all of that would count as `OPERATING` or
`MAINTENANCE_DEBUG` after `COMMERCIAL_CLOCK_START`** — the categories that must stay near
zero. A *successful* WordPress plugin generates more support load, so success makes the
autonomy problem worse. That is a structurally bad shape for Factory's mission.

## 16. Required commerce infrastructure

Deliberately not answered — that ordering was the owner's correction and it was correct.
Infrastructure follows from the product, and I do not yet have a product.

Noting only the structural constraint: whatever the offer, WordPress.org cannot process the
payment, so payment infrastructure is necessarily off-platform.

## 17. Strongest non-WordPress space — direct comparison

**Honest answer: I have not found a clearly better one, and I now think that says more about
where I looked than about the world.**

| Dimension | WordPress | Atlassian Marketplace |
|---|---|---|
| Willingness-to-pay evidence | Vendor benchmarks only, no niche data | **Paid apps are the norm; business buyers with budgets** |
| Payment infrastructure | Off-platform, self-built | **Atlassian bills and remits** |
| Evidence quality | **Strong** — real installs, open API, permitted | Weak anonymously (listing counts only); real metrics need auth and appear vendor-scoped |
| Platform risk | Low | **High — Marketplace V2 API announced for shutdown 30 June 2026** |
| Time to first test | ~5 day review | 10–15 business days + partner verification |
| Uncapped cost exposure | None | **Forge consumption billing requires a payment method** |
| Validation velocity | 3–5 attempts / 90 days | 2–3 attempts / 90 days |

Atlassian is better on the thing that matters most (people demonstrably pay) and worse on
almost everything else, including a sunset API and uncapped billing exposure.

**Neither is good.** That is the honest comparison.

## 18. Genuine opportunity, or clean data?

**Substantially the latter.** Answered at the top. The bias is structural: I probed catalogue
platforms because catalogues are queryable, and queryable catalogues skew heavily toward
free-software ecosystems. Every space that scored well on evidence scored badly on
monetization, and I resolved that tension by picking the least-bad on monetization among the
data-rich — rather than asking what a space with strong monetization and weak public data
would look like.

**How I tested for it:** insufficiently. I included Atlassian and Shopify as paid-norm
candidates, which was a real attempt. But both were evaluated *on whether I could screen
them*, and both were eliminated on evidence availability. That test cannot discover a good
business in an unscreenable space — it can only ever return screenable ones.

## 19. If WordPress's public data disappeared tomorrow?

**No. The commercial case would not stand.**

Strip out `active_installs` and what remains is: a directory whose ranking reportedly does not
give new plugins organic reach, an off-platform payment path, a support burden that grows with
success, a vendor-published conversion benchmark, and no niche-specific evidence that anyone
pays.

**That is not a compelling business case. It is a data-availability case.** This question was
the most useful one asked, and it answers itself.

## 20. The thesis in six plain sentences

*Stated as the strongest honest version, followed by whether I believe it.*

Factory makes small, sharply-targeted WordPress plugins that do one operational job for one
kind of small business — the jobs where the directory currently returns nothing, or returns
something abandoned. Small-business owners and the freelancers who build their sites want
them, because the job is real and the current answer is a spreadsheet or nothing. They find
them by searching the plugin directory from inside their own WordPress admin at the moment the
need arises. They get a working free plugin that solves the core job completely. They pay for
the part that scales it — multi-location, automation, integrations, or export. It should make
money because the plugin directory puts the offer in front of someone at the exact moment
they have the problem, and roughly 2% of people who adopt a free tool and hit its limit will
pay to remove it.

**Do I believe it?** The first five sentences are defensible. **The sixth is where it breaks**
— it assumes the directory delivers strangers to a new plugin, and the retrieved evidence says
it largely does not.

---

## What I recommend

**Do not build a WordPress plugin on this basis.** The gate WordPress passed measures search
cost, not profitability, and the two pieces of evidence that would justify a commercial bet —
niche-level willingness to pay, and cold-start reach for new entrants — are missing and
adverse respectively.

**Two things should happen before any space is committed to:**

1. **Retrieve real purchase evidence.** CodeCanyon publishes actual sales counts and prices
   per item for WordPress plugins. That is direct willingness-to-pay data at niche level, and
   it is the highest-value measurement available. It would also test the WordPress case
   properly rather than on vendor benchmarks.

2. **Deliberately evaluate spaces that are hard to screen but where money is obvious.** The
   current method structurally cannot find them. Correcting the bias means accepting that E1
   evidence may need a different — possibly paid — data source, and that is the circumstance
   in which a capital request would be genuinely justified rather than premature.

**No capital has been spent, no account created, and nothing built.** The cost of discovering
all of this was $0, which is the Data Economics Gate working as intended — just one level up
from where I was applying it.

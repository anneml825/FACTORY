# Rainforest reconciled against the approved $50 — no purchase made

**2026-08-24.** Requested before any capital ask. Nothing has been purchased,
subscribed to, or signed up for.

## Correction first: "$23/month" was wrong in a way that matters

My previous recommendation said Rainforest Hobbyist is **$23/month**. The page
says **"$23/month Billed Annually"**, and the tier detail — captured this round,
missing last round — reads:

> Hobbyist **$23/month Billed Annually** … What's Included? **500 credits/month**,
> +$0.06 per extra credit, 1 custom zip/postal code

So the commitment is **$276/year**, not $23. Every tier on that page is quoted
"Billed Annually" behind a Monthly/Annual toggle advertising **-20%**, which puts
month-to-month at roughly **$28.75/month** if it is offered at all — unverified.

**$276 is 5.5× the entire authorized capital base.** The recommendation as I
stated it was not affordable, and I should have captured the billing term before
making it.

## 1. How much of the $50 has been spent or committed

**$0.00 spent. $0.00 committed. $0.00/month recurring burn.**

From `ROADMAP.md`: *"Fixed monthly burn: $0.00. Owner capital consumed: $0.00.
Owner capital authorized: $50.00 (2026-08-17) — allocated but entirely unspent."*

Two facts matter more than the zero:

- **The buckets have never been instantiated.** `ROADMAP.md` records
  *"Live database instance: `BLOCKED` — needs owner Neon account."* The Capital
  Authority passes 19/19 checks including a 40-worker concurrency race, but
  **against a local test PostgreSQL**. No `capital_bucket` row exists anywhere
  outside a test fixture. The $50 and its split are a **documented intent, not a
  system state**, and a `reserve()` call today has nothing to reserve against.
- **The kill switch is engaged.** `ROADMAP.md`: *"Paid activity: HALTED."*

Canopy consumed **$0.00** — it ran entirely inside a free tier, on a plan
(Hobby) that cannot bill above its allowance.

## 2. Which bucket Rainforest belongs to

**`DISCOVERY`** — *"Research, data retrieval, screening"* (`FINANCIAL_CONTROLS.md`).
That is exactly what a book-market data API is. It is **not** `INFRASTRUCTURE`,
which is reserved for *"unavoidable operating cost"*; a research subscription is
elective by definition, and classifying it as unavoidable would be the kind of
reclassification the bucket system exists to prevent.

Bucket membership does not settle the question, though, because a subscription
also trips a rule that applies regardless of bucket — see §4.

## 3. What would remain — and an honest gap in the record

**I cannot answer this precisely, because the split is not written down anywhere
in a resolvable form.** The only record is nine characters in one roadmap line:

> `Owner capital authorization + buckets | DONE — $50 allocated 30/10/10, reserve from earnings`

There is **no mapping of 30/10/10 to bucket names** in `ROADMAP.md`,
`FINANCIAL_CONTROLS.md`, `CONSTITUTION.md`, or the specs. Both readings are
defensible and they give opposite answers:

| Reading | DISCOVERY | After one $23 month | After $276 annual |
| --- | ---: | ---: | ---: |
| A — table order (DISCOVERY $30) | $30 | $7 left | **impossible** — exceeds the whole $50 base |
| B — validation-weighted (DISCOVERY $10) | $10 | **refused** — `InsufficientBucketFunds` | **impossible** |

Under reading B the Capital Authority would refuse even a single month outright.
Under reading A a single month would consume **77% of discovery** for one screen.
Under annual billing, both readings fail. `VALIDATION` and `INFRASTRUCTURE` are
untouched either way — and cannot be drawn on, because **buckets are
non-transferable and there is deliberately no transfer function in the
codebase**.

**Recommended owner action regardless of Rainforest: state the 30/10/10 mapping
explicitly.** It is currently ambiguous in the only place it is recorded.

## 4. Is it already authorized? No — on four independent grounds

1. **`FINANCIAL_CONTROLS.md` is explicit:** *"Agents may not autonomously
   subscribe to new paid services. New recurring commitments are owner
   approvals."*
2. **The burn line is the point of the rule:** *"$20/month consumes the entire
   capital base in ten weeks with zero experiments run."* At $23/month that is
   **8.7 weeks**; at $276 annual it is immediate and total.
3. **The kill switch is engaged.** Paid activity is HALTED.
4. **There is no live bucket to reserve against.** Even a fully approved purchase
   could not currently be routed through the Capital Authority — it would have to
   bypass the control that was built to govern it, which is worse than not
   spending.

A compliant approval must also specify what `FINANCIAL_CONTROLS.md` requires:
reusable capability · expected information gain · owner labor curve · minimum
commitment · **cancellation path** · maximum downside. The minimum commitment and
cancellation path are precisely what the annual billing term makes load-bearing,
and I have not verified either.

## 5. Can something cheaper answer the first KDP selection question?

**Probably yes, and it should be tried before any commitment.**

The first selection question needs roughly **36–40 requests**: the Books root
plus its 35 subcategory bestseller charts. That is a small number, and it fits
inside every cheaper option below.

| Option | Cost | Status |
| --- | --- | --- |
| **Rainforest free trial** | **$0** | Their FAQ, verified this round: *"Can I try it for free? Absolutely! Start a free trial to see results instantly."* Credit allowance **not stated** on the page |
| Traject Data "Amazon product data" | **"Starting at $18 per month"** | Verified on trajectdata.com/pricing — a lower entry point than Hobbyist. Terms and credit count unverified |
| Hobbyist | $23/mo **billed annually** = $276/yr | 500 credits/month — ~12× more than the screen needs, on the longest commitment |

**The screen needs ~40 requests once.** Paying $276/year for 6,000 annual credits
to run a 40-request question is the wrong shape of purchase, and the free trial
plausibly answers it for nothing.

## Recommendation

**Do not purchase.** In order:

1. **Resolve the 30/10/10 mapping** — needed for any future capital decision, not
   just this one.
2. **Try the free trial first.** If its allowance covers ~40 requests, the first
   KDP selection question is answerable at **$0** and no capital decision is
   needed at all. This is an owner-only action: account creation is not something
   Factory may do autonomously.
3. **Only if the trial is insufficient**, price the $18/month Traject entry point
   and confirm whether month-to-month billing exists, then bring a compliant
   recurring-cost request with the cancellation path verified.
4. **Independently: the Capital Authority still has no live database.** Until a
   bucket exists, no spend can be governed by it. That is a prerequisite for any
   purchase, and it is an owner action (`ROADMAP.md` marks it `BLOCKED`).

Nothing purchased. No account created. No credential requested. No capital
requested.

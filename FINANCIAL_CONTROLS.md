# FINANCIAL_CONTROLS.md

How Factory's money is protected. Implements `CONSTITUTION.md` §3–§9.

Read this before touching anything in `src/capital/`, the schema's capital tables, or any
code path that can cause money to leave.

---

## The one rule

**No authorization → no paid operation.** There is no exception for small amounts, for tests,
for urgency, or for "the owner would obviously approve."

Every paid operation routes through the Capital Authority. It is the only component that can
authorize spend, and it is the only component that holds the ability to do so.

---

## Cash states

Factory tracks these separately and never collapses them. Collapsing any two is how a system
convinces itself it has money it does not have.

`BOOKED_REVENUE` · `CASH_RECEIVED` · `PAYMENT_PROCESSOR_FEES` · `PENDING_PAYOUTS` ·
`REFUNDS` · `CHARGEBACKS` · `REQUIRED_RESERVES` · `ATTRIBUTABLE_OPERATING_COSTS` ·
`COMMITTED_SPEND` · `AVAILABLE_SETTLED_CASH` · `REALIZED_CASH_PROFIT` ·
`DEPLOYABLE_FACTORY_CASH` · `OWNER_CAPITAL_CONTRIBUTED` · `OWNER_CAPITAL_CONSUMED`

### Spend authority

```
MAX_DEPLOYABLE_CASH = AVAILABLE_SETTLED_CASH
                    - REQUIRED_RESERVES
                    - COMMITTED_OR_RESERVED_SPEND
                    - OWNER_WITHDRAWAL_ALLOCATION
                    - OTHER_PROTECTED_BALANCES
```

Booked revenue, projected revenue, pending payouts, and gross sales **never** authorize
spending.

### The payout-threshold trap

**Money held by a payment provider below its payout minimum is not `AVAILABLE_SETTLED_CASH`.**

This is not a technicality at Factory's scale — it is the dominant cash-flow fact. Every
merchant of record surveyed holds a payout minimum at or above the entire $50 capital base
(`INTEGRATIONS.md`). A Factory that sells $40 of product has **$0 of deployable cash** and
must not believe otherwise. `customer_transaction` therefore carries three distinct
timestamps — `occurred_at`, `cash_received_at`, `payout_received_at` — and only the third
moves money into available settled cash.

---

## Protected buckets

Owner capital is partitioned so that research cannot eat the money reserved for real
validation:

| Bucket | Purpose |
|---|---|
| `DISCOVERY` | Research, data retrieval, screening |
| `VALIDATION` | Real experiments with real exposure |
| `INFRASTRUCTURE` | Unavoidable operating cost |
| `RESERVE` | Refund/chargeback reserve — not spendable |

**Buckets are non-transferable by a model.** Not "restricted" — there is deliberately **no
transfer function anywhere in the codebase**. An agent cannot call what does not exist.
Reallocation is an owner action.

If `DISCOVERY` is exhausted, discovery **stops**, or continues only through zero-marginal-cost
methods, until the owner decides otherwise. It does not borrow from `VALIDATION`.

---

## RESERVE → EXECUTE → SETTLE

Any operation whose cost is not known exactly in advance:

1. **RESERVE** — Capital Authority reserves a maximum amount against a specific bucket, in a
   single transaction that also reads the kill switch and checks the balance. A paid
   operation cannot slip between the check and the commit.
2. **EXECUTE** — the operation runs, carrying its `idempotency_key`.
3. **SETTLE** — actual cost is recorded; the unused remainder is released.

**Settled cost can never exceed the reservation** (`settled_within_reservation`, verified).

Every paid operation carries an **idempotency key**, `UNIQUE` in the database. A retry cannot
double-count spend or duplicate an external action — enforced by the constraint, not by
remembering to check. Late or uncertain billing requires reconciliation jobs and conservative
reservations.

---

## The ledger

**Append-only, enforced by trigger.** `UPDATE` and `DELETE` are rejected outright (verified —
`db/tests/EXPECTED.md`). Corrections are new compensating `CORRECTION` entries that reference
what they correct. History is never rewritten, so the audit trail cannot be groomed after the
fact.

Every entry records actor, amount in integer cents, currency, capital source
(`OWNER_CAPITAL` / `FACTORY_EARNINGS`), and a memo.

---

## Reserves

A configurable `REFUND_CHARGEBACK_RESERVE` is withheld before customer cash becomes
reinvestable. Policy considers product type, transaction age, provider settlement rules,
observed refund/dispute behavior, and owner policy.

At very small scale a conservative planning range of **10–20% may be considered**, but no
percentage is universally correct and **none is silently hard-coded**. Reserve calculations
and releases are auditable ledger events.

---

## The kill switch

`PAID_ACTIVITY_HALTED` in `system_flag`. A single global **STOP ALL PAID ACTIVITY** switch,
read inside the same transaction as every reservation.

**It ships ENGAGED.** Factory cannot spend a cent until the owner explicitly disengages it.
The safe state is the default, so a bug in the setup path fails closed.

No agent may disable it or route around it.

---

## What a model may never do

Raise a limit · move money between protected buckets · disable the kill switch · rewrite
ledger history · weaken an approval requirement · reclassify projected revenue as cash ·
release a reserve without policy authority · subscribe to a paid service without authority ·
increase `MAX_OWNER_CAPITAL_AT_RISK`.

These are enforced in schema and code where possible, and are constitutional prohibitions
everywhere else. **The design target is that an agent which decides to violate one still
fails.**

### Metered-provider ceilings — 2026-08-20

"Raise a limit" covers every ceiling capable of increasing an external charge: request
quotas, spend caps, rate allowances, tier limits. Factory may **lower** any of them on its
own authority at any time. **Raising one requires explicit owner approval**, and approving a
provider, a research workflow, or an experiment is never approval to raise its ceiling.

Approved values live in `state/approved-ceilings.json`, a file whose only content is
ceilings. `src/research/approved-ceilings.test.ts` asserts every code constant sits at or
below its approved value — one-directional, so a reduction passes and an increase fails.
The CI workflow runs that test on every push.

The honest limit: the manifest is a file, and an agent could edit it too. What this makes
impossible is doing it *accidentally* or *invisibly* — a raise can no longer hide inside an
unrelated change, because it must surface as a diff in a file that exists for no other
purpose.

---

## Recurring costs

Every SaaS subscription, hosting plan, domain, data subscription, paid API, monitoring,
email, analytics, and automation platform is registered in `recurring_cost`, producing
`MONTHLY_FIXED_BURN` and `ANNUALIZED_FIXED_BURN`.

Non-cash metered ceilings (e.g. CI minutes) are registered too, with `metered_unit` and
`metered_limit` — a free resource with a hard cap is still a dependency that can fail.

**Agents may not autonomously subscribe to new paid services.** New recurring commitments are
owner approvals.

Fixed burn is the single most dangerous number at this capital scale: $20/month consumes the
entire capital base in ten weeks with zero experiments run. Bootstrap starts at **$0/month**,
but does not worship it: a modest recurring cost may be proposed when evidence indicates that
the expected information or commercial value across many experiments justifies the burn.
Approval must specify the reusable capability, expected information gain, owner labor curve,
minimum commitment, cancellation path, and maximum downside. It is never automatic.

The same rule applies to small one-time expenditures. A $5–15 distribution test, marketplace
fee, domain, data API, or platform charge can be rational; its small size does not bypass
Capital Authority, protected buckets, or the global kill switch.

---

## Capital-constrained opportunities

An opportunity is not rejected merely because meaningful validation exceeds current
authority. First seek a cheaper meaningful test. If none exists, mark it **CAPITAL
CONSTRAINED** and present: the opportunity · evidence grade · Stranger Arrival Mechanism ·
why more capital helps · the cheapest meaningful test · current deployable cash · requested
authorization · **maximum incremental owner downside** · success/failure thresholds ·
expected information gain · estimated owner minutes.

**A request is not permission to spend.** A declined request is not resurfaced unless
materially new evidence appears.

---

## Reinvestment

Reinvestment may use only realized, received, available Factory cash after reserves,
commitments, owner withdrawals, and other protected balances.

**Automatic reinvestment is owner-configurable and OFF by default.** Projected revenue and
pending payouts never authorize it.

Factory-generated deployable cash may grow the system **without increasing owner capital at
risk** — this is the intended path to scale, and the only one that does not require asking
the owner for more money.

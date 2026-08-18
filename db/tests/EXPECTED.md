# Invariant test — verified baseline

`db/tests/invariants.sql` asserts that the protections in `CONSTITUTION.md` are enforced by
PostgreSQL rather than by agent discipline. The test is written so that **failure is the
pass condition** for T1–T9: each block attempts a constitutional violation and must be
rejected by the database.

## Verified run

**Date:** 2026-08-18 · **Engine:** PostgreSQL 16 (GitHub Actions service) · **Result:** all 15 as expected.

| # | Attempted violation | Constitution | Rejected by |
|---|---|---|---|
| T1 | `UPDATE` a ledger entry | §8 no rewriting history | `reject_ledger_mutation()` trigger |
| T2 | `DELETE` a ledger entry | §8 no rewriting history | `reject_ledger_mutation()` trigger |
| T3 | Overdraw a bucket | §7 protected buckets | `bucket_not_overdrawn` CHECK |
| T4 | Overdraw via reserved+spent | §6 solvency | `bucket_not_overdrawn` CHECK |
| T5 | Reuse an idempotency key | §6 no double-spend on retry | `UNIQUE` constraint |
| T6 | Settle above the reserved max | §6 RESERVE→EXECUTE→SETTLE | `settled_within_reservation` CHECK |
| T7 | Insert a number with no source or retrieval time | §12 / Protocol §2 no invented metrics | `NOT NULL` on `source`, `retrieved_at`, `collection_method`, `reliability_limitations` |
| T8 | Start the commercial clock with unmet conditions | Protocol §10 | `clock_requires_all_conditions` CHECK |
| T9 | Owner override with no stated reason | Protocol §11 | `override_requires_reason` CHECK |
| T13 | Mutate a durable WATCH event | Constitution §12 / audit integrity | `reject_watch_event_mutation()` trigger |

| # | Operation that must succeed | Result |
|---|---|---|
| T10 | Insert a fully provenanced evidence signal | inserted |
| T10 | Settle a reservation within its maximum (80 ≤ 100) | settled |
| T11 | Start the clock once all seven conditions are true | started |
| T12 | Record rare owner labor as explicit `EXCEPTION` | inserted separately |
| T13 | Insert one signed WATCH inbox event before attempting mutation | inserted |

**Post-state confirmed:** kill switch ships `ENGAGED`; owner capital ceiling ships at `0`
cents; the ledger row survived both mutation attempts unmodified at its original 5000;
exactly one evidence row exists — the one with provenance.

## Phase E additions (verified separately)

Migration 004 adds two more database-enforced protections, covered by
`src/capital/inference-accounting.test.ts` against real PostgreSQL rather than by this SQL
script: `inference_usage` rejects `UPDATE` and `DELETE` via `reject_inference_usage_mutation()`,
and `inference_tranche` rejects a settlement above its reservation via
`settlement_within_reservation`. The `db/tests/run.sh` baseline above is unchanged.

## What this does and does not establish

**Does:** T7 is the load-bearing one. A model that decides to fabricate a search volume
cannot write it down, because a fabricated number has no source and no retrieval timestamp,
and the columns are `NOT NULL`. `EXPERIMENTAL_PROTOCOL.md` §2 is enforced by the schema
rather than by an agent choosing to comply.

**Does not:** this tests the *storage layer only*. Nothing prevents an agent from putting a
fabricated number into a text field, a report, or a commit message. Those paths are governed
by `AGENTS.md` §5 and are not machine-enforced. The schema narrows the hole; it does not
close it.

Also untested here: concurrent reservation races. The single-transaction discipline in
`ARCHITECTURE.md` ADR-3 is designed but unproven — it needs the Capital Authority code and a
concurrency test, which is Milestone 0A work.

## Reproducing

```bash
DATABASE_URL=postgres://…/scratch_db ./db/tests/run.sh
```

Writes test rows — point it at a scratch database, never at Factory state.

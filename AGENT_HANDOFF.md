# Agent handoff — Phase A MAKE + PUT + WATCH

**Date:** 2026-08-18

**Branch:** `codex/make-put-watch-dry-run`

**Status:** Phase A implemented and locally verified; Phase B prohibited pending owner review

**Cash spent:** $0.00

**Owner setup/operating minutes required:** 0 / 0

**External actions:** none

Read `AGENTS.md`, `CONSTITUTION.md`, `EXPERIMENTAL_PROTOCOL.md`, and the relevant subsystem
documents before changing this work.

## What is executable now

- `src/portfolio/types.ts` — typed `AssetManifest`, event, transaction, cost, and evaluation
  records.
- `src/portfolio/state-machine.ts` — explicit lifecycle and hard publication gates.
- `src/portfolio/renderers.ts` — deterministic attributed HTML and CSV fixture rendering,
  checksums, functional QA, and fixture-only Value QA.
- `src/portfolio/ports.ts` — provider-neutral MAKE, PUT, ARRIVE, and WATCH interfaces. Every
  adapter declares its maximum cost and receives an idempotency key where applicable.
- `src/portfolio/cost-control.ts` — zero-cost records plus fail-closed routing of every
  nonzero operation through the existing Capital Authority contract.
- `src/portfolio/fake-adapters.ts` — fake/local PUT, fixture MAKE/ARRIVE, and synthetic HMAC
  signing.
- `src/portfolio/watch.ts` — signature verification, duplicate/conflict detection,
  transaction attribution, fulfillment state, refunds, and disputes.
- `src/portfolio/evaluator.ts` — executable KEEP / ITERATE / KILL / INSUFFICIENT_SIGNAL policy.
- `src/portfolio/engine.ts` — the complete simulated lifecycle orchestrator.
- `state/PHASE_A_FIXTURE_CATALOG.html` — generated, visibly noncommercial two-item fixture
  catalog with no checkout.

## What remains simulated or unproved

- PUT is `fixture://` only. No file or listing was published externally.
- ARRIVE is a test contract only. No provider was selected; no E1 evidence or stranger
  exposure exists.
- Checkout, transactions, fulfillment, refunds, and disputes are signed synthetic events.
- State and WATCH storage are in-memory and are not crash-durable.
- Spreadsheet output is deterministic CSV, not packaged XLSX. Real workbook packaging and
  formula-engine verification remain unproved.
- HMAC verification proves the event boundary, not any provider-specific webhook scheme.
- The existing PostgreSQL Capital Authority was not re-run in this environment because no
  `DATABASE_URL` or installed `pg`/`tsx` dependencies are available. Its implementation was
  not changed. Phase A separately proves that a nonzero adapter cannot execute without an
  authority and that a halted authority stops the provider call.

Do not describe any of the above as a real publication, payment, customer interaction,
commercial validation, or live provider verification. `COMMERCIAL_CLOCK_START` is not set.

## Verification

Run:

```bash
node --test src/portfolio/phase-a.test.ts
node src/portfolio/generate-fixture-catalog.ts
git diff --check
```

Measured result on 2026-08-18:

- 12 tests, 12 passed, 0 failed;
- Node test duration: 759.901 ms;
- shell wall/user/system: 1.109 / 0.970 / 0.448 seconds;
- portfolio-module coverage: 94.70% lines, 79.35% branches, 97.67% functions;
- generated catalog: 1,181 bytes, two fake/local publications.

`npm test` could not be invoked in this work environment because npm execution requested an
unavailable network approval. The same configured test command was run directly with Node
and passed. The database-backed `npm run test:capital` suite was not re-run for the reasons
above; this is an explicit test limitation, not a skipped failure.

## Invariants covered

- A publication cannot occur without functional QA, Value QA, and a complete passed Arrival
  gate.
- A stable PUT retry returns one publication; a changed payload or key conflict fails.
- Duplicate event IDs cannot duplicate transaction, fulfillment, revenue, refund, dispute,
  or cost effects. The same ID with a changed payload fails.
- `experiment_id` cannot change during a transaction lifecycle.
- Owner/internal purchases remain visible as plumbing but contribute zero arm's-length or
  eligible revenue and cannot produce E3.
- Failed fulfillment remains visible and produces zero eligible commercial revenue.
- Invalid signatures and out-of-order transaction events fail closed.
- Every adapter declares a maximum cost. Nonzero work requires Capital Authority before the
  adapter is called; zero-cost fixture work settles explicitly at zero.

## Architecture findings

Two assumptions were disproved during implementation:

1. Capital Authority idempotency alone is not sufficient. It prevents duplicate financial
   authorization/ledger effects, but the provider must also enforce the same stable
   idempotency key to prevent duplicate external side effects.
2. A completed checkout cannot be the commercial-success record. Fulfillment, classification,
   refund, and dispute state must be joined before revenue becomes eligible for evaluation.

The provider-neutral separation held: ARRIVE remains replaceable without changing MAKE, PUT,
or WATCH. The next durability boundary is also clear: Phase B needs database constraints for
events, transactions, effects, and publication keys so process restarts preserve the
invariants currently proved in memory.

## Stop point

Stop here. Do not choose an ARRIVE provider, create accounts, request credentials, spend
capital, deploy, or begin Phase B until the owner reviews Phase A.

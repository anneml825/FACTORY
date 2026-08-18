# Phase D — credential-free metered MAKE preparation

**Date:** 2026-08-18  
**Status:** implementation complete; stopped before credentials, spend, commercial generation, or launch

## Outcome

Phase D now has an executable, provider-neutral campaign and inference boundary. It accepts only
structurally complete experiments:

`BUYER + PROBLEM + OFFER + MAKE + PUT + ARRIVE + WATCH`

The first four plans are noncommercial integration fixtures. They are not product selections,
market research, evidence, or a steady-state portfolio limit. The same runner was exercised with
100 independently attributed plans and bounded concurrency.

No credential was read or requested. No paid API was called. No capital was reserved or spent. No
commercial asset, listing, arrival surface, checkout, or public content was created.

## What is executable

- typed complete-commercial-experiment plans, including all seven primitives;
- fail-fast structural validation and a zero-per-asset owner operating-labor gate;
- provider/model profiles advertising task capability, quality, token pricing, credential state,
  and fixture-only status;
- deterministic per-task routing to the cheapest available model meeting the quality threshold,
  with stable tie-breaking;
- generic inference adapters with no provider name or environment-variable convention in the
  interface;
- fail-closed behavior when no eligible/credentialed provider exists;
- RESERVE → EXECUTE → SETTLE mediation for every adapter that quotes nonzero cost;
- kill-switch/Capital Authority refusal before provider execution;
- deterministic zero-cost fixture inference, rendering, functional QA, and fixture Value QA;
- bounded-concurrency campaign preparation with per-experiment failure isolation;
- stable experiment attribution and inference idempotency;
- explicit live-launch evaluation that rejects E0, unverified measurement, missing QA,
  noncommercial fixtures, and non-LIVE PUT;
- local four-experiment integration run and 100-experiment scale simulation.

Run:

```bash
node --test src/campaign/phase-d.test.ts
node src/campaign/run-phase-d-credential-free.ts
```

## What remains simulated or deliberately absent

- all actual model inference;
- provider credentials and provider-specific adapters;
- real token counts, quality measurements, latency, and billed cost;
- real commercial candidate selection or asset generation;
- independently retrieved E1 evidence;
- a selected or verified commercial ARRIVE mechanism;
- live PUT, checkout, stranger traffic, or arm's-length revenue;
- commercial KEEP / ITERATE / KILL decisions.

Phase A–C fixture/Stripe/DEV engineering proofs remain separate. Phase D does not reinterpret them
as demand evidence.

## Provider-neutral model selection

`InferenceModelProfile` contains `providerId`, `modelId`, supported task kinds, minimum-quality
compatibility, input/output token prices, credential availability, and fixture-only status.
`InferenceRouter` filters first by task, quality, credential availability, and fixture policy, then
selects the lowest estimated cost. Quality and cost are therefore task/model measurements, not a
single preferred-provider assumption.

No provider-specific credential name appears in the campaign contract. A future provider adapter
must receive its secret outside this interface and advertise `AVAILABLE` only after its own secure
initialization succeeds.

## Cost precision finding

Factory's constitutional money ledger settles integer cents, while model inference can cost a
fraction of one cent per call. The model profile uses integer micro-dollars for routing so sub-cent
differences are not discarded. Before enabling a metered adapter, Factory must persist exact token
usage/provider billed units and define a conservative batching or reconciliation rule for settling
those micro-costs into the cent-denominated Capital Authority. Settling every tiny call as a full
cent would materially overstate portfolio cost; rounding every call down would understate it.

This did not affect Phase D because every executed adapter quoted and settled exactly zero.

## Launch gates

The four fixture plans intentionally have:

- `noncommercialFixture: true`;
- E0 evidence with no invented number/source/timestamp;
- no selected commercial ARRIVE adapter;
- an unverified measurement instrument;
- fixture PUT only.

They can reach local `VALUE_QA_PASS` for integration verification, but none can stage or publish.
The runner reports zero launch-eligible experiments at both 4 and 100 units.

## Local measurements

One direct simulation run on 2026-08-18 measured:

| Run | Plans | Concurrency cap | Peak | Prepared | Launch eligible | Owner operating minutes | Cost | Runtime |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Integration | 4 | 3 | 3 | 4 | 0 | 0 | $0.00 | 13.174 ms |
| Scale | 100 | 12 | 12 | 100 | 0 | 0 | $0.00 | 74.254 ms |

These are local deterministic compute measurements, not model/provider benchmarks.

The complete local suite discovered 43 tests: 41 passed, 2 PostgreSQL tests skipped because this
workspace has no database service, and 0 failed. Node reported 1.445 seconds; shell wall time was
1.771 seconds. TypeScript, runner syntax, and `git diff --check` also passed.

## Assumptions corrected during implementation

1. A 3–5 experiment batch cannot be encoded as a campaign limit. The runner accepts arbitrary
   positive batch sizes and enforces a separate concurrency cap.
2. Model selection cannot be provider-global. Capability, quality, and price belong to each
   provider/model/task profile.
3. “Very cheap per call” cannot be faithfully settled using only integer cents. Exact sub-cent
   usage attribution plus batch/provider reconciliation is a prerequisite for metered MAKE.
4. Passing fixture QA is not sufficient to stage an E0 experiment. Evidence and real ARRIVE
   measurement remain independent launch gates.

## Superseded by Phase E

The "Cost precision finding" above understated the defect: the zero-cost fast path was keyed on
cents, so a sub-cent paid call would have executed with **no reservation, no kill-switch check,
and no ledger entry** — real spend outside the Capital Authority. Phase E repaired it, replaced
the nonexistent `production` bucket with `discovery`, wired §18 into execution, and built the
commercial Value QA contract this document's launch gate assumed. See
`docs/PHASE_E_REMEDIATION.md`.

The conclusion below — that an inference credential is not the next executable action — was
correct, and remains correct for a different reason: publishing, not generation, was the binding
constraint, and the edge that fixes it is built but not deployed.

## Review stop

Stop here. The next phase must not begin until owner review. No inference credential is presently
the next executable action because no provider-specific adapter has been selected or benchmarked,
and the sub-cent settlement rule remains to be implemented and reviewed. No capital or live launch
is authorized.

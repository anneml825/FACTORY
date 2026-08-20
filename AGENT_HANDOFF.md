# Agent handoff — Phase E required remediation

**Date:** 2026-08-20

**Branch:** `codex/phase-e-required-remediation`

**Baseline:** Claude Phase E commit `d41ec55b99cdef1bd9edad8d310d7679e9eff512`,
whose Phase D ancestor is `5d34716`.

**Status:** Phase E's useful Cloudflare Worker, D1, Stripe-sandbox, Value QA, and
cost-control work is preserved. The product-independent corrections required by
the independent Codex review are implemented. **No product, ARRIVE mechanism,
inference provider, live payment path, commercial listing, or commercial launch
has been selected or activated.**

**Cash spent by this remediation:** $0.00 · **Kill switch:** fail-closed ·
**Commercial serving:** disabled

Read, in order:

1. `AGENTS.md`, `CONSTITUTION.md`, `FINANCIAL_CONTROLS.md`, and
   `EXPERIMENTAL_PROTOCOL.md`;
2. `docs/PHASE_E_REMEDIATION.md`;
3. `docs/PHASE_E_COMMERCIAL_ISOLATION.md`;
4. `docs/PHASE_E_CLOUDFLARE_VERIFICATION.md`.

## Corrections now in the branch

- Deployment canaries have their own append-only D1 table and can no longer be
  inserted into or replayed through WATCH.
- The one-time legacy-canary repair is fenced to the COMMERCIAL database, exact
  known row shape/count, and an explicit authorization environment variable.
  It cannot run against a database containing commercial objects or events.
- A dormant commercial Worker can execute an ordinary catalog route without
  Stripe credentials. Credential-dependent commerce routes remain unavailable.
- Commercial authorization is a scoped, expiring launch grant with append-only
  revocation. A matching scope digest, complete owner-identity markers, the
  COMMERCIAL database stamp, configuration, and the serving variable must all
  agree before listings can be served.
- Closed, redeployed, and enabled builds have distinct build IDs; the deploy
  workflow asserts the final posture rather than accepting a stale deployment.
- Commercial Value QA covers every §9 review area and accepts model reviews or
  the narrowly permitted provenance owner exception only through durable,
  artifact-hash-bound evidence.
- Inference reservations and usage survive restart. Once provider execution may
  have begun, failures become `SETTLEMENT_PENDING`; they do not release capital.
  Duplicate usage records must match in full, and incurred tranches cannot be
  abandoned.
- Observed owner labor has a durable PostgreSQL source, including EXCEPTION and
  batch-approval categories.
- Provider-mutating GitHub workflows are manual-only. The Data Economics Probe
  no longer mutates providers or repository state on push.
- Generated Python bytecode is no longer tracked.

## Verification status

The corrected dormant-edge proof is GitHub Actions run
[`32374482792`](https://github.com/anneml825/FACTORY/actions/runs/32374482792), which passed in
1m29s. It observed the exact `redeployed` build for five consecutive checks, then received the
normal empty-catalog `404` with no edge-failure header. Final posture was `200`, COMMERCIAL,
`commercialServing: false`, and zero launch authorizations. Stable secrets and the 2026-08-19
database identity stamp survived redeploy; a deployment canary survived in
`edge_deploy_canary`; both WATCH append-only triggers were present; WATCH contained no operational
canary.

Two prior reproof attempts are evidence-bearing failures rather than hidden history. Run
`32373686632` proved the four exact invalid canaries were removed, but its empty-table UPDATE
could not exercise a row trigger. Run `32374094985` passed the route but exposed Cloudflare
version skew between one matching check and the next posture request. The final workflow uses a
non-mutating trigger-definition check and requires five consecutive exact build IDs plus an exact
final build assertion.

The final local suite discovered 127 tests: 121 passed, 6 PostgreSQL-dependent tests skipped
because this workspace had no `TEST_DATABASE_URL`, and 0 failed (Node duration 813 ms; shell wall
862 ms). TypeScript passed in 5.06 s; every workflow YAML file parsed; `git diff --check` passed.
The deployed commercial edge remains dormant.

## Correctly deferred work and activation conditions

- **Provider billing reconciliation:** no inference provider is selected. Before
  enabling any metered inference adapter or credential, implement that provider's
  durable usage/billing fetch, feed it into `reconcileInferenceUsage`, and connect
  a HALT result to the kill switch. The provider-neutral pending-settlement and
  restart semantics are already enforced.
- **Commercial Stripe webhook processing:** sandbox proof exists; live mode is
  prohibited. Implement and externally prove the live commercial processor only
  after owner authorization for live Stripe and before accepting a real checkout.
- **Artifact object storage (R2 or equivalent):** D1-backed fixture artifacts are
  sufficient for the engineering proof. Select object storage only when Product
  #1's artifact size/delivery requirements are known, and provision it before a
  commercial artifact exceeds the D1 policy.
- **WATCH snapshots/indexed projections:** current replay is linear. Add snapshots
  before measured event volume or route latency approaches the Worker/D1 budget;
  it is not a blocker at N=1 after deployment canaries are removed from WATCH.
- **Signing-key rotation:** stable secrets now survive redeploy. Add versioned-key
  verification and a rotation runbook before the first planned rotation or before
  issuing grants whose validity must span a rotation.
- **Custom domain:** choose only with Product #1 and its PUT/ARRIVE path. The
  workers.dev dormant endpoint is sufficient for infrastructure verification.

## Stop line

The next permissible activity, after owner acceptance, is Product #1 + ARRIVE
decision-making. Do not silently cross into product selection, market research,
metered MAKE, credential requests, live Stripe, capital spend, or commercial
serving.

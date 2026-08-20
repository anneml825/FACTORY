# Fixture and commercial edges: separation, and what is proven

Status: **implemented and externally re-proven.** Corrected dormant-edge run
[`32374482792`](https://github.com/anneml825/FACTORY/actions/runs/32374482792) is green. Historical commercial deploy run
[`32304390962`](https://github.com/anneml825/FACTORY/actions/runs/32304390962)
and fixture proof run
[`32304390932`](https://github.com/anneml825/FACTORY/actions/runs/32304390932),
both at commit `843441e`, both green.

> **2026-08-20 correction:** the historical commercial run proved database persistence but
> its canary method was invalid: it inserted unsigned operational rows into signed WATCH.
> Those rows made ordinary route replay fail. The successor remediation moves canaries to
> `edge_deploy_canary`, narrowly removes the four invalid rows only after proving the database
> contains no commerce, and requires a normal unknown product route to return `404` after
> redeploy. The historical run remains evidence for resource separation, not for a healthy
> commercial application route.

The corrected run supplies that missing evidence: the exact redeployed build stabilized, an
ordinary catalog route returned `404` without an edge-failure header, and final posture remained
COMMERCIAL with serving off and zero launch authorizations.

Nothing commercial has been served, no product exists, and no launch has been
authorized. What exists is the machinery underneath those decisions, built so
that whichever product and channel Codex selects, the deployment path does not
have to be repaired first.

## The hazard this removes

The fixture proof is destructive by design. It installs freshly generated
signing secrets on every run, and a WATCH journal signed under an older secret
cannot be verified under a new one, so the fixture database is dropped and
rebuilt each time. Before this work, the only thing standing between that reset
and durable commercial history was the spelling of a database name in a
workflow file.

## Three independent fences

No single mistake is sufficient to cross them.

1. **By name.** `src/edge/deploy/edge-targets.ts` is the only place a Worker or
   database name is written down. Every script resolves through `edgeTarget()`,
   which throws on anything it does not recognise. `wrangler.toml`'s duplicate
   of those names is asserted against it by test, so the two cannot drift.
2. **By stamp.** Every database carries one `edge_deployment_identity` row.
   Its purpose is immutable — the database itself raises on an attempt to change
   it — and it cannot be deleted.
3. **By refusal.** Every destructive or commercial script re-reads that stamp
   and refuses when it is not the one the script was written for. An unstamped
   or unreadable database is refused too: not knowing what a database is must
   never take the same code path as knowing it is safe.

| | Fixture | Commercial |
| --- | --- | --- |
| Worker | `factory-edge` | `factory-commerce` |
| Database | `factory-edge` | `factory-commerce` (`9bb782b4-…`) |
| Reset | every run | **no reset step exists** |
| Secrets | regenerated per run | installed once, never replaced |
| Stripe objects | created and swept per run | none; teardown cannot see them |
| Serving | never commercial | off unless identity, complete config, exact scoped grant, and enabled deploy agree |

## Commercial serving is scope-bound and fail-closed

The deployed `COMMERCIAL_SERVING` variable must be exactly `enabled`, the database must be
stamped `COMMERCIAL`, all required credentials plus nonempty owner markers must exist, and an
unexpired/unrevoked `commercial_launch_grant` must match the exact SHA-256 scope digest.
Revocation is append-only. Starting needs every condition; stopping needs any one to fail.

`GET /posture` reports the result, so a deploy is checked rather than assumed:

```json
{ "deploymentPurpose": "COMMERCIAL", "commercialServing": false,
  "commercialAuthorizations": 0, "missingConfiguration": ["STRIPE_WEBHOOK_SECRET"] }
```

Liveness and posture are answered **before** any configuration is required. The
first commercial deploy 503'd on its own posture check — the request that was
supposed to explain the 503 — and a diagnostic surface that only works when
nothing is wrong is not a diagnostic surface. Commerce routes still fail closed,
and now name the reason in an `x-factory-edge-failure` header.

## What was proven externally

* **Secrets persist and are never replaced.** The second commercial deploy
  reported `WATCH_EVENT_SECRET: already set, left alone` for all three
  generated secrets. Replacing a non-rotatable secret is refused outright.
* **The identity is stamped once.** `stamped_at` stayed `2026-08-19 21:24:28`
  across four separate deploys — re-running the migration is a no-op, never a
  change.
* **Corrected redeploy persistence is proven.** Run `32374482792` wrote its operational canary
  only to `edge_deploy_canary`, redeployed, and read the same canary back. WATCH is reserved
  exclusively for signed funnel events.
* **The commercial journal is append-only in production.** The live database exposes both exact
  no-update and no-delete trigger definitions. An earlier populated-database run also rejected an
  UPDATE. The corrected empty-WATCH proof is non-mutating because a row trigger cannot fire when
  an UPDATE matches zero rows.
* **The fixture proof still passes end to end** — 14 external checks against the
  live fixture edge — and asserts its own posture is `FIXTURE` with commercial
  serving off.
* **Deployment failures fail closed.** Before the commercial database existed,
  Cloudflare refused the deploy — `binding EDGE_DB of type d1 must have a valid
  database_id` — and no Worker was created. There is no partially-live state.

## The intermittent failures were version skew, not code

Three fixture runs failed in ways that looked like defects and were not: a buy
click that redirected without its ARRIVE reference, and 503s appearing partway
through an otherwise passing run. `wrangler deploy` returning does not mean
every Cloudflare colo is serving the new version, so a verifier that starts
immediately can measure the *previous* build — in one case a build deployed
before its secrets existed, which is exactly a build that answers 503.

Each deploy now carries an `EDGE_BUILD_ID`, `/posture` reports it, and both
workflows wait for the build under test to be the one answering before they
measure anything. One corrected commercial run demonstrated that a single match was still too
weak: its next posture request reached the earlier `closed` build. The commercial gate now
requires five consecutive exact build IDs and reasserts that exact ID in the final posture.
Run `32374482792` reached five consecutive matches on attempt 12 and then passed the ordinary
route and final-posture checks. The earlier fixture gate also measured skew directly: it
logged `Build 32304390932-1 is live after 12 check(s)` — roughly 22 seconds
during which the old version was still serving. That is exactly the window the
earlier runs were measuring in, and with the gate in place the fixture proof
passed 14/14.

This is worth keeping past the fixture: any commercial deploy verified
immediately after a push is measuring an unknown version.

## Adjacent hazards found and fixed

* `src/capital/authority.test.ts` ran `DROP SCHEMA public CASCADE` against
  whatever `DATABASE_URL` held. It now requires the database to identify itself
  as disposable — a marker table, or a name containing test/scratch/ci/tmp —
  and refuses otherwise. The check is positive on purpose: a database that has
  never heard of the convention is refused rather than assumed safe.
* The Data Economics Probe and every provider-changing Cloudflare/Stripe workflow are now
  manual-only. Pushing code cannot deploy, provision, create provider objects, or commit probe
  measurements as a hidden side effect.
* `wrangler secret list --name X --env Y` looks for a Worker called `X-Y`.
  The environment block already sets the name, so the script names it once.

## The arm's-length filter

`src/portfolio/arms-length-policy.ts` sits on the transaction write path. It is
**downgrade-only by construction**: it can move a transaction away from
`ARM_LENGTH_CUSTOMER` and can never move one toward it. A buyer matching a
configured owner marker becomes `OWNER_TEST`; a payment claiming arm's length
with no buyer identity to check becomes `OTHER_OR_UNKNOWN`, because Factory
cannot assert a stranger bought something when it cannot see who bought it.

The worst a misconfiguration can do is understate Factory's results, which is
survivable in a way that overstating them is not. Under provider-test rules the
filter changes nothing today; it is wired in so that a commercial classification
path cannot be added without passing through it.

## Deliberately not built

These depend materially on Product #1 or the ARRIVE channel, and building them
now would be guessing:

R2 (the `ObjectStore` port already abstracts it); a custom domain; any
marketplace integration or ARRIVE adapter; inference-provider selection; live
Stripe activation; commercial pricing; a commercial Stripe webhook processor;
WATCH snapshotting; and key-id-tagged secret rotation. The commercial edge never
regenerates its signing secrets, so it does not need the last one to operate
safely at N=1 — it needs it before anyone ever rotates one.

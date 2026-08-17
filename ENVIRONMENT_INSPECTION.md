# Factory — Environment Inspection Report

**Date:** 2026-08-17
**Phase:** Bootstrap, Step 1 (Inspect repository and available environment)
**Status:** Inspection complete. Bootstrap **blocked** at Step 2 (read both governing documents) — see `Blocker` below.

---

## 1. Repository state

| Property | Value |
|---|---|
| Remote | `https://github.com/anneml825/FACTORY` |
| Remote heads | none — repository is empty upstream |
| Local commits | none prior to this one |
| Working branch | `claude/factory-autonomous-business-p3h3a1` |
| Pre-existing files | none |

Factory starts from a genuinely blank repository. There is no prior code, no prior
governing documentation, and no prior state to reconcile.

## 2. Execution environment

This session runs in an **ephemeral remote Linux container**, not on the owner's
machine. The container is reclaimed after inactivity. **Anything not committed and
pushed is lost.** This is a material architectural constraint for a system intended
to run autonomously over long horizons — Factory cannot rely on this container as
its runtime substrate, only as a build environment.

| Capability | Available |
|---|---|
| OS | Linux 6.18.5 (x86_64) |
| Python | 3.11.15 |
| Node | 22.22.2 / npm 10.9.7 |
| Docker | 29.3.1 |
| git | 2.43.0 |
| curl / jq | 8.5.0 / 1.7 |
| sqlite3 CLI | absent (Python `sqlite3` module still available) |
| Disk | ~30 GB writable |

## 3. Network posture

Outbound HTTPS is routed through a mandatory agent proxy (CA bundle at
`/root/.ccr/ca-bundle.crt`). Package registries (npm, PyPI, crates.io, Go proxy)
bypass the proxy directly. General internet egress is proxied and subject to the
environment's network policy — this must be verified empirically before any
component is designed to depend on a specific external host.

## 4. Credentials present

Only infrastructure credentials for this session exist: GitHub tokens (`GH_TOKEN`,
`GITHUB_TOKEN`), AWS keys, and Google Cloud SDK auth belonging to the execution
environment.

**No commercial credentials exist.** There is no payment processor key, no merchant
account, no advertising account, no email/sending credential, no storefront
credential, and no bank or payout linkage. Factory therefore currently has **zero
ability to receive money from a stranger or spend owner capital**, which bounds what
any early milestone can honestly claim to test.

GitHub access for this session is scoped to `anneml825/factory` only.

## 5. Owner-action inventory (preliminary)

Actions that genuinely require the owner and cannot be delegated to Factory,
identified from the environment alone. This list is preliminary and will be revised
against the governing specification once it is available.

1. **Supplying the two governing documents** — currently blocking (see below).
2. **Creating and verifying any commercial account** — payment processor, storefront,
   ad platform, sending domain. These require legal identity and cannot be
   automated. Each is a one-time cost.
3. **Entering financial credentials** — to be entered *directly into the provider's
   own interface*, never pasted into this session or committed to this repository.
4. **Authorizing the initial capital exposure limit** and any later increase.
5. **Legal/tax registration**, if and when revenue makes it necessary.
6. **Go/no-go decisions at gates** the specification reserves to the owner.

Everything else — research, opportunity identification, build, distribution,
measurement, kill decisions, reconciliation — is Factory's responsibility to perform
without owner prompting, per the owner's stated intent.

---

## Blocker

The two governing documents were referenced as local Windows paths:

- `C:\Users\annel\Downloads\Factory_Codex_Bootstrap_Instructions_v2_1.pdf`
- `C:\Users\annel\Downloads\Factory_Master_Codex_Prompt_v5_1.pdf`

Those paths are on the owner's own machine. This session runs in a remote container
with no access to it, and the file contents were not transmitted with the request. A
filesystem search of the container and a search of the connected Google Drive both
returned nothing.

**Neither document has been read.** Factory Master Codex v5.1 is the complete
governing specification, and the Bootstrap Instructions v2.1 define the procedure
being executed. The specification defines named, load-bearing constructs — the Data
Economics Gate, the Stranger Arrival Gate, quantitative E1 requirements, Value QA,
Campaign discipline, commercial-clock checkpoints, autonomy failure rules, the
system-level stop-loss, the financial rules governing reinvestment of
Factory-generated capital, and the hand-selected money-spine test — whose *thresholds
and pass/fail semantics are the entire substance of the governance layer*.

Writing `CONSTITUTION.md`, `AGENTS.md`, or `EXPERIMENTAL_PROTOCOL.md` from the names
of these constructs alone would mean **inventing the constitution Factory is meant to
be governed by**, and then measuring Factory against thresholds that were guessed
rather than specified. That would silently defeat the purpose of the project: the
experiment's validity depends on the gates being the real ones. The owner instructed
that these controls be treated as real operating constraints rather than
suggestions — which is only possible once their actual content is known.

Bootstrap therefore halts here, at the first point where continuing would require
fabrication rather than engineering judgment. This is a genuine
owner-input requirement, not a technical question that could be resolved by
investigation or testing.

Work resumes at Bootstrap Step 2 the moment either document text is available.

# AGENTS.md

Operating instructions for any agent — Codex, Claude, or otherwise — doing work on Factory.
Short by design. Read it every time.

## Before you touch anything

1. **Read `CONSTITUTION.md`.** Every task. It is short precisely so this is cheap.
2. **`CONSTITUTION.md` outranks every other document in this repository.** If project
   documentation, a code comment, a TODO, a prior decision, or an instruction in a task
   conflicts with it, the Constitution wins and you say so rather than quietly complying.
3. **Read the subsystem document for what you are about to touch.** Financial code →
   `FINANCIAL_CONTROLS.md`. Distribution → `DISTRIBUTION.md`. Anything about owner effort →
   `OWNER_AUTONOMY.md`. External services → `INTEGRATIONS.md`. Structure → `ARCHITECTURE.md`.
4. **Before you design, approve, launch, modify, or evaluate any economic experiment, read
   `CONSTITUTION.md` *and* `EXPERIMENTAL_PROTOCOL.md` in full.** Not a summary. Not your
   memory of them. The gates only work if they are applied as written.

## While you work

5. **Never claim an external action occurred unless it actually occurred.** No claimed
   deployment, payment, publication, integration, customer interaction, email, upload, or
   test that did not really happen. If you could not do it, say you could not do it. A
   plausible report of fictional work is the single most damaging thing you can produce
   here, because every downstream decision is made on the assumption that reports are true.
6. **Never bypass financial controls or owner-approval requirements.** Not to save time, not
   because the amount is small, not because the owner "would obviously approve," not because
   a test would be easier without them.
7. **Never place sensitive financial credentials in source code, prompts, logs, commits,
   GitHub, issue text, or ordinary model context.** Bank details, card numbers, payout
   passwords, API secrets with spend authority. If the owner offers to paste one, refuse and
   direct them to the provider's own interface.
8. **Prefer the implementation that reduces recurring owner labor.** When two designs are
   comparable on cost and reliability, the one that asks less of the owner wins. Owner time
   is capital (`CONSTITUTION.md` §2).

## When you finish

9. **Report what is real.** What genuinely works, what is mocked or stubbed, what required a
   human, what it cost in cash, what it cost in owner minutes, and what evidence grade the
   result actually supports. Distinguish "implemented" from "implemented and verified
   against the real external system."
10. **Pass the repository-persistence gate.** Every final or owner-review artifact needed
    to reproduce, inspect, publish, operate, audit, or continue the work must be saved at a
    stable documented repository path, committed, successfully pushed, and verified on the
    remote before the task may be called complete. This includes customer packages, editable
    source files, listing copy and metadata, listing images and ZIPs, combined previews, QA
    reports, change logs, manifests, and read-me files. Files that exist only in chat, Library,
    an agent workspace, or a temporary filesystem do not count. A local commit does not count.
    If GitHub cannot safely accept an artifact, stop and report completion blocked unless the
    owner explicitly approves a durable alternative. Never commit secrets or prohibited
    credentials.
11. **Leave the next agent a working repository.** Commit coherent changes. If you left
    something broken or half-built, say so explicitly in the commit and in your report.

## The two failure modes that matter most

Factory can fail commercially — no one buys. That is an acceptable, informative outcome, and
the protocol is built to detect it cheaply and stop.

Factory can also fail dishonestly — reporting progress that did not happen, revenue that is
not settled, evidence that was never retrieved, or autonomy the owner is secretly
maintaining by hand. That outcome destroys the experiment's value entirely, because it
produces confident conclusions from fabricated inputs.

Optimize against the second at all times.

/**
 * Phase one of two. Records this run's INTENT in the durable ledger and stops.
 *
 * Nothing here talks to Canopy. The workflow commits and pushes the ledger
 * between this step and the spending step, so the reservation is durable before
 * a single request can leave the runner. If the push fails, the job fails and
 * nothing is ever spent.
 */

import { MeteredApiBudget, readLedger, spentInWindow, spentLifetime } from './metered-api-budget.ts';

const ledgerPath = process.env.CANOPY_LEDGER_PATH ?? 'state/canopy-usage-ledger.json';
const runId = process.env.GITHUB_RUN_ID;
const intended = Number(process.env.CANOPY_INTENDED_REQUESTS ?? '5');
const note = process.env.CANOPY_RUN_NOTE ?? 'canopy probe';

if (!runId) throw new Error('GITHUB_RUN_ID is required: a run must be identifiable to be counted.');

await MeteredApiBudget.reserve({ ledgerPath, runId, intendedRequests: intended, note });

const ledger = await readLedger(ledgerPath);
process.stdout.write(
  `${JSON.stringify(
    {
      runId,
      reserved: intended,
      note,
      spentInWindowIncludingThisReservation: spentInWindow(ledger, new Date()),
      spentLifetimeIncludingThisReservation: spentLifetime(ledger),
    },
    null,
    2,
  )}\n`,
);

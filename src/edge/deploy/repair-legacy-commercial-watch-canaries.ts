/**
 * One-time repair for four Phase E deployment canaries that were incorrectly
 * inserted into the signed WATCH journal with `signature='n/a'`.
 *
 * The operation is deliberately narrower than a reset. It refuses unless the
 * target and database are COMMERCIAL, every WATCH row is one of the exact
 * legacy canaries, and the database has no commerce, delivery, object, or
 * launch-authorization state. A normal commercial database can never satisfy
 * those preconditions.
 */

import { assertPurpose } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';
import { d1Execute } from './wrangler-d1.ts';

const target = edgeTargetFromEnvironment();
if (process.env.I_AUTHORIZE_LEGACY_CANARY_REPAIR !== 'yes') {
  throw new Error('Refusing legacy canary repair without I_AUTHORIZE_LEGACY_CANARY_REPAIR=yes.');
}
assertPurpose(target, 'COMMERCIAL');

interface Counts {
  watch_rows: number;
  exact_legacy_rows: number;
  commerce_rows: number;
  authorization_rows: number;
}

const counts = d1Execute<Counts>(target, {
  command: `SELECT
    (SELECT count(*) FROM watch_event_inbox) AS watch_rows,
    (SELECT count(*) FROM watch_event_inbox
       WHERE event_id LIKE 'deploy-proof-%'
         AND experiment_key = 'deployment-proof'
         AND asset_key = 'deployment-proof'
         AND event_type = 'DEPLOYMENT_PROOF'
         AND environment = 'PROVIDER_TEST'
         AND payload = '{}'
         AND signature = 'n/a'
         AND payload_sha256 = 'n/a'
         AND effect_key IS NULL
         AND effect_fingerprint IS NULL) AS exact_legacy_rows,
    ((SELECT count(*) FROM stripe_webhook_inbox) +
     (SELECT count(*) FROM stripe_transaction_reference) +
     (SELECT count(*) FROM delivery_grant) +
     (SELECT count(*) FROM delivery_reference) +
     (SELECT count(*) FROM delivery_download) +
     (SELECT count(*) FROM edge_object)) AS commerce_rows,
    ((SELECT count(*) FROM commercial_launch_authorization) +
     (SELECT count(*) FROM commercial_launch_grant) +
     (SELECT count(*) FROM commercial_launch_revocation)) AS authorization_rows`,
})[0];

if (!counts) throw new Error('Could not read repair preconditions.');
if (counts.watch_rows === 0) {
  process.stdout.write('No legacy commercial WATCH canaries exist; repair is a no-op.\n');
  process.exit(0);
}
if (
  counts.watch_rows !== 4 ||
  counts.watch_rows !== counts.exact_legacy_rows ||
  counts.commerce_rows !== 0 ||
  counts.authorization_rows !== 0
) {
  throw new Error(
    `Refusing repair (exactly four reviewed legacy rows are required): ` +
      `watch=${counts.watch_rows}, exactLegacy=${counts.exact_legacy_rows}, ` +
      `commerce=${counts.commerce_rows}, authorizations=${counts.authorization_rows}.`,
  );
}

d1Execute(target, {
  file: 'db/edge/repair-legacy-commercial-watch-canaries.sql',
});

const remaining = d1Execute<{ rows: number }>(target, {
  command: 'SELECT count(*) AS rows FROM watch_event_inbox',
})[0]?.rows;
if (remaining !== 0) throw new Error(`Legacy canary repair left ${remaining ?? 'unknown'} WATCH row(s).`);
process.stdout.write(`Removed ${counts.exact_legacy_rows} invalid legacy deployment canary row(s).\n`);

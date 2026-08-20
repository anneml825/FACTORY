/** Append a revocation for one commercial launch grant. */

import { assertPurpose } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';
import { d1Execute, sqlLiteral } from './wrangler-d1.ts';

const target = edgeTargetFromEnvironment();
const authorizationKey = process.env.AUTHORIZATION_KEY?.trim();
const revocationKey = process.env.REVOCATION_KEY?.trim();
const revokedBy = process.env.REVOKED_BY?.trim();
const reason = process.env.REVOCATION_REASON?.trim();

if (process.env.I_REVOKE_COMMERCIAL_LAUNCH !== 'yes') {
  throw new Error('Refusing revocation without I_REVOKE_COMMERCIAL_LAUNCH=yes.');
}
if (!authorizationKey || !revocationKey || !revokedBy || !reason) {
  throw new Error('AUTHORIZATION_KEY, REVOCATION_KEY, REVOKED_BY, and REVOCATION_REASON are required.');
}
assertPurpose(target, 'COMMERCIAL');
d1Execute(target, {
  command:
    'INSERT INTO commercial_launch_revocation ' +
    '(revocation_key, authorization_key, revoked_by, reason) VALUES (' +
    [revocationKey, authorizationKey, revokedBy, reason]
      .map((value, index) => sqlLiteral(value, index === 3 ? 500 : 200))
      .join(', ') +
    ')',
});
process.stdout.write(`Revoked commercial authorization ${authorizationKey}.\n`);

/**
 * Record an owner authorization to serve commercial listings.
 *
 * Serving commercially needs two independent things: the COMMERCIAL_SERVING
 * variable set to exactly "enabled", and a row in this table. Both must be true
 * to start; changing either one stops it. The asymmetry is the point — starting
 * takes two deliberate acts, stopping takes one.
 *
 * This records THAT launch was authorized, by whom, and against which note. It
 * says nothing about what is being sold. Product and channel are not this
 * layer's business and must not leak into it.
 */

import { d1Execute, sqlLiteral } from './wrangler-d1.ts';
import { assertPurpose } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';

const target = edgeTargetFromEnvironment();
const authorizedBy = process.env.AUTHORIZED_BY?.trim();
const scopeNote = process.env.SCOPE_NOTE?.trim();

if (process.env.I_AUTHORIZE_COMMERCIAL_LAUNCH !== 'yes') {
  throw new Error(
    'Refusing to record an authorization without I_AUTHORIZE_COMMERCIAL_LAUNCH=yes. ' +
      'This is not a step that should be reachable by accident.',
  );
}
if (!authorizedBy) throw new Error('AUTHORIZED_BY is required.');
if (!scopeNote) throw new Error('SCOPE_NOTE is required.');

assertPurpose(target, 'COMMERCIAL');

d1Execute(target, {
  command:
    'INSERT INTO commercial_launch_authorization (authorized_by, scope_note) VALUES (' +
    `${sqlLiteral(authorizedBy, 200)}, ${sqlLiteral(scopeNote, 500)})`,
});

const rows = d1Execute<{ id: number; authorized_at: string; authorized_by: string }>(target, {
  command:
    'SELECT id, authorized_at, authorized_by FROM commercial_launch_authorization ORDER BY id DESC LIMIT 5',
});
process.stdout.write(`${JSON.stringify({ database: target.databaseName, rows }, null, 2)}\n`);

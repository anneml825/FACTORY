/** Record a scoped, expiring owner authorization to serve commercial listings. */

import { d1Execute, sqlLiteral } from './wrangler-d1.ts';
import { assertPurpose } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';

const target = edgeTargetFromEnvironment();
const authorizedBy = process.env.AUTHORIZED_BY?.trim();
const scopeNote = process.env.SCOPE_NOTE?.trim();
const authorizationKey = process.env.AUTHORIZATION_KEY?.trim();
const scopeKind = process.env.SCOPE_KIND?.trim();
const scopeDigest = process.env.SCOPE_DIGEST?.trim().toLowerCase();
const expiresAt = process.env.EXPIRES_AT?.trim();

if (process.env.I_AUTHORIZE_COMMERCIAL_LAUNCH !== 'yes') {
  throw new Error(
    'Refusing authorization without I_AUTHORIZE_COMMERCIAL_LAUNCH=yes.',
  );
}
if (!authorizedBy) throw new Error('AUTHORIZED_BY is required.');
if (!scopeNote) throw new Error('SCOPE_NOTE is required.');
if (!authorizationKey || !/^[a-zA-Z0-9:_-]{8,200}$/.test(authorizationKey)) {
  throw new Error('AUTHORIZATION_KEY must be an 8-200 character stable identifier.');
}
if (scopeKind !== 'ARTIFACT_MANIFEST' && scopeKind !== 'DEPLOYMENT') {
  throw new Error('SCOPE_KIND must be ARTIFACT_MANIFEST or DEPLOYMENT.');
}
if (!scopeDigest || !/^[a-f0-9]{64}$/.test(scopeDigest)) {
  throw new Error('SCOPE_DIGEST must be one lowercase SHA-256 digest.');
}
if (!expiresAt || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now()) {
  throw new Error('EXPIRES_AT must be a future ISO-8601 timestamp.');
}

assertPurpose(target, 'COMMERCIAL');

d1Execute(target, {
  command:
    'INSERT INTO commercial_launch_grant ' +
    '(authorization_key, scope_kind, scope_digest, expires_at, authorized_by, scope_note) VALUES (' +
    [authorizationKey, scopeKind, scopeDigest, expiresAt, authorizedBy, scopeNote]
      .map((value, index) => sqlLiteral(value, index === 5 ? 500 : 200))
      .join(', ') +
    ')',
});

const rows = d1Execute(target, {
  command:
    'SELECT authorization_key, scope_kind, scope_digest, expires_at, authorized_at, authorized_by ' +
    'FROM commercial_launch_grant ORDER BY authorized_at DESC LIMIT 5',
});
process.stdout.write(`${JSON.stringify({ database: target.databaseName, rows }, null, 2)}\n`);

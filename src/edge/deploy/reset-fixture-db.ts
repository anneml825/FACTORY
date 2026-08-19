/**
 * Destroy and rebuild the FIXTURE edge database.
 *
 * This is the only destructive database operation Factory has, and it is fenced
 * three ways: the target must resolve to the fixture target by name, that target
 * must be marked resettable, and the database itself must be stamped FIXTURE.
 * An unstamped or unreadable database is refused, because not knowing what a
 * database is must never take the same path as knowing it is safe.
 *
 * It exists because a fixture proof installs freshly generated signing secrets,
 * and a WATCH journal signed under an older secret cannot be verified under a
 * new one. Commercial deployments solve that by never regenerating the secret,
 * which is why they never need this script and are refused by it.
 */

import { d1Execute } from './wrangler-d1.ts';
import { assertPurpose, stampIdentity } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';

const target = edgeTargetFromEnvironment();

if (!target.resettable) {
  throw new Error(
    `Refusing to reset: the ${target.name} target is not resettable. ` +
      `Durable commercial history is never rebuilt from scratch.`,
  );
}
assertPurpose(target, 'FIXTURE');

d1Execute(target, { file: 'db/edge/reset-fixture.sql' });
d1Execute(target, { file: 'db/edge/schema.sql' });
const identity = stampIdentity(target);

process.stdout.write(
  `${JSON.stringify({ reset: target.databaseName, identity }, null, 2)}\n`,
);

/**
 * Apply the edge schema and stamp the database's identity.
 *
 * Safe to run against a COMMERCIAL database: every statement in schema.sql is
 * `CREATE ... IF NOT EXISTS`, so applying it is additive and repeatable, and the
 * identity stamp is `INSERT OR IGNORE`, so it can never rewrite a stamp that is
 * already there. Nothing in this path drops, truncates, or updates a row.
 */

import { d1Execute } from './wrangler-d1.ts';
import { stampIdentity, tryReadIdentity } from './edge-identity.ts';
import { edgeTargetFromEnvironment } from './edge-targets.ts';

const target = edgeTargetFromEnvironment();

// If the database already carries a stamp, it must agree with the target before
// a single statement runs. A commercial database reached by a fixture-shaped
// invocation stops here.
// Tolerant: this is the step that creates the identity table in the first
// place, so on a database that predates it there is nothing to read.
const existing = tryReadIdentity(target);
if (existing && existing.purpose !== target.purpose) {
  throw new Error(
    `Refusing to migrate: ${target.databaseName} is stamped ${existing.purpose} but the ` +
      `${target.name} target expects ${target.purpose}.`,
  );
}

d1Execute(target, { file: 'db/edge/schema.sql' });
const identity = stampIdentity(target);

process.stdout.write(
  `${JSON.stringify({ target: target.name, database: target.databaseName, identity }, null, 2)}\n`,
);

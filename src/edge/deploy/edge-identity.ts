/**
 * Read and stamp the identity of an edge database.
 *
 * `assertPurpose` is the guard every destructive or commercial script calls
 * first. It fails closed in every ambiguous case: an unstamped database, an
 * unreadable one, or one whose stamp disagrees with the target's name all raise
 * rather than proceed, because "I could not tell what this database is" and
 * "this is the right database" must never take the same code path.
 */

import { d1Execute, sqlLiteral } from './wrangler-d1.ts';
import { EDGE_SCHEMA_VERSION, type EdgeTarget } from './edge-targets.ts';

export interface EdgeIdentity {
  purpose: string;
  database_label: string;
  schema_version: number;
  stamped_at: string;
}

/**
 * Tolerant read, for the one caller that legitimately runs before the identity
 * table exists: the migration that creates it. Everything else uses the strict
 * read, because "I could not ask" must not resolve to "there is nothing there".
 */
export function tryReadIdentity(target: EdgeTarget): EdgeIdentity | null {
  try {
    return readIdentity(target);
  } catch {
    return null;
  }
}

export function readIdentity(target: EdgeTarget): EdgeIdentity | null {
  const rows = d1Execute<EdgeIdentity>(target, {
    command:
      'SELECT purpose, database_label, schema_version, stamped_at FROM edge_deployment_identity WHERE singleton = 1',
  });
  return rows[0] ?? null;
}

/** Stamps identity exactly once. Re-running is a no-op, never a change. */
export function stampIdentity(target: EdgeTarget): EdgeIdentity {
  d1Execute(target, {
    command:
      'INSERT OR IGNORE INTO edge_deployment_identity ' +
      '(singleton, purpose, database_label, schema_version) VALUES (1, ' +
      `${sqlLiteral(target.purpose)}, ${sqlLiteral(target.databaseName)}, ${EDGE_SCHEMA_VERSION})`,
  });
  const identity = readIdentity(target);
  if (!identity) throw new Error(`Failed to stamp identity on ${target.databaseName}.`);
  if (identity.purpose !== target.purpose) {
    throw new Error(
      `Refusing to continue: ${target.databaseName} is stamped ${identity.purpose} but target ` +
        `${target.name} expects ${target.purpose}. This database has been used for something else.`,
    );
  }
  return identity;
}

/**
 * The guard. Throws unless the database really is what the caller believes.
 */
export function assertPurpose(target: EdgeTarget, expected: EdgeTarget['purpose']): EdgeIdentity {
  if (target.purpose !== expected) {
    throw new Error(
      `Refusing to continue: target ${target.name} is ${target.purpose}, not ${expected}.`,
    );
  }
  let identity: EdgeIdentity | null;
  try {
    identity = readIdentity(target);
  } catch (error) {
    throw new Error(
      `Refusing to continue: could not read the identity of ${target.databaseName}. ` +
        `An unreadable database is treated as the wrong database. ` +
        `(${error instanceof Error ? error.message.split('\n')[0] : String(error)})`,
    );
  }
  if (!identity) {
    throw new Error(
      `Refusing to continue: ${target.databaseName} carries no deployment identity. ` +
        `Stamp it before any script is allowed to act on it.`,
    );
  }
  if (identity.purpose !== expected) {
    throw new Error(
      `Refusing to continue: ${target.databaseName} is stamped ${identity.purpose}, ` +
        `and this operation is only permitted against a ${expected} database.`,
    );
  }
  if (identity.database_label !== target.databaseName) {
    throw new Error(
      `Refusing to continue: ${target.databaseName} is stamped with the label ` +
        `${identity.database_label}. The name and the stamp disagree.`,
    );
  }
  return identity;
}

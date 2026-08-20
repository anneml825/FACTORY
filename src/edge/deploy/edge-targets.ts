/**
 * The only place a Worker name or a database name is allowed to be written down.
 *
 * Factory runs two edges that must never be confused: a FIXTURE edge, which is
 * disposable and is reset on every proof, and a COMMERCIAL edge, which holds
 * durable WATCH, transaction, attribution and fulfillment history and must never
 * be reset by anything. Before this module those names were free text in a
 * workflow file, which meant a single typo could point the fixture reset at
 * commercial data. Every script and every workflow now resolves its target
 * through `edgeTarget()`, which throws on anything it does not recognise.
 *
 * The separation is enforced in three independent places, so no single mistake
 * is sufficient:
 *   1. here, by name — a target resolves to exactly one Worker and one database;
 *   2. in the database itself, by the `edge_deployment_identity` row, which is
 *      stamped once and whose purpose is immutable;
 *   3. in each destructive script, which re-reads that row and refuses to act
 *      when the purpose is not the one it was written for.
 */

export type EdgeDeploymentPurpose = 'FIXTURE' | 'COMMERCIAL';

export interface EdgeTarget {
  /** The name used on the command line and in workflow inputs. */
  name: 'fixture' | 'commercial';
  purpose: EdgeDeploymentPurpose;
  /** Cloudflare Worker script name. */
  workerName: string;
  /** D1 database name. */
  databaseName: string;
  /** `--env` passed to wrangler; the fixture target is the top-level config. */
  wranglerEnvironment: string | null;
  /**
   * Stamped into the metadata of every Stripe object created for this target,
   * so a teardown written for one scope cannot see the other's objects.
   */
  objectScope: EdgeDeploymentPurpose;
  /** Whether any script is permitted to drop this target's tables. */
  resettable: boolean;
}

export const EDGE_TARGETS: Record<EdgeTarget['name'], EdgeTarget> = {
  fixture: {
    name: 'fixture',
    purpose: 'FIXTURE',
    workerName: 'factory-edge',
    databaseName: 'factory-edge',
    wranglerEnvironment: null,
    objectScope: 'FIXTURE',
    resettable: true,
  },
  commercial: {
    name: 'commercial',
    purpose: 'COMMERCIAL',
    workerName: 'factory-commerce',
    databaseName: 'factory-commerce',
    wranglerEnvironment: 'commercial',
    objectScope: 'COMMERCIAL',
    resettable: false,
  },
};

export function edgeTarget(name: string | undefined): EdgeTarget {
  const target = EDGE_TARGETS[(name ?? '') as EdgeTarget['name']];
  if (!target) {
    throw new Error(
      `Unknown edge target ${JSON.stringify(name)}. Known targets: ${Object.keys(EDGE_TARGETS).join(', ')}.`,
    );
  }
  return target;
}

/** Resolves the target from the environment, refusing to guess a default. */
export function edgeTargetFromEnvironment(): EdgeTarget {
  return edgeTarget(process.env.EDGE_TARGET);
}

/** The schema version this checkout expects a database to be at. */
export const EDGE_SCHEMA_VERSION = 3;

/** Secrets every edge needs. Regenerating any of these breaks durable history. */
export const REQUIRED_EDGE_SECRETS = [
  'STRIPE_WEBHOOK_SECRET',
  'WATCH_EVENT_SECRET',
  'EDGE_DELIVERY_SECRET',
  'EDGE_INTERNAL_TRAFFIC_TOKEN',
] as const;

/**
 * Secrets that must never be replaced once set on a durable deployment. The
 * WATCH journal is HMAC-signed under the secret current when each row was
 * written, and delivery tokens are signed under theirs, so replacing either
 * one silently invalidates history that is supposed to be permanent.
 */
export const NON_ROTATABLE_EDGE_SECRETS = [
  'WATCH_EVENT_SECRET',
  'EDGE_DELIVERY_SECRET',
] as const;

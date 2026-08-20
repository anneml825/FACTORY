/**
 * Cloudflare Worker entry for Factory's always-on commerce edge.
 *
 * Phase E's original `worker.ts` had no `fetch` handler at all — it was a pair
 * of binding adapters, so `wrangler deploy` would have failed with "no event
 * handlers registered". This is the real entry point.
 *
 * The commerce logic is not here. It lives in `router.ts` and is the same
 * handler the Node tests exercise, so what this file adds is binding
 * translation and nothing else. That is deliberate: the more this file does,
 * the more of the edge is only ever proven in production.
 *
 * Fail-closed by construction:
 *   * a missing binding or secret refuses the request rather than degrading;
 *   * commercial listings are refused unless COMMERCIAL_SERVING is explicitly
 *     "enabled", so a fixture deployment cannot quietly start selling;
 *   * KV is not used anywhere — it cannot enforce a download limit atomically.
 */

import { createHmac } from 'node:crypto';
import { normalizeOwnerMarkers } from '../portfolio/arms-length-policy.ts';
import { StripeTestWebhookProcessor } from '../portfolio/stripe-webhook.ts';
import type { FunnelEvent, SignedEventEnvelope } from '../portfolio/types.ts';
import { createEdgeHandler, EdgeDeliveryFulfillment } from './router.ts';
import {
  D1EdgeStateStore,
  D1ObjectStore,
  D1StripeWebhookStateStore,
  D1WatchStore,
  type D1Like,
} from './d1-bindings.ts';
import { FixtureCatalog } from './fixture-catalog.ts';
import type { CatalogStore, EdgeEnvironment } from './types.ts';

export interface WorkerEnv {
  EDGE_DB: D1Like;
  STRIPE_WEBHOOK_SECRET?: string;
  WATCH_EVENT_SECRET?: string;
  EDGE_DELIVERY_SECRET?: string;
  EDGE_INTERNAL_TRAFFIC_TOKEN?: string;
  /**
   * Stripe Payment Link the fixture's Buy button redirects to. Optional: an
   * edge with nothing to sell yet is a legitimate state, and it serves an empty
   * catalog rather than refusing to start.
   */
  FIXTURE_CHECKOUT_URL?: string;
  /** Factory ARRIVE reference carried into checkout as client_reference_id. */
  FIXTURE_ARRIVE_REFERENCE?: string;
  /**
   * Must be the exact string "enabled" to serve a commercial listing — and even
   * then, only if the database agrees (see `readCommercialPosture`).
   */
  COMMERCIAL_SERVING?: string;
  /** SHA-256 of the exact authorized deployment or artifact/manifest bundle. */
  COMMERCIAL_SCOPE_DIGEST?: string;
  /**
   * Owner email addresses or `@domains`, comma-separated. A buyer matching one
   * of these can never be recorded as an arm's-length customer. Empty is safe:
   * the filter downgrades and never upgrades.
   */
  OWNER_IDENTITY_MARKERS?: string;
  /**
   * Identifies the deployment that is answering. Cloudflare can keep serving an
   * older version for a short while after a deploy returns, so a verifier that
   * starts immediately can measure the previous build and report a defect that
   * does not exist. Reported by /posture so a caller can wait for the version it
   * meant to test.
   */
  EDGE_BUILD_ID?: string;
  DELIVERY_TTL_SECONDS?: string;
  MAX_DOWNLOADS_PER_GRANT?: string;
}

/** Settings the commerce routes cannot run without. Reported by /posture. */
const REQUIRED_FOR_COMMERCE = [
  'STRIPE_WEBHOOK_SECRET',
  'WATCH_EVENT_SECRET',
  'EDGE_DELIVERY_SECRET',
  'EDGE_INTERNAL_TRAFFIC_TOKEN',
] as const satisfies readonly (keyof WorkerEnv)[];

const REQUIRED_FOR_COMMERCIAL_ACTIVATION = [
  'OWNER_IDENTITY_MARKERS',
  'COMMERCIAL_SCOPE_DIGEST',
] as const satisfies readonly (keyof WorkerEnv)[];

function missingConfiguration(
  env: WorkerEnv,
  purpose: 'FIXTURE' | 'COMMERCIAL' | 'UNKNOWN',
): (keyof WorkerEnv)[] {
  const settings = purpose === 'COMMERCIAL'
    ? [...REQUIRED_FOR_COMMERCE, ...REQUIRED_FOR_COMMERCIAL_ACTIVATION]
    : REQUIRED_FOR_COMMERCE;
  return settings.filter((name) => {
    const value = env[name];
    if (typeof value !== 'string' || value.trim().length === 0) return true;
    if (name === 'OWNER_IDENTITY_MARKERS') return normalizeOwnerMarkers(value).length === 0;
    if (name === 'COMMERCIAL_SCOPE_DIGEST') return !/^[a-f0-9]{64}$/.test(value);
    return false;
  });
}

function required(env: WorkerEnv, key: keyof WorkerEnv): string {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Edge misconfigured: ${String(key)} is not set.`);
  }
  return value;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Edge misconfigured: expected a positive integer, received ${value}.`);
  }
  return parsed;
}

/**
 * Ask the database what this deployment is and whether launch was authorized.
 *
 * One query, so it costs one of D1's fifty per invocation. Every failure mode
 * resolves to "not commercial": an older database without these tables, an
 * unreadable row, an unexpected value. The edge must be able to serve the
 * fixture when this is unavailable, but it must never serve commercially on the
 * strength of a query it could not run.
 */
async function readCommercialPosture(
  db: D1Like,
  scopeDigest: string | undefined,
): Promise<{ purpose: 'FIXTURE' | 'COMMERCIAL' | 'UNKNOWN'; authorizations: number }> {
  try {
    const row = await db
      .prepare(
        'SELECT (SELECT purpose FROM edge_deployment_identity WHERE singleton = 1) AS purpose, ' +
          `(SELECT count(*) FROM commercial_launch_grant g
             WHERE g.scope_digest = ?1
               AND datetime(g.expires_at) > datetime('now')
               AND NOT EXISTS (
                 SELECT 1 FROM commercial_launch_revocation r
                 WHERE r.authorization_key = g.authorization_key
               )) AS authorizations`,
      )
      .bind(scopeDigest ?? '')
      .first<{ purpose: string | null; authorizations: number | null }>();
    const purpose = row?.purpose === 'COMMERCIAL' || row?.purpose === 'FIXTURE' ? row.purpose : 'UNKNOWN';
    return { purpose, authorizations: Number(row?.authorizations ?? 0) };
  } catch {
    return { purpose: 'UNKNOWN', authorizations: 0 };
  }
}

async function buildEnvironment(env: WorkerEnv): Promise<EdgeEnvironment> {
  if (!env.EDGE_DB) throw new Error('Edge misconfigured: the EDGE_DB D1 binding is missing.');

  const watchSecret = required(env, 'WATCH_EVENT_SECRET');
  const objects = new D1ObjectStore(env.EDGE_DB);
  const state = new D1EdgeStateStore(env.EDGE_DB);
  // No checkout URL means no listing to serve, not a broken edge. Every
  // listing lookup then returns null and every product page is a 404, which is
  // the truthful answer for an edge that has nothing to sell.
  const catalog: CatalogStore = env.FIXTURE_CHECKOUT_URL
    ? new FixtureCatalog({
        checkoutUrl: env.FIXTURE_CHECKOUT_URL,
        arrivalPublicationId: env.FIXTURE_ARRIVE_REFERENCE || undefined,
      })
    : { async get() { return null; } };
  const posture = await readCommercialPosture(env.EDGE_DB, env.COMMERCIAL_SCOPE_DIGEST);
  const missing = missingConfiguration(env, posture.purpose);
  const commerceReady = missing.length === 0;
  const ttlSeconds = positiveInteger(env.DELIVERY_TTL_SECONDS, 3600);
  const maxDownloads = positiveInteger(env.MAX_DOWNLOADS_PER_GRANT, 3);

  // The edge only ever handles provider-test commerce in this phase. A LIVE
  // event would be refused by the WATCH store rather than silently recorded.
  const watch = await D1WatchStore.create({
    db: env.EDGE_DB,
    signingSecret: watchSecret,
    acceptedEnvironments: ['PROVIDER_TEST'],
  });

  const fulfillment = new EdgeDeliveryFulfillment({
    objects,
    state,
    catalog,
    now: () => new Date(),
    ttlSeconds,
    maxDownloads,
  });

  return {
    objects,
    catalog,
    state,
    watch,
    stripe: env.STRIPE_WEBHOOK_SECRET
      ? new StripeTestWebhookProcessor({
          webhookSecret: env.STRIPE_WEBHOOK_SECRET,
          internalEventSecret: watchSecret,
          state: new D1StripeWebhookStateStore(env.EDGE_DB),
          watch,
          fulfillment,
          armsLengthPolicy: { ownerMarkers: normalizeOwnerMarkers(env.OWNER_IDENTITY_MARKERS) },
        })
      : {
          async process() {
            throw new Error('Stripe webhook processing is not configured.');
          },
        },
    commerceReady,
    signEvent(event: FunnelEvent): SignedEventEnvelope {
      const payload = JSON.stringify(event);
      return { payload, signature: createHmac('sha256', watchSecret).update(payload).digest('hex') };
    },
    deliverySecret: env.EDGE_DELIVERY_SECRET ?? '',
    internalTrafficToken: env.EDGE_INTERNAL_TRAFFIC_TOKEN ?? '',
    // Three independent conditions, all read from different places: the
    // deployed variable, the database's own identity, and an owner
    // authorization row. Starting to serve commercially takes all three;
    // stopping takes any one. There is no truthiness here on purpose.
    allowCommercialListings:
      env.COMMERCIAL_SERVING === 'enabled' &&
      posture.purpose === 'COMMERCIAL' &&
      posture.authorizations > 0 &&
      commerceReady,
    deploymentPurpose: posture.purpose,
    commercialAuthorizations: posture.authorizations,
    now: () => new Date(),
    deliveryTtlSeconds: ttlSeconds,
    maxDownloadsPerGrant: maxDownloads,
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Liveness and posture are answered BEFORE any configuration is required.
    // A diagnostic surface that only works when nothing is wrong is not a
    // diagnostic surface: the commercial edge's first deploy 503'd on its own
    // posture check, which is precisely the request that was supposed to
    // explain the 503.
    const path = new URL(request.url).pathname;
    if (path === '/healthz') {
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
    if (path === '/posture') {
      const posture = env.EDGE_DB
        ? await readCommercialPosture(env.EDGE_DB, env.COMMERCIAL_SCOPE_DIGEST)
        : { purpose: 'UNKNOWN' as const, authorizations: 0 };
      const missing = missingConfiguration(env, posture.purpose);
      return new Response(
        `${JSON.stringify(
          {
            buildId: env.EDGE_BUILD_ID ?? null,
            deploymentPurpose: posture.purpose,
            commercialServing:
              env.COMMERCIAL_SERVING === 'enabled' &&
              posture.purpose === 'COMMERCIAL' &&
              posture.authorizations > 0 &&
              missing.length === 0,
            commercialAuthorizations: posture.authorizations,
            // Names only. Which settings are absent is a deployment fact; their
            // values never leave the edge.
            missingConfiguration: missing,
          },
          null,
          2,
        )}\n`,
        { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
      );
    }

    try {
      const environment = await buildEnvironment(env);
      return await createEdgeHandler(environment)(request);
    } catch (error) {
      // Misconfiguration must not look like a working edge, so the body stays
      // opaque. The reason goes in a header: an edge that fails closed without
      // saying why is only half a safety property — the two runs it took to
      // find the last one were spent guessing at a blank 503. Every message
      // that reaches here is one Factory wrote itself and names a
      // configuration fact, never a secret or a buyer.
      const reason = error instanceof Error ? error.message : String(error);
      console.error('edge failure:', reason);
      return new Response('The edge is not correctly configured.', {
        status: 503,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'x-factory-edge-failure': reason.replaceAll(/[\r\n]+/g, ' ').slice(0, 200),
        },
      });
    }
  },
};

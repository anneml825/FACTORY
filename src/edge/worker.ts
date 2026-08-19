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
import type { EdgeEnvironment } from './types.ts';

export interface WorkerEnv {
  EDGE_DB: D1Like;
  STRIPE_WEBHOOK_SECRET: string;
  WATCH_EVENT_SECRET: string;
  EDGE_DELIVERY_SECRET: string;
  EDGE_INTERNAL_TRAFFIC_TOKEN: string;
  /** Stripe sandbox Payment Link the fixture's Buy button redirects to. */
  FIXTURE_CHECKOUT_URL: string;
  /** Factory ARRIVE reference carried into checkout as client_reference_id. */
  FIXTURE_ARRIVE_REFERENCE?: string;
  /** Must be the exact string "enabled" to serve a commercial listing. */
  COMMERCIAL_SERVING?: string;
  DELIVERY_TTL_SECONDS?: string;
  MAX_DOWNLOADS_PER_GRANT?: string;
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

async function buildEnvironment(env: WorkerEnv): Promise<EdgeEnvironment> {
  if (!env.EDGE_DB) throw new Error('Edge misconfigured: the EDGE_DB D1 binding is missing.');

  const watchSecret = required(env, 'WATCH_EVENT_SECRET');
  const objects = new D1ObjectStore(env.EDGE_DB);
  const state = new D1EdgeStateStore(env.EDGE_DB);
  const catalog = new FixtureCatalog({
    checkoutUrl: required(env, 'FIXTURE_CHECKOUT_URL'),
    arrivalPublicationId: env.FIXTURE_ARRIVE_REFERENCE || undefined,
  });
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
    stripe: new StripeTestWebhookProcessor({
      webhookSecret: required(env, 'STRIPE_WEBHOOK_SECRET'),
      internalEventSecret: watchSecret,
      state: new D1StripeWebhookStateStore(env.EDGE_DB),
      watch,
      fulfillment,
    }),
    signEvent(event: FunnelEvent): SignedEventEnvelope {
      const payload = JSON.stringify(event);
      return { payload, signature: createHmac('sha256', watchSecret).update(payload).digest('hex') };
    },
    deliverySecret: required(env, 'EDGE_DELIVERY_SECRET'),
    internalTrafficToken: required(env, 'EDGE_INTERNAL_TRAFFIC_TOKEN'),
    // Anything other than the exact string "enabled" leaves commercial serving
    // off. There is no truthiness here on purpose.
    allowCommercialListings: env.COMMERCIAL_SERVING === 'enabled',
    now: () => new Date(),
    deliveryTtlSeconds: ttlSeconds,
    maxDownloadsPerGrant: maxDownloads,
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    try {
      const environment = await buildEnvironment(env);
      return await createEdgeHandler(environment)(request);
    } catch (error) {
      // Misconfiguration must not look like a working edge. 503, no detail to
      // the caller, message only in the Worker log.
      console.error('edge failure:', error instanceof Error ? error.message : String(error));
      return new Response('The edge is not correctly configured.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },
};

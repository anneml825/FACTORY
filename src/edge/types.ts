/**
 * Always-on commerce edge — ports and records. Phase E remediation.
 *
 * Before this module Factory had no internet-facing component at all: no
 * product page, no webhook receiver outside a CI job, and no way to give a
 * buyer the file they paid for. Stripe hosts checkout; it does not host the
 * offer or deliver the artifact. GitHub Actions is a batch runner, not a
 * listener. That gap — not inference — was the binding constraint on a first
 * dollar.
 *
 * Everything here is provider-shaped but provider-neutral: `ObjectStore` is R2
 * or anything else, `EdgeStateStore` is D1/KV or anything else. `worker.ts`
 * binds the Cloudflare implementations; the tests bind in-memory ones and run
 * the exact same handler.
 */

import type { WatchAdapter } from '../portfolio/ports.ts';
import type { CommerceEnvironment, FunnelEvent, SignedEventEnvelope } from '../portfolio/types.ts';
import type { StripeTestWebhookProcessor } from '../portfolio/stripe-webhook.ts';

export interface StoredObject {
  bytes: Uint8Array;
  mediaType: string;
  fileName: string;
  sha256: string;
}

export interface ObjectStore {
  put(key: string, object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}

/**
 * One offer the edge is allowed to serve. `noncommercialFixture` is load-bearing:
 * the handler refuses to serve a commercial listing unless commercial mode has
 * been explicitly enabled, so Phase E cannot accidentally launch anything.
 */
export interface EdgeListing {
  experimentId: string;
  assetId: string;
  title: string;
  summary: string;
  priceCents: number;
  currency: string;
  /** Stripe Payment Link. The edge appends `client_reference_id`. */
  checkoutUrl: string;
  artifactKey: string;
  noncommercialFixture: boolean;
  environment: CommerceEnvironment;
  arrivalPublicationId?: string;
}

export interface CatalogStore {
  get(experimentId: string): Promise<EdgeListing | null>;
}

/**
 * A right to download one artifact, minted only after a webhook-confirmed
 * payment. Grants are bounded in time and in uses; the token itself carries no
 * authority beyond identifying the grant.
 */
export interface DeliveryGrant {
  grantId: string;
  experimentId: string;
  assetId: string;
  transactionId: string;
  artifactKey: string;
  issuedAt: string;
  expiresAt: string;
  maxDownloads: number;
  downloads: number;
}

export interface EdgeStateStore {
  putGrant(grant: DeliveryGrant): Promise<{ created: boolean }>;
  getGrant(grantId: string): Promise<DeliveryGrant | null>;
  grantForTransaction(transactionId: string): Promise<DeliveryGrant | null>;
  /**
   * Maps an externally visible reference (Stripe Checkout Session ID, or the
   * `client_reference_id` the edge minted at buy-click) onto the transaction.
   * The buyer returns from Stripe holding one of these, not the PaymentIntent.
   */
  linkReference(reference: string, transactionId: string): Promise<void>;
  transactionForReference(reference: string): Promise<string | null>;
  /** Atomically consume one download. Returns null when exhausted or missing. */
  consumeDownload(grantId: string, at: string): Promise<DeliveryGrant | null>;
}

export interface EdgeEnvironment {
  objects: ObjectStore;
  catalog: CatalogStore;
  state: EdgeStateStore;
  watch: WatchAdapter;
  stripe: StripeTestWebhookProcessor;
  /** Signs first-party funnel events for the WATCH store. */
  signEvent(event: FunnelEvent): SignedEventEnvelope;
  /** HMAC secret for delivery tokens. Never leaves the edge. */
  deliverySecret: string;
  /**
   * Requests carrying this value in `x-factory-internal` are owner/internal and
   * are excluded from every stranger-facing count.
   */
  internalTrafficToken: string;
  /** Phase E is fixture-only. Serving a commercial listing requires this flag. */
  allowCommercialListings: boolean;
  now(): Date;
  deliveryTtlSeconds: number;
  maxDownloadsPerGrant: number;
}

/**
 * The always-on commerce edge handler.
 *
 * One WHATWG `fetch` handler, run unchanged by the Cloudflare Worker entry and
 * by the tests. Routes:
 *
 *   GET  /p/:experimentId        product page + first-party PRODUCT_VIEW
 *   POST /e/:experimentId        offer-interaction beacon
 *   GET  /buy/:experimentId      first-party buy-click, then redirect to Stripe
 *   POST /webhooks/stripe        signed webhook -> fulfillment -> delivery grant
 *   GET  /thanks?ref=            post-payment page carrying the signed download
 *   GET  /d/:token               signed, expiring, use-limited artifact delivery
 *   GET  /healthz                liveness
 *
 * Deliberately absent: QUALIFIED_EXPOSURE. The edge can count views of its own
 * page honestly; it cannot know that an appropriate stranger was exposed. That
 * remains the ARRIVE adapter's claim to make, and conflating the two is how a
 * denominator becomes fiction.
 */

import { randomUUID } from 'node:crypto';
import type { FunnelEvent, TrafficClassification } from '../portfolio/types.ts';
import type { FulfillmentRequest, ProviderTestFulfillment } from '../portfolio/stripe-webhook.ts';
import { InvalidDeliveryTokenError, mintDeliveryToken, verifyDeliveryToken } from './delivery.ts';
import type { EdgeEnvironment, EdgeListing, ObjectStore, EdgeStateStore } from './types.ts';

const VISITOR_COOKIE = 'fv';

/**
 * Same shape the Stripe webhook processor enforces. Validating it at buy-click
 * means a malformed catalog entry fails before the buyer leaves for Stripe,
 * rather than after they have paid and the webhook rejects their transaction.
 */
const ARRIVE_REFERENCE = /^factory_arrive_[a-f0-9]{32}$/;

function html(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function text(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=') || null;
  }
  return null;
}

function classifyTraffic(request: Request, env: EdgeEnvironment): TrafficClassification {
  const marker = request.headers.get('x-factory-internal');
  if (marker && env.internalTrafficToken && marker === env.internalTrafficToken) return 'OWNER_INTERNAL';
  // Never STRANGER by default. Unverified traffic is unknown, and saying so is
  // the whole point of having a first-party instrument.
  return 'OTHER_OR_UNKNOWN';
}

/** Minute-bucketed so a refresh storm or a retry cannot inflate the count. */
function firstPartyEventId(kind: string, listing: EdgeListing, visitorId: string, now: Date): string {
  return `edge:${kind}:${listing.experimentId}:${visitorId}:${now.toISOString().slice(0, 16)}`;
}

async function emit(env: EdgeEnvironment, event: FunnelEvent): Promise<void> {
  await env.watch.ingest(env.signEvent(event));
}

function listingServable(listing: EdgeListing, env: EdgeEnvironment): boolean {
  return listing.noncommercialFixture || env.allowCommercialListings;
}

/**
 * Mints a delivery grant once a webhook confirms payment. Fails closed when the
 * artifact is not actually in object storage: telling a buyer "thanks" for a
 * file that does not exist is a fulfillment failure, and WATCH must see it.
 */
export interface EdgeDeliveryFulfillmentDeps {
  objects: ObjectStore;
  state: EdgeStateStore;
  catalog: EdgeEnvironment['catalog'];
  now: () => Date;
  ttlSeconds: number;
  maxDownloads: number;
}

export class EdgeDeliveryFulfillment implements ProviderTestFulfillment {
  private readonly deps: EdgeDeliveryFulfillmentDeps;

  constructor(deps: EdgeDeliveryFulfillmentDeps) {
    this.deps = deps;
  }

  async fulfill(request: FulfillmentRequest): Promise<{ succeeded: boolean; reason?: string }> {
    const listing = await this.deps.catalog.get(request.experimentId);
    if (!listing) {
      return { succeeded: false, reason: `No catalog listing for ${request.experimentId}.` };
    }
    if (listing.assetId !== request.assetId) {
      return { succeeded: false, reason: 'Transaction asset_id does not match the catalog listing.' };
    }
    const object = await this.deps.objects.get(listing.artifactKey);
    if (!object) {
      return { succeeded: false, reason: `Artifact ${listing.artifactKey} is not in object storage.` };
    }
    const existing = await this.deps.state.grantForTransaction(request.transactionId);
    if (existing) return { succeeded: true, reason: 'Delivery grant already existed (idempotent replay).' };

    const issuedAt = this.deps.now();
    const created = await this.deps.state.putGrant({
      grantId: `grant_${request.idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      experimentId: request.experimentId,
      assetId: request.assetId,
      transactionId: request.transactionId,
      artifactKey: listing.artifactKey,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + this.deps.ttlSeconds * 1000).toISOString(),
      maxDownloads: this.deps.maxDownloads,
      downloads: 0,
    });
    return {
      succeeded: true,
      reason: created.created ? 'Delivery grant issued.' : 'Delivery grant already existed.',
    };
  }
}

export function createEdgeHandler(env: EdgeEnvironment): (request: Request) => Promise<Response> {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/healthz') return text('ok', 200);

    // Externally readable posture, so a deploy can be *checked* rather than
    // assumed. It reports whether this edge is serving commercially and why
    // not; it exposes no secret, no listing, and no buyer data.
    if (url.pathname === '/posture') {
      return new Response(
        `${JSON.stringify(
          {
            deploymentPurpose: env.deploymentPurpose,
            commercialServing: env.allowCommercialListings,
            commercialAuthorizations: env.commercialAuthorizations,
          },
          null,
          2,
        )}\n`,
        { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
      );
    }

    if (segments[0] === 'p' && segments[1] && request.method === 'GET') {
      return productPage(env, request, segments[1]);
    }
    if (segments[0] === 'e' && segments[1] && request.method === 'POST') {
      return offerInteraction(env, request, segments[1]);
    }
    if (segments[0] === 'buy' && segments[1] && request.method === 'GET') {
      return buyClick(env, request, segments[1]);
    }
    if (url.pathname === '/webhooks/stripe' && request.method === 'POST') {
      return stripeWebhook(env, request);
    }
    if (url.pathname === '/thanks' && request.method === 'GET') {
      return thanks(env, url);
    }
    if (segments[0] === 'd' && segments[1] && request.method === 'GET') {
      return deliver(env, segments.slice(1).join('/'));
    }
    return text('Not found.', 404);
  };
}

async function loadServableListing(
  env: EdgeEnvironment,
  experimentId: string,
): Promise<EdgeListing | Response> {
  const listing = await env.catalog.get(experimentId);
  if (!listing) return text('Not found.', 404);
  if (!listingServable(listing, env)) {
    return text('This listing is commercial and commercial serving is disabled at this edge.', 403);
  }
  return listing;
}

async function productPage(
  env: EdgeEnvironment,
  request: Request,
  experimentId: string,
): Promise<Response> {
  const listing = await loadServableListing(env, experimentId);
  if (listing instanceof Response) return listing;

  const existingVisitor = readCookie(request, VISITOR_COOKIE);
  const visitorId = existingVisitor ?? randomUUID();
  const now = env.now();
  const classification = classifyTraffic(request, env);

  await emit(env, {
    eventId: firstPartyEventId('view', listing, visitorId, now),
    type: 'PRODUCT_VIEW',
    occurredAt: now.toISOString(),
    experimentId: listing.experimentId,
    assetId: listing.assetId,
    trafficClassification: classification,
    arrivalPublicationId: listing.arrivalPublicationId,
    environment: listing.environment,
    synthetic: false,
  });

  const price = (listing.priceCents / 100).toFixed(2);
  const marker = listing.noncommercialFixture
    ? '<p><strong>NONCOMMERCIAL FIXTURE — NOT FOR SALE.</strong> This page exists to prove Factory’s commerce path end to end.</p>'
    : '';
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(listing.title)}</title></head>
<body>
${marker}
<main data-experiment-id="${escapeHtml(listing.experimentId)}">
  <h1>${escapeHtml(listing.title)}</h1>
  <p>${escapeHtml(listing.summary)}</p>
  <p data-price>${escapeHtml(listing.currency)} ${price}</p>
  <p><a data-buy href="/buy/${encodeURIComponent(listing.experimentId)}">Buy</a></p>
  <button data-interest onclick="fetch('/e/${encodeURIComponent(listing.experimentId)}',{method:'POST'})">Tell me more</button>
</main>
</body></html>
`;
  const headers: Record<string, string> = {};
  if (!existingVisitor) {
    headers['set-cookie'] = `${VISITOR_COOKIE}=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  }
  return html(body, 200, headers);
}

async function offerInteraction(
  env: EdgeEnvironment,
  request: Request,
  experimentId: string,
): Promise<Response> {
  const listing = await loadServableListing(env, experimentId);
  if (listing instanceof Response) return listing;
  const visitorId = readCookie(request, VISITOR_COOKIE) ?? randomUUID();
  const now = env.now();
  await emit(env, {
    eventId: firstPartyEventId('interaction', listing, visitorId, now),
    type: 'OFFER_INTERACTION',
    occurredAt: now.toISOString(),
    experimentId: listing.experimentId,
    assetId: listing.assetId,
    trafficClassification: classifyTraffic(request, env),
    arrivalPublicationId: listing.arrivalPublicationId,
    environment: listing.environment,
    synthetic: false,
  });
  return text('recorded', 202);
}

async function buyClick(
  env: EdgeEnvironment,
  request: Request,
  experimentId: string,
): Promise<Response> {
  const listing = await loadServableListing(env, experimentId);
  if (listing instanceof Response) return listing;
  const visitorId = readCookie(request, VISITOR_COOKIE) ?? randomUUID();
  const now = env.now();

  // This is a FIRST-PARTY buy click. It is not Stripe's
  // `checkout.session.created`, which Phase C could not obtain with usable
  // attribution. The reason field says so, permanently.
  await emit(env, {
    eventId: firstPartyEventId('buy-click', listing, visitorId, now),
    type: 'CHECKOUT_STARTED',
    occurredAt: now.toISOString(),
    experimentId: listing.experimentId,
    assetId: listing.assetId,
    transactionId: `first-party-click:${listing.experimentId}:${visitorId}`,
    effectId: firstPartyEventId('buy-click', listing, visitorId, now),
    classification: 'OTHER_OR_UNKNOWN',
    trafficClassification: classifyTraffic(request, env),
    arrivalPublicationId: listing.arrivalPublicationId,
    reason: 'first-party buy click recorded at the edge before redirect to the provider',
    environment: listing.environment,
    synthetic: false,
  });

  const target = new URL(listing.checkoutUrl);
  if (listing.arrivalPublicationId) {
    if (!ARRIVE_REFERENCE.test(listing.arrivalPublicationId)) {
      return text('This listing has a malformed ARRIVE reference and cannot accept a checkout.', 500);
    }
    target.searchParams.set('client_reference_id', listing.arrivalPublicationId);
  }
  return new Response(null, {
    status: 302,
    headers: { location: target.toString(), 'cache-control': 'no-store' },
  });
}

async function stripeWebhook(env: EdgeEnvironment, request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return text('Missing stripe-signature.', 400);
  const payload = await request.text();
  let result;
  try {
    result = await env.stripe.process(payload, signature);
  } catch (error) {
    // Signature and policy failures are 400: Stripe should not retry them.
    return text(error instanceof Error ? error.message : 'Webhook rejected.', 400);
  }
  if (result.status === 'RETRYABLE_FAILURE') {
    return text(result.error ?? 'Retryable failure.', 500);
  }
  if (result.status === 'PROCESSED') {
    await linkBuyerFacingReferences(env, payload);
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * The buyer comes back from Stripe holding a Checkout Session ID or the
 * `client_reference_id` the edge minted — never the PaymentIntent the grant is
 * keyed on. Bind them here rather than inside the settled webhook processor.
 */
async function linkBuyerFacingReferences(env: EdgeEnvironment, payload: string): Promise<void> {
  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return;
  }
  if (event.type !== 'checkout.session.completed') return;
  const object = event.data?.object ?? {};
  const transactionId = typeof object.payment_intent === 'string' ? object.payment_intent : null;
  if (!transactionId) return;
  for (const field of ['id', 'client_reference_id']) {
    const value = object[field];
    if (typeof value === 'string' && value.length > 0) {
      await env.state.linkReference(value, transactionId);
    }
  }
}

async function thanks(env: EdgeEnvironment, url: URL): Promise<Response> {
  const reference = url.searchParams.get('ref') ?? url.searchParams.get('session_id');
  if (!reference) return text('Missing reference.', 400);
  const transactionId = await env.state.transactionForReference(reference);
  const grant = transactionId ? await env.state.grantForTransaction(transactionId) : null;
  if (!grant) {
    // Webhooks are asynchronous. A missing grant is "not yet", not "never".
    return html(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Payment received</title></head>' +
        '<body><h1>Payment received</h1><p data-pending>Your download is being prepared. Refresh in a moment.</p></body></html>',
      202,
    );
  }
  const token = mintDeliveryToken(
    {
      grantId: grant.grantId,
      experimentId: grant.experimentId,
      assetId: grant.assetId,
      expiresAt: grant.expiresAt,
    },
    env.deliverySecret,
  );
  return html(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Your download</title></head>` +
      `<body><h1>Your download</h1><p><a data-download href="/d/${token}">Download</a></p>` +
      `<p>This link expires at ${escapeHtml(grant.expiresAt)} and works ${grant.maxDownloads} time(s).</p></body></html>`,
  );
}

async function deliver(env: EdgeEnvironment, token: string): Promise<Response> {
  let payload;
  try {
    payload = verifyDeliveryToken(token, env.deliverySecret, env.now().toISOString());
  } catch (error) {
    if (error instanceof InvalidDeliveryTokenError) return text(error.message, 403);
    throw error;
  }
  const grant = await env.state.consumeDownload(payload.grantId, env.now().toISOString());
  if (!grant) return text('This download link has been used its maximum number of times.', 410);
  const object = await env.objects.get(grant.artifactKey);
  if (!object) return text('The artifact is unavailable.', 500);
  const body = new Uint8Array(object.bytes).slice().buffer as ArrayBuffer;
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': object.mediaType,
      'content-disposition': `attachment; filename="${object.fileName}"`,
      'x-factory-experiment-id': grant.experimentId,
      'cache-control': 'no-store',
    },
  });
}

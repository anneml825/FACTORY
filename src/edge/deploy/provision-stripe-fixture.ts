/**
 * Create the temporary Stripe SANDBOX objects the external fixture proof needs:
 * a Product, a Price, and a Managed Payments Payment Link, plus a webhook
 * endpoint pointed at the deployed Worker.
 *
 * Everything created here is test-mode and temporary. `teardown-stripe-fixture`
 * deactivates all of it. No live key is accepted: the adapter refuses anything
 * that is not a sandbox object.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { StripeTestHttpTransport } from '../../portfolio/stripe-api.ts';
import { StripeTestPutAdapter } from '../../portfolio/stripe-put-adapter.ts';
import { JsonStripePublicationStore } from '../../portfolio/stripe-publication-store.ts';
import { fixtureArtifact, fixtureManifest } from '../fixture-catalog.ts';
import { fixtureArriveReference } from './fixture-identity.ts';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const workerUrl = process.env.EDGE_BASE_URL;
const statePath = process.env.PHASE_E_STRIPE_STATE ?? 'state/phase-e-stripe-publication.json';
const outputPath = process.env.PHASE_E_STRIPE_OUTPUT ?? 'state/phase-e-stripe-fixture.json';

if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is required.');
if (!workerUrl) throw new Error('EDGE_BASE_URL is required so the webhook endpoint can be created.');
if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('rk_test_')) {
  throw new Error('Refusing to run: only a Stripe TEST key is accepted for the fixture proof.');
}

const transport = new StripeTestHttpTransport(stripeKey);
const manifest = fixtureManifest();
const artifact = fixtureArtifact();

const put = new StripeTestPutAdapter({
  transport,
  store: new JsonStripePublicationStore(statePath),
});

// Scoped to the run. Stripe replays a cached response for a reused idempotency
// key for 24 hours, so a stable key would hand this run the previous run's
// Product/Price/Payment Link — which teardown deactivated at the end of that
// run. The proof would then redirect buyers to a dead checkout while reporting
// success. Each proof creates its own objects; teardown sweeps them by metadata.
const runScope = process.env.GITHUB_RUN_ID ?? String(Date.now());
const publication = await put.publish(
  manifest,
  artifact,
  `phase-e-edge:${manifest.experimentId}:${runScope}`,
);

// The endpoint secret is returned only at creation, so it is captured here and
// installed straight into the Worker without ever being printed.
const endpoint = await transport.request<{ id: string; secret: string; url: string }>({
  method: 'POST',
  path: '/v1/webhook_endpoints',
  form: {
    url: `${workerUrl.replace(/\/$/, '')}/webhooks/stripe`,
    description: 'Factory Phase E fixture edge (temporary, deleted after the proof)',
    enabled_events: [
      'checkout.session.completed',
      'checkout.session.async_payment_failed',
      'refund.created',
      'charge.dispute.created',
    ],
  },
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      experimentId: manifest.experimentId,
      assetId: manifest.assetId,
      priceCents: manifest.price.amountCents,
      arriveReference: fixtureArriveReference(),
      checkoutUrl: publication.location,
      providerObjects: publication.providerObjects,
      webhookEndpointId: endpoint.id,
      webhookEndpointUrl: endpoint.url,
    },
    null,
    2,
  )}\n`,
);

// Written to a file the workflow reads into a masked secret, never to stdout.
await writeFile(process.env.PHASE_E_WHSEC_PATH ?? 'whsec.txt', endpoint.secret);

process.stdout.write(
  `checkout_url=${publication.location}\nwebhook_endpoint=${endpoint.id}\narrive_reference=${fixtureArriveReference()}\n`,
);

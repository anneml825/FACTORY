/**
 * Deactivate every temporary Stripe sandbox object the proof created and delete
 * the webhook endpoint. Runs even when the proof fails, so a failed run cannot
 * leave a live payment link or a webhook endpoint behind.
 */

import { readFile } from 'node:fs/promises';
import { StripeTestHttpTransport } from '../../portfolio/stripe-api.ts';
import { StripeTestPutAdapter } from '../../portfolio/stripe-put-adapter.ts';
import { JsonStripePublicationStore } from '../../portfolio/stripe-publication-store.ts';
import type { Publication } from '../../portfolio/types.ts';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const statePath = process.env.PHASE_E_STRIPE_STATE ?? 'state/phase-e-stripe-publication.json';
const outputPath = process.env.PHASE_E_STRIPE_OUTPUT ?? 'state/phase-e-stripe-fixture.json';
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is required.');

const transport = new StripeTestHttpTransport(stripeKey);
const results: Record<string, string> = {};

let fixture: { webhookEndpointId?: string; providerObjects?: Publication['providerObjects'] } = {};
try {
  fixture = JSON.parse(await readFile(outputPath, 'utf8'));
} catch {
  results.fixtureFile = 'absent — nothing recorded to tear down';
}

if (fixture.providerObjects) {
  const put = new StripeTestPutAdapter({ transport, store: new JsonStripePublicationStore(statePath) });
  const publication: Publication = {
    publicationId: fixture.providerObjects.paymentLinkId,
    experimentId: 'phase-e-teardown',
    assetId: 'phase-e-teardown',
    providerId: 'stripe-managed-payments-test-v1',
    location: '',
    idempotencyKey: 'phase-e-teardown',
    manifestFingerprint: 'phase-e-teardown',
    mode: 'PROVIDER_TEST',
    status: 'ACTIVE',
    providerObjects: fixture.providerObjects,
  };
  try {
    const deactivated = await put.deactivate(publication, 'phase-e-teardown');
    results.providerObjects = `status=${deactivated.status}`;
  } catch (error) {
    results.providerObjects = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
  }
}

if (fixture.webhookEndpointId) {
  try {
    await transport.request({ method: 'POST', path: `/v1/webhook_endpoints/${fixture.webhookEndpointId}` , form: { disabled: true } });
    results.webhookEndpoint = 'disabled';
  } catch (error) {
    results.webhookEndpoint = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
  }
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

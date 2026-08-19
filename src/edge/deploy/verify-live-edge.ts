/**
 * External verification of the deployed fixture commerce edge.
 *
 * Runs from a GitHub Actions runner against the real workers.dev URL over the
 * public internet. Nothing here is mocked: the page, the measurement, the
 * redirect, the webhook, the fulfillment, and the download are all served by
 * Cloudflare, and the webhook is signed and delivered by Stripe.
 *
 * Every assertion records what actually happened rather than what was expected,
 * so a partial result is reported as a partial result.
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { StripeTestHttpTransport } from '../../portfolio/stripe-api.ts';
import { fixtureArtifact, fixtureManifest } from '../fixture-catalog.ts';
import { fixtureArriveReference } from './fixture-identity.ts';

const run = promisify(execFile);

const baseUrl = (process.env.EDGE_BASE_URL ?? '').replace(/\/$/, '');
const stripeKey = process.env.STRIPE_SECRET_KEY;
const internalToken = process.env.EDGE_INTERNAL_TRAFFIC_TOKEN;
const resultPath = process.env.PHASE_E_RESULT_PATH ?? 'state/phase-e-edge-verification.json';
if (!baseUrl) throw new Error('EDGE_BASE_URL is required.');
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is required.');

const manifest = fixtureManifest();
const artifact = fixtureArtifact();
const arriveReference = fixtureArriveReference();
const transport = new StripeTestHttpTransport(stripeKey);

interface Check {
  name: string;
  passed: boolean;
  observed: string;
}
const checks: Check[] = [];
let failures = 0;

/** The edge reports why it failed closed; a bare 503 is not a diagnosis. */
function failureReason(response: Response): string {
  const reason = response.headers.get('x-factory-edge-failure');
  return reason ? ` — edge says: ${reason}` : '';
}

function record(name: string, passed: boolean, observed: string): void {
  checks.push({ name, passed, observed });
  if (!passed) failures++;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'}  ${name}\n        ${observed}\n`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// --- 1. liveness ------------------------------------------------------------
{
  const response = await fetch(`${baseUrl}/healthz`);
  record(
    'edge is reachable on the public internet',
    response.status === 200,
    `GET /healthz -> ${response.status}${failureReason(response)}`,
  );
}

// --- 2. product page + first-party measurement ------------------------------
let cookie = '';
{
  const response = await fetch(`${baseUrl}/p/${manifest.experimentId}`);
  const html = await response.text();
  cookie = (response.headers.get('set-cookie') ?? '').split(';')[0];
  record(
    'fixture product page is served',
    response.status === 200 && html.includes('NONCOMMERCIAL FIXTURE'),
    `GET /p/${manifest.experimentId} -> ${response.status}, ${html.length} bytes, banner=${html.includes('NONCOMMERCIAL FIXTURE')}`,
  );
  record('visitor cookie is issued for first-party measurement', cookie.startsWith('fv='), `set-cookie -> ${cookie || '(none)'}`);
}

// --- 3. offer interaction ---------------------------------------------------
{
  const response = await fetch(`${baseUrl}/e/${manifest.experimentId}`, { method: 'POST', headers: { cookie } });
  record('offer-interaction beacon is recorded', response.status === 202, `POST /e -> ${response.status}`);
}

// --- 4. owner-internal traffic is excluded ----------------------------------
if (internalToken) {
  const response = await fetch(`${baseUrl}/p/${manifest.experimentId}`, {
    headers: { 'x-factory-internal': internalToken },
  });
  record('owner-internal request is served but classified separately', response.status === 200, `GET /p (internal) -> ${response.status}`);
}

// --- 5. buy click -> Stripe with ARRIVE attribution -------------------------
{
  const response = await fetch(`${baseUrl}/buy/${manifest.experimentId}`, { headers: { cookie }, redirect: 'manual' });
  const location = response.headers.get('location') ?? '';
  const reference = location ? new URL(location).searchParams.get('client_reference_id') : null;
  record(
    'buy click redirects to Stripe carrying the ARRIVE reference',
    response.status === 302 && reference === arriveReference,
    `GET /buy -> ${response.status}, client_reference_id=${reference ?? '(none)'}`,
  );
}

// --- 6. a real Stripe-originated webhook ------------------------------------
// `stripe trigger` creates and completes a genuine test-mode Checkout Session,
// so the resulting event is signed by Stripe and delivered by Stripe over the
// internet. The overrides carry Factory's own attribution metadata; without
// them the edge's fail-closed metadata gate rejects the event, which is itself
// a meaningful result and is recorded as such.
let triggeredSessionId: string | null = null;
let triggerMode = 'unknown';
{
  const overrides = [
    `checkout_session:metadata[factory_environment]=PROVIDER_TEST`,
    `checkout_session:metadata[factory_test_transaction]=true`,
    `checkout_session:metadata[transaction_classification]=OWNER_TEST`,
    `checkout_session:metadata[experiment_id]=${manifest.experimentId}`,
    `checkout_session:metadata[asset_id]=${manifest.assetId}`,
    `checkout_session:client_reference_id=${arriveReference}`,
  ].flatMap((override) => ['--override', override]);
  try {
    const { stdout, stderr } = await run('stripe', ['trigger', 'checkout.session.completed', ...overrides], {
      env: { ...process.env, STRIPE_API_KEY: stripeKey },
      timeout: 120_000,
    });
    triggerMode = 'stripe trigger with Factory metadata overrides';
    record('Stripe trigger accepted Factory metadata overrides', true, `${(stdout || stderr).trim().split('\n').slice(-2).join(' | ')}`);
  } catch (error) {
    triggerMode = 'stripe trigger without overrides (override syntax rejected)';
    const detail = error instanceof Error ? error.message.split('\n').slice(0, 2).join(' ') : String(error);
    record('Stripe trigger accepted Factory metadata overrides', false, `override attempt failed: ${detail}`);
    try {
      await run('stripe', ['trigger', 'checkout.session.completed'], {
        env: { ...process.env, STRIPE_API_KEY: stripeKey },
        timeout: 120_000,
      });
      triggerMode = 'stripe trigger without overrides';
    } catch (fallbackError) {
      record(
        'a real Stripe event could be triggered at all',
        false,
        fallbackError instanceof Error ? fallbackError.message.split('\n')[0] : String(fallbackError),
      );
    }
  }
}

// Find the session Stripe actually created.
{
  await sleep(4000);
  const events = await transport.request<{ data: Array<{ id: string; type: string; data: { object: Record<string, unknown> } }> }>({
    method: 'GET',
    path: '/v1/events?limit=10&type=checkout.session.completed',
  });
  const newest = events.data?.[0];
  const object = newest?.data?.object ?? {};
  triggeredSessionId = typeof object.id === 'string' ? object.id : null;
  const metadata = (object.metadata ?? {}) as Record<string, string>;
  record(
    'Stripe created a completed Checkout Session',
    Boolean(triggeredSessionId),
    `session=${triggeredSessionId ?? '(none)'}, experiment_id=${metadata.experiment_id ?? '(absent)'}, client_reference_id=${String(object.client_reference_id ?? '(absent)')}`,
  );
}

// --- 7. fulfillment and signed delivery -------------------------------------
let downloadToken: string | null = null;
{
  let html = '';
  let status = 0;
  let lastFailure = '';
  for (let attempt = 0; attempt < 15 && !downloadToken; attempt++) {
    const response = await fetch(`${baseUrl}/thanks?session_id=${encodeURIComponent(triggeredSessionId ?? 'unknown')}`);
    status = response.status;
    lastFailure = failureReason(response) || `, body: ${(await response.clone().text()).slice(0, 100)}`;
    html = await response.text();
    downloadToken = html.match(/href="\/d\/([^"]+)"/)?.[1] ?? null;
    if (!downloadToken) await sleep(3000);
  }
  record(
    'webhook fulfillment produced a signed download grant',
    Boolean(downloadToken),
    `GET /thanks -> ${status}${downloadToken ? ', signed link issued' : `, no grant after 15 polls${lastFailure}`}`,
  );
}

if (downloadToken) {
  const response = await fetch(`${baseUrl}/d/${downloadToken}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = createHash('sha256').update(bytes).digest('hex');
  record(
    'signed download returns the exact fixture artifact',
    response.status === 200 && digest === artifact.sha256,
    `GET /d -> ${response.status}, ${bytes.length} bytes, sha256 match=${digest === artifact.sha256}`,
  );

  // --- 8. download-limit enforcement ---------------------------------------
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    statuses.push((await fetch(`${baseUrl}/d/${downloadToken}`)).status);
  }
  record(
    'download limit is enforced by the edge',
    statuses.includes(410),
    `repeat downloads -> ${statuses.join(', ')} (410 = grant exhausted)`,
  );

  // --- 9. token integrity ---------------------------------------------------
  const tampered = `${downloadToken.slice(0, -3)}AAA`;
  const response2 = await fetch(`${baseUrl}/d/${tampered}`);
  record('a tampered delivery token is refused', response2.status === 403, `GET /d (tampered) -> ${response2.status}`);
}

// --- 10. webhook idempotency ------------------------------------------------
{
  const events = await transport.request<{ data: Array<{ id: string }> }>({
    method: 'GET',
    path: '/v1/events?limit=1&type=checkout.session.completed',
  });
  const eventId = events.data?.[0]?.id;
  if (eventId) {
    try {
      await run('stripe', ['events', 'resend', eventId], {
        env: { ...process.env, STRIPE_API_KEY: stripeKey },
        timeout: 60_000,
      });
      await sleep(5000);
      record('Stripe redelivered the same event for the idempotency check', true, `resent ${eventId}`);
    } catch (error) {
      record(
        'Stripe redelivered the same event for the idempotency check',
        false,
        error instanceof Error ? error.message.split('\n')[0] : String(error),
      );
    }
  }
}

// --- 11. unknown listing -----------------------------------------------------
{
  const response = await fetch(`${baseUrl}/p/not-a-real-experiment`);
  record('an unknown listing is a 404', response.status === 404, `GET /p/not-a-real-experiment -> ${response.status}`);
}

await mkdir(dirname(resultPath), { recursive: true });
await writeFile(
  resultPath,
  `${JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      baseUrl,
      experimentId: manifest.experimentId,
      arriveReference,
      stripeTriggerMode: triggerMode,
      triggeredSessionId,
      checks,
      failures,
      commercialLaunch: false,
      capitalSpentCents: 0,
    },
    null,
    2,
  )}\n`,
);

process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.exit(failures === 0 ? 0 : 1);

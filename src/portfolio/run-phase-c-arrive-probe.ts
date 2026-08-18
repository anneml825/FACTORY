import { createServer } from 'node:http';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';
import { ArrivalWatchBridge, JsonArrivalMetricCheckpointStore } from './arrival-watch-bridge.ts';
import { DevToArriveAdapter, DevToHttpTransport, JsonDevToArrivalStore } from './devto-arrive-adapter.ts';
import { PostgresWatchStore } from './durable-watch.ts';
import { PhaseAEngine } from './engine.ts';
import { FixtureMakeAdapter } from './fake-adapters.ts';
import { shortDocumentFixture } from './fixtures.ts';
import { PostgresStripeWebhookStateStore } from './postgres-stripe-webhook-state.ts';
import { StripeTestHttpTransport } from './stripe-api.ts';
import { JsonStripePublicationStore } from './stripe-publication-store.ts';
import { StripeTestPutAdapter } from './stripe-put-adapter.ts';
import { StripeTestWebhookProcessor } from './stripe-webhook.ts';
import type { ArrivalPublication, Publication } from './types.ts';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const devToKey = process.env.DEVTO_API_KEY;
const devToExpectedPublicName = process.env.DEVTO_EXPECTED_PUBLIC_NAME;
const devToExpectedPublicUsername = process.env.DEVTO_EXPECTED_PUBLIC_USERNAME;
const devToAllowedPublicGithubUsername = process.env.DEVTO_ALLOWED_PUBLIC_GITHUB_USERNAME;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const internalSecret = process.env.FACTORY_INTERNAL_EVENT_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const stateDirectory = resolve(process.env.PHASE_C_STATE_DIRECTORY ?? 'state/phase-c-runtime');
const resultPath = resolve(process.env.PHASE_C_RESULT_PATH ?? 'state/phase-c-arrive-result.json');
const instructionsPath = resolve(process.env.PHASE_C_INSTRUCTIONS_PATH ?? 'state/phase-c-arrive-links.md');
const waitSeconds = Number(process.env.PHASE_C_WAIT_SECONDS ?? '900');
const port = Number(process.env.PHASE_C_WEBHOOK_PORT ?? '4242');
const probeId = process.env.PHASE_C_PROBE_ID?.trim() || `local-${Date.now()}`;

if (
  !stripeKey || !devToKey || !devToExpectedPublicName || !devToExpectedPublicUsername ||
  !webhookSecret || !internalSecret || !databaseUrl
) {
  throw new Error('Phase C requires Stripe/DEV test credentials, webhook/internal secrets, and DATABASE_URL.');
}
if (process.env.FACTORY_PAID_ACTIVITY_HALTED !== '1') {
  throw new Error('Phase C probe requires FACTORY_PAID_ACTIVITY_HALTED=1.');
}
if (!Number.isFinite(waitSeconds) || waitSeconds < 60 || waitSeconds > 1800) {
  throw new Error('PHASE_C_WAIT_SECONDS must be between 60 and 1800.');
}

const pool = new Pool({ connectionString: databaseUrl });
const stripeTransport = new StripeTestHttpTransport(stripeKey);
const put = new StripeTestPutAdapter({
  transport: stripeTransport,
  store: new JsonStripePublicationStore(resolve(stateDirectory, 'stripe-publication.json')),
});
const arrive = new DevToArriveAdapter({
  transport: new DevToHttpTransport(devToKey),
  store: new JsonDevToArrivalStore(resolve(stateDirectory, 'devto-arrival.json')),
  tag: 'webdev',
  expectedPublicName: devToExpectedPublicName,
  expectedPublicUsername: devToExpectedPublicUsername,
  allowedPublicGithubUsername: devToAllowedPublicGithubUsername,
});
const watch = await PostgresWatchStore.create({
  pool,
  signingSecret: internalSecret,
  acceptedEnvironments: ['PROVIDER_TEST', 'LIVE'],
});
const manifest = shortDocumentFixture();
const processor = new StripeTestWebhookProcessor({
  webhookSecret,
  internalEventSecret: internalSecret,
  state: new PostgresStripeWebhookStateStore(pool),
  watch,
  transport: stripeTransport,
  fulfillment: {
    async fulfill(request) {
      return request.assetId === manifest.assetId
        ? { succeeded: true }
        : { succeeded: false, reason: 'Attributed fixture artifact is unavailable.' };
    },
  },
});
const arrivalBridge = new ArrivalWatchBridge({
  watch,
  internalEventSecret: internalSecret,
  checkpoints: new JsonArrivalMetricCheckpointStore(resolve(stateDirectory, 'arrival-checkpoints.json')),
});

let wake: (() => void) | null = null;
const activity = () => {
  wake?.();
  wake = null;
};

const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/stripe-webhook') {
    response.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const payload = Buffer.concat(chunks).toString('utf8');
  const signature = request.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    response.writeHead(400).end('missing Stripe-Signature');
    return;
  }
  try {
    const result = await processor.process(payload, signature);
    if (result.status === 'REJECTED') response.writeHead(400).end(result.error);
    else if (result.status === 'RETRYABLE_FAILURE') response.writeHead(500).end(result.error);
    else response.writeHead(200).end('ok');
    activity();
  } catch (error) {
    response.writeHead(400).end(error instanceof Error ? error.message : String(error));
  }
});

await new Promise<void>((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', resolveListen);
});

let stripePublication: Publication | null = null;
let arrivalPublication: ArrivalPublication | null = null;
let stripeDeactivated = false;
let arrivalDeactivated = false;
let reportWritten = false;

try {
  const engine = new PhaseAEngine({ make: new FixtureMakeAdapter(), put, arrive, watch });
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  stripePublication = await engine.publish(
    manifest.experimentId,
    `phase-c:${probeId}:stripe-publication`,
  );
  const record = await engine.activateArrival(
    manifest.experimentId,
    `phase-c:${probeId}:devto-arrival`,
  );
  arrivalPublication = record.arrivalPublication;
  if (!arrivalPublication) throw new Error('ARRIVE activation returned no publication.');
  engine.observe(manifest.experimentId);

  const attributedCheckout = new URL(stripePublication.location);
  attributedCheckout.searchParams.set(
    'client_reference_id',
    arrivalPublication.arrivalPublicationId,
  );

  const instructions = [
    '## Factory Phase C noncommercial ARRIVE probe',
    '',
    `Public DEV fixture: ${arrivalPublication.location}`,
    `Internal attributed Stripe sandbox checkout: ${attributedCheckout.toString()}`,
    '',
    'Use the internal checkout URL for the owner test; do not open the DEV article from the',
    'owner account during measurement. Both URLs carry the same ARRIVE reference, while this',
    'avoids misclassifying the controlled test visit as stranger exposure.',
    'No real money can move. Any checkout is permanently test-only and excluded from commercial evidence.',
    'Do not repeatedly open the DEV article from the owner account; activation-time views are already baselined.',
    '',
  ].join('\n');
  await mkdir(dirname(instructionsPath), { recursive: true });
  await writeFile(instructionsPath, `${instructions}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, instructions);
  console.log(instructions);

  const deadline = Date.now() + waitSeconds * 1000;
  while (Date.now() < deadline) {
    const current = await arrive.measure(arrivalPublication);
    await arrivalBridge.ingest(arrivalPublication, current);
    const snapshot = watch.snapshot(manifest.experimentId);
    const completedTestTransaction = snapshot.transactions.some(
      (transaction) =>
        transaction.fulfilled &&
        transaction.classification === 'OWNER_TEST' &&
        transaction.arrivalPublicationId === arrivalPublication?.arrivalPublicationId,
    );
    const attributedFunnel = snapshot.arrivalFunnels.find(
      (funnel) => funnel.arrivalPublicationId === arrivalPublication?.arrivalPublicationId,
    );
    if (
      (attributedFunnel?.qualifiedExposures ?? 0) > 0 &&
      (attributedFunnel?.checkoutStarts ?? 0) > 0 &&
      completedTestTransaction
    ) {
      break;
    }
    await new Promise<void>((resolveWait) => {
      wake = resolveWait;
      setTimeout(resolveWait, Math.min(10_000, deadline - Date.now()));
    });
  }

  const finalMetrics = await arrive.measure(arrivalPublication);
  await arrivalBridge.ingest(arrivalPublication, finalMetrics);
  const snapshot = watch.snapshot(manifest.experimentId);
  const completedTestTransactions = snapshot.transactions.filter(
    (transaction) =>
      transaction.fulfilled &&
      transaction.classification === 'OWNER_TEST' &&
      transaction.arrivalPublicationId === arrivalPublication?.arrivalPublicationId,
  ).length;
  const attributedFunnel = snapshot.arrivalFunnels.find(
    (funnel) => funnel.arrivalPublicationId === arrivalPublication?.arrivalPublicationId,
  );
  const passed =
    (attributedFunnel?.qualifiedExposures ?? 0) > 0 &&
    (attributedFunnel?.productViews ?? 0) > 0 &&
    (attributedFunnel?.checkoutStarts ?? 0) > 0 &&
    completedTestTransactions > 0 &&
    snapshot.eligibleArmLengthRevenueCents === 0;

  arrivalPublication = await arrive.deactivate(
    arrivalPublication,
    `phase-c:${probeId}:devto-deactivate`,
  );
  arrivalDeactivated = arrivalPublication.status === 'INACTIVE';
  stripePublication = await put.deactivate(
    stripePublication,
    `phase-c:${probeId}:stripe-deactivate`,
  );
  stripeDeactivated = stripePublication.status === 'INACTIVE';

  const report = {
    schemaVersion: 1,
    completedAt: new Date().toISOString(),
    passed: passed && arrivalDeactivated && stripeDeactivated,
    probeId,
    cashSpentCents: 0,
    noncommercialFixture: true,
    experimentId: manifest.experimentId,
    arrive: {
      adapterId: arrive.adapterId,
      publication: arrivalPublication,
      measuredMetrics: finalMetrics,
      strangerExposureMeasured: (attributedFunnel?.qualifiedExposures ?? 0) > 0,
      attributedFunnel,
      evidenceSemantics: 'DEV page views are a PROXY for qualified exposure and a DIRECT visit count; feed impressions and outbound-link clicks are unavailable.',
    },
    put: { publication: stripePublication, deactivated: stripeDeactivated },
    watch: { durableStore: 'PostgreSQL watch_event_inbox', snapshot },
    settlement: {
      bookedRevenueCents: 0,
      availableSettledCashCents: 0,
      eligibleArmLengthRevenueCents: 0,
      attributableFactoryCostCents: 0,
    },
    ownerOperatingMinutes: 0,
    commercialClockStarted: false,
    phaseDStarted: false,
  };
  await mkdir(dirname(resultPath), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`);
  reportWritten = true;
  console.log(`PHASE_C_RESULT=${report.passed ? 'PASS' : 'FAIL'}`);
  if (!report.passed) process.exitCode = 1;
} finally {
  if (arrivalPublication && arrivalPublication.status === 'ACTIVE') {
    try {
      await arrive.deactivate(arrivalPublication, `phase-c:${probeId}:finally-devto-deactivate`);
      arrivalDeactivated = true;
    } catch (error) {
      console.error(`DEV cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (stripePublication && stripePublication.status === 'ACTIVE') {
    try {
      await put.deactivate(stripePublication, `phase-c:${probeId}:finally-stripe-deactivate`);
      stripeDeactivated = true;
    } catch (error) {
      console.error(`Stripe cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!reportWritten) {
    await mkdir(dirname(resultPath), { recursive: true });
    await writeFile(resultPath, `${JSON.stringify({
      schemaVersion: 1,
      completedAt: new Date().toISOString(),
      passed: false,
      probeId,
      cleanup: { arrivalDeactivated, stripeDeactivated },
      commercialClockStarted: false,
      phaseDStarted: false,
    }, null, 2)}\n`);
  }
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  await pool.end();
}

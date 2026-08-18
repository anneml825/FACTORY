import { createServer } from 'node:http';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PhaseAEngine } from './engine.ts';
import { FixtureArrivalAdapter, FixtureMakeAdapter } from './fake-adapters.ts';
import { shortDocumentFixture } from './fixtures.ts';
import { StripeTestHttpTransport } from './stripe-api.ts';
import { StripeTestPutAdapter } from './stripe-put-adapter.ts';
import { JsonStripePublicationStore } from './stripe-publication-store.ts';
import {
  StripeTestReconciler,
  StripeTestReconciliationRecovery,
} from './stripe-reconciliation.ts';
import { StripeTestWebhookProcessor } from './stripe-webhook.ts';
import { InMemoryWatchStore } from './watch.ts';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const internalSecret = process.env.FACTORY_INTERNAL_EVENT_SECRET;
const statePath = resolve(process.env.PHASE_B_STATE_PATH ?? 'state/phase-b-stripe-publication.json');
const resultPath = resolve(process.env.PHASE_B_RESULT_PATH ?? 'state/phase-b-stripe-sandbox-result.json');
const instructionsPath = resolve(
  process.env.PHASE_B_INSTRUCTIONS_PATH ?? 'state/phase-b-stripe-checkout.md',
);
const waitSeconds = Number(process.env.PHASE_B_WAIT_SECONDS ?? '900');
const port = Number(process.env.PHASE_B_WEBHOOK_PORT ?? '4242');
const probeId = process.env.PHASE_B_PROBE_ID?.trim() || `local-${Date.now()}`;

if (!stripeKey || !webhookSecret || !internalSecret) {
  throw new Error(
    'STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and FACTORY_INTERNAL_EVENT_SECRET are required.',
  );
}
if (process.env.FACTORY_PAID_ACTIVITY_HALTED !== '1') {
  throw new Error('Phase B sandbox probe requires FACTORY_PAID_ACTIVITY_HALTED=1.');
}
if (!Number.isFinite(waitSeconds) || waitSeconds < 60 || waitSeconds > 1800) {
  throw new Error('PHASE_B_WAIT_SECONDS must be between 60 and 1800.');
}

const transport = new StripeTestHttpTransport(stripeKey);
const put = new StripeTestPutAdapter({
  transport,
  store: new JsonStripePublicationStore(statePath),
});
const watch = new InMemoryWatchStore(internalSecret, ['PROVIDER_TEST']);
const manifest = shortDocumentFixture();
let artifactAvailable = false;
const refundedTransactions = new Set<string>();

const processor = new StripeTestWebhookProcessor({
  webhookSecret,
  internalEventSecret: internalSecret,
  watch,
  transport,
  fulfillment: {
    async fulfill(request) {
      return artifactAvailable && request.assetId === manifest.assetId
        ? { succeeded: true }
        : { succeeded: false, reason: 'Attributed fixture artifact is unavailable.' };
    },
  },
});
const recovery = new StripeTestReconciliationRecovery({
  transport,
  watch,
  internalEventSecret: internalSecret,
});
const recoveredEffects = { refunds: 0, disputes: 0 };

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

    const event = JSON.parse(payload) as {
      type: string;
      data: { object: { payment_intent?: string } };
    };
    if (
      result.status === 'PROCESSED' &&
      event.type === 'checkout.session.completed' &&
      event.data.object.payment_intent &&
      refundedTransactions.size === 0
    ) {
      const paymentIntent = event.data.object.payment_intent;
      refundedTransactions.add(paymentIntent);
      await transport.request({
        method: 'POST',
        path: '/v1/refunds',
        idempotencyKey: `factory:phase-b:refund:${paymentIntent}`,
        form: { payment_intent: paymentIntent, amount: 300 },
      });
    }
    activity();
  } catch (error) {
    response.writeHead(400).end(error instanceof Error ? error.message : String(error));
  }
});

await new Promise<void>((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', resolveListen);
});

try {
  const engine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put,
    arrive: new FixtureArrivalAdapter(),
    watch,
  });
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  artifactAvailable = true;
  const publication = await engine.publish(
    manifest.experimentId,
    `phase-b:stripe-sandbox:${probeId}:publication`,
  );
  engine.observe(manifest.experimentId);

  const instructions = [
    '## Factory Phase B Stripe sandbox probe',
    '',
    'This is a noncommercial Stripe test link. No real money can move.',
    '',
    `1. Open: ${publication.location}`,
    '2. First checkout: use test card `4242 4242 4242 4242`, any future expiry/CVC.',
    '3. Open the same link again.',
    '4. Second checkout: use dispute test card `4000 0000 0000 0259`.',
    '',
    'Both purchases are permanently classified OWNER_TEST and can never count as commercial revenue.',
    '',
  ].join('\n');
  console.log(instructions);
  await mkdir(dirname(instructionsPath), { recursive: true });
  await writeFile(instructionsPath, `${instructions}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, instructions);
  }

  const deadline = Date.now() + waitSeconds * 1000;
  while (Date.now() < deadline) {
    let snapshot = watch.snapshot(manifest.experimentId);
    for (const transaction of snapshot.transactions) {
      const recovered = await recovery.recoverTransaction(
        snapshot,
        transaction.transactionId,
      );
      recoveredEffects.refunds += recovered.recoveredRefundEffects;
      recoveredEffects.disputes += recovered.recoveredDisputeEffects;
      snapshot = watch.snapshot(manifest.experimentId);
    }
    const fulfilled = snapshot.transactions.filter((transaction) => transaction.fulfilled).length;
    if (fulfilled >= 2 && snapshot.refundsCents >= 300 && snapshot.disputesCents > 0) break;
    await new Promise<void>((resolveWait) => {
      wake = resolveWait;
      setTimeout(resolveWait, Math.min(10_000, deadline - Date.now()));
    });
  }

  const snapshot = watch.snapshot(manifest.experimentId);
  const reconciliations = [];
  for (const transaction of snapshot.transactions) {
    reconciliations.push(
      await new StripeTestReconciler(transport).reconcileTransaction(
        snapshot,
        transaction.transactionId,
      ),
    );
  }
  const inactive = await put.deactivate(
    publication,
    `phase-b:stripe-sandbox:${probeId}:deactivate`,
  );
  const passed =
    snapshot.transactions.length >= 2 &&
    snapshot.transactions.every(
      (transaction) => transaction.fulfilled && transaction.classification === 'OWNER_TEST',
    ) &&
    snapshot.refundsCents >= 300 &&
    snapshot.disputesCents > 0 &&
    snapshot.eligibleArmLengthRevenueCents === 0 &&
    reconciliations.every((reconciliation) => reconciliation.reconciled) &&
    inactive.status === 'INACTIVE';
  const report = {
    schemaVersion: 1,
    completedAt: new Date().toISOString(),
    passed,
    environment: 'PROVIDER_TEST',
    managedPaymentsRequested: true,
    probeId,
    experimentId: manifest.experimentId,
    publication,
    deactivated: inactive.status === 'INACTIVE',
    snapshot,
    recoveredEffects,
    reconciliations,
    settlement: {
      bookedRevenueCents: 0,
      availableSettledCashCents: 0,
      eligibleArmLengthRevenueCents: 0,
      attributableFactoryCostCents: 0,
    },
    commercialClockStarted: false,
    arriveSolved: false,
  };
  await mkdir(dirname(resultPath), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`PHASE_B_RESULT=${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) process.exitCode = 1;
} finally {
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
}

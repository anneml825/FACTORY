import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureEventSigner } from './fake-adapters.ts';
import { syntheticEvent } from './fixtures.ts';
import { PostgresWatchStore } from './durable-watch.ts';
import { PostgresStripeWebhookStateStore } from './postgres-stripe-webhook-state.ts';
import { signStripeTestEvent, StripeTestWebhookProcessor } from './stripe-webhook.ts';

const databaseUrl = process.env.TEST_DATABASE_URL;
const SECRET = 'phase-c-postgres-test-secret';
const STRIPE_SECRET = 'whsec_phase_c_postgres_test';
const NOW = 1_776_499_200;

test('PostgreSQL WATCH acknowledges durably, recovers on restart, and remains append-only', {
  skip: !databaseUrl,
}, async () => {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query('TRUNCATE watch_event_inbox RESTART IDENTITY');
    const signer = new FixtureEventSigner(SECRET);
    const event = syntheticEvent({ eventId: 'postgres-durable-exposure', type: 'QUALIFIED_EXPOSURE' });
    const first = await PostgresWatchStore.create({ pool, signingSecret: SECRET });
    assert.deepEqual(await first.ingest(signer.sign(event)), { accepted: true, duplicate: false });

    const row = await pool.query('SELECT count(*)::int AS count FROM watch_event_inbox');
    assert.equal(row.rows[0].count, 1);
    const restarted = await PostgresWatchStore.create({ pool, signingSecret: SECRET });
    assert.equal(restarted.snapshot(event.experimentId).qualifiedExposures, 1);
    assert.deepEqual(await restarted.ingest(signer.sign(event)), { accepted: false, duplicate: true });
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM watch_event_inbox')).rows[0].count, 1);

    await assert.rejects(
      pool.query("UPDATE watch_event_inbox SET event_type='PRODUCT_VIEW' WHERE event_id=$1", [event.eventId]),
      /append-only/,
    );
    assert.equal((await pool.query('SELECT event_type FROM watch_event_inbox')).rows[0].event_type, 'QUALIFIED_EXPOSURE');
  } finally {
    await pool.end();
  }
});

test('Stripe webhook inbox and transaction attribution recover from a process restart', {
  skip: !databaseUrl,
}, async () => {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query('TRUNCATE stripe_webhook_inbox, stripe_transaction_reference, watch_event_inbox RESTART IDENTITY');
    let fulfillments = 0;
    const payload = JSON.stringify({
      id: 'evt_postgres_checkout',
      type: 'checkout.session.completed',
      created: NOW,
      livemode: false,
      data: {
        object: {
          id: 'cs_postgres_checkout',
          payment_intent: 'pi_postgres_checkout',
          client_reference_id: 'factory_arrive_abcdef0123456789abcdef0123456789',
          amount_total: 1200,
          currency: 'usd',
          payment_status: 'paid',
          metadata: {
            factory_environment: 'PROVIDER_TEST',
            factory_test_transaction: 'true',
            transaction_classification: 'OWNER_TEST',
            experiment_id: 'phase-a-doc-001',
            asset_id: 'fixture-doc-001',
          },
        },
      },
    });
    const signature = signStripeTestEvent(payload, STRIPE_SECRET, NOW);
    const firstWatch = await PostgresWatchStore.create({
      pool,
      signingSecret: SECRET,
      acceptedEnvironments: ['PROVIDER_TEST'],
    });
    const first = new StripeTestWebhookProcessor({
      webhookSecret: STRIPE_SECRET,
      internalEventSecret: SECRET,
      state: new PostgresStripeWebhookStateStore(pool),
      watch: firstWatch,
      fulfillment: { async fulfill() { fulfillments++; return { succeeded: true }; } },
      nowSeconds: () => NOW,
    });
    assert.equal((await first.process(payload, signature)).status, 'PROCESSED');

    const restartedWatch = await PostgresWatchStore.create({
      pool,
      signingSecret: SECRET,
      acceptedEnvironments: ['PROVIDER_TEST'],
    });
    const restarted = new StripeTestWebhookProcessor({
      webhookSecret: STRIPE_SECRET,
      internalEventSecret: SECRET,
      state: new PostgresStripeWebhookStateStore(pool),
      watch: restartedWatch,
      fulfillment: { async fulfill() { fulfillments++; return { succeeded: true }; } },
      nowSeconds: () => NOW,
    });
    assert.equal((await restarted.process(payload, signature)).status, 'DUPLICATE');
    assert.equal(fulfillments, 1);
    assert.equal(restartedWatch.snapshot('phase-a-doc-001').transactions.length, 1);
    const snapshot = restartedWatch.snapshot('phase-a-doc-001');
    assert.equal(snapshot.transactions[0].arrivalPublicationId, 'factory_arrive_abcdef0123456789abcdef0123456789');
    assert.deepEqual(snapshot.arrivalFunnels[0].transactionIds, ['pi_postgres_checkout']);
    const reference = await new PostgresStripeWebhookStateStore(pool).findTransaction('pi_postgres_checkout');
    assert.equal(reference?.arrivalPublicationId, 'factory_arrive_abcdef0123456789abcdef0123456789');
  } finally {
    await pool.end();
  }
});

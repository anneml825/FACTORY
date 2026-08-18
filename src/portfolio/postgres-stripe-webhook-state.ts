import type { Pool } from 'pg';
import type {
  StripeTransactionReference,
  StripeWebhookInboxRecord,
  StripeWebhookStateStore,
} from './stripe-webhook.ts';

export class PostgresStripeWebhookStateStore implements StripeWebhookStateStore {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getInbox(eventId: string): Promise<StripeWebhookInboxRecord | null> {
    const result = await this.pool.query<{
      event_id: string;
      payload_sha256: string;
      status: StripeWebhookInboxRecord['status'];
      attempts: number;
      last_error: string | null;
    }>(
      `SELECT event_id, payload_sha256, status, attempts, last_error
         FROM stripe_webhook_inbox
        WHERE event_id=$1`,
      [eventId],
    );
    const row = result.rows[0];
    return row ? {
      eventId: row.event_id,
      payloadSha256: row.payload_sha256,
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
    } : null;
  }

  async saveInbox(record: StripeWebhookInboxRecord): Promise<void> {
    const result = await this.pool.query(
      `INSERT INTO stripe_webhook_inbox
         (event_id, payload_sha256, status, attempts, last_error)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id) DO UPDATE SET
         status=EXCLUDED.status,
         attempts=EXCLUDED.attempts,
         last_error=EXCLUDED.last_error,
         updated_at=now()
       WHERE stripe_webhook_inbox.payload_sha256=EXCLUDED.payload_sha256`,
      [record.eventId, record.payloadSha256, record.status, record.attempts, record.lastError],
    );
    if (result.rowCount !== 1) {
      throw new Error('Stripe webhook event ID was persisted previously with different bytes.');
    }
  }

  async saveTransaction(reference: StripeTransactionReference): Promise<void> {
    await this.pool.query(
      `INSERT INTO stripe_transaction_reference
         (transaction_id, checkout_session_id, payment_intent_id, experiment_key,
          asset_key, classification, gross_cents, currency, arrival_publication_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (transaction_id) DO NOTHING`,
      [
        reference.transactionId,
        reference.checkoutSessionId,
        reference.paymentIntentId,
        reference.experimentId,
        reference.assetId,
        reference.classification,
        reference.grossCents,
        reference.currency,
        reference.arrivalPublicationId,
      ],
    );
    const persisted = await this.findTransaction(reference.transactionId);
    if (!persisted || JSON.stringify(persisted) !== JSON.stringify(reference)) {
      throw new Error('Stripe transaction reference changed semantics across a retry.');
    }
  }

  async findTransaction(providerReference: string): Promise<StripeTransactionReference | null> {
    const result = await this.pool.query<{
      transaction_id: string;
      checkout_session_id: string;
      payment_intent_id: string | null;
      experiment_key: string;
      asset_key: string;
      classification: StripeTransactionReference['classification'];
      gross_cents: string;
      currency: string;
      arrival_publication_key: string | null;
    }>(
      `SELECT transaction_id, checkout_session_id, payment_intent_id, experiment_key,
              asset_key, classification, gross_cents, currency, arrival_publication_key
         FROM stripe_transaction_reference
        WHERE transaction_id=$1 OR checkout_session_id=$1 OR payment_intent_id=$1
        LIMIT 1`,
      [providerReference],
    );
    const row = result.rows[0];
    return row ? {
      transactionId: row.transaction_id,
      checkoutSessionId: row.checkout_session_id,
      paymentIntentId: row.payment_intent_id,
      experimentId: row.experiment_key,
      assetId: row.asset_key,
      classification: row.classification,
      grossCents: Number(row.gross_cents),
      currency: row.currency,
      arrivalPublicationId: row.arrival_publication_key,
    } : null;
  }
}

/**
 * Cloudflare D1 bindings for the always-on commerce edge.
 *
 * A Worker isolate is evicted between requests and cannot open a TCP connection
 * to PostgreSQL, so the in-memory and `pg`-backed stores are both unusable at
 * the edge. These are their D1 counterparts, deliberately written against a
 * minimal `D1Like` interface so they can be exercised against real SQLite
 * without Cloudflare in the loop.
 *
 * Verified constraint (docs/PHASE_E_CLOUDFLARE_VERIFICATION.md): D1 on Workers
 * Free permits only 50 queries per Worker invocation. Every path here is
 * counted. In particular `D1WatchStore.create` replays the whole journal with
 * ONE query returning many rows — never one query per event — because the
 * obvious implementation would blow the budget on a cold start.
 */

import { createHash } from 'node:crypto';
import { InMemoryWatchStore, watchEventEffectIdentity } from '../portfolio/watch.ts';
import type { WatchAdapter } from '../portfolio/ports.ts';
import type { FunnelEvent, FunnelSnapshot, SignedEventEnvelope } from '../portfolio/types.ts';
import type {
  StripeTransactionReference,
  StripeWebhookInboxRecord,
  StripeWebhookStateStore,
} from '../portfolio/stripe-webhook.ts';
import type { DeliveryGrant, EdgeStateStore, ObjectStore, StoredObject } from './types.ts';

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success?: boolean;
  meta?: { changes?: number; rows_read?: number; rows_written?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Like {
  prepare(query: string): D1PreparedStatement;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

// ---------------------------------------------------------------------------
// Object storage
// ---------------------------------------------------------------------------

/**
 * D1 as a stand-in for R2 while artifacts are fixture-sized. D1 Free caps a
 * database at 500 MB, so this cannot carry real 2 MB products — the ObjectStore
 * port exists precisely so that swap is a binding change, not a redesign.
 */
export class D1ObjectStore implements ObjectStore {
  private readonly db: D1Like;

  constructor(db: D1Like) {
    this.db = db;
  }

  async put(key: string, object: StoredObject): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO edge_object (key, media_type, file_name, sha256, body_base64)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (key) DO UPDATE SET
           media_type = excluded.media_type,
           file_name = excluded.file_name,
           sha256 = excluded.sha256,
           body_base64 = excluded.body_base64`,
      )
      .bind(key, object.mediaType, object.fileName, object.sha256, toBase64(object.bytes))
      .run();
  }

  async get(key: string): Promise<StoredObject | null> {
    const row = await this.db
      .prepare('SELECT media_type, file_name, sha256, body_base64 FROM edge_object WHERE key = ?1')
      .bind(key)
      .first<{ media_type: string; file_name: string; sha256: string; body_base64: string }>();
    if (!row) return null;
    return {
      bytes: fromBase64(row.body_base64),
      mediaType: row.media_type,
      fileName: row.file_name,
      sha256: row.sha256,
    };
  }
}

// ---------------------------------------------------------------------------
// Delivery grants
// ---------------------------------------------------------------------------

interface GrantRow {
  grant_id: string;
  transaction_id: string;
  experiment_key: string;
  asset_key: string;
  artifact_key: string;
  issued_at: string;
  expires_at: string;
  max_downloads: number;
  downloads: number;
}

function toGrant(row: GrantRow): DeliveryGrant {
  return {
    grantId: row.grant_id,
    transactionId: row.transaction_id,
    experimentId: row.experiment_key,
    assetId: row.asset_key,
    artifactKey: row.artifact_key,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    maxDownloads: row.max_downloads,
    downloads: row.downloads,
  };
}

export class D1EdgeStateStore implements EdgeStateStore {
  private readonly db: D1Like;

  constructor(db: D1Like) {
    this.db = db;
  }

  async putGrant(grant: DeliveryGrant): Promise<{ created: boolean }> {
    const result = await this.db
      .prepare(
        `INSERT INTO delivery_grant
           (grant_id, transaction_id, experiment_key, asset_key, artifact_key,
            issued_at, expires_at, max_downloads, downloads)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT (transaction_id) DO NOTHING`,
      )
      .bind(
        grant.grantId,
        grant.transactionId,
        grant.experimentId,
        grant.assetId,
        grant.artifactKey,
        grant.issuedAt,
        grant.expiresAt,
        grant.maxDownloads,
        grant.downloads,
      )
      .run();
    return { created: (result.meta?.changes ?? 0) > 0 };
  }

  async getGrant(grantId: string): Promise<DeliveryGrant | null> {
    const row = await this.db
      .prepare('SELECT * FROM delivery_grant WHERE grant_id = ?1')
      .bind(grantId)
      .first<GrantRow>();
    return row ? toGrant(row) : null;
  }

  async grantForTransaction(transactionId: string): Promise<DeliveryGrant | null> {
    const row = await this.db
      .prepare('SELECT * FROM delivery_grant WHERE transaction_id = ?1')
      .bind(transactionId)
      .first<GrantRow>();
    return row ? toGrant(row) : null;
  }

  async linkReference(reference: string, transactionId: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO delivery_reference (reference, transaction_id)
         VALUES (?1, ?2) ON CONFLICT (reference) DO NOTHING`,
      )
      .bind(reference, transactionId)
      .run();
    const stored = await this.transactionForReference(reference);
    if (stored && stored !== transactionId) {
      throw new Error(`Reference ${reference} is already bound to a different transaction.`);
    }
  }

  async transactionForReference(reference: string): Promise<string | null> {
    const row = await this.db
      .prepare('SELECT transaction_id FROM delivery_reference WHERE reference = ?1')
      .bind(reference)
      .first<{ transaction_id: string }>();
    return row?.transaction_id ?? null;
  }

  /**
   * The conditional UPDATE is the limit. D1 has no interactive transactions, but
   * a single statement is atomic, so two concurrent requests for the last slot
   * cannot both match — one reports zero changed rows and is refused.
   */
  async consumeDownload(grantId: string, at: string): Promise<DeliveryGrant | null> {
    const claimed = await this.db
      .prepare(
        `UPDATE delivery_grant SET downloads = downloads + 1
          WHERE grant_id = ?1 AND downloads < max_downloads`,
      )
      .bind(grantId)
      .run();
    if ((claimed.meta?.changes ?? 0) === 0) return null;

    await this.db
      .prepare('INSERT INTO delivery_download (grant_id, downloaded_at) VALUES (?1, ?2)')
      .bind(grantId, at)
      .run();
    return this.getGrant(grantId);
  }
}

// ---------------------------------------------------------------------------
// Stripe webhook state
// ---------------------------------------------------------------------------

export class D1StripeWebhookStateStore implements StripeWebhookStateStore {
  private readonly db: D1Like;

  constructor(db: D1Like) {
    this.db = db;
  }

  async getInbox(eventId: string): Promise<StripeWebhookInboxRecord | null> {
    const row = await this.db
      .prepare(
        'SELECT event_id, payload_sha256, status, attempts, last_error FROM stripe_webhook_inbox WHERE event_id = ?1',
      )
      .bind(eventId)
      .first<{
        event_id: string;
        payload_sha256: string;
        status: StripeWebhookInboxRecord['status'];
        attempts: number;
        last_error: string | null;
      }>();
    return row
      ? {
          eventId: row.event_id,
          payloadSha256: row.payload_sha256,
          status: row.status,
          attempts: row.attempts,
          lastError: row.last_error,
        }
      : null;
  }

  async saveInbox(record: StripeWebhookInboxRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO stripe_webhook_inbox (event_id, payload_sha256, status, attempts, last_error)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (event_id) DO UPDATE SET
           status = excluded.status,
           attempts = excluded.attempts,
           last_error = excluded.last_error`,
      )
      .bind(record.eventId, record.payloadSha256, record.status, record.attempts, record.lastError)
      .run();
  }

  async saveTransaction(reference: StripeTransactionReference): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO stripe_transaction_reference
           (transaction_id, checkout_session_id, payment_intent_id, experiment_key,
            asset_key, classification, gross_cents, currency, arrival_publication_key)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT (transaction_id) DO NOTHING`,
      )
      .bind(
        reference.transactionId,
        reference.checkoutSessionId,
        reference.paymentIntentId,
        reference.experimentId,
        reference.assetId,
        reference.classification,
        reference.grossCents,
        reference.currency,
        reference.arrivalPublicationId,
      )
      .run();
  }

  async findTransaction(providerReference: string): Promise<StripeTransactionReference | null> {
    const row = await this.db
      .prepare(
        `SELECT * FROM stripe_transaction_reference
          WHERE transaction_id = ?1 OR checkout_session_id = ?1 OR payment_intent_id = ?1
          LIMIT 1`,
      )
      .bind(providerReference)
      .first<{
        transaction_id: string;
        checkout_session_id: string;
        payment_intent_id: string | null;
        experiment_key: string;
        asset_key: string;
        classification: StripeTransactionReference['classification'];
        gross_cents: number;
        currency: string;
        arrival_publication_key: string | null;
      }>();
    return row
      ? {
          transactionId: row.transaction_id,
          checkoutSessionId: row.checkout_session_id,
          paymentIntentId: row.payment_intent_id,
          experimentId: row.experiment_key,
          assetId: row.asset_key,
          classification: row.classification,
          grossCents: row.gross_cents,
          currency: row.currency,
          arrivalPublicationId: row.arrival_publication_key,
        }
      : null;
  }
}

// ---------------------------------------------------------------------------
// Durable WATCH
// ---------------------------------------------------------------------------

/**
 * Append-only WATCH journal on D1, with an in-memory projection rebuilt by
 * replay. `snapshot` is synchronous in the WatchAdapter contract, so the
 * projection must already be loaded — hence the async factory.
 */
export class D1WatchStore implements WatchAdapter {
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly db: D1Like;
  private readonly signingSecret: string;
  private readonly acceptedEnvironments: readonly FunnelEvent['environment'][];
  private memory: InMemoryWatchStore;

  private constructor(options: {
    db: D1Like;
    signingSecret: string;
    acceptedEnvironments: readonly FunnelEvent['environment'][];
    memory: InMemoryWatchStore;
  }) {
    this.db = options.db;
    this.signingSecret = options.signingSecret;
    this.acceptedEnvironments = options.acceptedEnvironments;
    this.memory = options.memory;
  }

  static async create(options: {
    db: D1Like;
    signingSecret: string;
    acceptedEnvironments?: readonly FunnelEvent['environment'][];
  }): Promise<D1WatchStore> {
    const acceptedEnvironments = options.acceptedEnvironments ?? ['FIXTURE'];
    const memory = new InMemoryWatchStore(options.signingSecret, [...acceptedEnvironments]);
    // ONE query. Replaying with a query per event would exhaust the Free plan's
    // 50-queries-per-invocation budget after fifty events.
    const rows = await options.db
      .prepare('SELECT payload, signature FROM watch_event_inbox ORDER BY id')
      .all<{ payload: string; signature: string }>();
    for (const row of rows.results ?? []) {
      await memory.ingest({ payload: row.payload, signature: row.signature });
    }
    return new D1WatchStore({ ...options, acceptedEnvironments, memory });
  }

  async ingest(envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }> {
    // Validate against a clone first so a rejected event never mutates the
    // projection, then persist, then adopt. Same ordering as PostgresWatchStore.
    const candidate = this.memory.clone();
    const result = await candidate.ingest(envelope);
    if (!result.accepted) return result;

    const event = JSON.parse(envelope.payload) as FunnelEvent;
    const effect = watchEventEffectIdentity(event);
    const payloadSha256 = createHash('sha256').update(envelope.payload).digest('hex');
    await this.db
      .prepare(
        `INSERT INTO watch_event_inbox
           (event_id, experiment_key, asset_key, event_type, environment,
            payload, signature, payload_sha256, effect_key, effect_fingerprint)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      )
      .bind(
        event.eventId,
        event.experimentId,
        event.assetId,
        event.type,
        event.environment,
        envelope.payload,
        envelope.signature,
        payloadSha256,
        effect?.key ?? null,
        effect?.fingerprint ?? null,
      )
      .run();

    this.memory = candidate;
    return result;
  }

  snapshot(experimentId: string): FunnelSnapshot {
    return this.memory.snapshot(experimentId);
  }

  eventCount(): number {
    return this.memory.eventCount();
  }
}

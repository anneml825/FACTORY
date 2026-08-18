import { createHash } from 'node:crypto';
import { mkdir, open, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool, PoolClient } from 'pg';
import type { WatchAdapter } from './ports.ts';
import type { FunnelEvent, FunnelSnapshot, SignedEventEnvelope } from './types.ts';
import { EventConflictError, InMemoryWatchStore, watchEventEffectIdentity } from './watch.ts';

interface DurableEventRecord {
  schemaVersion: 1;
  sequence: number;
  envelope: SignedEventEnvelope;
}

function parseEvent(envelope: SignedEventEnvelope): FunnelEvent {
  return JSON.parse(envelope.payload) as FunnelEvent;
}

function safeEventName(eventId: string): string {
  return createHash('sha256').update(eventId).digest('hex');
}

/**
 * A restartable local journal used by the credential-free Phase C proof.
 * Each acknowledged event is fsynced to a complete, atomically renamed file.
 * It is not the unattended cloud runtime; PostgresWatchStore is that boundary.
 */
export class JsonJournalWatchStore implements WatchAdapter {
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly directory: string;
  private memory: InMemoryWatchStore;
  private nextSequence: number;

  private constructor(directory: string, memory: InMemoryWatchStore, nextSequence: number) {
    this.directory = directory;
    this.memory = memory;
    this.nextSequence = nextSequence;
  }

  static async create(
    directory: string,
    signingSecret: string,
    acceptedEnvironments: readonly FunnelEvent['environment'][] = ['FIXTURE'],
  ): Promise<JsonJournalWatchStore> {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const memory = new InMemoryWatchStore(signingSecret, acceptedEnvironments);
    const files = (await readdir(directory)).filter((name) => name.endsWith('.event.json')).sort();
    let highest = 0;
    for (const name of files) {
      const handle = await open(join(directory, name), 'r');
      const parsed = JSON.parse(await handle.readFile('utf8')) as DurableEventRecord;
      await handle.close();
      if (parsed.schemaVersion !== 1 || !Number.isInteger(parsed.sequence)) {
        throw new Error(`Unsupported or corrupt WATCH journal record: ${name}.`);
      }
      highest = Math.max(highest, parsed.sequence);
      const result = await memory.ingest(parsed.envelope);
      if (!result.accepted) {
        throw new Error(`WATCH journal contains a duplicate accepted effect: ${name}.`);
      }
    }
    return new JsonJournalWatchStore(directory, memory, highest + 1);
  }

  async ingest(envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }> {
    const candidate = this.memory.clone();
    const result = await candidate.ingest(envelope);
    if (!result.accepted) return result;

    const event = parseEvent(envelope);
    const sequence = this.nextSequence;
    const prefix = String(sequence).padStart(16, '0');
    const finalPath = join(this.directory, `${prefix}-${safeEventName(event.eventId)}.event.json`);
    const temporaryPath = `${finalPath}.${process.pid}.tmp`;
    const record: DurableEventRecord = { schemaVersion: 1, sequence, envelope };
    const handle = await open(temporaryPath, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(record)}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, finalPath);
    const directoryHandle = await open(this.directory, 'r');
    try {
      await directoryHandle.sync();
    } finally {
      await directoryHandle.close();
    }
    this.memory = candidate;
    this.nextSequence++;
    return result;
  }

  snapshot(experimentId: string): FunnelSnapshot {
    return this.memory.snapshot(experimentId);
  }
}

interface WatchRow {
  event_id: string;
  payload: string;
  signature: string;
  payload_sha256: string;
  effect_key: string | null;
  effect_fingerprint: string | null;
}

/** PostgreSQL-backed append-only WATCH inbox for unattended runtimes. */
export class PostgresWatchStore implements WatchAdapter {
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly pool: Pool;
  private readonly signingSecret: string;
  private readonly acceptedEnvironments: readonly FunnelEvent['environment'][];
  private memory: InMemoryWatchStore;

  private constructor(options: {
    pool: Pool;
    signingSecret: string;
    acceptedEnvironments: readonly FunnelEvent['environment'][];
    memory: InMemoryWatchStore;
  }) {
    this.pool = options.pool;
    this.signingSecret = options.signingSecret;
    this.acceptedEnvironments = options.acceptedEnvironments;
    this.memory = options.memory;
  }

  static async create(options: {
    pool: Pool;
    signingSecret: string;
    acceptedEnvironments?: readonly FunnelEvent['environment'][];
  }): Promise<PostgresWatchStore> {
    const acceptedEnvironments = options.acceptedEnvironments ?? ['FIXTURE'];
    const memory = await loadPostgresMemory(
      options.pool,
      options.signingSecret,
      acceptedEnvironments,
    );
    return new PostgresWatchStore({ ...options, acceptedEnvironments, memory });
  }

  async ingest(envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }> {
    const candidate = this.memory.clone();
    const result = await candidate.ingest(envelope);
    if (!result.accepted) return result;

    const event = parseEvent(envelope);
    const effect = watchEventEffectIdentity(event);
    const payloadSha256 = createHash('sha256').update(envelope.payload).digest('hex');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('factory-watch-ingest'))");
      await client.query(
        `INSERT INTO watch_event_inbox
          (event_id, experiment_key, asset_key, event_type, environment, payload,
           signature, payload_sha256, effect_key, effect_fingerprint)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
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
        ],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code !== '23505') throw error;
      return this.resolveUniqueConflict(client, envelope, event, payloadSha256, effect);
    } finally {
      client.release();
    }
    this.memory = candidate;
    return result;
  }

  snapshot(experimentId: string): FunnelSnapshot {
    return this.memory.snapshot(experimentId);
  }

  async refresh(): Promise<void> {
    this.memory = await loadPostgresMemory(
      this.pool,
      this.signingSecret,
      this.acceptedEnvironments,
    );
  }

  private async resolveUniqueConflict(
    client: PoolClient,
    envelope: SignedEventEnvelope,
    event: FunnelEvent,
    payloadSha256: string,
    effect: ReturnType<typeof watchEventEffectIdentity>,
  ): Promise<{ accepted: boolean; duplicate: boolean }> {
    const existing = await client.query<WatchRow>(
      `SELECT event_id, payload, signature, payload_sha256,
              effect_key, effect_fingerprint
         FROM watch_event_inbox
        WHERE event_id = $1 OR ($2::text IS NOT NULL AND effect_key = $2)
        ORDER BY received_at
        LIMIT 1`,
      [event.eventId, effect?.key ?? null],
    );
    const row = existing.rows[0];
    if (!row) throw new Error('WATCH uniqueness conflict could not be reconciled.');
    const sameEvent = row.event_id === event.eventId && row.payload_sha256 === payloadSha256;
    const sameEffect =
      effect !== null &&
      row.effect_key === effect.key &&
      row.effect_fingerprint === effect.fingerprint;
    if (!sameEvent && !sameEffect) {
      throw new EventConflictError('Durable WATCH uniqueness key arrived with changed semantics.');
    }
    await this.refresh();
    return { accepted: false, duplicate: true };
  }
}

async function loadPostgresMemory(
  pool: Pool,
  signingSecret: string,
  acceptedEnvironments: readonly FunnelEvent['environment'][],
): Promise<InMemoryWatchStore> {
  const memory = new InMemoryWatchStore(signingSecret, acceptedEnvironments);
  const result = await pool.query<WatchRow>(
    `SELECT event_id, payload, signature, payload_sha256,
            effect_key, effect_fingerprint
       FROM watch_event_inbox
      ORDER BY sequence`,
  );
  for (const row of result.rows) {
    const payloadSha256 = createHash('sha256').update(row.payload).digest('hex');
    if (payloadSha256 !== row.payload_sha256) {
      throw new EventConflictError(`Durable WATCH payload hash mismatch for ${row.event_id}.`);
    }
    const accepted = await memory.ingest({ payload: row.payload, signature: row.signature });
    if (!accepted.accepted) {
      throw new EventConflictError(`Durable WATCH contains duplicate accepted event ${row.event_id}.`);
    }
  }
  return memory;
}

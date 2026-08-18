import { createHmac } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { WatchAdapter } from './ports.ts';
import type {
  ArrivalMetrics,
  ArrivalPublication,
  FunnelEvent,
  FunnelEventType,
  SignedEventEnvelope,
} from './types.ts';

export interface ArrivalMetricCheckpointStore {
  get(arrivalPublicationId: string): Promise<ArrivalMetrics | null>;
  save(arrivalPublicationId: string, metrics: ArrivalMetrics): Promise<void>;
}

export class InMemoryArrivalMetricCheckpointStore implements ArrivalMetricCheckpointStore {
  private readonly records = new Map<string, ArrivalMetrics>();

  async get(arrivalPublicationId: string): Promise<ArrivalMetrics | null> {
    return structuredClone(this.records.get(arrivalPublicationId) ?? null);
  }

  async save(arrivalPublicationId: string, metrics: ArrivalMetrics): Promise<void> {
    this.records.set(arrivalPublicationId, structuredClone(metrics));
  }
}

interface CheckpointFile {
  schemaVersion: 1;
  records: Record<string, ArrivalMetrics>;
}

export class JsonArrivalMetricCheckpointStore implements ArrivalMetricCheckpointStore {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async get(arrivalPublicationId: string): Promise<ArrivalMetrics | null> {
    const state = await this.read();
    return structuredClone(state.records[arrivalPublicationId] ?? null);
  }

  async save(arrivalPublicationId: string, metrics: ArrivalMetrics): Promise<void> {
    const state = await this.read();
    state.records[arrivalPublicationId] = structuredClone(metrics);
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }

  private async read(): Promise<CheckpointFile> {
    try {
      const parsed = JSON.parse(await readFile(this.path, 'utf8')) as CheckpointFile;
      if (parsed.schemaVersion !== 1 || typeof parsed.records !== 'object') {
        throw new Error('Unsupported ARRIVE metric checkpoint schema.');
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { schemaVersion: 1, records: {} };
      }
      throw error;
    }
  }
}

function signed(secret: string, event: FunnelEvent): SignedEventEnvelope {
  const payload = JSON.stringify(event);
  return {
    payload,
    signature: createHmac('sha256', secret).update(payload).digest('hex'),
  };
}

function assertMonotonic(previous: ArrivalMetrics, current: ArrivalMetrics): void {
  for (const key of ['qualifiedExposures', 'visits', 'offerInteractions', 'ownerInternalExposures'] as const) {
    if (current[key] < previous[key]) {
      throw new Error(`ARRIVE cumulative metric ${key} moved backward; reconciliation required.`);
    }
  }
  if (
    previous.ownerInternalExposures > previous.qualifiedExposures ||
    current.ownerInternalExposures > current.qualifiedExposures
  ) {
    throw new Error('Known owner/internal exposures cannot exceed total qualified exposures.');
  }
}

/** Converts cumulative provider analytics into idempotent WATCH deltas. */
export class ArrivalWatchBridge {
  private readonly watch: WatchAdapter;
  private readonly secret: string;
  private readonly checkpoints: ArrivalMetricCheckpointStore;

  constructor(options: {
    watch: WatchAdapter;
    internalEventSecret: string;
    checkpoints?: ArrivalMetricCheckpointStore;
  }) {
    this.watch = options.watch;
    this.secret = options.internalEventSecret;
    this.checkpoints = options.checkpoints ?? new InMemoryArrivalMetricCheckpointStore();
  }

  async ingest(
    arrival: ArrivalPublication,
    current: ArrivalMetrics,
  ): Promise<{ acceptedEvents: number; duplicateEvents: number }> {
    const previous = await this.checkpoints.get(arrival.arrivalPublicationId) ?? arrival.baseline;
    assertMonotonic(previous, current);
    const definitions: Array<{
      type: FunnelEventType;
      current: number;
      previous: number;
      semantic: string;
      classification: 'OWNER_INTERNAL' | 'STRANGER';
    }> = [
      {
        type: 'QUALIFIED_EXPOSURE',
        current: current.ownerInternalExposures,
        previous: previous.ownerInternalExposures,
        semantic: 'Known owner/internal exposure reported separately and excluded from the qualified denominator.',
        classification: 'OWNER_INTERNAL',
      },
      {
        type: 'QUALIFIED_EXPOSURE',
        current: current.qualifiedExposures - current.ownerInternalExposures,
        previous: previous.qualifiedExposures - previous.ownerInternalExposures,
        semantic: current.semantics.qualifiedExposures,
        classification: 'STRANGER',
      },
      {
        type: 'PRODUCT_VIEW',
        current: current.visits,
        previous: previous.visits,
        semantic: current.semantics.visits,
        classification: 'STRANGER',
      },
      {
        type: 'OFFER_INTERACTION',
        current: current.offerInteractions,
        previous: previous.offerInteractions,
        semantic: current.semantics.offerInteractions,
        classification: 'STRANGER',
      },
    ];
    let acceptedEvents = 0;
    let duplicateEvents = 0;
    for (const definition of definitions) {
      const quantity = definition.current - definition.previous;
      if (quantity === 0) continue;
      const effectId = `${arrival.providerId}:${arrival.providerObjectId}:${definition.type}:${definition.classification}:${definition.current}`;
      const event: FunnelEvent = {
        eventId: `arrive:${effectId}`,
        type: definition.type,
        occurredAt: current.measuredAt,
        experimentId: arrival.experimentId,
        assetId: arrival.assetId,
        effectId,
        quantity,
        trafficClassification: definition.classification,
        arrivalPublicationId: arrival.arrivalPublicationId,
        reason: definition.semantic,
        environment: 'LIVE',
        synthetic: false,
      };
      const result = await this.watch.ingest(signed(this.secret, event));
      if (result.accepted) acceptedEvents++;
      if (result.duplicate) duplicateEvents++;
    }
    await this.checkpoints.save(arrival.arrivalPublicationId, current);
    return { acceptedEvents, duplicateEvents };
  }
}

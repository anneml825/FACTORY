import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Publication } from './types.ts';

export interface StoredStripePublication {
  experimentId: string;
  idempotencyKey: string;
  publication: Publication | null;
  requestFingerprint: string;
  productId?: string;
  priceId?: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
}

export interface StripePublicationStore {
  getByExperiment(experimentId: string): Promise<StoredStripePublication | null>;
  save(record: StoredStripePublication): Promise<void>;
}

export class InMemoryStripePublicationStore implements StripePublicationStore {
  private readonly records = new Map<string, StoredStripePublication>();

  async getByExperiment(experimentId: string): Promise<StoredStripePublication | null> {
    return structuredClone(this.records.get(experimentId) ?? null);
  }

  async save(record: StoredStripePublication): Promise<void> {
    this.records.set(record.experimentId, structuredClone(record));
  }
}

interface PublicationFile {
  schemaVersion: 1;
  records: Record<string, StoredStripePublication>;
}

export class JsonStripePublicationStore implements StripePublicationStore {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async getByExperiment(experimentId: string): Promise<StoredStripePublication | null> {
    const state = await this.read();
    return structuredClone(state.records[experimentId] ?? null);
  }

  async save(record: StoredStripePublication): Promise<void> {
    const state = await this.read();
    state.records[record.experimentId] = structuredClone(record);
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }

  private async read(): Promise<PublicationFile> {
    try {
      const parsed = JSON.parse(await readFile(this.path, 'utf8')) as PublicationFile;
      if (parsed.schemaVersion !== 1 || typeof parsed.records !== 'object') {
        throw new Error('Unsupported Stripe publication-state schema.');
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

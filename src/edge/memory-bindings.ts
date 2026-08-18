/**
 * In-memory edge bindings. These are what the tests run against, and they are
 * the reference semantics the Cloudflare bindings in `worker.ts` must match.
 */

import type {
  CatalogStore,
  DeliveryGrant,
  EdgeListing,
  EdgeStateStore,
  ObjectStore,
  StoredObject,
} from './types.ts';

export class MemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, StoredObject>();

  async put(key: string, object: StoredObject): Promise<void> {
    this.objects.set(key, { ...object, bytes: new Uint8Array(object.bytes) });
  }

  async get(key: string): Promise<StoredObject | null> {
    const found = this.objects.get(key);
    return found ? { ...found, bytes: new Uint8Array(found.bytes) } : null;
  }

  get size(): number {
    return this.objects.size;
  }
}

export class MemoryCatalogStore implements CatalogStore {
  private readonly listings = new Map<string, EdgeListing>();

  register(listing: EdgeListing): void {
    this.listings.set(listing.experimentId, structuredClone(listing));
  }

  async get(experimentId: string): Promise<EdgeListing | null> {
    const found = this.listings.get(experimentId);
    return found ? structuredClone(found) : null;
  }
}

export class MemoryEdgeStateStore implements EdgeStateStore {
  private readonly grants = new Map<string, DeliveryGrant>();
  private readonly byTransaction = new Map<string, string>();
  private readonly references = new Map<string, string>();
  readonly downloadLog: Array<{ grantId: string; at: string }> = [];

  async putGrant(grant: DeliveryGrant): Promise<{ created: boolean }> {
    const existingId = this.byTransaction.get(grant.transactionId);
    if (existingId) {
      // Webhook redelivery must not mint a second right to the same artifact.
      return { created: false };
    }
    this.grants.set(grant.grantId, structuredClone(grant));
    this.byTransaction.set(grant.transactionId, grant.grantId);
    return { created: true };
  }

  async getGrant(grantId: string): Promise<DeliveryGrant | null> {
    const found = this.grants.get(grantId);
    return found ? structuredClone(found) : null;
  }

  async grantForTransaction(transactionId: string): Promise<DeliveryGrant | null> {
    const grantId = this.byTransaction.get(transactionId);
    return grantId ? this.getGrant(grantId) : null;
  }

  async linkReference(reference: string, transactionId: string): Promise<void> {
    const existing = this.references.get(reference);
    if (existing && existing !== transactionId) {
      throw new Error(`Reference ${reference} is already bound to a different transaction.`);
    }
    this.references.set(reference, transactionId);
  }

  async transactionForReference(reference: string): Promise<string | null> {
    return this.references.get(reference) ?? null;
  }

  async consumeDownload(grantId: string, at: string): Promise<DeliveryGrant | null> {
    const grant = this.grants.get(grantId);
    if (!grant) return null;
    if (grant.downloads >= grant.maxDownloads) return null;
    grant.downloads += 1;
    this.downloadLog.push({ grantId, at });
    return structuredClone(grant);
  }
}

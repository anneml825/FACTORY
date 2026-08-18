/**
 * Cloudflare Worker entry.
 *
 * STATUS: NOT DEPLOYED AND NOT VERIFIED. No Cloudflare account exists, so this
 * binding layer has never run against real R2 or KV. `server.ts` is the adapter
 * the tests and CI actually exercise. Do not describe this file as working
 * infrastructure until a real deployment has served a real request (AGENTS.md §5).
 *
 * The handler itself is shared, so what remains unverified here is the binding
 * translation and the WATCH sink — not the commerce logic.
 */

import type { DeliveryGrant, EdgeStateStore, ObjectStore, StoredObject } from './types.ts';

export interface R2ObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string; contentDisposition?: string };
  customMetadata?: Record<string, string>;
}

export interface R2LikeBucket {
  put(key: string, value: ArrayBuffer, options?: unknown): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

export interface KvLikeNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export class R2ObjectStore implements ObjectStore {
  private readonly bucket: R2LikeBucket;

  constructor(bucket: R2LikeBucket) {
    this.bucket = bucket;
  }

  async put(key: string, object: StoredObject): Promise<void> {
    await this.bucket.put(key, new Uint8Array(object.bytes).slice().buffer as ArrayBuffer, {
      httpMetadata: { contentType: object.mediaType },
      customMetadata: { fileName: object.fileName, sha256: object.sha256 },
    });
  }

  async get(key: string): Promise<StoredObject | null> {
    const found = await this.bucket.get(key);
    if (!found) return null;
    const bytes = new Uint8Array(await found.arrayBuffer());
    return {
      bytes,
      mediaType: found.httpMetadata?.contentType ?? 'application/octet-stream',
      fileName: found.customMetadata?.fileName ?? key.split('/').pop() ?? 'download',
      sha256: found.customMetadata?.sha256 ?? '',
    };
  }
}

/**
 * KV is eventually consistent, which is acceptable for a grant record that is
 * written once and read afterwards, but NOT for the download counter. A real
 * deployment must move `consumeDownload` to a strongly consistent store (D1 or
 * a Durable Object) before commercial use; this implementation refuses to
 * pretend otherwise.
 */
export class KvEdgeStateStore implements EdgeStateStore {
  private readonly kv: KvLikeNamespace;

  constructor(kv: KvLikeNamespace) {
    this.kv = kv;
  }

  async putGrant(grant: DeliveryGrant): Promise<{ created: boolean }> {
    const existing = await this.grantForTransaction(grant.transactionId);
    if (existing) return { created: false };
    await this.kv.put(`grant:${grant.grantId}`, JSON.stringify(grant));
    await this.kv.put(`txgrant:${grant.transactionId}`, grant.grantId);
    return { created: true };
  }

  async getGrant(grantId: string): Promise<DeliveryGrant | null> {
    const raw = await this.kv.get(`grant:${grantId}`);
    return raw ? (JSON.parse(raw) as DeliveryGrant) : null;
  }

  async grantForTransaction(transactionId: string): Promise<DeliveryGrant | null> {
    const grantId = await this.kv.get(`txgrant:${transactionId}`);
    return grantId ? this.getGrant(grantId) : null;
  }

  async linkReference(reference: string, transactionId: string): Promise<void> {
    const existing = await this.kv.get(`ref:${reference}`);
    if (existing && existing !== transactionId) {
      throw new Error(`Reference ${reference} is already bound to a different transaction.`);
    }
    await this.kv.put(`ref:${reference}`, transactionId);
  }

  async transactionForReference(reference: string): Promise<string | null> {
    return this.kv.get(`ref:${reference}`);
  }

  async consumeDownload(): Promise<DeliveryGrant | null> {
    throw new Error(
      'KV cannot enforce a download limit atomically. Bind a D1 or Durable Object store before serving downloads.',
    );
  }
}

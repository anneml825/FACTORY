import { createHash } from 'node:crypto';
import type { PutAdapter } from './ports.ts';
import { assertStripeTestObject, type StripeTransport } from './stripe-api.ts';
import {
  InMemoryStripePublicationStore,
  type StoredStripePublication,
  type StripePublicationStore,
} from './stripe-publication-store.ts';
import type { Artifact, AssetManifest, Publication } from './types.ts';

interface StripeObject {
  id: string;
  livemode: boolean;
}

interface StripePaymentLink extends StripeObject {
  active: boolean;
  url: string;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function requestFingerprint(manifest: AssetManifest, artifact: Artifact): string {
  return hash(`${JSON.stringify(manifest)}\n${artifact.sha256}`);
}

function operationKey(base: string, operation: string): string {
  return `factory:${operation}:${hash(base).slice(0, 48)}`;
}

function fixtureTitle(manifest: AssetManifest): string {
  return `[NONCOMMERCIAL TEST] ${manifest.source.title}`.slice(0, 250);
}

function metadata(
  manifest: AssetManifest,
  artifact: Artifact,
  idempotencyKey: string,
): Record<string, string> {
  return {
    factory_environment: 'PROVIDER_TEST',
    factory_test_transaction: 'true',
    transaction_classification: 'OWNER_TEST',
    experiment_id: manifest.experimentId,
    asset_id: manifest.assetId,
    artifact_sha256: artifact.sha256,
    publication_key_sha256: hash(idempotencyKey),
  };
}

export class StripeTestPutAdapter implements PutAdapter {
  readonly adapterId = 'stripe-managed-payments-test-v1';
  readonly mode = 'PROVIDER_TEST' as const;
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly transport: StripeTransport;
  private readonly store: StripePublicationStore;
  private readonly taxCode: string;

  constructor(options: {
    transport: StripeTransport;
    store?: StripePublicationStore;
    taxCode?: string;
  }) {
    this.transport = options.transport;
    this.store = options.store ?? new InMemoryStripePublicationStore();
    this.taxCode = options.taxCode ?? 'txcd_10503000';
  }

  async publish(
    manifest: AssetManifest,
    artifact: Artifact,
    idempotencyKey: string,
  ): Promise<Publication> {
    if (!manifest.noncommercialFixture) {
      throw new Error('Stripe test publication accepts noncommercial fixtures only.');
    }
    if (manifest.price.currency !== 'USD') {
      throw new Error('Phase B fixture probe is intentionally limited to USD.');
    }
    const fingerprint = requestFingerprint(manifest, artifact);
    let progress = await this.store.getByExperiment(manifest.experimentId);
    if (progress) {
      if (progress.idempotencyKey !== idempotencyKey || progress.requestFingerprint !== fingerprint) {
        throw new Error('Stripe PUT conflict: experiment was already started with different semantics.');
      }
      if (progress.publication) return progress.publication;
    } else {
      progress = {
        experimentId: manifest.experimentId,
        idempotencyKey,
        publication: null,
        requestFingerprint: fingerprint,
      };
      await this.store.save(progress);
    }

    const objectMetadata = metadata(manifest, artifact, idempotencyKey);
    if (!progress.productId) {
      const product = await this.transport.request<StripeObject>({
        method: 'POST',
        path: '/v1/products',
        idempotencyKey: operationKey(idempotencyKey, 'product'),
        form: {
          name: fixtureTitle(manifest),
          description: 'NONCOMMERCIAL PROVIDER TEST FIXTURE. Created only to verify Factory Phase B plumbing.',
          tax_code: this.taxCode,
          metadata: objectMetadata,
        },
      });
      assertStripeTestObject(product, 'Stripe Product');
      progress.productId = product.id;
      await this.store.save(progress);
    }

    if (!progress.priceId) {
      const price = await this.transport.request<StripeObject>({
        method: 'POST',
        path: '/v1/prices',
        idempotencyKey: operationKey(idempotencyKey, 'price'),
        form: {
          product: progress.productId,
          unit_amount: manifest.price.amountCents,
          currency: manifest.price.currency.toLowerCase(),
          metadata: objectMetadata,
        },
      });
      assertStripeTestObject(price, 'Stripe Price');
      progress.priceId = price.id;
      await this.store.save(progress);
    }

    if (!progress.paymentLinkId || !progress.paymentLinkUrl) {
      const paymentLink = await this.transport.request<StripePaymentLink>({
        method: 'POST',
        path: '/v1/payment_links',
        idempotencyKey: operationKey(idempotencyKey, 'payment-link'),
        form: {
          line_items: [{ price: progress.priceId, quantity: 1 }],
          managed_payments: { enabled: true },
          metadata: objectMetadata,
          payment_intent_data: { metadata: objectMetadata },
        },
      });
      assertStripeTestObject(paymentLink, 'Stripe Payment Link');
      if (!paymentLink.url.includes('/test_') && !paymentLink.url.includes('test')) {
        throw new Error('Stripe Payment Link URL was not visibly a test URL.');
      }
      progress.paymentLinkId = paymentLink.id;
      progress.paymentLinkUrl = paymentLink.url;
      await this.store.save(progress);
    }

    const publication: Publication = {
      publicationId: progress.paymentLinkId,
      experimentId: manifest.experimentId,
      assetId: manifest.assetId,
      providerId: this.adapterId,
      location: progress.paymentLinkUrl,
      idempotencyKey,
      manifestFingerprint: fingerprint,
      mode: 'PROVIDER_TEST',
      status: 'ACTIVE',
      providerObjects: {
        productId: progress.productId,
        priceId: progress.priceId,
        paymentLinkId: progress.paymentLinkId,
      },
    };
    progress.publication = publication;
    await this.store.save(progress);
    return publication;
  }

  async deactivate(publication: Publication, idempotencyKey: string): Promise<Publication> {
    if (publication.mode !== 'PROVIDER_TEST' || !publication.providerObjects) {
      throw new Error('Stripe test adapter can deactivate only its provider-test publications.');
    }
    const { paymentLinkId, priceId, productId } = publication.providerObjects;
    for (const operation of [
      { path: `/v1/payment_links/${paymentLinkId}`, label: 'Payment Link' },
      { path: `/v1/prices/${priceId}`, label: 'Price' },
      { path: `/v1/products/${productId}`, label: 'Product' },
    ]) {
      const result = await this.transport.request<StripeObject>({
        method: 'POST',
        path: operation.path,
        idempotencyKey: operationKey(idempotencyKey, `deactivate-${operation.label}`),
        form: { active: false },
      });
      assertStripeTestObject(result, `Stripe ${operation.label}`);
    }
    // The provider objects are now inactive. Local bookkeeping is recorded after
    // that fact, and a missing record is repaired rather than raised: reporting a
    // completed deactivation as a failure is worse than a thin durable record,
    // because it invites a second teardown of surfaces that are already dead.
    const inactive = { ...publication, status: 'INACTIVE' as const };
    const stored = (await this.store.getByExperiment(publication.experimentId)) ?? {
      experimentId: publication.experimentId,
      idempotencyKey: publication.idempotencyKey,
      publication: null,
      requestFingerprint: publication.manifestFingerprint,
      productId,
      priceId,
      paymentLinkId,
      paymentLinkUrl: publication.location,
    };
    stored.publication = inactive;
    await this.store.save(stored);
    return inactive;
  }
}

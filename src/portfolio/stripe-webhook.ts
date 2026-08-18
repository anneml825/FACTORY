import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { WatchAdapter } from './ports.ts';
import type { StripeTransport } from './stripe-api.ts';
import type {
  FunnelEvent,
  SignedEventEnvelope,
  TransactionClassification,
} from './types.ts';

export type StripeWebhookStatus = 'RECEIVED' | 'RETRYABLE_FAILURE' | 'PROCESSED' | 'REJECTED';

export interface StripeWebhookInboxRecord {
  eventId: string;
  payloadSha256: string;
  status: StripeWebhookStatus;
  attempts: number;
  lastError: string | null;
}

export interface StripeTransactionReference {
  transactionId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  experimentId: string;
  assetId: string;
  classification: Exclude<TransactionClassification, 'ARM_LENGTH_CUSTOMER'>;
  grossCents: number;
  currency: string;
}

export interface StripeWebhookStateStore {
  getInbox(eventId: string): Promise<StripeWebhookInboxRecord | null>;
  saveInbox(record: StripeWebhookInboxRecord): Promise<void>;
  saveTransaction(reference: StripeTransactionReference): Promise<void>;
  findTransaction(providerReference: string): Promise<StripeTransactionReference | null>;
}

export class InMemoryStripeWebhookStateStore implements StripeWebhookStateStore {
  private readonly inbox = new Map<string, StripeWebhookInboxRecord>();
  private readonly transactions = new Map<string, StripeTransactionReference>();

  async getInbox(eventId: string): Promise<StripeWebhookInboxRecord | null> {
    return structuredClone(this.inbox.get(eventId) ?? null);
  }

  async saveInbox(record: StripeWebhookInboxRecord): Promise<void> {
    this.inbox.set(record.eventId, structuredClone(record));
  }

  async saveTransaction(reference: StripeTransactionReference): Promise<void> {
    this.transactions.set(reference.transactionId, structuredClone(reference));
    this.transactions.set(reference.checkoutSessionId, structuredClone(reference));
    if (reference.paymentIntentId) {
      this.transactions.set(reference.paymentIntentId, structuredClone(reference));
    }
  }

  async findTransaction(providerReference: string): Promise<StripeTransactionReference | null> {
    return structuredClone(this.transactions.get(providerReference) ?? null);
  }
}

export class InvalidStripeSignatureError extends Error {
  constructor(message = 'Stripe webhook signature is invalid.') {
    super(message);
    this.name = 'InvalidStripeSignatureError';
  }
}

export class StripeWebhookPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeWebhookPolicyError';
  }
}

export function verifyStripeSignature(input: {
  payload: string;
  signatureHeader: string;
  secret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): void {
  const fields = input.signatureHeader.split(',').map((part) => part.split('=', 2));
  const timestamp = fields.find(([name]) => name === 't')?.[1];
  const signatures = fields.filter(([name]) => name === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) {
    throw new InvalidStripeSignatureError('Stripe-Signature is missing t or v1 fields.');
  }
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(now - Number(timestamp)) > tolerance) {
    throw new InvalidStripeSignatureError('Stripe webhook timestamp is outside tolerance.');
  }
  const expected = createHmac('sha256', input.secret)
    .update(`${timestamp}.${input.payload}`)
    .digest();
  const matches = signatures.some((candidate) => {
    if (!candidate || !/^[0-9a-f]+$/i.test(candidate)) return false;
    const received = Buffer.from(candidate, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!matches) throw new InvalidStripeSignatureError();
}

interface StripeEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

export interface FulfillmentRequest {
  transactionId: string;
  experimentId: string;
  assetId: string;
  idempotencyKey: string;
}

export interface ProviderTestFulfillment {
  fulfill(request: FulfillmentRequest): Promise<{ succeeded: boolean; reason?: string }>;
}

export interface StripeWebhookProcessResult {
  status: 'PROCESSED' | 'DUPLICATE' | 'RETRYABLE_FAILURE' | 'REJECTED' | 'IGNORED';
  eventId: string;
  error?: string;
}

function textField(object: Record<string, unknown>, field: string): string | null {
  const value = object[field];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function integerField(object: Record<string, unknown>, field: string): number | null {
  const value = object[field];
  return Number.isInteger(value) ? (value as number) : null;
}

function metadataField(object: Record<string, unknown>): Record<string, string> {
  const value = object.metadata;
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

class InternalEventSigner {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(event: FunnelEvent): SignedEventEnvelope {
    const payload = JSON.stringify(event);
    return {
      payload,
      signature: createHmac('sha256', this.secret).update(payload).digest('hex'),
    };
  }
}

export class StripeTestWebhookProcessor {
  private readonly webhookSecret: string;
  private readonly state: StripeWebhookStateStore;
  private readonly watch: WatchAdapter;
  private readonly signer: InternalEventSigner;
  private readonly fulfillment: ProviderTestFulfillment;
  private readonly transport: StripeTransport | null;
  private readonly nowSeconds: () => number;

  constructor(options: {
    webhookSecret: string;
    internalEventSecret: string;
    state?: StripeWebhookStateStore;
    watch: WatchAdapter;
    fulfillment: ProviderTestFulfillment;
    transport?: StripeTransport;
    nowSeconds?: () => number;
  }) {
    this.webhookSecret = options.webhookSecret;
    this.state = options.state ?? new InMemoryStripeWebhookStateStore();
    this.watch = options.watch;
    this.signer = new InternalEventSigner(options.internalEventSecret);
    this.fulfillment = options.fulfillment;
    this.transport = options.transport ?? null;
    this.nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));
  }

  async process(payload: string, signatureHeader: string): Promise<StripeWebhookProcessResult> {
    verifyStripeSignature({
      payload,
      signatureHeader,
      secret: this.webhookSecret,
      nowSeconds: this.nowSeconds(),
    });
    const event = JSON.parse(payload) as StripeEvent;
    if (!event.id || !event.type || !event.data?.object) throw new Error('Malformed Stripe Event.');
    if (event.livemode !== false) throw new StripeWebhookPolicyError('Phase B refuses livemode Stripe events.');
    const payloadSha256 = createHash('sha256').update(payload).digest('hex');
    const prior = await this.state.getInbox(event.id);
    if (prior) {
      if (prior.payloadSha256 !== payloadSha256) {
        throw new Error('Stripe event ID was redelivered with different bytes.');
      }
      if (prior.status === 'PROCESSED' || prior.status === 'REJECTED') {
        return { status: 'DUPLICATE', eventId: event.id };
      }
    }
    const inbox: StripeWebhookInboxRecord = {
      eventId: event.id,
      payloadSha256,
      status: 'RECEIVED',
      attempts: (prior?.attempts ?? 0) + 1,
      lastError: null,
    };
    await this.state.saveInbox(inbox);

    try {
      const result = await this.dispatch(event);
      inbox.status = result.status === 'RETRYABLE_FAILURE' ? 'RETRYABLE_FAILURE' : 'PROCESSED';
      inbox.lastError = result.error ?? null;
      await this.state.saveInbox(inbox);
      return result;
    } catch (error) {
      inbox.status = error instanceof StripeWebhookPolicyError ? 'REJECTED' : 'RETRYABLE_FAILURE';
      inbox.lastError = error instanceof Error ? error.message : String(error);
      await this.state.saveInbox(inbox);
      return { status: inbox.status, eventId: event.id, error: inbox.lastError };
    }
  }

  private async dispatch(event: StripeEvent): Promise<StripeWebhookProcessResult> {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      return this.checkoutCompleted(event);
    }
    if (event.type === 'refund.created') return this.refundCreated(event);
    if (event.type === 'charge.dispute.created') return this.disputeCreated(event);
    return { status: 'IGNORED', eventId: event.id };
  }

  private async checkoutCompleted(event: StripeEvent): Promise<StripeWebhookProcessResult> {
    const object = event.data.object;
    const metadata = metadataField(object);
    this.assertProviderTestMetadata(metadata);
    const sessionId = textField(object, 'id');
    const paymentIntentId = textField(object, 'payment_intent');
    const amount = integerField(object, 'amount_total');
    const currency = textField(object, 'currency');
    const paymentStatus = textField(object, 'payment_status');
    if (!sessionId || amount === null || !currency) throw new Error('Checkout Session lacks required fields.');
    if (paymentStatus !== 'paid' && event.type !== 'checkout.session.async_payment_succeeded') {
      throw new Error(`Checkout Session is not paid (payment_status=${paymentStatus ?? 'missing'}).`);
    }
    const classification = metadata.transaction_classification;
    if (classification !== 'OWNER_TEST' && classification !== 'INTERNAL_TEST') {
      throw new StripeWebhookPolicyError(
        'Provider-test checkout must be explicitly OWNER_TEST or INTERNAL_TEST.',
      );
    }
    const reference: StripeTransactionReference = {
      transactionId: paymentIntentId ?? sessionId,
      checkoutSessionId: sessionId,
      paymentIntentId,
      experimentId: metadata.experiment_id,
      assetId: metadata.asset_id,
      classification,
      grossCents: amount,
      currency: currency.toUpperCase(),
    };
    await this.state.saveTransaction(reference);
    await this.ingest({
      eventId: `stripe:${event.id}:checkout`,
      type: 'CHECKOUT_COMPLETED',
      occurredAt: new Date(event.created * 1000).toISOString(),
      experimentId: reference.experimentId,
      assetId: reference.assetId,
      transactionId: reference.transactionId,
      effectId: sessionId,
      classification,
      amountCents: amount,
      currency: reference.currency,
      environment: 'PROVIDER_TEST',
      synthetic: false,
    });

    const fulfillmentKey = `stripe-fulfillment:${reference.transactionId}`;
    const fulfillment = await this.fulfillment.fulfill({
      transactionId: reference.transactionId,
      experimentId: reference.experimentId,
      assetId: reference.assetId,
      idempotencyKey: fulfillmentKey,
    });
    await this.ingest({
      eventId: `stripe:${event.id}:fulfillment:${fulfillment.succeeded ? 'succeeded' : 'failed'}`,
      type: fulfillment.succeeded ? 'FULFILLMENT_SUCCEEDED' : 'FULFILLMENT_FAILED',
      occurredAt: new Date(event.created * 1000).toISOString(),
      experimentId: reference.experimentId,
      assetId: reference.assetId,
      transactionId: reference.transactionId,
      effectId: fulfillmentKey,
      reason: fulfillment.reason,
      environment: 'PROVIDER_TEST',
      synthetic: false,
    });
    if (!fulfillment.succeeded) {
      return {
        status: 'RETRYABLE_FAILURE',
        eventId: event.id,
        error: fulfillment.reason ?? 'Provider-test fulfillment failed.',
      };
    }
    return { status: 'PROCESSED', eventId: event.id };
  }

  private async refundCreated(event: StripeEvent): Promise<StripeWebhookProcessResult> {
    const object = event.data.object;
    const refundId = textField(object, 'id');
    const amount = integerField(object, 'amount');
    if (!refundId || amount === null || amount <= 0) throw new Error('Refund lacks required fields.');
    const reference = await this.resolveTransaction(object);
    if (!reference) {
      return { status: 'RETRYABLE_FAILURE', eventId: event.id, error: 'Refund attribution is not yet resolvable.' };
    }
    await this.ingest({
      eventId: `stripe:${event.id}:refund`,
      type: 'REFUND_CREATED',
      occurredAt: new Date(event.created * 1000).toISOString(),
      experimentId: reference.experimentId,
      assetId: reference.assetId,
      transactionId: reference.transactionId,
      effectId: refundId,
      amountCents: amount,
      currency: (textField(object, 'currency') ?? reference.currency).toUpperCase(),
      environment: 'PROVIDER_TEST',
      synthetic: false,
    });
    return { status: 'PROCESSED', eventId: event.id };
  }

  private async disputeCreated(event: StripeEvent): Promise<StripeWebhookProcessResult> {
    const object = event.data.object;
    const disputeId = textField(object, 'id');
    const amount = integerField(object, 'amount');
    if (!disputeId || amount === null || amount <= 0) throw new Error('Dispute lacks required fields.');
    const reference = await this.resolveTransaction(object);
    if (!reference) {
      return { status: 'RETRYABLE_FAILURE', eventId: event.id, error: 'Dispute attribution is not yet resolvable.' };
    }
    await this.ingest({
      eventId: `stripe:${event.id}:dispute`,
      type: 'DISPUTE_CREATED',
      occurredAt: new Date(event.created * 1000).toISOString(),
      experimentId: reference.experimentId,
      assetId: reference.assetId,
      transactionId: reference.transactionId,
      effectId: disputeId,
      amountCents: amount,
      currency: (textField(object, 'currency') ?? reference.currency).toUpperCase(),
      environment: 'PROVIDER_TEST',
      synthetic: false,
    });
    return { status: 'PROCESSED', eventId: event.id };
  }

  private async resolveTransaction(object: Record<string, unknown>): Promise<StripeTransactionReference | null> {
    const paymentIntentId = textField(object, 'payment_intent');
    const chargeId = textField(object, 'charge');
    for (const reference of [paymentIntentId, chargeId]) {
      if (!reference) continue;
      const found = await this.state.findTransaction(reference);
      if (found) return found;
    }
    if (chargeId && this.transport) {
      const charge = await this.transport.request<{ livemode: boolean; payment_intent?: string }>({
        method: 'GET',
        path: `/v1/charges/${chargeId}`,
      });
      if (charge.livemode !== false) throw new Error('Charge lookup was not livemode=false.');
      if (charge.payment_intent) return this.state.findTransaction(charge.payment_intent);
    }
    return null;
  }

  private assertProviderTestMetadata(metadata: Record<string, string>): void {
    if (
      metadata.factory_environment !== 'PROVIDER_TEST' ||
      metadata.factory_test_transaction !== 'true' ||
      !metadata.experiment_id ||
      !metadata.asset_id
    ) {
      throw new StripeWebhookPolicyError(
        'Stripe object lacks fail-closed Factory provider-test attribution metadata.',
      );
    }
  }

  private async ingest(event: FunnelEvent): Promise<void> {
    await this.watch.ingest(this.signer.sign(event));
  }
}

export function signStripeTestEvent(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

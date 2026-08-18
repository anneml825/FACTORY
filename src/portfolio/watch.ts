import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WatchAdapter } from './ports.ts';
import type {
  FunnelEvent,
  FunnelSnapshot,
  SignedEventEnvelope,
  TransactionClassification,
  TransactionSnapshot,
} from './types.ts';

interface MutableTransaction extends TransactionSnapshot {}

export class InvalidEventSignatureError extends Error {
  constructor() {
    super('Synthetic event signature is invalid.');
    this.name = 'InvalidEventSignatureError';
  }
}

export class EventConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventConflictError';
  }
}

function requireTransactionFields(event: FunnelEvent): {
  transactionId: string;
  classification: TransactionClassification;
  amountCents: number;
} {
  if (!event.transactionId || !event.classification) {
    throw new EventConflictError(`${event.type} requires transactionId and classification.`);
  }
  if (!Number.isInteger(event.amountCents) || (event.amountCents ?? -1) < 0) {
    throw new EventConflictError(`${event.type} requires a non-negative integer amountCents.`);
  }
  return {
    transactionId: event.transactionId,
    classification: event.classification,
    amountCents: event.amountCents as number,
  };
}

export class InMemoryWatchStore implements WatchAdapter {
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly signingSecret: string;
  private readonly acceptedEnvironments: ReadonlySet<FunnelEvent['environment']>;
  private readonly eventPayloads = new Map<string, string>();
  private readonly effectFingerprints = new Map<string, string>();
  private readonly eventsByExperiment = new Map<string, FunnelEvent[]>();
  private readonly transactions = new Map<string, MutableTransaction>();

  constructor(
    signingSecret: string,
    acceptedEnvironments: readonly FunnelEvent['environment'][] = ['FIXTURE'],
  ) {
    this.signingSecret = signingSecret;
    this.acceptedEnvironments = new Set(acceptedEnvironments);
  }

  async ingest(envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }> {
    this.verify(envelope);
    const event = JSON.parse(envelope.payload) as FunnelEvent;
    if (!this.acceptedEnvironments.has(event.environment)) {
      throw new EventConflictError(`WATCH refuses commerce environment ${event.environment}.`);
    }
    if (event.environment === 'FIXTURE' && !event.synthetic) {
      throw new EventConflictError('Fixture WATCH events must be marked synthetic.');
    }
    if (
      event.environment === 'PROVIDER_TEST' &&
      event.classification === 'ARM_LENGTH_CUSTOMER'
    ) {
      throw new EventConflictError('Provider test transactions can never be arm-length revenue.');
    }
    const prior = this.eventPayloads.get(event.eventId);
    if (prior !== undefined) {
      if (prior !== envelope.payload) {
        throw new EventConflictError('Duplicate event_id arrived with a different payload.');
      }
      return { accepted: false, duplicate: true };
    }

    const effect = this.effectIdentity(event);
    if (effect) {
      const priorEffect = this.effectFingerprints.get(effect.key);
      if (priorEffect !== undefined) {
        if (priorEffect !== effect.fingerprint) {
          throw new EventConflictError('A stable transaction effect ID arrived with changed semantics.');
        }
        this.eventPayloads.set(event.eventId, envelope.payload);
        return { accepted: false, duplicate: true };
      }
    }

    this.apply(event);
    this.eventPayloads.set(event.eventId, envelope.payload);
    if (effect) this.effectFingerprints.set(effect.key, effect.fingerprint);
    const experimentEvents = this.eventsByExperiment.get(event.experimentId) ?? [];
    experimentEvents.push(event);
    this.eventsByExperiment.set(event.experimentId, experimentEvents);
    return { accepted: true, duplicate: false };
  }

  snapshot(experimentId: string): FunnelSnapshot {
    const events = this.eventsByExperiment.get(experimentId) ?? [];
    const transactions = [...this.transactions.values()]
      .filter((transaction) => transaction.experimentId === experimentId)
      .map((transaction) => ({ ...transaction }))
      .sort((a, b) => a.transactionId.localeCompare(b.transactionId));
    const grossRevenueCents = transactions.reduce((sum, tx) => sum + tx.grossCents, 0);
    const armLength = transactions.filter((tx) => tx.classification === 'ARM_LENGTH_CUSTOMER');
    const armLengthGrossRevenueCents = armLength.reduce((sum, tx) => sum + tx.grossCents, 0);
    const eligibleArmLengthRevenueCents = armLength
      .filter(
        (tx) =>
          tx.fulfilled &&
          !tx.fulfillmentFailed &&
          tx.refundedCents === 0 &&
          tx.disputedCents === 0,
      )
      .reduce((sum, tx) => sum + tx.grossCents, 0);
    const arrivalIds = new Set<string>();
    for (const event of events) {
      if (event.arrivalPublicationId) arrivalIds.add(event.arrivalPublicationId);
    }
    for (const transaction of transactions) {
      if (transaction.arrivalPublicationId) arrivalIds.add(transaction.arrivalPublicationId);
    }
    const arrivalFunnels = [...arrivalIds].sort().map((arrivalPublicationId) => {
      const attributedEvents = events.filter(
        (event) => event.arrivalPublicationId === arrivalPublicationId,
      );
      return {
        arrivalPublicationId,
        qualifiedExposures: this.sumEvents(
          attributedEvents,
          'QUALIFIED_EXPOSURE',
          (event) => event.trafficClassification !== 'OWNER_INTERNAL',
        ),
        productViews: this.sumEvents(attributedEvents, 'PRODUCT_VIEW'),
        offerInteractions: this.sumEvents(attributedEvents, 'OFFER_INTERACTION'),
        checkoutStarts: this.sumEvents(attributedEvents, 'CHECKOUT_STARTED'),
        checkoutFailures: this.sumEvents(attributedEvents, 'CHECKOUT_FAILED'),
        transactionIds: transactions
          .filter((transaction) => transaction.arrivalPublicationId === arrivalPublicationId)
          .map((transaction) => transaction.transactionId),
      };
    });
    return {
      experimentId,
      qualifiedExposures: this.sumEvents(
        events,
        'QUALIFIED_EXPOSURE',
        (event) => event.trafficClassification !== 'OWNER_INTERNAL',
      ),
      ownerInternalExposures: this.sumEvents(
        events,
        'QUALIFIED_EXPOSURE',
        (event) => event.trafficClassification === 'OWNER_INTERNAL',
      ),
      unknownExposures: this.sumEvents(
        events,
        'QUALIFIED_EXPOSURE',
        (event) => event.trafficClassification === 'OTHER_OR_UNKNOWN',
      ),
      productViews: this.sumEvents(events, 'PRODUCT_VIEW'),
      offerInteractions: this.sumEvents(events, 'OFFER_INTERACTION'),
      checkoutStarts: this.sumEvents(events, 'CHECKOUT_STARTED'),
      checkoutFailures: this.sumEvents(events, 'CHECKOUT_FAILED'),
      transactions,
      arrivalFunnels,
      grossRevenueCents,
      armLengthGrossRevenueCents,
      eligibleArmLengthRevenueCents,
      refundsCents: transactions.reduce((sum, tx) => sum + tx.refundedCents, 0),
      disputesCents: transactions.reduce((sum, tx) => sum + tx.disputedCents, 0),
      fulfillmentFailures: transactions.filter((tx) => tx.hadFulfillmentFailure).length,
    };
  }

  eventCount(): number {
    return [...this.eventsByExperiment.values()].reduce((sum, events) => sum + events.length, 0);
  }

  clone(): InMemoryWatchStore {
    const copy = new InMemoryWatchStore(this.signingSecret, [...this.acceptedEnvironments]);
    for (const [key, value] of this.eventPayloads) copy.eventPayloads.set(key, value);
    for (const [key, value] of this.effectFingerprints) copy.effectFingerprints.set(key, value);
    for (const [key, value] of this.eventsByExperiment) {
      copy.eventsByExperiment.set(key, structuredClone(value));
    }
    for (const [key, value] of this.transactions) {
      copy.transactions.set(key, structuredClone(value));
    }
    return copy;
  }

  private verify(envelope: SignedEventEnvelope): void {
    const expected = createHmac('sha256', this.signingSecret).update(envelope.payload).digest();
    let received: Buffer;
    try {
      received = Buffer.from(envelope.signature, 'hex');
    } catch {
      throw new InvalidEventSignatureError();
    }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new InvalidEventSignatureError();
    }
  }

  private apply(event: FunnelEvent): void {
    const quantity = event.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new EventConflictError('Funnel event quantity must be a positive integer.');
    }
    if (
      quantity !== 1 &&
      event.type !== 'QUALIFIED_EXPOSURE' &&
      event.type !== 'PRODUCT_VIEW' &&
      event.type !== 'OFFER_INTERACTION' &&
      event.type !== 'CHECKOUT_STARTED' &&
      event.type !== 'CHECKOUT_FAILED'
    ) {
      throw new EventConflictError(`${event.type} cannot use aggregate quantity.`);
    }
    if (event.type === 'CHECKOUT_COMPLETED') {
      const fields = requireTransactionFields(event);
      const existing = this.transactions.get(fields.transactionId);
      if (existing) {
        throw new EventConflictError('A transaction_id may have only one checkout completion event.');
      }
      this.transactions.set(fields.transactionId, {
        transactionId: fields.transactionId,
        experimentId: event.experimentId,
        assetId: event.assetId,
        classification: fields.classification,
        grossCents: fields.amountCents,
        currency: event.currency ?? 'UNKNOWN',
        fulfilled: false,
        fulfillmentFailed: false,
        hadFulfillmentFailure: false,
        refundedCents: 0,
        disputedCents: 0,
        arrivalPublicationId: event.arrivalPublicationId,
      });
      return;
    }

    if (
      event.type === 'FULFILLMENT_SUCCEEDED' ||
      event.type === 'FULFILLMENT_FAILED' ||
      event.type === 'REFUND_CREATED' ||
      event.type === 'DISPUTE_CREATED'
    ) {
      if (!event.transactionId) {
        throw new EventConflictError(`${event.type} requires transactionId.`);
      }
      if (!event.effectId) {
        throw new EventConflictError(`${event.type} requires a stable effectId.`);
      }
      const transaction = this.transactions.get(event.transactionId);
      if (!transaction) throw new EventConflictError('Transaction event arrived before checkout completion.');
      if (transaction.experimentId !== event.experimentId) {
        throw new EventConflictError('experiment_id attribution changed across a transaction lifecycle.');
      }
      if (transaction.arrivalPublicationId !== event.arrivalPublicationId) {
        throw new EventConflictError('ARRIVE attribution changed across a transaction lifecycle.');
      }
      if (event.type === 'FULFILLMENT_SUCCEEDED') {
        transaction.fulfilled = true;
        transaction.fulfillmentFailed = false;
      } else if (event.type === 'FULFILLMENT_FAILED') {
        transaction.fulfilled = false;
        transaction.fulfillmentFailed = true;
        transaction.hadFulfillmentFailure = true;
      } else {
        const amount = event.amountCents;
        if (!Number.isInteger(amount) || (amount ?? 0) <= 0) {
          throw new EventConflictError(`${event.type} requires positive integer amountCents.`);
        }
        if (event.type === 'REFUND_CREATED') {
          if (transaction.refundedCents + (amount as number) > transaction.grossCents) {
            throw new EventConflictError('Cumulative refunds cannot exceed transaction gross.');
          }
          transaction.refundedCents += amount as number;
        } else {
          if (transaction.disputedCents + (amount as number) > transaction.grossCents) {
            throw new EventConflictError('Cumulative disputes cannot exceed transaction gross.');
          }
          transaction.disputedCents += amount as number;
        }
      }
    }
  }

  private effectIdentity(event: FunnelEvent): { key: string; fingerprint: string } | null {
    return watchEventEffectIdentity(event);
  }

  private sumEvents(
    events: FunnelEvent[],
    type: FunnelEvent['type'],
    predicate: (event: FunnelEvent) => boolean = () => true,
  ): number {
    return events
      .filter((event) => event.type === type && predicate(event))
      .reduce((sum, event) => sum + (event.quantity ?? 1), 0);
  }
}

export function watchEventEffectIdentity(
  event: FunnelEvent,
): { key: string; fingerprint: string } | null {
    if (
      (event.type === 'CHECKOUT_COMPLETED' || event.type === 'CHECKOUT_FAILED') &&
      event.transactionId
    ) {
      return {
        key: `${event.type}:${event.transactionId}`,
        fingerprint: JSON.stringify({
          type: event.type,
          experimentId: event.experimentId,
          assetId: event.assetId,
          transactionId: event.transactionId,
          classification: event.classification,
          amountCents: event.amountCents,
          currency: event.currency,
          reason: event.reason,
          arrivalPublicationId: event.arrivalPublicationId,
        }),
      };
    }
    if (
      (event.type === 'FULFILLMENT_SUCCEEDED' ||
        event.type === 'FULFILLMENT_FAILED' ||
        event.type === 'REFUND_CREATED' ||
        event.type === 'DISPUTE_CREATED') &&
      event.effectId
    ) {
      return {
        key: `${event.type}:${event.effectId}`,
        fingerprint: JSON.stringify({
          type: event.type,
          experimentId: event.experimentId,
          assetId: event.assetId,
          transactionId: event.transactionId,
          effectId: event.effectId,
          amountCents: event.amountCents,
          currency: event.currency,
          arrivalPublicationId: event.arrivalPublicationId,
        }),
      };
    }
    if (event.arrivalPublicationId) {
      return {
        key: `arrival:${event.arrivalPublicationId}:${event.type}:${event.effectId ?? event.eventId}`,
        fingerprint: JSON.stringify({
          type: event.type,
          experimentId: event.experimentId,
          assetId: event.assetId,
          arrivalPublicationId: event.arrivalPublicationId,
          effectId: event.effectId,
          quantity: event.quantity ?? 1,
          trafficClassification: event.trafficClassification,
          occurredAt: event.occurredAt,
        }),
      };
    }
    return null;
}

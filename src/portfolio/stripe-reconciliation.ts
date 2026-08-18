import { createHmac } from 'node:crypto';
import type { WatchAdapter } from './ports.ts';
import type { StripeTransport } from './stripe-api.ts';
import type { FunnelEvent, FunnelSnapshot, SignedEventEnvelope, TransactionSnapshot } from './types.ts';

interface StripePaymentIntent {
  id: string;
  livemode: boolean;
  amount_received: number;
  currency: string;
  latest_charge: string | null;
}

interface StripeCharge {
  id: string;
  livemode: boolean;
  amount: number;
  amount_refunded: number;
  disputed: boolean;
  currency: string;
}

interface StripeProviderEffect {
  id: string;
  amount: number;
  currency: string;
  created: number;
  payment_intent?: string | null;
  charge?: string | null;
}

interface StripeList<T> {
  data: T[];
  has_more: boolean;
}

export interface ProviderTestReconciliation {
  transactionId: string;
  providerTest: true;
  grossMatches: boolean;
  refundMatches: boolean;
  disputeMatches: boolean;
  currencyMatches: boolean;
  reconciled: boolean;
  bookedRevenueCents: 0;
  availableSettledCashCents: 0;
  eligibleArmLengthRevenueCents: 0;
  attributableFactoryCostCents: 0;
}

export interface ProviderTestRecovery {
  transactionId: string;
  recoveredRefundEffects: number;
  recoveredDisputeEffects: number;
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

async function retrieveProviderObjects(transport: StripeTransport, transactionId: string) {
  const paymentIntent = await transport.request<StripePaymentIntent>({
    method: 'GET',
    path: `/v1/payment_intents/${transactionId}`,
  });
  if (paymentIntent.livemode !== false) {
    throw new Error('PaymentIntent reconciliation returned livemode=true.');
  }
  const charge = paymentIntent.latest_charge
    ? await transport.request<StripeCharge>({
        method: 'GET',
        path: `/v1/charges/${paymentIntent.latest_charge}`,
      })
    : null;
  if (charge?.livemode !== false && charge !== null) {
    throw new Error('Charge reconciliation did not explicitly return livemode=false.');
  }
  return { paymentIntent, charge };
}

export class StripeTestReconciliationRecovery {
  private readonly transport: StripeTransport;
  private readonly watch: WatchAdapter;
  private readonly signer: InternalEventSigner;

  constructor(options: {
    transport: StripeTransport;
    watch: WatchAdapter;
    internalEventSecret: string;
  }) {
    this.transport = options.transport;
    this.watch = options.watch;
    this.signer = new InternalEventSigner(options.internalEventSecret);
  }

  async recoverTransaction(
    snapshot: FunnelSnapshot,
    transactionId: string,
  ): Promise<ProviderTestRecovery> {
    const local = snapshot.transactions.find((transaction) => transaction.transactionId === transactionId);
    if (!local) throw new Error(`WATCH has no transaction ${transactionId}.`);
    if (local.classification === 'ARM_LENGTH_CUSTOMER') {
      throw new Error('Provider-test recovery refuses arm-length classification.');
    }
    const { paymentIntent, charge } = await retrieveProviderObjects(this.transport, transactionId);
    if (!charge) {
      return { transactionId, recoveredRefundEffects: 0, recoveredDisputeEffects: 0 };
    }

    let recoveredRefundEffects = 0;
    let recoveredDisputeEffects = 0;
    if (charge.amount_refunded !== local.refundedCents) {
      const refunds = await this.listEffects('refunds', transactionId);
      for (const refund of refunds) {
        this.assertEffect(refund, local, paymentIntent, charge);
        const result = await this.watch.ingest(this.signer.sign(this.effectEvent({
          providerKind: 'refund',
          providerEffect: refund,
          local,
        })));
        if (result.accepted) recoveredRefundEffects++;
      }
    }
    if (charge.disputed !== (local.disputedCents > 0)) {
      const disputes = await this.listEffects('disputes', transactionId);
      for (const dispute of disputes) {
        this.assertEffect(dispute, local, paymentIntent, charge);
        const result = await this.watch.ingest(this.signer.sign(this.effectEvent({
          providerKind: 'dispute',
          providerEffect: dispute,
          local,
        })));
        if (result.accepted) recoveredDisputeEffects++;
      }
    }
    return { transactionId, recoveredRefundEffects, recoveredDisputeEffects };
  }

  private async listEffects(
    kind: 'refunds' | 'disputes',
    paymentIntentId: string,
  ): Promise<StripeProviderEffect[]> {
    const list = await this.transport.request<StripeList<StripeProviderEffect>>({
      method: 'GET',
      path: `/v1/${kind}?payment_intent=${encodeURIComponent(paymentIntentId)}&limit=100`,
    });
    if (list.has_more) {
      throw new Error(`Stripe ${kind} reconciliation exceeded one page; refusing partial recovery.`);
    }
    return list.data;
  }

  private assertEffect(
    effect: StripeProviderEffect,
    local: TransactionSnapshot,
    paymentIntent: StripePaymentIntent,
    charge: StripeCharge,
  ): void {
    if (
      !effect.id ||
      !Number.isInteger(effect.amount) ||
      effect.amount <= 0 ||
      !effect.currency ||
      !Number.isInteger(effect.created) ||
      effect.created <= 0
    ) {
      throw new Error('Stripe reconciliation returned a malformed financial effect.');
    }
    if (effect.payment_intent && effect.payment_intent !== paymentIntent.id) {
      throw new Error('Stripe reconciliation effect changed payment_intent attribution.');
    }
    if (effect.charge && effect.charge !== charge.id) {
      throw new Error('Stripe reconciliation effect changed charge attribution.');
    }
    if (effect.currency.toUpperCase() !== local.currency) {
      throw new Error('Stripe reconciliation effect changed transaction currency.');
    }
  }

  private effectEvent(input: {
    providerKind: 'refund' | 'dispute';
    providerEffect: StripeProviderEffect;
    local: TransactionSnapshot;
  }): FunnelEvent {
    const type = input.providerKind === 'refund' ? 'REFUND_CREATED' : 'DISPUTE_CREATED';
    return {
      eventId: `stripe:reconciliation:${input.providerKind}:${input.providerEffect.id}`,
      type,
      occurredAt: new Date(input.providerEffect.created * 1000).toISOString(),
      experimentId: input.local.experimentId,
      assetId: input.local.assetId,
      transactionId: input.local.transactionId,
      effectId: input.providerEffect.id,
      amountCents: input.providerEffect.amount,
      currency: input.providerEffect.currency.toUpperCase(),
      reason: 'Recovered from authoritative Stripe provider state after a webhook gap.',
      environment: 'PROVIDER_TEST',
      synthetic: false,
    };
  }
}

export class StripeTestReconciler {
  private readonly transport: StripeTransport;

  constructor(transport: StripeTransport) {
    this.transport = transport;
  }

  async reconcileTransaction(
    snapshot: FunnelSnapshot,
    transactionId: string,
  ): Promise<ProviderTestReconciliation> {
    const local = snapshot.transactions.find((transaction) => transaction.transactionId === transactionId);
    if (!local) throw new Error(`WATCH has no transaction ${transactionId}.`);
    if (local.classification === 'ARM_LENGTH_CUSTOMER') {
      throw new Error('Provider-test reconciliation refuses arm-length classification.');
    }
    const { paymentIntent, charge } = await retrieveProviderObjects(this.transport, transactionId);
    return reconcileProviderTestObjects(local, paymentIntent, charge);
  }
}

export function reconcileProviderTestObjects(
  local: TransactionSnapshot,
  paymentIntent: StripePaymentIntent,
  charge: StripeCharge | null,
): ProviderTestReconciliation {
  const grossMatches = local.grossCents === paymentIntent.amount_received;
  const refundMatches = local.refundedCents === (charge?.amount_refunded ?? 0);
  const disputeMatches = (local.disputedCents > 0) === (charge?.disputed ?? false);
  const currencyMatches = local.currency === paymentIntent.currency.toUpperCase();
  return {
    transactionId: local.transactionId,
    providerTest: true,
    grossMatches,
    refundMatches,
    disputeMatches,
    currencyMatches,
    reconciled: grossMatches && refundMatches && disputeMatches && currencyMatches,
    bookedRevenueCents: 0,
    availableSettledCashCents: 0,
    eligibleArmLengthRevenueCents: 0,
    attributableFactoryCostCents: 0,
  };
}

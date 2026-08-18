import type { StripeTransport } from './stripe-api.ts';
import type { FunnelSnapshot, TransactionSnapshot } from './types.ts';

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
    const paymentIntent = await this.transport.request<StripePaymentIntent>({
      method: 'GET',
      path: `/v1/payment_intents/${transactionId}`,
    });
    if (paymentIntent.livemode !== false) throw new Error('PaymentIntent reconciliation returned livemode=true.');
    const charge = paymentIntent.latest_charge
      ? await this.transport.request<StripeCharge>({
          method: 'GET',
          path: `/v1/charges/${paymentIntent.latest_charge}`,
        })
      : null;
    if (charge?.livemode !== false && charge !== null) {
      throw new Error('Charge reconciliation did not explicitly return livemode=false.');
    }
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

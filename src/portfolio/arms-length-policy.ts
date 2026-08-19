/**
 * The last check between a payment and the claim that a stranger made it.
 *
 * Factory's central risk is not losing money; it is believing it has evidence
 * when it does not. A purchase made by the owner, from the owner's own address,
 * counts as revenue and must never count as arm's-length demand. Metadata
 * cannot be trusted to say so, because whoever creates the payment object is
 * also the party who benefits from it reading well.
 *
 * So this filter is DOWNGRADE-ONLY by construction. It can move a transaction
 * away from ARM_LENGTH_CUSTOMER and can never move one toward it. No input, no
 * configuration, and no absent field can cause it to upgrade a classification —
 * which means the worst a misconfiguration can do is understate Factory's
 * results, and understating them is survivable in a way that overstating them
 * is not.
 *
 * It knows nothing about any product or channel. It only knows how to refuse.
 */

import type { TransactionClassification } from './types.ts';

export type UnidentifiedBuyerPolicy = 'OTHER_OR_UNKNOWN' | 'ALLOW_ARM_LENGTH';

export interface ArmsLengthPolicy {
  /**
   * Email addresses (`someone@example.com`) or whole domains (`@example.com`),
   * lowercased. A buyer matching any of these is the owner, whatever the
   * payment metadata claims.
   */
  ownerMarkers: string[];
  /**
   * What to do when a payment claims arm's length but carries no buyer identity
   * that could be checked. Defaults to refusing the claim: Factory cannot assert
   * a stranger bought something when it cannot see who bought it.
   */
  unidentifiedBuyer?: UnidentifiedBuyerPolicy;
}

export interface ArmsLengthResolution {
  classification: TransactionClassification;
  downgraded: boolean;
  reason: string | null;
}

export function normalizeOwnerMarkers(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

function matchesOwner(email: string, markers: string[]): string | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  for (const marker of markers) {
    if (marker.startsWith('@') ? normalized.endsWith(marker) : normalized === marker) {
      return marker;
    }
  }
  return null;
}

/**
 * Resolve the classification actually recorded. Only ARM_LENGTH_CUSTOMER is
 * ever changed; everything else is returned exactly as declared.
 */
export function resolveArmsLength(input: {
  declared: TransactionClassification;
  buyerEmail?: string | null;
  policy: ArmsLengthPolicy;
}): ArmsLengthResolution {
  const unchanged: ArmsLengthResolution = {
    classification: input.declared,
    downgraded: false,
    reason: null,
  };
  // Anything already excluded stays excluded. There is no path from here to
  // ARM_LENGTH_CUSTOMER, and that is the whole safety property.
  if (input.declared !== 'ARM_LENGTH_CUSTOMER') return unchanged;

  const email = input.buyerEmail?.trim();
  if (!email) {
    return (input.policy.unidentifiedBuyer ?? 'OTHER_OR_UNKNOWN') === 'ALLOW_ARM_LENGTH'
      ? unchanged
      : {
          classification: 'OTHER_OR_UNKNOWN',
          downgraded: true,
          reason: 'No buyer identity was available, so arm\'s-length cannot be asserted.',
        };
  }

  const marker = matchesOwner(email, input.policy.ownerMarkers);
  if (marker) {
    return {
      classification: 'OWNER_TEST',
      downgraded: true,
      reason: `Buyer matches the owner identity marker ${marker}.`,
    };
  }
  return unchanged;
}

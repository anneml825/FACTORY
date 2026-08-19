import { createHash } from 'node:crypto';
import { fixtureManifest } from '../fixture-catalog.ts';

/**
 * Deterministic ARRIVE reference for the fixture.
 *
 * The Stripe webhook processor enforces `factory_arrive_[a-f0-9]{32}` and
 * rejects anything else as an invalid Factory ARRIVE reference, so this must
 * match that shape exactly. Deriving it from the experiment ID keeps it stable
 * across reruns, which is what makes webhook redelivery testable.
 */
export function fixtureArriveReference(): string {
  const digest = createHash('sha256')
    .update(`phase-e-fixture-arrive:${fixtureManifest().experimentId}`)
    .digest('hex')
    .slice(0, 32);
  return `factory_arrive_${digest}`;
}

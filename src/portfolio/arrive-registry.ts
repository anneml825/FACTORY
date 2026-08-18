/**
 * ARRIVE adapter registry. Phase E remediation.
 *
 * Phase C established that ARRIVE is a provider-neutral contract, but nothing
 * held more than one adapter at a time, so "the portfolio can run several
 * independently measurable mechanisms" was an intention rather than a
 * capability. This registry is that capability and nothing more: it selects no
 * mechanism, recommends none, and contains no adapter.
 *
 * The related lesson from Phase C is recorded in `denominatorNote`: DEV's
 * article counter did not register a controlled load within ten minutes, so an
 * ARRIVE provider's own analytics cannot be assumed to be a timely instrument.
 * Factory's own edge counts product views the moment they happen, which gives
 * every adapter a first-party denominator regardless of what the provider
 * reports. That denominator measures ARRIVAL AT THE PAGE, not stranger
 * exposure, and the two must never be conflated.
 */

import type { ArriveAdapter } from './ports.ts';

export interface RegisteredArriveMechanism {
  adapterId: string;
  mode: 'FIXTURE' | 'LIVE';
  /** How exposure is claimed to be measured, and by whom. */
  measurementInstrument: string;
  /** True only when a real measurement has been verified against the provider. */
  measurementVerified: boolean;
}

export class ArriveAdapterRegistry {
  private readonly adapters = new Map<string, ArriveAdapter>();
  private readonly descriptions = new Map<string, RegisteredArriveMechanism>();

  register(adapter: ArriveAdapter, description: Omit<RegisteredArriveMechanism, 'adapterId' | 'mode'>): void {
    if (this.adapters.has(adapter.adapterId)) {
      throw new Error(`ARRIVE adapter ${adapter.adapterId} is already registered.`);
    }
    this.adapters.set(adapter.adapterId, adapter);
    this.descriptions.set(adapter.adapterId, {
      adapterId: adapter.adapterId,
      mode: adapter.mode,
      ...description,
    });
  }

  get(adapterId: string): ArriveAdapter {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw new Error(`No ARRIVE adapter registered as ${adapterId}.`);
    return adapter;
  }

  list(): RegisteredArriveMechanism[] {
    return [...this.descriptions.values()];
  }

  liveMechanisms(): RegisteredArriveMechanism[] {
    return this.list().filter((mechanism) => mechanism.mode === 'LIVE');
  }

  /**
   * A batch whose experiments all depend on one arrival mechanism produces one
   * bit of information, not N. This is the check that says so out loud; it does
   * not choose the mechanisms.
   */
  assertMechanismDiversity(minimumLiveMechanisms: number): void {
    const live = this.liveMechanisms();
    if (live.length < minimumLiveMechanisms) {
      throw new Error(
        `A batch requiring ${minimumLiveMechanisms} independent live ARRIVE mechanisms has ${live.length}. ` +
          'Experiments sharing a single untested channel fail together and cannot be told apart.',
      );
    }
  }

  static readonly denominatorNote =
    'Factory-owned edge product views are the immediate first-party denominator for every ' +
    'adapter. They measure arrival at the page, never stranger exposure, and never substitute ' +
    'for the Stranger Arrival Test.';
}

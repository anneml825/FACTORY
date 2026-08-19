/**
 * The single noncommercial fixture listing the edge serves.
 *
 * This is NOT Product #1 and must not become it. The buyer, problem, and
 * promise are the Phase A engineering fixture's, the manifest is marked
 * `noncommercialFixture`, the page carries a NOT FOR SALE banner, and the
 * handler refuses to serve any non-fixture listing unless commercial mode is
 * explicitly enabled. Its only purpose is to prove the commerce path.
 */

import { shortDocumentFixture } from '../portfolio/fixtures.ts';
import { renderAsset } from '../portfolio/renderers.ts';
import type { Artifact, AssetManifest } from '../portfolio/types.ts';
import type { CatalogStore, EdgeListing } from './types.ts';

export const FIXTURE_ARTIFACT_KEY = 'artifacts/phase-e/fixture-document.html';

export function fixtureManifest(): AssetManifest {
  return shortDocumentFixture();
}

export function fixtureArtifact(): Artifact {
  return renderAsset(fixtureManifest());
}

export function fixtureListing(input: {
  checkoutUrl: string;
  arrivalPublicationId?: string;
}): EdgeListing {
  const manifest = fixtureManifest();
  return {
    experimentId: manifest.experimentId,
    assetId: manifest.assetId,
    title: 'Phase E fixture — Factory commerce path proof',
    summary:
      'A noncommercial engineering fixture. It exists to prove that Factory can serve a page, ' +
      'measure arrival at it, take a sandbox payment, and deliver a file. It is not for sale.',
    priceCents: manifest.price.amountCents,
    currency: manifest.price.currency,
    checkoutUrl: input.checkoutUrl,
    artifactKey: FIXTURE_ARTIFACT_KEY,
    noncommercialFixture: true,
    environment: 'PROVIDER_TEST',
    arrivalPublicationId: input.arrivalPublicationId,
  };
}

/** A catalog with exactly one fixture listing and no way to add another. */
export class FixtureCatalog implements CatalogStore {
  private readonly listing: EdgeListing;

  constructor(input: { checkoutUrl: string; arrivalPublicationId?: string }) {
    this.listing = fixtureListing(input);
  }

  async get(experimentId: string): Promise<EdgeListing | null> {
    return experimentId === this.listing.experimentId ? structuredClone(this.listing) : null;
  }
}

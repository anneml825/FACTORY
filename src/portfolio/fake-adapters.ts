import { createHash, createHmac } from 'node:crypto';
import type { ArriveAdapter, MakeAdapter, PutAdapter, SyntheticEventSource } from './ports.ts';
import { renderAsset } from './renderers.ts';
import type {
  ArrivalGateRecord,
  Artifact,
  AssetManifest,
  FunnelEvent,
  Publication,
  SignedEventEnvelope,
} from './types.ts';

function fingerprint(manifest: AssetManifest, artifact: Artifact): string {
  return createHash('sha256')
    .update(JSON.stringify(manifest))
    .update(artifact.sha256)
    .digest('hex');
}

export class FixtureMakeAdapter implements MakeAdapter {
  readonly adapterId = 'fixture-make-v1';
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'discovery' };

  async build(manifest: AssetManifest, _idempotencyKey: string): Promise<Artifact> {
    return renderAsset(manifest);
  }
}

export class FixtureArrivalAdapter implements ArriveAdapter {
  readonly adapterId = 'fixture-arrive-contract-v1';
  readonly mode = 'FIXTURE' as const;
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'discovery' };
  private readonly shouldPass: boolean;

  constructor(shouldPass = true) {
    this.shouldPass = shouldPass;
  }

  async evaluateGate(manifest: AssetManifest, _idempotencyKey: string): Promise<ArrivalGateRecord> {
    if (!this.shouldPass) {
      return {
        ...manifest.arrivalGate,
        adapterId: this.adapterId,
        mode: 'FIXTURE',
        status: 'FAILED',
      };
    }
    return {
      adapterId: this.adapterId,
      mode: 'FIXTURE',
      status: 'PASSED',
      who: 'synthetic unrelated visitor fixture',
      where: 'local Phase A harness',
      surface: 'fixture://arrival-surface',
      permittedReason: 'test-only fixture contract; no public exposure occurs',
      quantitativeEvidenceId: 'fixture-evidence-not-e1',
      measurementInstrument: 'in-memory event counter',
      measurementVerifiedAt: '2026-08-18T00:00:00.000Z',
    };
  }
}

export class FakeLocalPutProvider implements PutAdapter {
  readonly adapterId = 'fake-local-put-v1';
  readonly mode = 'FIXTURE' as const;
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  private readonly byIdempotencyKey = new Map<string, Publication>();
  private readonly byExperimentId = new Map<string, Publication>();
  publishCalls = 0;
  createdPublications = 0;

  async publish(
    manifest: AssetManifest,
    artifact: Artifact,
    idempotencyKey: string,
  ): Promise<Publication> {
    this.publishCalls++;
    const manifestFingerprint = fingerprint(manifest, artifact);
    const retry = this.byIdempotencyKey.get(idempotencyKey);
    if (retry) {
      if (retry.manifestFingerprint !== manifestFingerprint) {
        throw new Error('PUT idempotency-key conflict: payload changed across a retry.');
      }
      return retry;
    }
    const alreadyPublished = this.byExperimentId.get(manifest.experimentId);
    if (alreadyPublished) {
      throw new Error('PUT refused: experiment already has a publication; retry with the original key.');
    }
    const publication: Publication = {
      publicationId: `fixture-publication-${manifest.experimentId}`,
      experimentId: manifest.experimentId,
      assetId: manifest.assetId,
      providerId: this.adapterId,
      location: `fixture://catalog/${manifest.experimentId}`,
      idempotencyKey,
      manifestFingerprint,
      mode: 'FIXTURE',
      status: 'ACTIVE',
    };
    this.byIdempotencyKey.set(idempotencyKey, publication);
    this.byExperimentId.set(manifest.experimentId, publication);
    this.createdPublications++;
    return publication;
  }

  async deactivate(publication: Publication, _idempotencyKey: string): Promise<Publication> {
    publication.status = 'INACTIVE';
    return publication;
  }
}

export class FixtureEventSigner implements SyntheticEventSource {
  private readonly signingSecret: string;

  constructor(signingSecret: string) {
    this.signingSecret = signingSecret;
  }

  sign(event: FunnelEvent): SignedEventEnvelope {
    const payload = JSON.stringify(event);
    const signature = createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    return { payload, signature };
  }
}

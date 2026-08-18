import type {
  ArrivalGateRecord,
  ArrivalMetrics,
  ArrivalPublication,
  Artifact,
  AssetManifest,
  FunnelEvent,
  FunnelSnapshot,
  Publication,
  SignedEventEnvelope,
} from './types.ts';

export interface AdapterCostProfile {
  maximumCents: number;
  currency: string;
  bucketName: string;
}

export interface MeteredAdapter {
  readonly costProfile: AdapterCostProfile;
}

export interface MakeAdapter extends MeteredAdapter {
  readonly adapterId: string;
  build(manifest: AssetManifest, idempotencyKey: string): Promise<Artifact>;
}

export interface PutAdapter extends MeteredAdapter {
  readonly adapterId: string;
  readonly mode: 'FIXTURE' | 'PROVIDER_TEST' | 'LIVE';
  publish(
    manifest: AssetManifest,
    artifact: Artifact,
    idempotencyKey: string,
  ): Promise<Publication>;
  deactivate(publication: Publication, idempotencyKey: string): Promise<Publication>;
}

export interface WatchAdapter extends MeteredAdapter {
  ingest(envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }>;
  snapshot(experimentId: string): FunnelSnapshot;
}

export interface ArriveAdapter extends MeteredAdapter {
  readonly adapterId: string;
  readonly mode: 'FIXTURE' | 'LIVE';
  evaluateGate(manifest: AssetManifest, idempotencyKey: string): Promise<ArrivalGateRecord>;
  activate(
    manifest: AssetManifest,
    publication: Publication,
    idempotencyKey: string,
  ): Promise<ArrivalPublication>;
  measure(arrival: ArrivalPublication): Promise<ArrivalMetrics>;
  deactivate(arrival: ArrivalPublication, idempotencyKey: string): Promise<ArrivalPublication>;
}

export interface SyntheticEventSource {
  sign(event: FunnelEvent): SignedEventEnvelope;
}

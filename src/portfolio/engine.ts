import { assertPublicationGates, transition } from './state-machine.ts';
import { runFixtureValueQa, runFunctionalQa } from './renderers.ts';
import { evaluateExperiment } from './evaluator.ts';
import type { ArriveAdapter, MakeAdapter, PutAdapter, WatchAdapter } from './ports.ts';
import { CostController } from './cost-control.ts';
import type {
  AssetManifest,
  CostRecord,
  ExperimentRecord,
  Publication,
  SignedEventEnvelope,
} from './types.ts';

export class PhaseAEngine {
  private readonly make: MakeAdapter;
  private readonly put: PutAdapter;
  private readonly arrive: ArriveAdapter;
  private readonly watch: WatchAdapter;
  private readonly costs: CostController;
  private readonly records = new Map<string, ExperimentRecord>();

  constructor(dependencies: {
    make: MakeAdapter;
    put: PutAdapter;
    arrive: ArriveAdapter;
    watch: WatchAdapter;
    costs?: CostController;
  }) {
    this.make = dependencies.make;
    this.put = dependencies.put;
    this.arrive = dependencies.arrive;
    this.watch = dependencies.watch;
    this.costs = dependencies.costs ?? new CostController();
  }

  register(manifest: AssetManifest): ExperimentRecord {
    if (this.records.has(manifest.experimentId)) {
      throw new Error(`Experiment already registered: ${manifest.experimentId}.`);
    }
    if (!manifest.noncommercialFixture) {
      throw new Error('Phase A refuses manifests that are not explicitly noncommercial fixtures.');
    }
    const record: ExperimentRecord = {
      manifest: structuredClone(manifest),
      state: 'CANDIDATE',
      stateHistory: [
        { state: 'CANDIDATE', at: '2026-08-18T00:00:00.000Z', reason: 'fixture registered' },
      ],
      artifact: null,
      functionalQa: null,
      valueQa: null,
      publication: null,
      costs: [],
      decision: null,
    };
    this.records.set(manifest.experimentId, record);
    return record;
  }

  get(experimentId: string): ExperimentRecord {
    const record = this.records.get(experimentId);
    if (!record) throw new Error(`Unknown experiment: ${experimentId}.`);
    return record;
  }

  async build(experimentId: string): Promise<ExperimentRecord> {
    const record = this.get(experimentId);
    if (record.state !== 'CANDIDATE') throw new Error('Build requires CANDIDATE state.');
    const result = await this.costs.execute({
      operationId: `make:${experimentId}`,
      reservationIdempotencyKey: `phase-a:make:${experimentId}`,
      bucketName: this.make.costProfile.bucketName,
      maximumCents: this.make.costProfile.maximumCents,
      currency: this.make.costProfile.currency,
      purpose: 'Phase A deterministic fixture rendering',
      actor: 'phase-a-engine',
      run: async () => ({
        value: await this.make.build(record.manifest, `phase-a:make:${experimentId}`),
        actualCostCents: this.make.costProfile.maximumCents,
      }),
    });
    record.artifact = result.value;
    this.appendCost(record, result.cost);
    transition(record, 'BUILT', 'deterministic fixture artifact rendered');
    return record;
  }

  functionalQa(experimentId: string): ExperimentRecord {
    const record = this.get(experimentId);
    if (record.state !== 'BUILT' || !record.artifact) throw new Error('Functional QA requires BUILT state.');
    record.functionalQa = runFunctionalQa(record.manifest, record.artifact);
    if (!record.functionalQa.passed) throw new Error('Functional QA failed.');
    transition(record, 'FUNCTIONAL_QA_PASS', 'fixture functional QA passed');
    return record;
  }

  valueQa(experimentId: string): ExperimentRecord {
    const record = this.get(experimentId);
    if (record.state !== 'FUNCTIONAL_QA_PASS') {
      throw new Error('Value QA requires FUNCTIONAL_QA_PASS state.');
    }
    record.valueQa = runFixtureValueQa(record.manifest);
    if (!record.valueQa.passed) throw new Error('Fixture Value QA failed.');
    transition(record, 'VALUE_QA_PASS', 'mandatory fixture Value QA passed');
    return record;
  }

  async stage(experimentId: string): Promise<ExperimentRecord> {
    const record = this.get(experimentId);
    if (record.state !== 'VALUE_QA_PASS') throw new Error('Staging requires VALUE_QA_PASS state.');
    const result = await this.costs.execute({
      operationId: `arrive:${experimentId}`,
      reservationIdempotencyKey: `phase-a:arrive:${experimentId}`,
      bucketName: this.arrive.costProfile.bucketName,
      maximumCents: this.arrive.costProfile.maximumCents,
      currency: this.arrive.costProfile.currency,
      purpose: 'Phase A fixture Arrival-gate evaluation',
      actor: 'phase-a-engine',
      run: async () => ({
        value: await this.arrive.evaluateGate(record.manifest, `phase-a:arrive:${experimentId}`),
        actualCostCents: this.arrive.costProfile.maximumCents,
      }),
    });
    record.manifest.arrivalGate = result.value;
    this.appendCost(record, result.cost);
    if (record.manifest.arrivalGate.status !== 'PASSED') {
      throw new Error('Staging refused: Arrival adapter did not pass the gate.');
    }
    transition(record, 'STAGED', 'fixture Arrival contract returned a simulated pass');
    return record;
  }

  async publish(experimentId: string, idempotencyKey: string): Promise<Publication> {
    const record = this.get(experimentId);
    if (this.put.mode === 'LIVE') {
      throw new Error('Fixture engine refuses LIVE PUT adapters.');
    }
    if (this.put.mode === 'PROVIDER_TEST' && !record.manifest.noncommercialFixture) {
      throw new Error('Provider-test publication requires an explicitly noncommercial fixture.');
    }
    if (!record.artifact) throw new Error('Publication requires an artifact.');
    if (record.state !== 'STAGED' && record.state !== 'PUBLISHED' && record.state !== 'OBSERVING') {
      throw new Error('Publication requires STAGED state or an idempotent retry of a publication.');
    }
    if (record.state === 'STAGED') assertPublicationGates(record);

    const result = await this.costs.execute({
      operationId: `put:${experimentId}`,
      reservationIdempotencyKey: `phase-a:put:${idempotencyKey}`,
      bucketName: this.put.costProfile.bucketName,
      maximumCents: this.put.costProfile.maximumCents,
      currency: this.put.costProfile.currency,
      purpose: 'Phase A fake/local publication',
      actor: 'phase-a-engine',
      run: async () => ({
        value: await this.put.publish(record.manifest, record.artifact as NonNullable<typeof record.artifact>, idempotencyKey),
        actualCostCents: this.put.costProfile.maximumCents,
      }),
    });
    if (record.publication && record.publication.publicationId !== result.value.publicationId) {
      throw new Error('Idempotent PUT retry returned a different publication.');
    }
    record.publication = result.value;
    this.appendCost(record, result.cost);
    if (record.state === 'STAGED') transition(record, 'PUBLISHED', 'fake/local publication created');
    return result.value;
  }

  observe(experimentId: string): ExperimentRecord {
    const record = this.get(experimentId);
    transition(record, 'OBSERVING', 'fixture WATCH ingestion enabled');
    return record;
  }

  async ingest(experimentId: string, envelope: SignedEventEnvelope): Promise<{ accepted: boolean; duplicate: boolean }> {
    const record = this.get(experimentId);
    if (record.state !== 'OBSERVING') throw new Error('WATCH ingestion requires OBSERVING state.');
    const event = JSON.parse(envelope.payload) as { experimentId?: string; assetId?: string; eventId?: string };
    if (event.experimentId !== experimentId || event.assetId !== record.manifest.assetId || !event.eventId) {
      throw new Error('Event attribution does not match the experiment/asset being observed.');
    }
    const result = await this.costs.execute({
      operationId: `watch:${event.eventId}`,
      reservationIdempotencyKey: `phase-a:watch:${event.eventId}`,
      bucketName: this.watch.costProfile.bucketName,
      maximumCents: this.watch.costProfile.maximumCents,
      currency: this.watch.costProfile.currency,
      purpose: 'Phase A synthetic WATCH event ingestion',
      actor: 'phase-a-engine',
      run: async () => ({
        value: await this.watch.ingest(envelope),
        actualCostCents: this.watch.costProfile.maximumCents,
      }),
    });
    this.appendCost(record, result.cost);
    return result.value;
  }

  evaluate(experimentId: string): ExperimentRecord {
    const record = this.get(experimentId);
    if (record.state !== 'OBSERVING') throw new Error('Evaluation requires OBSERVING state.');
    const settledFactoryCostCents = record.costs.reduce((sum, cost) => sum + cost.settledCents, 0);
    const result = evaluateExperiment(
      record.manifest,
      this.watch.snapshot(experimentId),
      settledFactoryCostCents,
    );
    record.decision = result;
    transition(record, result.decision, result.reason);
    return record;
  }

  private appendCost(record: ExperimentRecord, cost: CostRecord): void {
    const existing = record.costs.find(
      (item) => item.reservationIdempotencyKey === cost.reservationIdempotencyKey,
    );
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(cost)) {
        throw new Error('Cost idempotency-key conflict: settlement changed across a retry.');
      }
      return;
    }
    record.costs.push(cost);
  }
}

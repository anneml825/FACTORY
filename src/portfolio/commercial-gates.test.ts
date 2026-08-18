import test from 'node:test';
import assert from 'node:assert/strict';
import { PhaseAEngine } from './engine.ts';
import { FixtureArrivalAdapter, FixtureMakeAdapter, FakeLocalPutProvider } from './fake-adapters.ts';
import { InMemoryWatchStore } from './watch.ts';
import { shortDocumentFixture } from './fixtures.ts';
import { renderAsset, runFixtureValueQa, runFunctionalQa } from './renderers.ts';
import { runCommercialValueQa, type CommercialValueQaInput } from './commercial-value-qa.ts';
import { assertPublicationGates } from './state-machine.ts';
import {
  InMemoryOwnerLaborLedger,
  reconcileOwnerLabor,
  type OwnerLaborObservation,
} from './owner-labor.ts';
import type { AssetManifest, ExperimentRecord } from './types.ts';
import type { MakeAdapter, PutAdapter } from './ports.ts';
import { ArriveAdapterRegistry } from './arrive-registry.ts';

/**
 * A SYNTHETIC commercial manifest. It is not a product, not a niche, and not a
 * candidate: it exists so the commercial gates can be exercised before any real
 * product exists, which is the only moment the criteria can be set honestly.
 */
function syntheticCommercialManifest(): AssetManifest {
  const base = shortDocumentFixture();
  return {
    ...base,
    experimentId: 'synthetic-commercial-gate-test',
    assetId: 'synthetic-commercial-asset',
    familyId: 'synthetic-commercial-family',
    noncommercialFixture: false,
    buyer: 'SYNTHETIC BUYER — gate test only, not a market segment',
    problem: 'SYNTHETIC PROBLEM — exists to exercise the commercial gate, not to be solved',
    promise: 'converts the supplied synthetic input rows into a checked synthetic summary table',
    source: {
      kind: 'SHORT_DOCUMENT',
      title: 'Synthetic Commercial Gate Fixture',
      summary:
        'A synthetic artifact used only to prove that commercial gates can pass and fail. It is never offered for sale.',
      sections: Array.from({ length: 8 }, (_, index) => ({
        heading: `Synthetic section ${index + 1}`,
        body: 'Padding body text so the artifact clears the usability byte floor without being a real product. '.repeat(3),
      })),
    },
  };
}

function completeEvidence(
  overrides: Partial<Omit<CommercialValueQaInput, 'manifest' | 'artifact'>> = {},
): Omit<CommercialValueQaInput, 'manifest' | 'artifact'> {
  return {
    generatorIdentity: { providerId: 'generator-provider', modelId: 'generator-model' },
    promiseCheck: {
      checkId: 'promise-summary-table',
      description: 'converts supplied synthetic input rows into a checked synthetic summary table',
      executed: true,
      passed: true,
      evidence: ['synthetic input rows produced the expected summary table for 12 sample inputs'],
    },
    functionalChecks: [
      { checkId: 'structure', description: 'document structure', executed: true, passed: true, evidence: ['8 sections'] },
    ],
    factualClaims: [],
    makesNoExternalFactualClaims: {
      declared: true,
      justification: 'The artifact restates only the buyer’s own supplied inputs and makes no external factual claim.',
    },
    sources: [],
    originalWorkAttestation: 'Generated from a Factory-owned template with no third-party source material.',
    freeAlternative: {
      name: 'A generic free checklist template',
      url: 'https://example.org/free-template',
      retrievedAt: '2026-08-18T00:00:00.000Z',
      howObtainedFree: 'downloadable without an account from the publisher',
      substantiveOverlap: 'PARTIAL',
    },
    differentiation: [
      {
        claim: 'computes 12 derived totals the free template leaves for the buyer to calculate by hand',
        verifiableBy: 'open both files and compare the derived-total columns',
      },
    ],
    modelReviews: [
      {
        criterionId: 'DIFFERENTIATION_VS_ALTERNATIVE',
        reviewerProviderId: 'reviewer-provider',
        reviewerModelId: 'reviewer-model',
        reviewedAt: '2026-08-18T01:00:00.000Z',
        verdict: 'PASS',
        rationale: 'The derived-total columns are present here and absent in the named free template.',
      },
      {
        criterionId: 'USABILITY_COMPLETENESS',
        reviewerProviderId: 'reviewer-provider',
        reviewerModelId: 'reviewer-model',
        reviewedAt: '2026-08-18T01:00:00.000Z',
        verdict: 'PASS',
        rationale: 'Every section the promise implies is present and the artifact needs no missing companion file.',
      },
    ],
    ownerExceptions: [],
    ...overrides,
  };
}

function qa(overrides: Partial<Omit<CommercialValueQaInput, 'manifest' | 'artifact'>> = {}) {
  const manifest = syntheticCommercialManifest();
  return runCommercialValueQa({ ...completeEvidence(overrides), manifest, artifact: renderAsset(manifest) });
}

// ---------------------------------------------------------------------------
// The defect this file exists for: Value QA that cannot fail anything.
// ---------------------------------------------------------------------------

test('a complete evidence bundle passes and reports how each criterion was established', () => {
  const result = qa();
  assert.equal(result.passed, true, result.failures.join(' | '));
  assert.equal(result.mode, 'COMMERCIAL');
  const modes = Object.fromEntries((result.criteria ?? []).map((c) => [c.id, c.verification]));
  assert.equal(modes.PROMISE_FULFILLED, 'DETERMINISTIC');
  assert.equal(modes.DIFFERENTIATION_VS_ALTERNATIVE, 'MODEL_REVIEW');
  assert.equal((result.criteria ?? []).every((c) => c.status === 'PASSED'), true);
});

test('REGRESSION: a technically valid artifact that duplicates a free alternative fails', () => {
  // The old fixture Value QA checked non-empty strings and a positive price.
  // This artifact would have sailed through it.
  const result = qa({
    freeAlternative: {
      name: 'The identical free checklist',
      url: 'https://example.org/free-template',
      retrievedAt: '2026-08-18T00:00:00.000Z',
      howObtainedFree: 'downloadable without an account',
      substantiveOverlap: 'IDENTICAL',
    },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /substantively identical/);
});

test('REGRESSION: differentiation that asserts value without asserting a difference fails', () => {
  const result = qa({
    differentiation: [{ claim: 'higher quality and more comprehensive', verifiableBy: 'read both of them' }],
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /without asserting a checkable difference/);
});

test('a differentiation claim with no way for a buyer to confirm it fails', () => {
  const result = qa({
    differentiation: [{ claim: 'computes 12 derived totals the free template omits', verifiableBy: 'trust us' }],
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /no way for a buyer to confirm/);
});

test('omitting the free-alternative comparison is a failure, not an omission', () => {
  const result = qa({ freeAlternative: null });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /is a claim, not an omission/);
});

test('a model may not mark its own work', () => {
  const result = qa({
    generatorIdentity: { providerId: 'reviewer-provider', modelId: 'reviewer-model' },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /may not mark its own work/);
});

test('a rubber-stamped review with no rationale fails', () => {
  const evidence = completeEvidence();
  const result = qa({
    modelReviews: evidence.modelReviews.map((review) => ({ ...review, rationale: 'looks fine' })),
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /without a substantive rationale/);
});

test('a missing model review fails closed rather than defaulting to pass', () => {
  const result = qa({ modelReviews: [] });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /No independent model review was recorded/);
});

test('a promise check that does not reference the promise fails', () => {
  const result = qa({
    promiseCheck: {
      checkId: 'unrelated',
      description: 'verifies that the file opens',
      executed: true,
      passed: true,
      evidence: ['opened without error'],
    },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /does not reference the promise/);
});

test('unsourced factual claims fail the Verifiable Correctness constraint', () => {
  const result = qa({
    factualClaims: [{ claim: 'the 2026 filing deadline is in April', primarySourceUrl: '', retrievedAt: '' }],
    makesNoExternalFactualClaims: null,
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /no primary-source URL/);
});

test('provenance may be escalated to a logged owner exception; promise fulfilment may not', () => {
  const uncleared = {
    sources: [
      {
        title: 'Third-party dataset',
        url: 'https://example.org/dataset',
        licence: 'unclear',
        retrievedAt: '2026-08-18T00:00:00.000Z',
        clearedForCommercialUse: false,
      },
    ],
  };
  const blocked = qa(uncleared);
  assert.equal(blocked.passed, false);

  const escalated = qa({
    ...uncleared,
    ownerExceptions: [
      {
        criterionId: 'PROVENANCE_RIGHTS',
        ownerInterventionId: 'owner-intervention-42',
        reason: 'Owner reviewed the licence directly and accepted the risk.',
        recordedAt: '2026-08-18T02:00:00.000Z',
      },
    ],
  });
  assert.equal(escalated.passed, true, escalated.failures.join(' | '));
  const provenance = escalated.criteria?.find((c) => c.id === 'PROVENANCE_RIGHTS');
  assert.equal(provenance?.verification, 'HUMAN_EXCEPTION');
  assert.equal(provenance?.ownerInterventionId, 'owner-intervention-42');

  // A criterion Factory must verify itself cannot be waived by the owner.
  const waived = qa({
    promiseCheck: { checkId: 'x', description: 'x', executed: false, passed: false, evidence: [] },
    ownerExceptions: [
      {
        criterionId: 'PROMISE_FULFILLED',
        ownerInterventionId: 'owner-intervention-43',
        reason: 'Owner is confident it works.',
        recordedAt: '2026-08-18T02:00:00.000Z',
      },
    ],
  });
  assert.equal(waived.passed, false);
  assert.match(waived.failures.join(' | '), /is not escalatable/);
});

test('commercial Value QA refuses a noncommercial fixture manifest', () => {
  const manifest = shortDocumentFixture();
  assert.throws(
    () => runCommercialValueQa({ ...completeEvidence(), manifest, artifact: renderAsset(manifest) }),
    TypeError,
  );
  // ...and the fixture check is preserved unchanged for fixtures.
  assert.equal(runFixtureValueQa(manifest).passed, true);
  assert.equal(runFixtureValueQa(manifest).mode, 'FIXTURE');
});

// ---------------------------------------------------------------------------
// COMMERCIAL-mode engine readiness.
// ---------------------------------------------------------------------------

class LivePutProvider implements PutAdapter {
  readonly adapterId = 'test-live-put';
  readonly mode = 'LIVE' as const;
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'infrastructure' };
  async publish(manifest: AssetManifest, artifact: { assetId: string }, idempotencyKey: string) {
    return {
      publicationId: `live-${manifest.experimentId}`,
      experimentId: manifest.experimentId,
      assetId: manifest.assetId,
      providerId: this.adapterId,
      location: `https://edge.invalid/p/${manifest.experimentId}`,
      idempotencyKey,
      manifestFingerprint: manifest.assetId,
      mode: 'LIVE' as const,
      status: 'ACTIVE' as const,
    };
  }
  async deactivate(publication: Awaited<ReturnType<LivePutProvider['publish']>>) {
    return { ...publication, status: 'INACTIVE' as const };
  }
}

function commercialEngine(put: PutAdapter = new LivePutProvider()): PhaseAEngine {
  return new PhaseAEngine({
    make: new FixtureMakeAdapter() as MakeAdapter,
    put,
    arrive: new FixtureArrivalAdapter(),
    watch: new InMemoryWatchStore('commercial-gate-test-secret'),
    mode: 'COMMERCIAL',
  });
}

test('each engine mode refuses the other mode’s manifests', () => {
  assert.throws(() => commercialEngine().register(shortDocumentFixture()), /refuses noncommercial fixture/);
  const fixtureEngine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put: new FakeLocalPutProvider(),
    arrive: new FixtureArrivalAdapter(),
    watch: new InMemoryWatchStore('secret'),
  });
  assert.throws(
    () => fixtureEngine.register(syntheticCommercialManifest()),
    /not explicitly noncommercial fixtures/,
  );
});

test('a commercial asset cannot pass Value QA without the evidence bundle', async () => {
  const engine = commercialEngine();
  const manifest = syntheticCommercialManifest();
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  assert.throws(() => engine.valueQa(manifest.experimentId), /refusing to pass by default/);
});

test('a commercial asset advances only when the commercial evidence passes', async () => {
  const engine = commercialEngine();
  const manifest = syntheticCommercialManifest();
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  const functional = engine.functionalQa(manifest.experimentId);
  assert.equal(functional.functionalQa?.mode, 'COMMERCIAL');
  // The commercial artifact must NOT carry the fixture marker.
  assert.ok(!new TextDecoder().decode(functional.artifact?.bytes as Uint8Array).includes('NONCOMMERCIAL FIXTURE'));

  assert.throws(
    () => engine.valueQa(manifest.experimentId, completeEvidence({ modelReviews: [] })),
    /Commercial Value QA failed/,
  );
  const record = engine.valueQa(manifest.experimentId, completeEvidence());
  assert.equal(record.state, 'VALUE_QA_PASS');
  assert.equal(record.valueQa?.mode, 'COMMERCIAL');
});

test('a commercial asset cannot publish behind a FIXTURE arrival gate', async () => {
  const engine = commercialEngine();
  const manifest = syntheticCommercialManifest();
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId, completeEvidence());
  await engine.stage(manifest.experimentId);
  await assert.rejects(
    engine.publish(manifest.experimentId, 'idem-1'),
    /requires a LIVE arrival gate/,
  );
});

test('a commercial asset cleared only by fixture QA cannot publish', () => {
  const manifest = syntheticCommercialManifest();
  const artifact = renderAsset(manifest);
  const record = {
    manifest: {
      ...manifest,
      arrivalGate: {
        adapterId: 'live-adapter',
        mode: 'LIVE' as const,
        status: 'PASSED' as const,
        who: 'w',
        where: 'x',
        surface: 's',
        permittedReason: 'p',
        quantitativeEvidenceId: 'e1',
        measurementInstrument: 'i',
        measurementVerifiedAt: '2026-08-18T00:00:00.000Z',
      },
    },
    state: 'STAGED',
    stateHistory: [],
    artifact,
    functionalQa: runFunctionalQa(manifest, artifact),
    // Fixture-mode Value QA result smuggled onto a commercial manifest.
    valueQa: { passed: true, checks: [], failures: [], mode: 'FIXTURE' as const },
    publication: null,
    arrivalPublication: null,
    costs: [],
    decision: null,
  } as unknown as ExperimentRecord;
  assert.throws(() => assertPublicationGates(record), /requires COMMERCIAL functional and Value QA/);
});

test('the fixture engine still refuses a LIVE PUT adapter', () => {
  const engine = new PhaseAEngine({
    make: new FixtureMakeAdapter(),
    put: new LivePutProvider(),
    arrive: new FixtureArrivalAdapter(),
    watch: new InMemoryWatchStore('secret'),
  });
  engine.register(shortDocumentFixture());
  return assert.rejects(engine.publish('phase-a-doc-001', 'k'), /refuses LIVE PUT adapters/);
});

// ---------------------------------------------------------------------------
// Owner-labour truthfulness.
// ---------------------------------------------------------------------------

function observation(overrides: Partial<OwnerLaborObservation> = {}): OwnerLaborObservation {
  return {
    experimentIds: ['e1', 'e2'],
    units: 2,
    observedSetupMinutes: 0,
    observedBatchApprovalMinutes: 0,
    observedExceptionMinutes: 0,
    observedOperatingMinutes: 0,
    observedMaintenanceMinutes: 0,
    windowStart: '',
    windowEnd: '',
    source: 'test',
    ...overrides,
  };
}

test('REGRESSION: a declared zero cannot survive contradicting owner_intervention records', () => {
  const truthful = reconcileOwnerLabor({
    declaredOperatingMinutesPerAsset: 0,
    units: 2,
    observation: observation(),
  });
  assert.equal(truthful.truthful, true);

  const falsified = reconcileOwnerLabor({
    declaredOperatingMinutesPerAsset: 0,
    units: 2,
    observation: observation({ observedOperatingMinutes: 10 }),
  });
  assert.equal(falsified.truthful, false);
  assert.equal(falsified.discrepancyMinutes, 10);
  assert.match(falsified.reasons.join(' | '), /10 were actually logged/);
});

test('setup and exception minutes are reported, not penalised; maintenance is surfaced', () => {
  const result = reconcileOwnerLabor({
    declaredOperatingMinutesPerAsset: 0,
    units: 2,
    observation: observation({
      observedSetupMinutes: 15,
      observedExceptionMinutes: 8,
      observedMaintenanceMinutes: 12,
    }),
  });
  assert.equal(result.truthful, true, 'brief setup and rare exceptions are policy-acceptable');
  assert.match(result.reasons.join(' | '), /12 maintenance\/debug minute/);
});

test('the ledger attributes interventions to the experiments they were spent on', async () => {
  const ledger = new InMemoryOwnerLaborLedger('test-ledger');
  ledger.log({
    interventionId: 'i1', occurredAt: '2026-08-18T00:00:00.000Z', kind: 'OPERATING',
    actualMinutes: 5, reasonHumanRequired: 'manual publish', isRecurring: true,
    automatable: true, unitsAffected: 1, experimentIds: ['e1'],
  });
  ledger.log({
    interventionId: 'i2', occurredAt: '2026-08-18T00:10:00.000Z', kind: 'SETUP',
    actualMinutes: 15, reasonHumanRequired: 'account creation', isRecurring: false,
    automatable: false, unitsAffected: 0, experimentIds: ['e1', 'e2'],
  });
  ledger.log({
    interventionId: 'i3', occurredAt: '2026-08-18T00:20:00.000Z', kind: 'OPERATING',
    actualMinutes: 40, reasonHumanRequired: 'unrelated experiment', isRecurring: true,
    automatable: true, unitsAffected: 1, experimentIds: ['other'],
  });
  const observed = await ledger.observe(['e1', 'e2']);
  assert.equal(observed.observedOperatingMinutes, 5);
  assert.equal(observed.observedSetupMinutes, 15);
  assert.throws(() => ledger.log({
    interventionId: 'i1', occurredAt: '2026-08-18T00:00:00.000Z', kind: 'OPERATING',
    actualMinutes: 5, reasonHumanRequired: 'x', isRecurring: true,
    automatable: true, unitsAffected: 1, experimentIds: ['e1'],
  }), /logged twice/);
});

// ---------------------------------------------------------------------------
// ARRIVE readiness: several mechanisms, measured independently. No mechanism
// is selected here, and none is recommended.
// ---------------------------------------------------------------------------

function stubArriveAdapter(adapterId: string, mode: 'FIXTURE' | 'LIVE') {
  return {
    adapterId,
    mode,
    costProfile: { maximumCents: 0, currency: 'USD', bucketName: 'discovery' },
    async evaluateGate() {
      throw new Error('not used');
    },
    async activate() {
      throw new Error('not used');
    },
    async measure() {
      throw new Error('not used');
    },
    async deactivate() {
      throw new Error('not used');
    },
  } as unknown as Parameters<ArriveAdapterRegistry['register']>[0];
}

test('the registry holds several independently described ARRIVE mechanisms', () => {
  const registry = new ArriveAdapterRegistry();
  registry.register(stubArriveAdapter('mechanism-a', 'LIVE'), {
    measurementInstrument: 'provider analytics',
    measurementVerified: false,
  });
  registry.register(stubArriveAdapter('mechanism-b', 'FIXTURE'), {
    measurementInstrument: 'first-party edge product views',
    measurementVerified: false,
  });
  assert.throws(
    () => registry.register(stubArriveAdapter('mechanism-a', 'LIVE'), {
      measurementInstrument: 'x',
      measurementVerified: false,
    }),
    /already registered/,
  );
  assert.equal(registry.list().length, 2);
  assert.equal(registry.liveMechanisms().length, 1);
  assert.throws(() => registry.assertMechanismDiversity(2), /fail together and cannot be told apart/);
  registry.register(stubArriveAdapter('mechanism-c', 'LIVE'), {
    measurementInstrument: 'first-party edge product views',
    measurementVerified: false,
  });
  assert.doesNotThrow(() => registry.assertMechanismDiversity(2));
  assert.equal(registry.get('mechanism-c').adapterId, 'mechanism-c');
  assert.throws(() => registry.get('nope'), /No ARRIVE adapter registered/);
});

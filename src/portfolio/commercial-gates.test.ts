import test from 'node:test';
import assert from 'node:assert/strict';
import { PhaseAEngine } from './engine.ts';
import { FixtureArrivalAdapter, FixtureMakeAdapter, FakeLocalPutProvider } from './fake-adapters.ts';
import { InMemoryWatchStore } from './watch.ts';
import { shortDocumentFixture } from './fixtures.ts';
import { renderAsset, runFixtureValueQa, runFunctionalQa } from './renderers.ts';
import {
  runCommercialValueQa,
  type CommercialQaEvidenceResolver,
  type CommercialValueQaInput,
} from './commercial-value-qa.ts';
import { assertPublicationGates } from './state-machine.ts';
import {
  InMemoryOwnerLaborLedger,
  reconcileOwnerLabor,
  type OwnerLaborObservation,
} from './owner-labor.ts';
import type { AssetManifest, ExperimentRecord } from './types.ts';
import type { MakeAdapter, PutAdapter } from './ports.ts';
import { ArriveAdapterRegistry } from './arrive-registry.ts';
import { PostgresOwnerLaborSource } from './postgres-owner-labor.ts';
import type { Pool } from 'pg';

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

const evidenceResolver: CommercialQaEvidenceResolver = {
  source: 'test-explicit-durable-allow-list',
  async verifyModelReview(record) { return record.evidenceId.startsWith('durable-model-'); },
  async verifyOwnerException(record) { return record.evidenceId.startsWith('durable-owner-'); },
};

function completeEvidence(
  artifactSha256: string,
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
    paidAlternatives: [{
      name: 'A synthetic paid comparison',
      url: 'https://example.org/paid-template',
      retrievedAt: '2026-08-18T00:00:00.000Z',
      priceCents: 1200,
      currency: 'USD',
      concreteComparison: 'The paid comparison lacks the 12 derived-total columns in this fixture.',
    }],
    differentiation: [
      {
        claim: 'computes 12 derived totals the free template leaves for the buyer to calculate by hand',
        verifiableBy: 'open both files and compare the derived-total columns',
      },
    ],
    accuracyChecks: [{
      checkId: 'internal-consistency', description: 'recompute all derived totals',
      executed: true, passed: true, evidence: ['all 12 derived totals matched the independent recomputation'],
    }],
    priceJustification:
      'The synthetic asking price is below the compared paid alternative while including 12 additional checked calculations.',
    modelReviews: [
      ...([
        ['DIFFERENTIATION_VS_ALTERNATIVE', 'The derived-total columns are present here and absent in the named free template.'],
        ['ACCURACY_INTERNAL_CONSISTENCY', 'All displayed derived totals agree with the independently recomputed fixture values.'],
        ['USABILITY_COMPLETENESS', 'Every section the promise implies is present and the artifact needs no missing companion file.'],
        ['PRESENTATION_BUYER_COMPREHENSION', 'The named synthetic buyer can identify the inputs, outputs, and purchase contents without ambiguity.'],
        ['SLOP_REPETITION_HALLUCINATION', 'The artifact contains no repeated filler, unsupported claims, broken sections, or obvious model slop.'],
        ['PRICE_VALUE_DEFENSIBILITY', 'The price comparison is concrete and the extra checked calculations are visible in the artifact.'],
      ] as const).map(([criterionId, rationale], index) => ({
        evidenceId: `durable-model-${index + 1}`,
        artifactSha256,
        criterionId,
        reviewerProviderId: 'reviewer-provider',
        reviewerModelId: 'reviewer-model',
        reviewedAt: '2026-08-18T01:00:00.000Z',
        verdict: 'PASS' as const,
        rationale,
      })),
    ],
    ownerExceptions: [],
    ...overrides,
  };
}

async function qa(overrides: Partial<Omit<CommercialValueQaInput, 'manifest' | 'artifact'>> = {}) {
  const manifest = syntheticCommercialManifest();
  const artifact = renderAsset(manifest);
  return runCommercialValueQa(
    { ...completeEvidence(artifact.sha256, overrides), manifest, artifact },
    evidenceResolver,
  );
}

// ---------------------------------------------------------------------------
// The defect this file exists for: Value QA that cannot fail anything.
// ---------------------------------------------------------------------------

test('a complete evidence bundle passes and reports how each criterion was established', async () => {
  const result = await qa();
  assert.equal(result.passed, true, result.failures.join(' | '));
  assert.equal(result.mode, 'COMMERCIAL');
  const modes = Object.fromEntries((result.criteria ?? []).map((c) => [c.id, c.verification]));
  assert.equal(modes.PROMISE_FULFILLED, 'DETERMINISTIC');
  assert.equal(modes.DIFFERENTIATION_VS_ALTERNATIVE, 'MODEL_REVIEW');
  assert.equal((result.criteria ?? []).every((c) => c.status === 'PASSED'), true);
});

test('REGRESSION: a technically valid artifact that duplicates a free alternative fails', async () => {
  // The old fixture Value QA checked non-empty strings and a positive price.
  // This artifact would have sailed through it.
  const result = await qa({
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

test('REGRESSION: differentiation that asserts value without asserting a difference fails', async () => {
  const result = await qa({
    differentiation: [{ claim: 'higher quality and more comprehensive', verifiableBy: 'read both of them' }],
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /without asserting a checkable difference/);
});

test('a differentiation claim with no way for a buyer to confirm it fails', async () => {
  const result = await qa({
    differentiation: [{ claim: 'computes 12 derived totals the free template omits', verifiableBy: 'trust us' }],
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /no way for a buyer to confirm/);
});

test('omitting the free-alternative comparison is a failure, not an omission', async () => {
  const result = await qa({ freeAlternative: null });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /is a claim, not an omission/);
});

test('a model may not mark its own work', async () => {
  const result = await qa({
    generatorIdentity: { providerId: 'reviewer-provider', modelId: 'reviewer-model' },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /may not mark its own work/);
});

test('a rubber-stamped review with no rationale fails', async () => {
  const evidence = completeEvidence(renderAsset(syntheticCommercialManifest()).sha256);
  const result = await qa({
    modelReviews: evidence.modelReviews.map((review) => ({ ...review, rationale: 'looks fine' })),
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /without a substantive rationale/);
});

test('the complete Experimental Protocol section 9 surface fails closed when omitted', async () => {
  for (const [field, value, expected] of [
    ['paidAlternatives', [], /No relevant paid alternative/],
    ['accuracyChecks', [], /No accuracy\/internal-consistency check/],
    ['priceJustification', '', /Price justification is not substantive/],
  ] as const) {
    const result = await qa({ [field]: value });
    assert.equal(result.passed, false);
    assert.match(result.failures.join(' | '), expected);
  }
});

test('model evidence must resolve durably against the exact artifact hash', async () => {
  const evidence = completeEvidence('b'.repeat(64));
  const result = await qa({ modelReviews: evidence.modelReviews });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /not resolved against durable artifact-hashed evidence/);
});

test('a missing model review fails closed rather than defaulting to pass', async () => {
  const result = await qa({ modelReviews: [] });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /No independent model review was recorded/);
});

test('a promise check that does not reference the promise fails', async () => {
  const result = await qa({
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

test('unsourced factual claims fail the Verifiable Correctness constraint', async () => {
  const result = await qa({
    factualClaims: [{ claim: 'the 2026 filing deadline is in April', primarySourceUrl: '', retrievedAt: '' }],
    makesNoExternalFactualClaims: null,
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' | '), /no primary-source URL/);
});

test('provenance may be escalated to a logged owner exception; promise fulfilment may not', async () => {
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
  const blocked = await qa(uncleared);
  assert.equal(blocked.passed, false);

  const artifactSha256 = renderAsset(syntheticCommercialManifest()).sha256;
  const escalated = await qa({
    ...uncleared,
    ownerExceptions: [
      {
        evidenceId: 'durable-owner-42',
        artifactSha256,
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
  const waived = await qa({
    promiseCheck: { checkId: 'x', description: 'x', executed: false, passed: false, evidence: [] },
    ownerExceptions: [
      {
        evidenceId: 'durable-owner-43',
        artifactSha256,
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

test('commercial Value QA refuses a noncommercial fixture manifest', async () => {
  const manifest = shortDocumentFixture();
  const artifact = renderAsset(manifest);
  await assert.rejects(
    runCommercialValueQa({ ...completeEvidence(artifact.sha256), manifest, artifact }, evidenceResolver),
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
    commercialQaEvidenceResolver: evidenceResolver,
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

  await assert.rejects(
    engine.valueQa(manifest.experimentId, completeEvidence(functional.artifact?.sha256 as string, { modelReviews: [] })),
    /Commercial Value QA failed/,
  );
  const record = await engine.valueQa(
    manifest.experimentId,
    completeEvidence(functional.artifact?.sha256 as string),
  );
  assert.equal(record.state, 'VALUE_QA_PASS');
  assert.equal(record.valueQa?.mode, 'COMMERCIAL');
});

test('a commercial asset cannot publish behind a FIXTURE arrival gate', async () => {
  const engine = commercialEngine();
  const manifest = syntheticCommercialManifest();
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  const record = engine.get(manifest.experimentId);
  await engine.valueQa(
    manifest.experimentId,
    completeEvidence(record.artifact?.sha256 as string),
  );
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

test('the durable PostgreSQL source reconciles all owner-labor categories by experiment key', async () => {
  const rows = [
    { kind: 'SETUP', actual_minutes: 15, occurred_at: new Date('2026-08-18T00:00:00.000Z') },
    { kind: 'APPROVAL', actual_minutes: 4, occurred_at: new Date('2026-08-18T00:05:00.000Z') },
    { kind: 'EXCEPTION', actual_minutes: 3, occurred_at: new Date('2026-08-18T00:06:00.000Z') },
    { kind: 'OPERATING', actual_minutes: 2, occurred_at: new Date('2026-08-18T00:07:00.000Z') },
    { kind: 'MAINTENANCE_DEBUG', actual_minutes: 1, occurred_at: new Date('2026-08-18T00:08:00.000Z') },
  ];
  const pool = { async query() { return { rows }; } } as unknown as Pool;
  const observed = await new PostgresOwnerLaborSource(pool).observe(['e1', 'e2']);
  assert.equal(observed.observedSetupMinutes, 15);
  assert.equal(observed.observedBatchApprovalMinutes, 4);
  assert.equal(observed.observedExceptionMinutes, 3);
  assert.equal(observed.observedOperatingMinutes, 2);
  assert.equal(observed.observedMaintenanceMinutes, 1);
  assert.equal(observed.source, 'postgresql-owner_intervention');
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

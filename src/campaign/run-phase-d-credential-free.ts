import { performance } from 'node:perf_hooks';
import { phaseDIntegrationFixtures } from './fixtures.ts';
import { FixtureInferenceAdapter, InferenceRouter, MeteredInferenceExecutor } from './inference.ts';
import { CredentialFreeCampaignOrchestrator } from './orchestrator.ts';

async function run(count: number, concurrency: number) {
  const adapter = new FixtureInferenceAdapter();
  const orchestrator = new CredentialFreeCampaignOrchestrator(
    new MeteredInferenceExecutor(new InferenceRouter([adapter])),
    { concurrency },
  );
  const started = performance.now();
  const result = await orchestrator.prepare(phaseDIntegrationFixtures(count));
  return {
    experiments: count,
    concurrency,
    peakConcurrency: result.peakConcurrency,
    prepared: result.prepared.filter((item) => item.state === 'VALUE_QA_PASS').length,
    launchEligible: result.prepared.filter((item) => item.launchGate.eligible).length,
    settledFactoryCostCents: result.prepared.flatMap((item) => item.costs).reduce((sum, cost) => sum + cost.settledCents, 0),
    inferenceCostMicros: result.inferenceCostMicros,
    declaredOwnerOperatingMinutes: result.declaredOwnerOperatingMinutes,
    observedOwnerOperatingMinutes: result.observedOwnerOperatingMinutes,
    independentlyAttributed: new Set(result.prepared.map((item) => item.experimentId)).size,
    inferenceExecutions: adapter.executions,
    durationMs: Number((performance.now() - started).toFixed(3)),
  };
}

const report = {
  phase: 'D_CREDENTIAL_FREE',
  generatedAt: new Date().toISOString(),
  commercialLaunchAttempted: false,
  credentialsUsed: false,
  capitalSpentCents: 0,
  integrationBatch: await run(4, 3),
  scaleSimulation: await run(100, 12),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

import { createHash } from 'node:crypto';
import { CostController } from '../portfolio/cost-control.ts';
import type { CostRecord } from '../portfolio/types.ts';
import type { InferenceTaskKind } from './types.ts';

export interface InferenceModelProfile {
  providerId: string;
  modelId: string;
  tasks: readonly InferenceTaskKind[];
  qualityScore: number;
  inputMicrosPerMillionTokens: number;
  outputMicrosPerMillionTokens: number;
  credentialState: 'NOT_REQUIRED' | 'AVAILABLE' | 'UNAVAILABLE';
  fixtureOnly: boolean;
}

export interface InferenceRequest {
  operationId: string;
  experimentId: string;
  task: InferenceTaskKind;
  input: string;
  estimatedInputTokens: number;
  maximumOutputTokens: number;
  minimumQualityScore: number;
}

export interface InferenceQuote {
  estimatedCostMicros: number;
  maximumCostCents: number;
}

export interface InferenceResponse {
  providerId: string;
  modelId: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  actualCostCents: number;
  fixture: boolean;
}

export interface InferenceAdapter {
  readonly profile: InferenceModelProfile;
  quote(request: InferenceRequest): InferenceQuote;
  execute(request: InferenceRequest, idempotencyKey: string): Promise<InferenceResponse>;
}

function assertProfile(profile: InferenceModelProfile): void {
  if (!profile.providerId || !profile.modelId || profile.tasks.length === 0) {
    throw new Error('Inference model profile is incomplete.');
  }
  if (profile.qualityScore < 0 || profile.qualityScore > 1) {
    throw new Error('Inference qualityScore must be between zero and one.');
  }
  for (const value of [profile.inputMicrosPerMillionTokens, profile.outputMicrosPerMillionTokens]) {
    if (!Number.isInteger(value) || value < 0) throw new Error('Inference token prices must be non-negative integer micros.');
  }
}

export class InferenceRouter {
  private readonly adapters: InferenceAdapter[];

  constructor(adapters: readonly InferenceAdapter[]) {
    for (const adapter of adapters) assertProfile(adapter.profile);
    this.adapters = [...adapters];
  }

  select(request: InferenceRequest, options: { allowFixture: boolean }): InferenceAdapter {
    const candidates = this.adapters
      .filter((adapter) => adapter.profile.tasks.includes(request.task))
      .filter((adapter) => adapter.profile.qualityScore >= request.minimumQualityScore)
      .filter((adapter) => adapter.profile.credentialState !== 'UNAVAILABLE')
      .filter((adapter) => options.allowFixture || !adapter.profile.fixtureOnly)
      .map((adapter) => ({ adapter, quote: adapter.quote(request) }))
      .sort((left, right) =>
        left.quote.estimatedCostMicros - right.quote.estimatedCostMicros ||
        right.adapter.profile.qualityScore - left.adapter.profile.qualityScore ||
        `${left.adapter.profile.providerId}/${left.adapter.profile.modelId}`.localeCompare(
          `${right.adapter.profile.providerId}/${right.adapter.profile.modelId}`,
        ),
      );
    if (candidates.length === 0) {
      throw new Error(`No available inference adapter satisfies task ${request.task}; failing closed.`);
    }
    return candidates[0].adapter;
  }
}

export class MeteredInferenceExecutor {
  private readonly router: InferenceRouter;
  private readonly costs: CostController;

  constructor(
    router: InferenceRouter,
    costs = new CostController(),
  ) {
    this.router = router;
    this.costs = costs;
  }

  async execute(
    request: InferenceRequest,
    options: { allowFixture: boolean },
  ): Promise<{ response: InferenceResponse; cost: CostRecord }> {
    const adapter = this.router.select(request, options);
    const quote = adapter.quote(request);
    const idempotencyKey = `inference:${request.operationId}`;
    const result = await this.costs.execute({
      operationId: request.operationId,
      reservationIdempotencyKey: idempotencyKey,
      bucketName: 'production',
      maximumCents: quote.maximumCostCents,
      currency: 'USD',
      purpose: `Provider-neutral inference ${request.task} for ${request.experimentId}`,
      actor: 'phase-d-inference-executor',
      run: async () => {
        const response = await adapter.execute(request, idempotencyKey);
        if (response.providerId !== adapter.profile.providerId || response.modelId !== adapter.profile.modelId) {
          throw new Error('Inference adapter response identity does not match its registered profile.');
        }
        if (response.actualCostCents > quote.maximumCostCents) {
          throw new Error('Inference cost exceeded the selected model quote.');
        }
        return { value: response, actualCostCents: response.actualCostCents };
      },
    });
    return { response: result.value, cost: result.cost };
  }
}

export class FixtureInferenceAdapter implements InferenceAdapter {
  readonly profile: InferenceModelProfile = {
    providerId: 'factory-fixture-inference',
    modelId: 'deterministic-fixture-v1',
    tasks: ['CANDIDATE_SYNTHESIS', 'SEMANTIC_DESIGN', 'DRAFT', 'VALUE_QA'],
    qualityScore: 1,
    inputMicrosPerMillionTokens: 0,
    outputMicrosPerMillionTokens: 0,
    credentialState: 'NOT_REQUIRED',
    fixtureOnly: true,
  };
  private readonly responses = new Map<string, InferenceResponse>();
  active = 0;
  peakActive = 0;
  executions = 0;

  quote(_request: InferenceRequest): InferenceQuote {
    return { estimatedCostMicros: 0, maximumCostCents: 0 };
  }

  async execute(request: InferenceRequest, idempotencyKey: string): Promise<InferenceResponse> {
    const prior = this.responses.get(idempotencyKey);
    if (prior) return structuredClone(prior);
    this.active++;
    this.peakActive = Math.max(this.peakActive, this.active);
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      const digest = createHash('sha256').update(request.input).digest('hex').slice(0, 16);
      const response: InferenceResponse = {
        providerId: this.profile.providerId,
        modelId: this.profile.modelId,
        output: JSON.stringify({ fixture: true, task: request.task, inputDigest: digest }),
        inputTokens: request.estimatedInputTokens,
        outputTokens: 16,
        actualCostCents: 0,
        fixture: true,
      };
      this.responses.set(idempotencyKey, response);
      this.executions++;
      return structuredClone(response);
    } finally {
      this.active--;
    }
  }
}

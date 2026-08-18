import { createHash } from 'node:crypto';
import {
  INFERENCE_BUCKET,
  MICROS_PER_CENT,
  centsCeilingFromMicros,
  type InferenceTranche,
} from '../capital/inference-accounting.ts';
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
  /** Expected cost. Used for routing comparisons only. */
  estimatedCostMicros: number;
  /**
   * Authoritative ceiling in micro-dollars. This is the number the Capital
   * Authority boundary is keyed on; the cent field below is derived from it and
   * exists only because the ledger is cent-denominated.
   */
  maximumCostMicros: number;
  maximumCostCents: number;
}

export interface InferenceResponse {
  providerId: string;
  modelId: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  /** Exact billed cost. Sub-cent values are preserved, never rounded here. */
  actualCostMicros: number;
  fixture: boolean;
}

export interface InferenceAdapter {
  readonly profile: InferenceModelProfile;
  quote(request: InferenceRequest): InferenceQuote;
  execute(request: InferenceRequest, idempotencyKey: string): Promise<InferenceResponse>;
}

/**
 * Standard quote arithmetic. Adapters should use this rather than computing
 * cents themselves — hand-rolled cent conversion is exactly how Phase D's
 * sub-cent bypass would have reached production.
 */
export function quoteFromProfile(
  profile: InferenceModelProfile,
  request: InferenceRequest,
): InferenceQuote {
  const inputMicros = Math.ceil(
    (request.estimatedInputTokens * profile.inputMicrosPerMillionTokens) / 1_000_000,
  );
  const outputMicros = Math.ceil(
    (request.maximumOutputTokens * profile.outputMicrosPerMillionTokens) / 1_000_000,
  );
  const maximumCostMicros = inputMicros + outputMicros;
  return {
    estimatedCostMicros: maximumCostMicros,
    maximumCostMicros,
    maximumCostCents: centsCeilingFromMicros(maximumCostMicros),
  };
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

function assertQuote(quote: InferenceQuote, providerId: string): void {
  for (const [label, value] of [
    ['estimatedCostMicros', quote.estimatedCostMicros],
    ['maximumCostMicros', quote.maximumCostMicros],
    ['maximumCostCents', quote.maximumCostCents],
  ] as const) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Adapter ${providerId} returned a non-integer or negative ${label}.`);
    }
  }
  if (quote.maximumCostCents !== centsCeilingFromMicros(quote.maximumCostMicros)) {
    throw new Error(
      `Adapter ${providerId} quoted ${quote.maximumCostMicros} micros but ${quote.maximumCostCents} cents; ` +
        'the cent ceiling must be derived from micros, not asserted independently.',
    );
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

export type InferenceSettlement = 'ZERO_COST' | 'SETTLED_PER_CALL' | 'TRANCHE_PENDING';

export interface InferenceCostAttribution {
  operationId: string;
  experimentId: string;
  trancheId: string | null;
  providerId: string;
  modelId: string;
  quotedMaximumMicros: number;
  actualCostMicros: number;
  settlement: InferenceSettlement;
  /** Present only when this call itself produced a cent-denominated ledger record. */
  centRecord: CostRecord | null;
}

export interface InferenceExecutionResult {
  response: InferenceResponse;
  attribution: InferenceCostAttribution;
}

export class MeteredInferenceExecutor {
  private readonly router: InferenceRouter;
  private readonly costs: CostController;
  private readonly bucketName: string;

  constructor(
    router: InferenceRouter,
    costs = new CostController(),
    bucketName: string = INFERENCE_BUCKET,
  ) {
    this.router = router;
    this.costs = costs;
    this.bucketName = bucketName;
  }

  /**
   * Price a request without executing it, so §18 cost discipline can be applied
   * before any provider call rather than after the money is gone.
   */
  quoteFor(request: InferenceRequest, options: { allowFixture: boolean }): InferenceQuote {
    const adapter = this.router.select(request, options);
    const quote = adapter.quote(request);
    assertQuote(quote, adapter.profile.providerId);
    return quote;
  }

  async execute(
    request: InferenceRequest,
    options: { allowFixture: boolean; tranche?: InferenceTranche },
  ): Promise<InferenceExecutionResult> {
    const adapter = this.router.select(request, options);
    const quote = adapter.quote(request);
    assertQuote(quote, adapter.profile.providerId);
    const idempotencyKey = `inference:${request.operationId}`;

    const verify = (response: InferenceResponse): void => {
      if (
        response.providerId !== adapter.profile.providerId ||
        response.modelId !== adapter.profile.modelId
      ) {
        throw new Error('Inference adapter response identity does not match its registered profile.');
      }
      if (!Number.isInteger(response.actualCostMicros) || response.actualCostMicros < 0) {
        throw new Error('Inference adapter returned a non-integer or negative actualCostMicros.');
      }
      if (response.actualCostMicros > quote.maximumCostMicros) {
        throw new Error('Inference cost exceeded the selected model quote.');
      }
    };

    // Genuinely free (fixture/deterministic) work. Keyed on micros, not cents,
    // so a sub-cent paid call can never land here.
    if (quote.maximumCostMicros === 0) {
      const response = await adapter.execute(request, idempotencyKey);
      verify(response);
      if (response.actualCostMicros !== 0) {
        throw new Error('A zero-quote adapter reported nonzero cost; refusing to proceed.');
      }
      return {
        response,
        attribution: {
          operationId: request.operationId,
          experimentId: request.experimentId,
          trancheId: null,
          providerId: response.providerId,
          modelId: response.modelId,
          quotedMaximumMicros: 0,
          actualCostMicros: 0,
          settlement: 'ZERO_COST',
          centRecord: {
            operationId: request.operationId,
            reservationIdempotencyKey: idempotencyKey,
            bucketName: this.bucketName,
            maximumCents: 0,
            settledCents: 0,
            currency: 'USD',
            status: 'ZERO_COST_SETTLED',
          },
        },
      };
    }

    // Many sub-cent calls under one whole-cent reservation. Aggregate rounding.
    if (options.tranche) {
      const tranche = options.tranche;
      tranche.assertAdmits(quote.maximumCostMicros);
      const response = await adapter.execute(request, idempotencyKey);
      verify(response);
      await tranche.record({
        usageId: idempotencyKey,
        experimentId: request.experimentId,
        operationId: request.operationId,
        providerId: response.providerId,
        modelId: response.modelId,
        task: request.task,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costMicros: response.actualCostMicros,
        recordedAt: new Date().toISOString(),
      });
      return {
        response,
        attribution: {
          operationId: request.operationId,
          experimentId: request.experimentId,
          trancheId: tranche.trancheId,
          providerId: response.providerId,
          modelId: response.modelId,
          quotedMaximumMicros: quote.maximumCostMicros,
          actualCostMicros: response.actualCostMicros,
          settlement: 'TRANCHE_PENDING',
          centRecord: null,
        },
      };
    }

    // Single nonzero call with no tranche: mediate it directly. Settlement
    // rounds up, which is conservative and correct for one call.
    const result = await this.costs.execute({
      operationId: request.operationId,
      reservationIdempotencyKey: idempotencyKey,
      bucketName: this.bucketName,
      maximumCents: quote.maximumCostCents,
      maximumMicros: quote.maximumCostMicros,
      currency: 'USD',
      purpose: `Provider-neutral inference ${request.task} for ${request.experimentId}`,
      actor: 'phase-d-inference-executor',
      run: async () => {
        const response = await adapter.execute(request, idempotencyKey);
        verify(response);
        return {
          value: response,
          actualCostCents: centsCeilingFromMicros(response.actualCostMicros),
          actualCostMicros: response.actualCostMicros,
        };
      },
    });
    return {
      response: result.value,
      attribution: {
        operationId: request.operationId,
        experimentId: request.experimentId,
        trancheId: null,
        providerId: result.value.providerId,
        modelId: result.value.modelId,
        quotedMaximumMicros: quote.maximumCostMicros,
        actualCostMicros: result.value.actualCostMicros,
        settlement: 'SETTLED_PER_CALL',
        centRecord: result.cost,
      },
    };
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

  quote(request: InferenceRequest): InferenceQuote {
    return quoteFromProfile(this.profile, request);
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
        actualCostMicros: 0,
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

export { INFERENCE_BUCKET, MICROS_PER_CENT };

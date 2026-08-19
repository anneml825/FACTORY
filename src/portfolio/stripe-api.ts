export const STRIPE_API_VERSION = '2026-06-24.dahlia';

export interface StripeRequest {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  form?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface StripeTransport {
  request<T>(request: StripeRequest): Promise<T>;
}

export class StripeApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(`Stripe API ${status}: ${message}`);
    this.name = 'StripeApiError';
    this.status = status;
    this.code = code;
  }
}

function appendForm(form: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendForm(form, `${key}[${index}]`, item));
    return;
  }
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      appendForm(form, key ? `${key}[${childKey}]` : childKey, childValue);
    }
    return;
  }
  form.append(key, String(value));
}

export function encodeStripeForm(input: Record<string, unknown>): URLSearchParams {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) appendForm(form, key, value);
  return form;
}

export class StripeTestHttpTransport implements StripeTransport {
  private readonly apiKey: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(apiKey: string, fetchImplementation: typeof fetch = fetch) {
    if (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('rk_test_')) {
      throw new Error('Stripe provider-test transport requires an sk_test_ or rk_test_ key.');
    }
    this.apiKey = apiKey;
    this.fetchImplementation = fetchImplementation;
  }

  async request<T>(request: StripeRequest): Promise<T> {
    if (!request.path.startsWith('/v1/')) throw new Error('Stripe API path must begin with /v1/.');
    if (request.idempotencyKey && request.idempotencyKey.length > 255) {
      throw new Error('Stripe idempotency keys must not exceed 255 characters.');
    }
    const response = await this.fetchImplementation(`https://api.stripe.com${request.path}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Stripe-Version': STRIPE_API_VERSION,
        ...(request.method === 'POST'
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : {}),
        ...(request.idempotencyKey ? { 'Idempotency-Key': request.idempotencyKey } : {}),
      },
      body: request.method === 'POST' ? encodeStripeForm(request.form ?? {}) : undefined,
    });
    const body = (await response.json()) as {
      error?: { message?: string; code?: string };
    } & T;
    if (!response.ok) {
      throw new StripeApiError(
        response.status,
        body.error?.message ?? 'Unknown Stripe error',
        body.error?.code ?? null,
      );
    }
    return body;
  }
}

export function assertStripeTestObject(value: { livemode?: boolean }, label: string): void {
  if (value.livemode !== false) {
    throw new Error(`${label} was not explicitly returned as livemode=false; refusing it.`);
  }
}

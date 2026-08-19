/**
 * Deactivate every temporary Stripe sandbox object the proof created, delete the
 * temporary webhook endpoint, and then PROVE from the Stripe API that nothing
 * Factory created is still live.
 *
 * This does not trust the local state file. It sweeps the sandbox account for
 * anything carrying Factory's fixture metadata, so an interrupted run, a lost
 * workspace, or a state file written under a different path cannot strand a
 * live checkout surface. It is refused outright for anything but a test key.
 *
 * Exit status is the contract: 0 means the sandbox has no live Factory fixture
 * surface left, and any other status means one survived.
 */

import { readFile } from 'node:fs/promises';
import { StripeTestHttpTransport, type StripeTransport } from '../../portfolio/stripe-api.ts';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const outputPath = process.env.PHASE_E_STRIPE_OUTPUT ?? 'state/phase-e-stripe-fixture.json';
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is required.');
if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('rk_test_')) {
  throw new Error('Refusing to run teardown with anything but a Stripe TEST key.');
}

const WEBHOOK_DESCRIPTION_PREFIX = 'Factory Phase E fixture edge';

interface StripeListed {
  id: string;
  active?: boolean;
  livemode?: boolean;
  metadata?: Record<string, string>;
  description?: string | null;
  status?: string;
  url?: string;
}

const transport: StripeTransport = new StripeTestHttpTransport(stripeKey);

async function listAll(path: string, query: Record<string, string> = {}): Promise<StripeListed[]> {
  const collected: StripeListed[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const parameters = new URLSearchParams({ ...query, limit: '100' });
    if (startingAfter) parameters.set('starting_after', startingAfter);
    const response = await transport.request<{ data: StripeListed[]; has_more: boolean }>({
      method: 'GET',
      path: `${path}?${parameters.toString()}`,
    });
    collected.push(...response.data);
    if (!response.has_more || response.data.length === 0) return collected;
    startingAfter = response.data[response.data.length - 1].id;
  }
  return collected;
}

/** Factory stamps every fixture object it creates; that stamp is the sweep key. */
function isFactoryFixture(object: StripeListed): boolean {
  return (
    object.metadata?.factory_environment === 'PROVIDER_TEST' ||
    object.metadata?.factory_test_transaction === 'true'
  );
}

async function setInactive(path: string): Promise<void> {
  await transport.request<StripeListed>({ method: 'POST', path, form: { active: false } });
}

const actions: string[] = [];
const failures: string[] = [];

async function attempt(label: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
    actions.push(label);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 1. Payment links first: the link is the surface a stranger could actually pay
// through, so it dies before anything it depends on.
const paymentLinks = (await listAll('/v1/payment_links')).filter(isFactoryFixture);
for (const link of paymentLinks.filter((candidate) => candidate.active !== false)) {
  await attempt(`payment_link ${link.id} deactivated`, () =>
    setInactive(`/v1/payment_links/${link.id}`),
  );
}

// 2. Then prices, then their products.
const products = (await listAll('/v1/products', { active: 'true' })).filter(isFactoryFixture);
for (const product of products) {
  const prices = await listAll('/v1/prices', { product: product.id, active: 'true' });
  for (const price of prices) {
    await attempt(`price ${price.id} deactivated`, () => setInactive(`/v1/prices/${price.id}`));
  }
  await attempt(`product ${product.id} deactivated`, () =>
    setInactive(`/v1/products/${product.id}`),
  );
}

// 3. The webhook endpoint is deleted outright rather than disabled: a disabled
// endpoint is still a standing route into a Worker whose secret is discarded.
const endpoints = (await listAll('/v1/webhook_endpoints')).filter((endpoint) =>
  (endpoint.description ?? '').startsWith(WEBHOOK_DESCRIPTION_PREFIX),
);
for (const endpoint of endpoints) {
  await attempt(`webhook_endpoint ${endpoint.id} deleted`, async () => {
    await transport.request({ method: 'DELETE', path: `/v1/webhook_endpoints/${endpoint.id}` });
  });
}

// 4. Verification: re-read from Stripe. The claim "the fixture is torn down" is
// only worth making if the provider itself says so afterwards.
const remainingLinks = (await listAll('/v1/payment_links'))
  .filter(isFactoryFixture)
  .filter((link) => link.active !== false);
const remainingProducts = (await listAll('/v1/products', { active: 'true' })).filter(
  isFactoryFixture,
);
const remainingEndpoints = (await listAll('/v1/webhook_endpoints')).filter((endpoint) =>
  (endpoint.description ?? '').startsWith(WEBHOOK_DESCRIPTION_PREFIX),
);

let recorded: { checkoutUrl?: string; providerObjects?: Record<string, string> } = {};
try {
  recorded = JSON.parse(await readFile(outputPath, 'utf8'));
} catch {
  recorded = {};
}

const clean =
  remainingLinks.length === 0 &&
  remainingProducts.length === 0 &&
  remainingEndpoints.length === 0 &&
  failures.length === 0;

process.stdout.write(
  `${JSON.stringify(
    {
      sweptAt: new Date().toISOString(),
      recordedCheckoutUrl: recorded.checkoutUrl ?? null,
      actions,
      failures,
      remaining: {
        activePaymentLinks: remainingLinks.map((link) => link.id),
        activeProducts: remainingProducts.map((product) => product.id),
        webhookEndpoints: remainingEndpoints.map((endpoint) => endpoint.id),
      },
      clean,
    },
    null,
    2,
  )}\n`,
);

if (!clean) process.exitCode = 1;

/**
 * Install the edge's secrets exactly once, and never replace them.
 *
 * The fixture proof used to generate all four secrets on every run. That is
 * correct for something disposable and catastrophic for something durable: the
 * WATCH journal is HMAC-signed under the secret current when each row was
 * written, and delivery tokens under theirs, so replacing either silently
 * invalidates history that is supposed to be permanent — the edge then fails
 * closed on every route, which is how this was found in the first place.
 *
 * So this script generates a secret only when the Worker does not already have
 * one, and refuses outright to replace a non-rotatable secret. Rotation is a
 * migration, not a deploy step, and Factory does not have that migration yet.
 */

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  NON_ROTATABLE_EDGE_SECRETS,
  REQUIRED_EDGE_SECRETS,
  edgeTargetFromEnvironment,
  type EdgeTarget,
} from './edge-targets.ts';

const target = edgeTargetFromEnvironment();
// Secrets supplied from outside (the Stripe endpoint secret is minted by Stripe,
// not by us) arrive through the environment and are installed as-is.
const supplied = new Map<string, string>();
for (const name of REQUIRED_EDGE_SECRETS) {
  const value = process.env[`SUPPLY_${name}`];
  if (value) supplied.set(name, value);
}

function wrangler(args: string[], input?: string): string {
  return execFileSync('npx', ['--yes', 'wrangler@latest', ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function environmentArgs(edge: EdgeTarget): string[] {
  return edge.wranglerEnvironment ? ['--env', edge.wranglerEnvironment] : [];
}

function existingSecretNames(edge: EdgeTarget): Set<string> {
  const output = wrangler(['secret', 'list', '--name', edge.workerName, ...environmentArgs(edge)]);
  try {
    const parsed = JSON.parse(output.slice(output.indexOf('['), output.lastIndexOf(']') + 1)) as Array<{
      name?: string;
    }>;
    return new Set(parsed.map((entry) => entry.name).filter((name): name is string => Boolean(name)));
  } catch {
    // Fall back to text matching rather than guessing that nothing is set —
    // concluding "no secrets exist" from an unparsed response would be the one
    // wrong answer, because it leads straight to regenerating them.
    return new Set(REQUIRED_EDGE_SECRETS.filter((name) => output.includes(name)));
  }
}

const present = existingSecretNames(target);
const actions: string[] = [];

for (const name of REQUIRED_EDGE_SECRETS) {
  const alreadySet = present.has(name);
  const supply = supplied.get(name);

  if (alreadySet && supply) {
    if ((NON_ROTATABLE_EDGE_SECRETS as readonly string[]).includes(name)) {
      throw new Error(
        `Refusing to replace ${name} on ${target.workerName}: it signs durable history. ` +
          `Replacing it would invalidate every record already written under it.`,
      );
    }
    wrangler(['secret', 'put', name, '--name', target.workerName, ...environmentArgs(target)], supply);
    actions.push(`${name}: replaced (rotatable)`);
    continue;
  }
  if (alreadySet) {
    actions.push(`${name}: already set, left alone`);
    continue;
  }
  if (supply) {
    wrangler(['secret', 'put', name, '--name', target.workerName, ...environmentArgs(target)], supply);
    actions.push(`${name}: installed from supplied value`);
    continue;
  }
  if (name === 'STRIPE_WEBHOOK_SECRET') {
    // Only Stripe can mint this one, so it is never invented here.
    actions.push(`${name}: MISSING — must be supplied by whoever creates the webhook endpoint`);
    continue;
  }
  const generated = randomBytes(32).toString('hex');
  if (process.env.GITHUB_ACTIONS) process.stdout.write(`::add-mask::${generated}\n`);
  wrangler(['secret', 'put', name, '--name', target.workerName, ...environmentArgs(target)], generated);
  actions.push(`${name}: generated once and installed`);
}

const stillMissing = REQUIRED_EDGE_SECRETS.filter(
  (name) => !present.has(name) && !supplied.has(name) && name === 'STRIPE_WEBHOOK_SECRET',
);

process.stdout.write(`${JSON.stringify({ worker: target.workerName, actions, stillMissing }, null, 2)}\n`);

if (stillMissing.length > 0 && process.env.ALLOW_MISSING_SECRETS !== 'yes') {
  process.exitCode = 1;
}

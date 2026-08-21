/**
 * The blast radius of the spending path, asserted rather than assumed.
 *
 * The budget module is only one half of the control. The other half is which
 * automation can reach the credential at all, and what can start it. That half
 * lives in YAML, where a one-line edit is easy and its consequence is not
 * obvious, so it is pinned here.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const WORKFLOWS = '.github/workflows';
const SPENDING_WORKFLOW = 'canopy-probe.yml';

async function workflowSources(): Promise<Map<string, string>> {
  const entries = await readdir(WORKFLOWS);
  const sources = new Map<string, string>();
  for (const name of entries.filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))) {
    sources.set(name, await readFile(join(WORKFLOWS, name), 'utf8'));
  }
  return sources;
}

test('exactly one workflow can reach the Canopy credential', async () => {
  const sources = await workflowSources();
  const withKey = [...sources.entries()]
    .filter(([, source]) => /secrets\.CANOPY/.test(source))
    .map(([name]) => name);
  assert.deepEqual(
    withKey,
    [SPENDING_WORKFLOW],
    'a second workflow gained access to the metered credential',
  );
});

test('the spending workflow is armed by one file and nothing else', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW);
  assert.ok(source, 'the spending workflow is missing');

  // A push trigger with no paths filter would fire on every commit to the repo.
  const paths = source.match(/paths:\n((?:\s+-\s+'[^']+'\n)+)/);
  assert.ok(paths, 'the spending workflow has a push trigger with no paths filter');
  const armed = paths[1]
    .split('\n')
    .map((line) => line.trim().replace(/^-\s*'|'$/g, ''))
    .filter(Boolean);
  assert.deepEqual(
    armed,
    ['state/canopy-probe-arm.txt'],
    'the spending workflow can now be triggered by editing something other than the arming file',
  );
});

test('a spending run is never cancelled mid-flight', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW) ?? '';
  // A cancelled run cannot settle, so it would strand its whole reservation.
  assert.match(source, /cancel-in-progress:\s*false/);
});

test('the reservation is pushed before the probe runs, not after', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW) ?? '';
  const durable = source.indexOf('Make the reservation durable before spending');
  const execute = source.indexOf('EXECUTE — the probe');
  const settle = source.indexOf('SETTLE — record what was actually spent');
  assert.ok(durable > 0 && execute > 0 && settle > 0, 'the three phases are not all present');
  assert.ok(durable < execute, 'the reservation must be durable before any request is made');
  assert.ok(execute < settle, 'settlement must follow execution');
});

test('settlement runs even when the probe fails', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW) ?? '';
  const settleBlock = source.slice(source.indexOf('SETTLE — record what was actually spent'));
  assert.match(
    settleBlock.slice(0, 200),
    /if:\s*always\(\)/,
    'an unsettled run leaves its full reservation charged against the budget forever',
  );
});

test('the reconnaissance workflow cannot spend', async () => {
  const source = (await workflowSources()).get('canopy-recon.yml') ?? '';
  assert.doesNotMatch(source, /secrets\.CANOPY/, 'recon must never carry the credential');
  assert.doesNotMatch(source, /API-KEY/, 'recon must never authenticate');
});

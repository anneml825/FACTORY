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
const SPENDING_WORKFLOW = 'canopy-spend.yml';

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

test('the spending workflow is disarmed — nothing in the repository can trigger it', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW);
  assert.ok(source, 'the spending workflow is missing');

  // Canopy failed as a research source, so the workflow is dispatch-only. The
  // file that used to arm it lives in state/, which Factory writes routinely; a
  // push trigger there would let an unrelated state write spend real requests.
  const triggers = source.slice(source.indexOf('\non:'), source.indexOf('permissions:'));
  assert.doesNotMatch(
    triggers,
    /^\s+push:/m,
    'the spending workflow has regained a push trigger — re-arming must be a deliberate, reviewed change',
  );
  assert.match(triggers, /workflow_dispatch:/);
});

test('a spending run is never cancelled mid-flight', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW) ?? '';
  // A cancelled run cannot settle, so it would strand its whole reservation.
  assert.match(source, /cancel-in-progress:\s*false/);
});

test('the reservation is pushed before the script runs, not after', async () => {
  const source = (await workflowSources()).get(SPENDING_WORKFLOW) ?? '';
  const durable = source.indexOf('Make the reservation durable before spending');
  const execute = source.indexOf('EXECUTE — the research script');
  const settle = source.indexOf('SETTLE — record what was actually spent');
  assert.ok(durable > 0 && execute > 0 && settle > 0, 'the three phases are not all present');
  assert.ok(durable < execute, 'the reservation must be durable before any request is made');
  assert.ok(execute < settle, 'settlement must follow execution');
});

test('settlement runs even when the script fails', async () => {
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

// --- The run request is executed, so it is validated rather than trusted ------

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { InvalidRunRequest, readRunRequest } from './canopy-run-request.ts';
import { ROLLING_WINDOW_REQUEST_BUDGET } from './metered-api-budget.ts';

async function requestFile(body: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'runreq-'));
  const path = join(dir, 'canopy-run-request.json');
  await writeFile(path, typeof body === 'string' ? body : JSON.stringify(body));
  return path;
}

test('a run request naming a script outside src/research is refused', async () => {
  for (const script of [
    '../../etc/passwd',
    'src/research/../../evil.ts',
    'scripts/anything.ts',
    'src/research/nested/deep.ts',
    'src/research/Screen.ts',
  ]) {
    const path = await requestFile({ script, intendedRequests: 1, note: 'x' });
    await assert.rejects(
      () => readRunRequest(path),
      InvalidRunRequest,
      `${script} should not be executable`,
    );
  }
});

test('a run request cannot ask for more than the window budget', async () => {
  const path = await requestFile({
    script: 'src/research/kdp-demand-screen.ts',
    intendedRequests: ROLLING_WINDOW_REQUEST_BUDGET + 1,
    note: 'too much',
  });
  await assert.rejects(() => readRunRequest(path), InvalidRunRequest);
});

test('a run request must say what it is for', async () => {
  const path = await requestFile({
    script: 'src/research/kdp-demand-screen.ts',
    intendedRequests: 5,
    note: '   ',
  });
  await assert.rejects(() => readRunRequest(path), InvalidRunRequest);
});

test('a missing or malformed run request authorizes nothing', async () => {
  await assert.rejects(() => readRunRequest('does/not/exist.json'), InvalidRunRequest);
  const malformed = await requestFile('{ not json');
  await assert.rejects(() => readRunRequest(malformed), InvalidRunRequest);
});

test('a well-formed run request is accepted', async () => {
  const path = await requestFile({
    script: 'src/research/kdp-demand-screen.ts',
    intendedRequests: 45,
    note: 'breadth-first books screen',
  });
  const request = await readRunRequest(path);
  assert.equal(request.script, 'src/research/kdp-demand-screen.ts');
  assert.equal(request.intendedRequests, 45);
});

/**
 * The standing capital-control rule, enforced mechanically.
 *
 * Factory may LOWER any limit capable of increasing external charges without
 * asking. Raising one requires explicit owner approval. FINANCIAL_CONTROLS.md
 * has always said a model may never raise a limit; until now nothing checked.
 *
 * The asymmetry is the whole point, so the assertion is one-directional: code
 * constants must be at or below the approved ceiling. A reduction passes. An
 * increase fails, and fails in a way that names the rule.
 *
 * HONEST LIMIT OF THIS CONTROL: the manifest is a file, and a determined agent
 * could edit it too. What this makes impossible is doing it ACCIDENTALLY or
 * INVISIBLY — a raise can no longer hide inside an unrelated change, because it
 * must appear as a diff in a file whose only content is spending ceilings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EXPLORATORY_LIFETIME_CEILING,
  FREE_TIER_REQUESTS,
  ROLLING_WINDOW_REQUEST_BUDGET,
} from './metered-api-budget.ts';

interface Ceiling {
  id: string;
  description: string;
  value: number;
  approvedBy: string;
  approvedAt: string;
}

const manifest = JSON.parse(readFileSync('state/approved-ceilings.json', 'utf8')) as {
  schemaVersion: number;
  ceilings: Ceiling[];
};

function approved(id: string): number {
  const entry = manifest.ceilings.find((candidate) => candidate.id === id);
  assert.ok(entry, `${id} has no owner-approved ceiling. Declare it before any code may use it.`);
  assert.ok(entry.approvedBy && entry.approvedAt, `${id} is missing its approval record.`);
  return entry.value;
}

test('no metered-provider limit exceeds its owner-approved ceiling', () => {
  assert.ok(
    ROLLING_WINDOW_REQUEST_BUDGET <= approved('canopy.rollingWindowRequests'),
    'Raising a request ceiling requires explicit owner approval (FINANCIAL_CONTROLS.md). ' +
      'Lowering it does not — reduce the constant, or get the manifest raised.',
  );
  assert.ok(
    EXPLORATORY_LIFETIME_CEILING <= approved('canopy.exploratoryLifetimeRequests'),
    'Raising a lifetime ceiling requires explicit owner approval (FINANCIAL_CONTROLS.md).',
  );
});

test('every approved ceiling is a real, bounded number', () => {
  assert.ok(manifest.ceilings.length > 0);
  for (const ceiling of manifest.ceilings) {
    assert.ok(Number.isInteger(ceiling.value) && ceiling.value > 0, `${ceiling.id} is not a positive integer`);
    assert.ok(ceiling.description.length > 10, `${ceiling.id} must say what it limits`);
  }
});

test('the Canopy ceiling stays inside the free tier', () => {
  // Approved as a ceiling, not a target: 90 of a free 100, so miscounts,
  // retries, or the provider counting differently still cannot reach a charge.
  assert.ok(approved('canopy.rollingWindowRequests') < FREE_TIER_REQUESTS);
});

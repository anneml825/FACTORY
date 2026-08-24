/**
 * The declaration of what a spending run intends to do, read from a file in the
 * repository rather than from workflow inputs.
 *
 * This exists so there is one spending surface rather than one per experiment.
 * A new piece of research is a new request file, reviewed as a diff, not a new
 * workflow with its own copy of the guards — copies drift, and the copy that
 * drifts is the one that spends the money.
 */

import { readFile } from 'node:fs/promises';
import { ROLLING_WINDOW_REQUEST_BUDGET } from './metered-api-budget.ts';

export interface CanopyRunRequest {
  /** Entry point to run. Constrained to this directory; see below. */
  script: string;
  intendedRequests: number;
  note: string;
}

export class InvalidRunRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRunRequest';
  }
}

/**
 * The script name is validated against a narrow pattern rather than trusted.
 * The workflow executes whatever this returns, so an unconstrained value would
 * turn an edit to a JSON file into arbitrary code execution with a credential
 * in scope. Research scripts live in one directory and are named plainly.
 */
const ALLOWED_SCRIPT = /^src\/research\/[a-z0-9][a-z0-9-]*\.ts$/;

export async function readRunRequest(path: string): Promise<CanopyRunRequest> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    throw new InvalidRunRequest(`No run request at ${path}. Nothing is authorized to spend.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidRunRequest(`The run request at ${path} is not valid JSON.`);
  }
  const request = parsed as Partial<CanopyRunRequest>;

  if (typeof request.script !== 'string' || !ALLOWED_SCRIPT.test(request.script)) {
    throw new InvalidRunRequest(
      `The run request names an unacceptable script: ${String(request.script)}. ` +
        `It must match ${ALLOWED_SCRIPT}.`,
    );
  }
  if (
    !Number.isInteger(request.intendedRequests) ||
    (request.intendedRequests as number) <= 0 ||
    (request.intendedRequests as number) > ROLLING_WINDOW_REQUEST_BUDGET
  ) {
    throw new InvalidRunRequest(
      `The run request asks for ${String(request.intendedRequests)} requests, which is not a ` +
        `positive integer within the window budget of ${ROLLING_WINDOW_REQUEST_BUDGET}.`,
    );
  }
  if (typeof request.note !== 'string' || request.note.trim() === '') {
    throw new InvalidRunRequest('The run request must say what it is for.');
  }
  return request as CanopyRunRequest;
}

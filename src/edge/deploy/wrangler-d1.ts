/**
 * Minimal, deliberately boring wrapper around `wrangler d1 execute`.
 *
 * Deployment scripts need to ask a database what it is before they are allowed
 * to touch it. That question has to be asked through the same tool that does
 * the touching, or the check and the action could disagree about which database
 * they mean.
 */

import { execFileSync } from 'node:child_process';
import type { EdgeTarget } from './edge-targets.ts';

export interface D1QueryOptions {
  /** SQL to run. Use `params` rather than string interpolation. */
  command?: string;
  /** A .sql file to run instead of a single command. */
  file?: string;
  /** Local databases are never used by Factory; this exists to be explicit. */
  remote?: boolean;
}

/**
 * SQLite string literal. Values reaching this are Factory's own constants and,
 * in one case, an owner-supplied note, so quotes are doubled and control
 * characters are refused outright rather than escaped into something subtle.
 * Parameter binding is deliberately not used: `wrangler d1 execute` has no
 * verified parameter flag in this checkout, and depending on an unverified flag
 * inside a safety guard would be worse than escaping carefully here.
 */
export function sqlLiteral(value: string, maximumLength = 500): string {
  if (value.length > maximumLength) {
    throw new Error(`Value is longer than the permitted ${maximumLength} characters.`);
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) {
    throw new Error('Value contains control characters and is refused.');
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function extractJson(output: string): unknown {
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`wrangler did not return JSON:\n${output.slice(0, 500)}`);
  }
  return JSON.parse(output.slice(start, end + 1));
}

export function d1Execute<T = Record<string, unknown>>(
  target: EdgeTarget,
  options: D1QueryOptions,
): T[] {
  if (!options.command && !options.file) {
    throw new Error('d1Execute needs either a command or a file.');
  }
  const args = [
    '--yes',
    'wrangler@latest',
    'd1',
    'execute',
    target.databaseName,
    options.remote === false ? '--local' : '--remote',
    '--yes',
    '--json',
  ];
  if (options.command) args.push('--command', options.command);
  if (options.file) args.push('--file', options.file);

  const output = execFileSync('npx', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
  // A failing statement exits non-zero and throws above, so an unparseable body
  // here means "this call returned no rows", not "this call failed quietly".
  // Applying a .sql file is the normal case for that.
  let parsed: Array<{ results?: T[] }>;
  try {
    parsed = extractJson(output) as Array<{ results?: T[] }>;
  } catch (error) {
    if (options.file) return [];
    throw error;
  }
  return parsed.flatMap((entry) => entry.results ?? []);
}

/** Runs a statement expected to fail, returning the failure text. */
export function d1ExpectFailure(target: EdgeTarget, command: string): string {
  try {
    d1Execute(target, { command });
  } catch (error) {
    const failure = error as { stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
    return [failure.stdout, failure.stderr, failure.message]
      .map((part) => (part ? String(part) : ''))
      .join('\n');
  }
  throw new Error(`Expected "${command}" to be rejected, but it succeeded.`);
}

import type { ExperimentRecord, ExperimentState } from './types.ts';

const TRANSITIONS: Readonly<Record<ExperimentState, readonly ExperimentState[]>> = {
  CANDIDATE: ['BUILT'],
  BUILT: ['FUNCTIONAL_QA_PASS'],
  FUNCTIONAL_QA_PASS: ['VALUE_QA_PASS'],
  VALUE_QA_PASS: ['STAGED'],
  STAGED: ['PUBLISHED'],
  PUBLISHED: ['OBSERVING'],
  OBSERVING: ['KEEP', 'ITERATE', 'KILL', 'INSUFFICIENT_SIGNAL'],
  KEEP: [],
  ITERATE: [],
  KILL: [],
  INSUFFICIENT_SIGNAL: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: ExperimentState, to: ExperimentState) {
    super(`Invalid experiment transition: ${from} -> ${to}.`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function assertPublicationGates(record: ExperimentRecord): void {
  if (record.state !== 'STAGED') {
    throw new InvalidStateTransitionError(record.state, 'PUBLISHED');
  }
  if (!record.functionalQa?.passed || !record.valueQa?.passed) {
    throw new Error('Publication refused: functional QA and Value QA must both pass.');
  }
  const gate = record.manifest.arrivalGate;
  if (
    gate.status !== 'PASSED' ||
    !gate.who ||
    !gate.where ||
    !gate.surface ||
    !gate.permittedReason ||
    !gate.quantitativeEvidenceId ||
    !gate.measurementInstrument ||
    !gate.measurementVerifiedAt
  ) {
    throw new Error('Publication refused: the Arrival gate is incomplete or has not passed.');
  }
}

export function transition(
  record: ExperimentRecord,
  to: ExperimentState,
  reason: string,
  at = new Date().toISOString(),
): void {
  if (!TRANSITIONS[record.state].includes(to)) {
    throw new InvalidStateTransitionError(record.state, to);
  }
  if (to === 'PUBLISHED') assertPublicationGates(record);
  record.state = to;
  record.stateHistory.push({ state: to, at, reason });
}

/**
 * Capital Authority — the only component that can authorize spend.
 *
 * Implements CONSTITUTION.md §6 and FINANCIAL_CONTROLS.md.
 *
 *   No authorization -> no paid operation. No exception for small amounts,
 *   for tests, for urgency, or for "the owner would obviously approve."
 *
 * Every mutation runs in ONE SERIALIZABLE transaction that reads the kill switch,
 * checks the bucket balance, and writes the ledger atomically. A paid operation
 * cannot slip between the check and the commit.
 *
 * There is deliberately NO transfer function between buckets. An agent cannot
 * call what does not exist (CONSTITUTION.md §7).
 */

import type { Pool, PoolClient } from 'pg';

export class KillSwitchEngagedError extends Error {
  constructor() {
    super('PAID_ACTIVITY_HALTED is engaged. All paid activity is stopped (CONSTITUTION.md §9).');
    this.name = 'KillSwitchEngagedError';
  }
}

export class InsufficientBucketFundsError extends Error {
  constructor(bucket: string, requestedCents: number, availableCents: number) {
    super(
      `Bucket "${bucket}" has ${availableCents} cents available; ${requestedCents} requested. ` +
        `Buckets are non-transferable — discovery does not borrow from validation (CONSTITUTION.md §7).`,
    );
    this.name = 'InsufficientBucketFundsError';
  }
}

export class ReservationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationStateError';
  }
}

export interface ReserveRequest {
  bucketName: string;
  maxAmountCents: number;
  purpose: string;
  /** Stable across retries. UNIQUE in the database — the retry guard is the constraint. */
  idempotencyKey: string;
  actor: string;
  experimentId?: number;
}

export interface Reservation {
  id: number;
  idempotencyKey: string;
  bucketName: string;
  maxAmountCents: number;
  state: 'RESERVED' | 'SETTLED' | 'RELEASED' | 'FAILED';
  /** True when this call found an existing reservation rather than creating one. */
  wasAlreadyReserved: boolean;
}

export class CapitalAuthority {
  constructor(private readonly pool: Pool) {}

  /**
   * Reserve a maximum amount against a bucket. Step 1 of RESERVE -> EXECUTE -> SETTLE.
   *
   * Idempotent: calling twice with the same key returns the original reservation
   * rather than reserving twice.
   */
  async reserve(req: ReserveRequest): Promise<Reservation> {
    if (!Number.isInteger(req.maxAmountCents) || req.maxAmountCents <= 0) {
      throw new RangeError('maxAmountCents must be a positive integer number of cents.');
    }
    return this.inSerializableTransaction(async (tx) => {
      await this.assertPaidActivityPermitted(tx);

      const existing = await tx.query(
        `SELECT r.id, r.idempotency_key, r.max_amount_cents, r.state, b.name AS bucket_name
           FROM spend_reservation r JOIN capital_bucket b ON b.id = r.bucket_id
          WHERE r.idempotency_key = $1`,
        [req.idempotencyKey],
      );
      if (existing.rowCount) {
        const r = existing.rows[0];
        return {
          id: Number(r.id),
          idempotencyKey: r.idempotency_key,
          bucketName: r.bucket_name,
          maxAmountCents: Number(r.max_amount_cents),
          state: r.state,
          wasAlreadyReserved: true,
        };
      }

      // FOR UPDATE serializes concurrent reservations against the same bucket.
      const bucket = await tx.query(
        `SELECT id, name, allocated_cents, spent_cents, reserved_cents
           FROM capital_bucket WHERE name = $1 FOR UPDATE`,
        [req.bucketName],
      );
      if (!bucket.rowCount) throw new Error(`No such capital bucket: "${req.bucketName}".`);

      const b = bucket.rows[0];
      const available =
        Number(b.allocated_cents) - Number(b.spent_cents) - Number(b.reserved_cents);
      if (available < req.maxAmountCents) {
        throw new InsufficientBucketFundsError(req.bucketName, req.maxAmountCents, available);
      }

      await tx.query(
        `UPDATE capital_bucket SET reserved_cents = reserved_cents + $1 WHERE id = $2`,
        [req.maxAmountCents, b.id],
      );

      const inserted = await tx.query(
        `INSERT INTO spend_reservation
           (idempotency_key, bucket_id, max_amount_cents, purpose, experiment_id, actor)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [req.idempotencyKey, b.id, req.maxAmountCents, req.purpose, req.experimentId ?? null, req.actor],
      );
      const reservationId = Number(inserted.rows[0].id);

      await this.writeLedger(tx, {
        eventKind: 'SPEND_RESERVED',
        direction: 'DEBIT',
        amountCents: req.maxAmountCents,
        bucketId: Number(b.id),
        reservationId,
        experimentId: req.experimentId,
        actor: req.actor,
        idempotencyKey: `reserve:${req.idempotencyKey}`,
        memo: `Reserved for: ${req.purpose}`,
      });

      return {
        id: reservationId,
        idempotencyKey: req.idempotencyKey,
        bucketName: req.bucketName,
        maxAmountCents: req.maxAmountCents,
        state: 'RESERVED',
        wasAlreadyReserved: false,
      };
    });
  }

  /**
   * Settle the actual cost. Step 3 of RESERVE -> EXECUTE -> SETTLE.
   * The unused remainder is released back to the bucket in the same transaction.
   */
  async settle(idempotencyKey: string, actualAmountCents: number, actor: string): Promise<void> {
    if (!Number.isInteger(actualAmountCents) || actualAmountCents < 0) {
      throw new RangeError('actualAmountCents must be a non-negative integer number of cents.');
    }
    await this.inSerializableTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT id, bucket_id, max_amount_cents, state
           FROM spend_reservation WHERE idempotency_key = $1 FOR UPDATE`,
        [idempotencyKey],
      );
      if (!res.rowCount) throw new ReservationStateError(`No reservation for key "${idempotencyKey}".`);

      const r = res.rows[0];
      if (r.state === 'SETTLED') return; // idempotent
      if (r.state !== 'RESERVED') {
        throw new ReservationStateError(`Reservation "${idempotencyKey}" is ${r.state}, not RESERVED.`);
      }

      const maxCents = Number(r.max_amount_cents);
      if (actualAmountCents > maxCents) {
        // Also blocked by CHECK settled_within_reservation; caught here for a clearer error.
        throw new ReservationStateError(
          `Settled cost ${actualAmountCents} exceeds reserved maximum ${maxCents}. ` +
            `Actual cost may never exceed what was authorized (CONSTITUTION.md §6).`,
        );
      }

      await tx.query(
        `UPDATE capital_bucket
            SET reserved_cents = reserved_cents - $1, spent_cents = spent_cents + $2
          WHERE id = $3`,
        [maxCents, actualAmountCents, r.bucket_id],
      );
      await tx.query(
        `UPDATE spend_reservation
            SET state='SETTLED', settled_amount_cents=$1, settled_at=now()
          WHERE id = $2`,
        [actualAmountCents, r.id],
      );

      await this.writeLedger(tx, {
        eventKind: 'SPEND_SETTLED',
        direction: 'DEBIT',
        amountCents: actualAmountCents,
        bucketId: Number(r.bucket_id),
        reservationId: Number(r.id),
        actor,
        idempotencyKey: `settle:${idempotencyKey}`,
        memo: `Settled ${actualAmountCents} of ${maxCents} reserved.`,
      });

      const unused = maxCents - actualAmountCents;
      if (unused > 0) {
        await this.writeLedger(tx, {
          eventKind: 'RESERVATION_RELEASED',
          direction: 'CREDIT',
          amountCents: unused,
          bucketId: Number(r.bucket_id),
          reservationId: Number(r.id),
          actor,
          idempotencyKey: `release-unused:${idempotencyKey}`,
          memo: `Released ${unused} unused cents.`,
        });
      }
    });
  }

  /** Release a reservation without spending — the operation did not run. */
  async release(idempotencyKey: string, actor: string, reason: string): Promise<void> {
    await this.inSerializableTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT id, bucket_id, max_amount_cents, state
           FROM spend_reservation WHERE idempotency_key = $1 FOR UPDATE`,
        [idempotencyKey],
      );
      if (!res.rowCount) throw new ReservationStateError(`No reservation for key "${idempotencyKey}".`);
      const r = res.rows[0];
      if (r.state === 'RELEASED') return; // idempotent
      if (r.state !== 'RESERVED') {
        throw new ReservationStateError(`Reservation "${idempotencyKey}" is ${r.state}, not RESERVED.`);
      }

      await tx.query(
        `UPDATE capital_bucket SET reserved_cents = reserved_cents - $1 WHERE id = $2`,
        [Number(r.max_amount_cents), r.bucket_id],
      );
      await tx.query(`UPDATE spend_reservation SET state='RELEASED' WHERE id = $1`, [r.id]);

      await this.writeLedger(tx, {
        eventKind: 'RESERVATION_RELEASED',
        direction: 'CREDIT',
        amountCents: Number(r.max_amount_cents),
        bucketId: Number(r.bucket_id),
        reservationId: Number(r.id),
        actor,
        idempotencyKey: `release:${idempotencyKey}`,
        memo: `Released unspent: ${reason}`,
      });
    });
  }

  /** Cents currently available to spend from a bucket. */
  async availableCents(bucketName: string): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT allocated_cents - spent_cents - reserved_cents AS available
         FROM capital_bucket WHERE name = $1`,
      [bucketName],
    );
    if (!rows.length) throw new Error(`No such capital bucket: "${bucketName}".`);
    return Number(rows[0].available);
  }

  // ---------------------------------------------------------------- internals

  private async assertPaidActivityPermitted(tx: PoolClient): Promise<void> {
    const { rows } = await tx.query(
      `SELECT bool_value FROM system_flag WHERE key = 'PAID_ACTIVITY_HALTED'`,
    );
    // Absent flag is treated as HALTED: the safe state is the default, so a
    // missing or corrupted flag fails closed rather than open.
    if (!rows.length || rows[0].bool_value !== false) throw new KillSwitchEngagedError();
  }

  private async writeLedger(
    tx: PoolClient,
    e: {
      eventKind: string;
      direction: 'DEBIT' | 'CREDIT';
      amountCents: number;
      bucketId: number;
      reservationId?: number;
      experimentId?: number;
      actor: string;
      idempotencyKey: string;
      memo: string;
    },
  ): Promise<void> {
    await tx.query(
      `INSERT INTO ledger_entry
         (event_kind, direction, amount_cents, bucket_id, reservation_id,
          experiment_id, actor, idempotency_key, memo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        e.eventKind, e.direction, e.amountCents, e.bucketId, e.reservationId ?? null,
        e.experimentId ?? null, e.actor, e.idempotencyKey, e.memo,
      ],
    );
  }

  private async inSerializableTransaction<T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> {
    // Retries on 40001 (serialization failure) / 40P01 (deadlock). These are
    // expected under contention and are not spend failures — the transaction
    // never committed, so no money moved.
    const MAX_ATTEMPTS = 10;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const tx = await this.pool.connect();
      try {
        await tx.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
        const result = await fn(tx);
        await tx.query('COMMIT');
        return result;
      } catch (err) {
        await tx.query('ROLLBACK').catch(() => {});
        const code = (err as { code?: string }).code;
        if (code === '40001' || code === '40P01') {
          lastError = err;
          await new Promise((r) => setTimeout(r, 5 * 2 ** attempt + Math.random() * 10));
          continue;
        }
        throw err;
      } finally {
        tx.release();
      }
    }
    throw lastError;
  }
}

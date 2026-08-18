/**
 * PostgreSQL edge state. Phase E remediation.
 *
 * A delivery grant is a paid-for right. If it lives only in memory, a restart
 * of the edge silently voids a completed purchase, and the download counter can
 * be reset by a crash. Both are durability problems, not features, so grants,
 * their buyer-facing references, and each consumed download are persisted.
 *
 * `consumeDownload` uses a single conditional UPDATE ... RETURNING so two
 * concurrent requests cannot both take the last download slot.
 */

import type { Pool } from 'pg';
import type { DeliveryGrant, EdgeStateStore } from './types.ts';

interface GrantRow {
  grant_id: string;
  transaction_id: string;
  experiment_key: string;
  asset_key: string;
  artifact_key: string;
  issued_at: Date;
  expires_at: Date;
  max_downloads: number;
  downloads: number;
}

function toGrant(row: GrantRow): DeliveryGrant {
  return {
    grantId: row.grant_id,
    transactionId: row.transaction_id,
    experimentId: row.experiment_key,
    assetId: row.asset_key,
    artifactKey: row.artifact_key,
    issuedAt: row.issued_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    maxDownloads: row.max_downloads,
    downloads: row.downloads,
  };
}

export class PostgresEdgeStateStore implements EdgeStateStore {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async putGrant(grant: DeliveryGrant): Promise<{ created: boolean }> {
    const result = await this.pool.query(
      `INSERT INTO delivery_grant
         (grant_id, transaction_id, experiment_key, asset_key, artifact_key,
          issued_at, expires_at, max_downloads, downloads)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (transaction_id) DO NOTHING
       RETURNING grant_id`,
      [
        grant.grantId,
        grant.transactionId,
        grant.experimentId,
        grant.assetId,
        grant.artifactKey,
        grant.issuedAt,
        grant.expiresAt,
        grant.maxDownloads,
        grant.downloads,
      ],
    );
    return { created: (result.rowCount ?? 0) > 0 };
  }

  async getGrant(grantId: string): Promise<DeliveryGrant | null> {
    const result = await this.pool.query<GrantRow>(
      'SELECT * FROM delivery_grant WHERE grant_id = $1',
      [grantId],
    );
    return result.rows[0] ? toGrant(result.rows[0]) : null;
  }

  async grantForTransaction(transactionId: string): Promise<DeliveryGrant | null> {
    const result = await this.pool.query<GrantRow>(
      'SELECT * FROM delivery_grant WHERE transaction_id = $1',
      [transactionId],
    );
    return result.rows[0] ? toGrant(result.rows[0]) : null;
  }

  async linkReference(reference: string, transactionId: string): Promise<void> {
    const result = await this.pool.query<{ transaction_id: string }>(
      `INSERT INTO delivery_reference (reference, transaction_id)
       VALUES ($1, $2)
       ON CONFLICT (reference) DO UPDATE SET reference = EXCLUDED.reference
       RETURNING transaction_id`,
      [reference, transactionId],
    );
    const stored = result.rows[0]?.transaction_id;
    if (stored && stored !== transactionId) {
      throw new Error(`Reference ${reference} is already bound to a different transaction.`);
    }
  }

  async transactionForReference(reference: string): Promise<string | null> {
    const result = await this.pool.query<{ transaction_id: string }>(
      'SELECT transaction_id FROM delivery_reference WHERE reference = $1',
      [reference],
    );
    return result.rows[0]?.transaction_id ?? null;
  }

  async consumeDownload(grantId: string, at: string): Promise<DeliveryGrant | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // The WHERE clause is the limit. Two concurrent requests for the last slot
      // cannot both match, because the row is locked by the UPDATE.
      const result = await client.query<GrantRow>(
        `UPDATE delivery_grant
            SET downloads = downloads + 1
          WHERE grant_id = $1 AND downloads < max_downloads
        RETURNING *`,
        [grantId],
      );
      if ((result.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query(
        'INSERT INTO delivery_download (grant_id, downloaded_at) VALUES ($1, $2)',
        [grantId, at],
      );
      await client.query('COMMIT');
      return toGrant(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

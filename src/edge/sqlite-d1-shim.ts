/**
 * A `D1Like` implementation over node:sqlite.
 *
 * D1 is SQLite. This shim lets the D1 bindings be exercised against a real
 * SQLite engine — real constraints, real triggers, real atomicity — without a
 * Cloudflare account in the loop. It is a TEST AND SEEDING aid, not a
 * production store, and the Worker never imports it.
 *
 * What it faithfully reproduces: statement semantics, `meta.changes`, and the
 * append-only triggers. What it cannot reproduce: D1's network latency, its
 * 50-queries-per-invocation ceiling, and its eventual-consistency behaviour
 * across regions. Passing here is necessary, not sufficient.
 */

import { DatabaseSync } from 'node:sqlite';
import type { D1Like, D1PreparedStatement, D1Result } from './d1-bindings.ts';

class SqliteStatement implements D1PreparedStatement {
  private readonly db: DatabaseSync;
  private readonly query: string;
  private values: unknown[] = [];

  constructor(db: DatabaseSync, query: string) {
    this.db = db;
    this.query = query;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    const next = new SqliteStatement(this.db, this.query);
    // node:sqlite rejects undefined and does not accept booleans.
    next.values = values.map((value) => {
      if (value === undefined) return null;
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value;
    });
    return next;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.db.prepare(this.query).get(...(this.values as never[]));
    return (row as T | undefined) ?? null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const result = this.db.prepare(this.query).run(...(this.values as never[]));
    return { success: true, meta: { changes: Number(result.changes) } };
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const rows = this.db.prepare(this.query).all(...(this.values as never[]));
    return { success: true, results: rows as T[] };
  }
}

export class SqliteD1 implements D1Like {
  readonly db: DatabaseSync;

  constructor(location = ':memory:') {
    this.db = new DatabaseSync(location);
  }

  applySchema(sql: string): void {
    this.db.exec(sql);
  }

  prepare(query: string): D1PreparedStatement {
    return new SqliteStatement(this.db, query);
  }

  close(): void {
    this.db.close();
  }
}

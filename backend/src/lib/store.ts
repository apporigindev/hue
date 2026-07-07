/**
 * store.ts — persistence for subscription entitlements.
 *
 * Keyed by an ANONYMOUS app-user id (a random UUID the app generates and keeps
 * on-device; sent to Apple as appAccountToken so notifications carry it back).
 * No personal data is stored — only the anonymous id, the product, status and
 * expiry. A Postgres implementation for production; an in-memory one for
 * tests / local dev without a database.
 */

import pg from "pg";

export type SubStatus = "active" | "in_grace" | "expired" | "refunded" | "revoked";
export type Platform = "apple" | "google";

export interface SubRecord {
  appUserId: string;
  platform: Platform;
  productId: string | null;
  originalTransactionId: string | null;
  status: SubStatus;
  expiresAt: Date | null;
  environment: string | null;
  updatedAt: Date;
}

export interface SubscriptionStore {
  upsert(rec: Omit<SubRecord, "updatedAt">): Promise<void>;
  getByUser(appUserId: string): Promise<SubRecord | null>;
  getByOriginalTransactionId(otid: string): Promise<SubRecord | null>;
  close(): Promise<void>;
}

/* ---------------- in-memory (dev / tests) ---------------- */

export class MemoryStore implements SubscriptionStore {
  private byUser = new Map<string, SubRecord>();

  async upsert(rec: Omit<SubRecord, "updatedAt">): Promise<void> {
    this.byUser.set(rec.appUserId, { ...rec, updatedAt: new Date() });
  }
  async getByUser(appUserId: string): Promise<SubRecord | null> {
    return this.byUser.get(appUserId) ?? null;
  }
  async getByOriginalTransactionId(otid: string): Promise<SubRecord | null> {
    for (const r of this.byUser.values()) {
      if (r.originalTransactionId === otid) return r;
    }
    return null;
  }
  async close(): Promise<void> {}
}

/* ---------------- Postgres (production) ---------------- */

export class PostgresStore implements SubscriptionStore {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async upsert(rec: Omit<SubRecord, "updatedAt">): Promise<void> {
    await this.pool.query(
      `insert into subscriptions
         (app_user_id, platform, product_id, original_transaction_id, status, expires_at, environment, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7, now())
       on conflict (app_user_id) do update set
         platform = excluded.platform,
         product_id = excluded.product_id,
         original_transaction_id = excluded.original_transaction_id,
         status = excluded.status,
         expires_at = excluded.expires_at,
         environment = excluded.environment,
         updated_at = now()`,
      [
        rec.appUserId,
        rec.platform,
        rec.productId,
        rec.originalTransactionId,
        rec.status,
        rec.expiresAt,
        rec.environment,
      ]
    );
  }

  async getByUser(appUserId: string): Promise<SubRecord | null> {
    const { rows } = await this.pool.query(
      `select * from subscriptions where app_user_id = $1`,
      [appUserId]
    );
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async getByOriginalTransactionId(otid: string): Promise<SubRecord | null> {
    const { rows } = await this.pool.query(
      `select * from subscriptions where original_transaction_id = $1
       order by updated_at desc limit 1`,
      [otid]
    );
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function rowToRecord(r: any): SubRecord {
  return {
    appUserId: r.app_user_id,
    platform: r.platform,
    productId: r.product_id,
    originalTransactionId: r.original_transaction_id,
    status: r.status,
    expiresAt: r.expires_at ? new Date(r.expires_at) : null,
    environment: r.environment,
    updatedAt: new Date(r.updated_at),
  };
}

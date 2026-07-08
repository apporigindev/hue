/**
 * consumed.ts — replay protection AND a bounded-retry cost cap for the try-on
 * consumable.
 *
 * A StoreKit consumable's transaction could be re-sent to get free generations,
 * and because the image provider bills per call, an unbounded "retry on failure"
 * would let one purchase burn arbitrary spend. So each transaction is tracked:
 *   - beginAttempt() atomically counts an attempt and returns whether it may
 *     proceed. Once committed ('spent') it can never run again (replay guard).
 *     A still-'reserved' transaction may retry, but only up to maxAttempts — after
 *     that it is force-spent so a deterministically-failing render can't loop and
 *     re-bill forever.
 *   - commit() marks a transaction fully spent after a successful render.
 *
 * There is no "release": a failed render still counts its attempt, which both
 * caps cost and means a crash between attempt and commit can never permanently
 * brick a purchase (the same transaction can retry until it succeeds or the cap
 * is reached). Keys are opaque strings — no personal data.
 */
import pg from "pg";

export type AttemptStatus = "ok" | "used" | "exhausted";
export interface AttemptResult {
  status: AttemptStatus;
  attempt: number;
}

export interface ConsumedStore {
  /** Count an attempt for this key. 'used' = already spent; 'exhausted' = over the cap. */
  beginAttempt(key: string, maxAttempts: number): Promise<AttemptResult>;
  /** Mark a key fully spent after a successful render. */
  commit(key: string): Promise<void>;
  close(): Promise<void>;
}

/* ---------------- in-memory (dev / tests) ---------------- */

export class MemoryConsumedStore implements ConsumedStore {
  private m = new Map<string, { status: "reserved" | "spent"; attempts: number }>();

  async beginAttempt(key: string, maxAttempts: number): Promise<AttemptResult> {
    const cur = this.m.get(key);
    if (cur?.status === "spent") return { status: "used", attempt: cur.attempts };
    const attempt = (cur?.attempts ?? 0) + 1;
    if (attempt > maxAttempts) {
      this.m.set(key, { status: "spent", attempts: attempt }); // force-spend: stop the cost
      return { status: "exhausted", attempt };
    }
    this.m.set(key, { status: "reserved", attempts: attempt });
    return { status: "ok", attempt };
  }

  async commit(key: string): Promise<void> {
    const cur = this.m.get(key);
    this.m.set(key, { status: "spent", attempts: cur?.attempts ?? 1 });
  }

  async close(): Promise<void> {}
}

/* ---------------- Postgres (production) ---------------- */

export class PostgresConsumedStore implements ConsumedStore {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async beginAttempt(key: string, maxAttempts: number): Promise<AttemptResult> {
    // Atomic upsert: insert a new reservation, or increment an existing STILL-
    // reserved one. If the row is already 'spent', the WHERE fails and nothing
    // is returned → replay ('used').
    const { rows } = await this.pool.query<{ attempts: number }>(
      `insert into tryon_consumed (tx_key, status, attempts, created_at)
         values ($1, 'reserved', 1, now())
       on conflict (tx_key) do update
         set attempts = tryon_consumed.attempts + 1
         where tryon_consumed.status = 'reserved'
       returning attempts`,
      [key]
    );
    if (rows.length === 0) return { status: "used", attempt: 0 };
    const attempt = rows[0].attempts;
    if (attempt > maxAttempts) {
      await this.pool.query(`update tryon_consumed set status = 'spent' where tx_key = $1`, [key]);
      return { status: "exhausted", attempt };
    }
    return { status: "ok", attempt };
  }

  async commit(key: string): Promise<void> {
    await this.pool.query(`update tryon_consumed set status = 'spent' where tx_key = $1`, [key]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

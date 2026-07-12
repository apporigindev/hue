/**
 * Tiny idempotent migration runner: applies every migrations/*.sql in name
 * order. All migrations use IF NOT EXISTS, so re-running is safe.
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const f of files) {
    process.stdout.write(`applying ${f} ... `);
    await client.query(readFileSync(join(dir, f), "utf8"));
    console.log("ok");
  }
  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema='public' order by table_name`
  );
  console.log("tables:", rows.map((r) => r.table_name).join(", "));
} finally {
  await client.end();
}

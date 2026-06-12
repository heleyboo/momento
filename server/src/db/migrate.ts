import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Standalone migration runner: applies generated Drizzle migrations, then
// applies non-schema concerns (pg_trgm extension + trigram index for search).
// Expand-contract discipline: new columns ship nullable → backfill → constrain
// in later migrations; never NOT NULL in one shot on a populated table.
async function main() {
  // Fail fast: never silently migrate a fallback localhost DB (a missing env in a
  // deploy shell could otherwise drop/alter the wrong database).
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set — refusing to run migrations against a default DB");
  }
  const client = postgres(connectionString, { max: 1, onnotice: () => {} });
  const db = drizzle(client);

  console.log("[migrate] applying drizzle migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  console.log("[migrate] ensuring pg_trgm + caption trigram index...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  // Plain trigram index on caption (no unaccent in v1 — keeps the index usable).
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS entries_caption_trgm_idx ON entries USING gin (caption gin_trgm_ops)`,
  );

  // Note: the legacy single-media → entry_media backfill lives inline in
  // migration 0004 so it runs in-sequence (before the 0006 contract drop),
  // correct even when a fresh DB applies all migrations in one pass.

  console.log("[migrate] done.");
  await client.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});

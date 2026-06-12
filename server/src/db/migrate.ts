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

  // Backfill: each existing single-media entry becomes one entry_media row
  // (position 0). Idempotent — skips entries that already have media. Guarded on
  // the legacy column still existing, so this stays a no-op after the contract
  // migration drops entries.storage_ref.
  const legacy = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'storage_ref' LIMIT 1
  `);
  if (legacy.length > 0) {
    console.log("[migrate] backfilling entry_media from legacy entry columns...");
    await db.execute(sql`
      INSERT INTO entry_media (user_id, client_entry_id, media_client_id, entry_id, position,
                               kind, storage_provider, storage_ref, thumbnail_ref, duration_sec, size_bytes)
      SELECT e.user_id, e.client_entry_id, gen_random_uuid(), e.id, 0,
             e.kind, e.storage_provider, e.storage_ref, e.thumbnail_ref, e.duration_sec,
             COALESCE(e.size_bytes, 0)
      FROM entries e
      WHERE NOT EXISTS (SELECT 1 FROM entry_media m WHERE m.entry_id = e.id)
    `);
  }

  console.log("[migrate] done.");
  await client.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});

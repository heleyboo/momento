import { and, eq, desc, ilike, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { entries, entryMedia, albums, entryAlbums, users, type Entry, type NewEntry } from "@/db/schema";

// Entry (post) data access. Ownership predicates live here (single source) so
// routes can't drift. All reads/writes are user-scoped. Per-media access +
// ownership-by-ref live in media-queries.ts.

export interface EntryFilters {
  q?: string; // caption keyword (trigram ILIKE)
  kind?: "photo" | "video";
  cat?: string; // category label
  from?: Date; // takenAt >=
  to?: Date; // takenAt <=
}

// Newest-first list with optional filters. The `user_id = :me` predicate is
// always ANDed first so no filter branch can widen tenancy. All values are
// parameter-bound by Drizzle (no string interpolation).
export async function searchEntries(
  userId: string,
  filters: EntryFilters = {},
  limit = 100,
): Promise<Entry[]> {
  const conds: SQL[] = [eq(entries.userId, userId)];
  // Escape LIKE wildcards so a user-typed % or _ matches literally (Postgres
  // default escape char is backslash). Value is still parameter-bound.
  if (filters.q) {
    const literal = filters.q.replace(/[\\%_]/g, "\\$&");
    conds.push(ilike(entries.caption, `%${literal}%`));
  }
  // Kind is per-media now: match posts that contain at least one media of the kind.
  if (filters.kind) {
    conds.push(
      sql`EXISTS (SELECT 1 FROM ${entryMedia} m WHERE m.entry_id = ${entries.id} AND m.kind = ${filters.kind})`,
    );
  }
  if (filters.cat) conds.push(eq(entries.category, filters.cat));
  if (filters.from) conds.push(gte(entries.takenAt, filters.from));
  if (filters.to) conds.push(lte(entries.takenAt, filters.to));

  return db
    .select()
    .from(entries)
    .where(and(...conds))
    .orderBy(desc(entries.takenAt))
    .limit(limit);
}

export async function getOwnedEntry(userId: string, id: string): Promise<Entry | null> {
  const [row] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)))
    .limit(1);
  return row ?? null;
}

/**
 * Idempotent insert on (user_id, client_entry_id). Returns the row plus whether
 * it was newly created (false → a replay; caller should clean up uploaded bytes).
 */
export async function insertEntryIdempotent(
  values: NewEntry,
): Promise<{ entry: Entry; created: boolean }> {
  const [inserted] = await db
    .insert(entries)
    .values(values)
    .onConflictDoNothing({ target: [entries.userId, entries.clientEntryId] })
    .returning();

  if (inserted) return { entry: inserted, created: true };

  // Conflict: the entry already exists — return it (idempotent replay).
  const [existing] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, values.userId), eq(entries.clientEntryId, values.clientEntryId)))
    .limit(1);
  return { entry: existing, created: false };
}

/** Atomic quota guard: increments used bytes only if it stays within quota. */
export async function reserveQuota(userId: string, sizeBytes: number): Promise<boolean> {
  const res = await db
    .update(users)
    .set({ storageUsedBytes: sql`${users.storageUsedBytes} + ${sizeBytes}` })
    .where(
      and(
        eq(users.id, userId),
        sql`${users.storageUsedBytes} + ${sizeBytes} <= ${users.storageQuotaBytes}`,
      ),
    )
    .returning({ id: users.id });
  return res.length > 0;
}

export async function releaseQuota(userId: string, sizeBytes: number): Promise<void> {
  await db
    .update(users)
    .set({ storageUsedBytes: sql`GREATEST(${users.storageUsedBytes} - ${sizeBytes}, 0)` })
    .where(eq(users.id, userId));
}

export interface EntryPatch {
  caption?: string;
  captionSource?: "ai" | "user";
  category?: string;
}

/** Updates editable fields on an owned entry; bumps updated_at. 404 → null. */
export async function updateOwnedEntry(
  userId: string,
  id: string,
  patch: EntryPatch,
): Promise<Entry | null> {
  const [row] = await db
    .update(entries)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.userId, userId)))
    .returning();
  return row ?? null;
}

/** Deletes an owned entry, returning it (for storage cleanup). 404 → null. */
export async function deleteOwnedEntry(userId: string, id: string): Promise<Entry | null> {
  const [row] = await db
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)))
    .returning();
  return row ?? null;
}

/** Confirms an album belongs to the user (cross-object IDOR guard). */
export async function userOwnsAlbum(userId: string, albumId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: albums.id })
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.userId, userId)))
    .limit(1);
  return !!row;
}

/** Attaches an owned entry to an owned album (idempotent). */
export async function attachEntryToAlbum(entryId: string, albumId: string): Promise<void> {
  await db.insert(entryAlbums).values({ entryId, albumId }).onConflictDoNothing();
}

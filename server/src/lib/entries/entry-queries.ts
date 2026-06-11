import { and, eq, or, desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { entries, albums, entryAlbums, users, type Entry, type NewEntry } from "@/db/schema";

// Entry data access. Ownership predicates live here (single source) so routes
// can't drift. All reads/writes are user-scoped.

// Matches a ref against either the media or thumbnail storage ref of an owned
// entry (the media route serves both through the same path).
export async function findOwnedEntryByRef(userId: string, ref: string): Promise<Entry | null> {
  const [row] = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        or(eq(entries.storageRef, ref), eq(entries.thumbnailRef, ref)),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listEntries(userId: string, limit = 100): Promise<Entry[]> {
  return db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
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

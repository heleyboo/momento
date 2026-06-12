import { and, eq, asc, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  entries,
  entryMedia,
  users,
  type Entry,
  type NewEntry,
  type EntryMedia,
  type NewEntryMedia,
} from "@/db/schema";
import { searchEntries, type EntryFilters } from "./entry-queries";

// Multi-media data access: media are staged into entry_media with entry_id NULL
// (idempotent per user+client_entry_id+media_client_id) and promoted by finalize.
// Ownership is enforced via entry_media.user_id, independent of the entries row.

export class FinalizeError extends Error {
  constructor(
    public code: "count_mismatch" | "too_large" | "quota",
    message: string,
  ) {
    super(message);
  }
}

const MAX_POST_BYTES = 500 * 1024 * 1024; // 500 MB total per post

/** Existing staged/owned media for an idempotency key, or null. */
export async function findStagedMedia(
  userId: string,
  clientEntryId: string,
  mediaClientId: string,
): Promise<EntryMedia | null> {
  const [row] = await db
    .select()
    .from(entryMedia)
    .where(
      and(
        eq(entryMedia.userId, userId),
        eq(entryMedia.clientEntryId, clientEntryId),
        eq(entryMedia.mediaClientId, mediaClientId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertStagedMedia(values: NewEntryMedia): Promise<EntryMedia> {
  const [row] = await db.insert(entryMedia).values(values).returning();
  return row;
}

/** Owner-scoped ref lookup for the media-serve + delete paths (entry_media-based). */
export async function findOwnedMediaByRef(userId: string, ref: string): Promise<EntryMedia | null> {
  const [row] = await db
    .select()
    .from(entryMedia)
    .where(
      and(
        eq(entryMedia.userId, userId),
        sql`(${entryMedia.storageRef} = ${ref} OR ${entryMedia.thumbnailRef} = ${ref})`,
      ),
    )
    .limit(1);
  return row ?? null;
}

async function mediaForEntry(entryId: string): Promise<EntryMedia[]> {
  return db
    .select()
    .from(entryMedia)
    .where(eq(entryMedia.entryId, entryId))
    .orderBy(asc(entryMedia.position));
}

/**
 * Promote staged media into a post. Idempotent on (user, client_entry_id).
 * `mediaClientIds` order defines position (index). Returns the post + its media.
 * Throws FinalizeError on count mismatch / over-cap / quota.
 */
export async function finalizePost(
  post: NewEntry,
  mediaClientIds: string[],
): Promise<{ entry: Entry; media: EntryMedia[]; created: boolean }> {
  return db.transaction(async (tx) => {
    // Idempotent entry insert.
    const [inserted] = await tx
      .insert(entries)
      .values(post)
      .onConflictDoNothing({ target: [entries.userId, entries.clientEntryId] })
      .returning();

    if (!inserted) {
      // Replay: return the existing post + media; drop any leftover staged rows.
      const [existing] = await tx
        .select()
        .from(entries)
        .where(and(eq(entries.userId, post.userId), eq(entries.clientEntryId, post.clientEntryId)))
        .limit(1);
      await tx
        .delete(entryMedia)
        .where(
          and(
            eq(entryMedia.userId, post.userId),
            eq(entryMedia.clientEntryId, post.clientEntryId),
            isNull(entryMedia.entryId),
          ),
        );
      const media = await tx
        .select()
        .from(entryMedia)
        .where(eq(entryMedia.entryId, existing.id))
        .orderBy(asc(entryMedia.position));
      return { entry: existing, media, created: false };
    }

    // Load the staged rows the client referenced (user-scoped → no cross-user copy).
    const staged = await tx
      .select()
      .from(entryMedia)
      .where(
        and(
          eq(entryMedia.userId, post.userId),
          eq(entryMedia.clientEntryId, post.clientEntryId),
          isNull(entryMedia.entryId),
          inArray(entryMedia.mediaClientId, mediaClientIds),
        ),
      );

    const byClientId = new Map(staged.map((m) => [m.mediaClientId, m]));
    if (byClientId.size !== mediaClientIds.length) {
      throw new FinalizeError("count_mismatch", "some media were not staged for this post");
    }

    const total = staged.reduce((sum, m) => sum + (m.sizeBytes ?? 0), 0);
    if (total > MAX_POST_BYTES) {
      throw new FinalizeError("too_large", "post exceeds size limit");
    }

    // Atomic quota reserve (throws → whole tx rolls back, nothing promoted).
    const reserved = await tx
      .update(users)
      .set({ storageUsedBytes: sql`${users.storageUsedBytes} + ${total}` })
      .where(
        and(
          eq(users.id, post.userId),
          sql`${users.storageUsedBytes} + ${total} <= ${users.storageQuotaBytes}`,
        ),
      )
      .returning({ id: users.id });
    if (reserved.length === 0) throw new FinalizeError("quota", "storage quota exceeded");

    // Record the post total (drives quota release on delete).
    await tx.update(entries).set({ sizeBytes: total }).where(eq(entries.id, inserted.id));

    // Promote each staged media: set entry_id + position by array index.
    for (let i = 0; i < mediaClientIds.length; i++) {
      await tx
        .update(entryMedia)
        .set({ entryId: inserted.id, position: i })
        .where(
          and(
            eq(entryMedia.userId, post.userId),
            eq(entryMedia.clientEntryId, post.clientEntryId),
            eq(entryMedia.mediaClientId, mediaClientIds[i]),
          ),
        );
    }

    // Drop any staged-but-unused media for this post (never reserved → no leak).
    await tx
      .delete(entryMedia)
      .where(
        and(
          eq(entryMedia.userId, post.userId),
          eq(entryMedia.clientEntryId, post.clientEntryId),
          isNull(entryMedia.entryId),
        ),
      );

    const media = await tx
      .select()
      .from(entryMedia)
      .where(eq(entryMedia.entryId, inserted.id))
      .orderBy(asc(entryMedia.position));
    return { entry: inserted, media, created: true };
  });
}

/** List posts (newest-first, filtered) each with its ordered media — 2 queries, no N+1. */
export async function listEntriesWithMedia(
  userId: string,
  filters: EntryFilters = {},
): Promise<{ entry: Entry; media: EntryMedia[] }[]> {
  const rows = await searchEntries(userId, filters);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const media = await db
    .select()
    .from(entryMedia)
    .where(inArray(entryMedia.entryId, ids))
    .orderBy(asc(entryMedia.entryId), asc(entryMedia.position));
  const grouped = new Map<string, EntryMedia[]>();
  for (const m of media) {
    if (!m.entryId) continue;
    (grouped.get(m.entryId) ?? grouped.set(m.entryId, []).get(m.entryId)!).push(m);
  }
  return rows.map((entry) => ({ entry, media: grouped.get(entry.id) ?? [] }));
}

export async function getEntryWithMedia(
  userId: string,
  id: string,
): Promise<{ entry: Entry; media: EntryMedia[] } | null> {
  const [entry] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)))
    .limit(1);
  if (!entry) return null;
  return { entry, media: await mediaForEntry(id) };
}

/** Delete an owned post, returning its media refs/sizes for storage + quota cleanup. */
export async function deleteEntryWithMedia(
  userId: string,
  id: string,
): Promise<{ media: EntryMedia[] } | null> {
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .select({ id: entries.id })
      .from(entries)
      .where(and(eq(entries.id, id), eq(entries.userId, userId)))
      .limit(1);
    if (!entry) return null;
    // Collect media BEFORE the cascade delete removes the rows.
    const media = await tx
      .select()
      .from(entryMedia)
      .where(eq(entryMedia.entryId, id));
    await tx.delete(entries).where(eq(entries.id, id)); // cascade clears entry_media
    return { media };
  });
}

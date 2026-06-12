import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// v1 albums = entries grouped by category (AI album suggestion deferred to
// v1.1). One query yields per-category count + the latest entry's cover refs.

export interface AlbumSummaryRow {
  category: string;
  count: number;
  coverEntryId: string | null;
  coverThumbnailRef: string | null;
  coverStorageRef: string | null;
}

export async function albumSummaries(userId: string): Promise<AlbumSummaryRow[]> {
  // array_agg(... ORDER BY taken_at DESC)[1] picks the most recent entry per
  // category as the cover. user_id bound as a parameter.
  // Cover = the position-0 media of the most recent entry per category.
  const res = await db.execute(sql`
    SELECT
      e.category,
      count(*)::int AS count,
      (array_agg(e.id ORDER BY e.taken_at DESC))[1] AS cover_entry_id,
      (array_agg(cm.thumbnail_ref ORDER BY e.taken_at DESC))[1] AS cover_thumbnail_ref,
      (array_agg(cm.storage_ref ORDER BY e.taken_at DESC))[1] AS cover_storage_ref
    FROM entries e
    LEFT JOIN LATERAL (
      SELECT thumbnail_ref, storage_ref FROM entry_media m
      WHERE m.entry_id = e.id ORDER BY m.position ASC LIMIT 1
    ) cm ON true
    WHERE e.user_id = ${userId} AND e.category IS NOT NULL
    GROUP BY e.category
    ORDER BY count DESC
  `);

  return (res as unknown as Record<string, unknown>[]).map((r) => ({
    category: String(r.category),
    count: Number(r.count),
    coverEntryId: (r.cover_entry_id as string) ?? null,
    coverThumbnailRef: (r.cover_thumbnail_ref as string) ?? null,
    coverStorageRef: (r.cover_storage_ref as string) ?? null,
  }));
}

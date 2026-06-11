import type { Entry } from "@/db/schema";
import { getStorage } from "@/lib/storage/get-storage";
import type { StorageCtx } from "@/lib/storage/provider";

// Maps an entry row to the API shape the iOS client consumes, resolving
// provider-aware media/thumbnail URLs.

export interface EntryDTO {
  id: string;
  clientEntryId: string;
  kind: "photo" | "video";
  caption: string | null;
  captionSource: "ai" | "user";
  category: string | null;
  takenAt: string;
  location: string | null;
  durationSec: number | null;
  syncStatus: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function toEntryDTO(row: Entry, ctx?: StorageCtx): Promise<EntryDTO> {
  const storage = getStorage();
  const mediaUrl = await storage.getUrl(row.userId, row.storageRef, ctx);
  const thumbnailUrl = row.thumbnailRef
    ? await storage.getUrl(row.userId, row.thumbnailRef, ctx)
    : null;
  return {
    id: row.id,
    clientEntryId: row.clientEntryId,
    kind: row.kind,
    caption: row.caption,
    captionSource: row.captionSource,
    category: row.category,
    takenAt: row.takenAt.toISOString(),
    location: row.location,
    durationSec: row.durationSec,
    syncStatus: row.syncStatus,
    mediaUrl,
    thumbnailUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

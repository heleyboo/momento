import type { Entry, EntryMedia } from "@/db/schema";
import { getStorage } from "@/lib/storage/get-storage";
import type { StorageCtx } from "@/lib/storage/provider";

// Maps a post + its media into the API shape the iOS client consumes, resolving
// provider-aware URLs per media. The client derives the cover from media[0].

export interface MediaDTO {
  id: string;
  position: number;
  kind: "photo" | "video";
  url: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
}

export interface EntryDTO {
  id: string;
  clientEntryId: string;
  caption: string | null;
  captionSource: "ai" | "user";
  category: string | null;
  takenAt: string;
  location: string | null;
  syncStatus: string;
  media: MediaDTO[];
  createdAt: string;
  updatedAt: string;
}

export async function toEntryDTO(
  entry: Entry,
  media: EntryMedia[],
  ctx?: StorageCtx,
): Promise<EntryDTO> {
  const storage = getStorage();
  const mediaDtos = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      position: m.position,
      kind: m.kind,
      url: await storage.getUrl(m.userId, m.storageRef, ctx),
      thumbnailUrl: m.thumbnailRef ? await storage.getUrl(m.userId, m.thumbnailRef, ctx) : null,
      durationSec: m.durationSec,
    })),
  );
  return {
    id: entry.id,
    clientEntryId: entry.clientEntryId,
    caption: entry.caption,
    captionSource: entry.captionSource,
    category: entry.category,
    takenAt: entry.takenAt.toISOString(),
    location: entry.location,
    syncStatus: entry.syncStatus,
    media: mediaDtos,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

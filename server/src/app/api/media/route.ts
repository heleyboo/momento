import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { getStorage } from "@/lib/storage/get-storage";
import { resolveStorageCtx } from "@/lib/storage/build-storage-ctx";
import { parseMultipart } from "@/lib/storage/multipart-stream";
import { sniffMime, isAllowedMime } from "@/lib/storage/media-types";
import { buildObjectKey } from "@/lib/storage/object-key";
import { findStagedMedia, insertStagedMedia } from "@/lib/entries/media-queries";

// POST /api/media — stage ONE media for a multi-media post (collection root; the
// GET serve route lives at [...ref]). The media is stored + recorded in
// entry_media with entry_id NULL; POST /api/entries finalize promotes it later.
// Idempotent per (user, clientEntryId, mediaClientId): a re-stage returns the
// existing record without re-writing bytes. Quota is NOT reserved here — finalize
// reserves the post total, so abandoned stages cost only disk (no quota leak).

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 314572800); // 300 MB

const metaSchema = z.object({
  clientEntryId: z.string().uuid(),
  mediaClientId: z.string().uuid(),
  kind: z.enum(["photo", "video"]),
  durationSec: z.number().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  let parsed;
  try {
    parsed = await parseMultipart(req, MAX_UPLOAD_BYTES);
  } catch {
    return NextResponse.json({ error: "invalid multipart body" }, { status: 400 });
  }
  if (parsed.tooLarge) {
    return NextResponse.json({ error: "file exceeds size limit" }, { status: 413 });
  }

  const meta = metaSchema.safeParse(safeJson(parsed.fields.meta));
  if (!meta.success) return NextResponse.json({ error: "invalid meta" }, { status: 400 });

  // Idempotent replay: already staged → return without touching storage.
  const existing = await findStagedMedia(auth.userId, meta.data.clientEntryId, meta.data.mediaClientId);
  if (existing) {
    return NextResponse.json({ mediaClientId: existing.mediaClientId, kind: existing.kind }, { status: 200 });
  }

  const media = parsed.files.media;
  if (!media) return NextResponse.json({ error: "media required" }, { status: 400 });

  const mediaMime = sniffMime(media.buffer);
  if (!mediaMime || !isAllowedMime(mediaMime)) {
    return NextResponse.json({ error: "unsupported media type" }, { status: 415 });
  }
  const poster = parsed.files.poster?.buffer;

  // Resolve Drive ctx (401 on bad/missing token) BEFORE writing bytes.
  const ctxr = await resolveStorageCtx(auth.userId, parsed.fields.driveToken);
  if (ctxr.error) return ctxr.error;

  const storage = getStorage();
  const { key } = buildObjectKey(auth.userId, new Date());
  let stored;
  try {
    stored = await storage.put(
      { userId: auth.userId, key, bytes: media.buffer, mime: mediaMime, thumbnail: true, posterBytes: poster },
      ctxr.ctx,
    );
  } catch {
    return NextResponse.json({ error: "storage write failed" }, { status: 500 });
  }

  const row = await insertStagedMedia({
    userId: auth.userId,
    clientEntryId: meta.data.clientEntryId,
    mediaClientId: meta.data.mediaClientId,
    entryId: null,
    kind: meta.data.kind,
    storageProvider: storage.name,
    storageRef: stored.ref,
    thumbnailRef: stored.thumbnailRef ?? null,
    durationSec: meta.data.durationSec ?? null,
    sizeBytes: media.buffer.length,
  });

  return NextResponse.json({ mediaClientId: row.mediaClientId, kind: row.kind }, { status: 201 });
}

function safeJson(s: string | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

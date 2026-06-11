import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { getUserSettings } from "@/lib/settings/get-user-settings";
import { captionFromFrame } from "@/lib/ai/caption-from-frame";
import { coerceCategory } from "@/lib/ai/caption-prompt";
import { getStorage } from "@/lib/storage/get-storage";
import { parseMultipart } from "@/lib/storage/multipart-stream";
import { sniffMime, isAllowedMime } from "@/lib/storage/media-types";
import { buildObjectKey } from "@/lib/storage/object-key";
import {
  insertEntryIdempotent,
  listEntries,
  reserveQuota,
  releaseQuota,
} from "@/lib/entries/entry-queries";
import { toEntryDTO } from "@/lib/entries/entry-dto";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 314572800); // 300 MB

const metaSchema = z.object({
  clientEntryId: z.string().uuid(),
  kind: z.enum(["photo", "video"]),
  takenAt: z.string().datetime(),
  location: z.string().max(300).optional(),
  durationSec: z.number().nonnegative().optional(),
  caption: z.string().max(500).optional(),
  captionSource: z.enum(["ai", "user"]).optional(),
  category: z.string().max(40).optional(),
});

// GET /api/entries — newest-first list for the session user.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const rows = await listEntries(auth.userId);
  const dtos = await Promise.all(rows.map(toEntryDTO));
  return NextResponse.json({ entries: dtos });
}

// POST /api/entries — create (stream upload + caption + idempotent persist).
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

  const media = parsed.files.media;
  if (!media) return NextResponse.json({ error: "media required" }, { status: 400 });

  const mediaMime = sniffMime(media.buffer);
  if (!mediaMime || !isAllowedMime(mediaMime)) {
    return NextResponse.json({ error: "unsupported media type" }, { status: 415 });
  }

  const poster = parsed.files.poster?.buffer;
  const settings = await getUserSettings(auth.userId);

  // Caption: honor a user-provided caption; otherwise ask the model (online).
  let caption = meta.data.caption ?? null;
  let captionSource = meta.data.captionSource ?? "ai";
  let category: string | null = null;
  const captionInput = poster ?? (mediaMime.startsWith("image/") ? media.buffer : null);
  if (!caption && settings.aiCaption && captionInput) {
    try {
      const r = await captionFromFrame(
        captionInput,
        { captionLang: settings.captionLang, captionLength: settings.captionLength },
        sniffMime(captionInput) ?? "image/jpeg",
      );
      caption = r.caption;
      category = r.category;
      captionSource = "ai";
    } catch {
      // Non-fatal: persist without a caption; iOS can retry/caption later.
    }
  } else if (caption) {
    category = coerceCategory(meta.data.category ?? null);
  }

  // Reserve quota before writing bytes.
  if (!(await reserveQuota(auth.userId, media.buffer.length))) {
    return NextResponse.json({ error: "storage quota exceeded" }, { status: 507 });
  }

  const storage = getStorage();
  const { key } = buildObjectKey(auth.userId, new Date(meta.data.takenAt));
  let stored;
  try {
    stored = await storage.put({
      userId: auth.userId,
      key,
      bytes: media.buffer,
      mime: mediaMime,
      thumbnail: true,
      posterBytes: poster,
    });
  } catch {
    await releaseQuota(auth.userId, media.buffer.length);
    return NextResponse.json({ error: "storage write failed" }, { status: 500 });
  }

  try {
    const { entry, created } = await insertEntryIdempotent({
      userId: auth.userId,
      clientEntryId: meta.data.clientEntryId,
      storageProvider: storage.name,
      storageRef: stored.ref,
      thumbnailRef: stored.thumbnailRef ?? null,
      kind: meta.data.kind,
      caption,
      captionSource,
      category,
      takenAt: new Date(meta.data.takenAt),
      location: meta.data.location ?? null,
      durationSec: meta.data.durationSec ?? null,
      syncStatus: "done",
    });

    if (!created) {
      // Idempotent replay: discard the bytes we just wrote, return existing row.
      await storage.delete(auth.userId, stored.ref).catch(() => {});
      if (stored.thumbnailRef) await storage.delete(auth.userId, stored.thumbnailRef).catch(() => {});
      await releaseQuota(auth.userId, media.buffer.length);
      return NextResponse.json(await toEntryDTO(entry), { status: 200 });
    }
    return NextResponse.json(await toEntryDTO(entry), { status: 201 });
  } catch {
    // Insert failed after write → clean up the orphaned bytes + quota.
    await storage.delete(auth.userId, stored.ref).catch(() => {});
    if (stored.thumbnailRef) await storage.delete(auth.userId, stored.thumbnailRef).catch(() => {});
    await releaseQuota(auth.userId, media.buffer.length);
    return NextResponse.json({ error: "failed to persist entry" }, { status: 500 });
  }
}

function safeJson(s: string | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

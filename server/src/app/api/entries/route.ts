import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { getUserSettings } from "@/lib/settings/get-user-settings";
import { captionFromFrame } from "@/lib/ai/caption-from-frame";
import { coerceCategory } from "@/lib/ai/caption-prompt";
import { getStorage } from "@/lib/storage/get-storage";
import { resolveStorageCtx, driveTokenFromHeader } from "@/lib/storage/build-storage-ctx";
import { parseMultipart } from "@/lib/storage/multipart-stream";
import { sniffMime, isAllowedMime } from "@/lib/storage/media-types";
import { buildObjectKey } from "@/lib/storage/object-key";
import {
  insertEntryIdempotent,
  searchEntries,
  reserveQuota,
  releaseQuota,
  type EntryFilters,
} from "@/lib/entries/entry-queries";
import { CATEGORIES } from "@/lib/ai/caption-prompt";
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

const filterSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  kind: z.enum(["photo", "video"]).optional(),
  cat: z.enum(CATEGORIES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// GET /api/entries[?q=&kind=&cat=&from=&to=] — newest-first list/search.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const sp = req.nextUrl.searchParams;
  const parsed = filterSchema.safeParse({
    q: sp.get("q") ?? undefined,
    kind: sp.get("kind") ?? undefined,
    cat: sp.get("cat") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid filters" }, { status: 400 });

  const filters: EntryFilters = {
    q: parsed.data.q,
    kind: parsed.data.kind,
    cat: parsed.data.cat,
    from: parsed.data.from ? new Date(parsed.data.from) : undefined,
    to: parsed.data.to ? new Date(parsed.data.to) : undefined,
  };

  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;
  const rows = await searchEntries(auth.userId, filters);
  const dtos = await Promise.all(rows.map((r) => toEntryDTO(r, ctxr.ctx)));
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

  // Resolve Drive ctx (401 on bad/missing token) BEFORE reserving quota.
  const ctxr = await resolveStorageCtx(auth.userId, parsed.fields.driveToken);
  if (ctxr.error) return ctxr.error;
  const ctx = ctxr.ctx;

  // Reserve quota before writing bytes.
  if (!(await reserveQuota(auth.userId, media.buffer.length))) {
    return NextResponse.json({ error: "storage quota exceeded" }, { status: 507 });
  }

  const storage = getStorage();
  const { key } = buildObjectKey(auth.userId, new Date(meta.data.takenAt));
  let stored;
  try {
    stored = await storage.put(
      {
        userId: auth.userId,
        key,
        bytes: media.buffer,
        mime: mediaMime,
        thumbnail: true,
        posterBytes: poster,
      },
      ctx,
    );
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
      sizeBytes: media.buffer.length,
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
      await storage.delete(auth.userId, stored.ref, ctx).catch(() => {});
      if (stored.thumbnailRef) await storage.delete(auth.userId, stored.thumbnailRef, ctx).catch(() => {});
      await releaseQuota(auth.userId, media.buffer.length);
      return NextResponse.json(await toEntryDTO(entry, ctx), { status: 200 });
    }
    return NextResponse.json(await toEntryDTO(entry, ctx), { status: 201 });
  } catch {
    // Insert failed after write → clean up the orphaned bytes + quota.
    await storage.delete(auth.userId, stored.ref, ctx).catch(() => {});
    if (stored.thumbnailRef) await storage.delete(auth.userId, stored.thumbnailRef, ctx).catch(() => {});
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

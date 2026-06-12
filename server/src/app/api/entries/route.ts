import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";
import { getUserSettings } from "@/lib/settings/get-user-settings";
import { captionFromFrame } from "@/lib/ai/caption-from-frame";
import { coerceCategory, CATEGORIES } from "@/lib/ai/caption-prompt";
import { getStorage } from "@/lib/storage/get-storage";
import { LocalStorageAdapter } from "@/lib/storage/local-adapter";
import { sniffMime } from "@/lib/storage/media-types";
import { resolveStorageCtx, driveTokenFromHeader } from "@/lib/storage/build-storage-ctx";
import { type EntryFilters } from "@/lib/entries/entry-queries";
import {
  finalizePost,
  listEntriesWithMedia,
  findStagedMedia,
  FinalizeError,
} from "@/lib/entries/media-queries";
import { toEntryDTO } from "@/lib/entries/entry-dto";

const filterSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  kind: z.enum(["photo", "video"]).optional(),
  cat: z.enum(CATEGORIES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// GET /api/entries[?q=&kind=&cat=&from=&to=] — newest-first posts, each with media[].
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
  const rows = await listEntriesWithMedia(auth.userId, filters);
  const dtos = await Promise.all(rows.map((r) => toEntryDTO(r.entry, r.media, ctxr.ctx)));
  return NextResponse.json({ entries: dtos });
}

const finalizeSchema = z.object({
  clientEntryId: z.string().uuid(),
  takenAt: z.string().datetime(),
  caption: z.string().max(500).optional(),
  captionSource: z.enum(["ai", "user"]).optional(),
  category: z.string().max(40).optional(),
  location: z.string().max(300).optional(),
  // Ordered list of staged mediaClientIds — array index = position. 1..20.
  media: z.array(z.string().uuid()).min(1).max(20),
});

// POST /api/entries — finalize: promote staged media into a post. The media bytes
// were already uploaded via POST /api/media; this is a small JSON request.
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const body = await parseJsonBody(req, finalizeSchema);
  if (isBodyError(body)) return body.error;
  const data = body.data;

  // Caption: honor client caption; otherwise best-effort server caption from the
  // cover (first media) — local provider + photo cover only, non-fatal on failure.
  let caption = data.caption ?? null;
  let captionSource = data.captionSource ?? "ai";
  let category: string | null = data.category ? coerceCategory(data.category) : null;

  if (!caption) {
    const settings = await getUserSettings(auth.userId);
    if (settings.aiCaption) {
      const cover = await findStagedMedia(auth.userId, data.clientEntryId, data.media[0]);
      const storage = getStorage();
      if (cover && cover.kind === "photo" && storage instanceof LocalStorageAdapter) {
        try {
          const bytes = await storage.read(cover.storageRef);
          const r = await captionFromFrame(
            bytes,
            { captionLang: settings.captionLang, captionLength: settings.captionLength },
            sniffMime(bytes) ?? "image/jpeg",
          );
          caption = r.caption;
          category = r.category;
          captionSource = "ai";
        } catch {
          // Non-fatal: persist without an AI caption.
        }
      }
    }
  }

  try {
    const { entry, media, created } = await finalizePost(
      {
        userId: auth.userId,
        clientEntryId: data.clientEntryId,
        caption,
        captionSource,
        category,
        takenAt: new Date(data.takenAt),
        location: data.location ?? null,
        syncStatus: "done",
      },
      data.media,
    );
    const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
    if (ctxr.error) return ctxr.error;
    return NextResponse.json(await toEntryDTO(entry, media, ctxr.ctx), {
      status: created ? 201 : 200,
    });
  } catch (e) {
    if (e instanceof FinalizeError) {
      const status = e.code === "count_mismatch" ? 409 : e.code === "too_large" ? 413 : 507;
      return NextResponse.json({ error: e.message }, { status });
    }
    throw e;
  }
}

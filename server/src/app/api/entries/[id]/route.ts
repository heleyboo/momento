import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";
import { coerceCategory } from "@/lib/ai/caption-prompt";
import { getStorage } from "@/lib/storage/get-storage";
import { resolveStorageCtx, driveTokenFromHeader } from "@/lib/storage/build-storage-ctx";
import {
  updateOwnedEntry,
  releaseQuota,
  userOwnsAlbum,
  attachEntryToAlbum,
} from "@/lib/entries/entry-queries";
import { getEntryWithMedia, deleteEntryWithMedia } from "@/lib/entries/media-queries";
import { toEntryDTO } from "@/lib/entries/entry-dto";

// GET detail / PATCH edit / DELETE remove — all owner-scoped (404 on miss).

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const { id } = await params;
  const found = await getEntryWithMedia(auth.userId, id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;
  return NextResponse.json(await toEntryDTO(found.entry, found.media, ctxr.ctx));
}

const patchSchema = z.object({
  caption: z.string().max(500).optional(),
  category: z.string().max(40).optional(),
  albumId: z.string().uuid().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const { id } = await params;

  const body = await parseJsonBody(req, patchSchema);
  if (isBodyError(body)) return body.error;

  // Cross-object IDOR guard: an attached album must also belong to the caller.
  if (body.data.albumId) {
    if (!(await userOwnsAlbum(auth.userId, body.data.albumId))) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  // A user-supplied caption edit marks the source as 'user' (wins over AI).
  const patch: { caption?: string; captionSource?: "ai" | "user"; category?: string } = {};
  if (body.data.caption !== undefined) {
    patch.caption = body.data.caption;
    patch.captionSource = "user";
  }
  if (body.data.category !== undefined) patch.category = coerceCategory(body.data.category);

  const updated = await updateOwnedEntry(auth.userId, id, patch);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.data.albumId) await attachEntryToAlbum(updated.id, body.data.albumId);

  const found = await getEntryWithMedia(auth.userId, id);
  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;
  return NextResponse.json(await toEntryDTO(updated, found?.media ?? [], ctxr.ctx));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const { id } = await params;

  // Resolve storage ctx first (401 on bad Drive token) so we don't delete the
  // row and then fail to clean up its bytes.
  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;

  // Collect the post's media (refs + sizes) then delete the row (cascade clears
  // entry_media). Best-effort byte cleanup + quota release for every media item.
  const removed = await deleteEntryWithMedia(auth.userId, id);
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });

  const storage = getStorage();
  let freed = 0;
  for (const m of removed.media) {
    await storage.delete(auth.userId, m.storageRef, ctxr.ctx).catch(() => {});
    if (m.thumbnailRef) await storage.delete(auth.userId, m.thumbnailRef, ctxr.ctx).catch(() => {});
    freed += m.sizeBytes ?? 0;
  }
  if (freed > 0) await releaseQuota(auth.userId, freed);

  return new NextResponse(null, { status: 204 });
}

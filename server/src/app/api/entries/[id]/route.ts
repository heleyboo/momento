import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";
import { coerceCategory } from "@/lib/ai/caption-prompt";
import { getStorage } from "@/lib/storage/get-storage";
import { resolveStorageCtx, driveTokenFromHeader } from "@/lib/storage/build-storage-ctx";
import {
  getOwnedEntry,
  updateOwnedEntry,
  deleteOwnedEntry,
  releaseQuota,
  userOwnsAlbum,
  attachEntryToAlbum,
} from "@/lib/entries/entry-queries";
import { toEntryDTO } from "@/lib/entries/entry-dto";

// GET detail / PATCH edit / DELETE remove — all owner-scoped (404 on miss).

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const { id } = await params;
  const entry = await getOwnedEntry(auth.userId, id);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;
  return NextResponse.json(await toEntryDTO(entry, ctxr.ctx));
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

  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;
  return NextResponse.json(await toEntryDTO(updated, ctxr.ctx));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const { id } = await params;

  // Resolve storage ctx first (401 on bad Drive token) so we don't delete the
  // row and then fail to clean up its bytes.
  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;

  // Delete the row first (within the owner check); then best-effort storage
  // cleanup + quota release. Order avoids a live row pointing at deleted bytes.
  const removed = await deleteOwnedEntry(auth.userId, id);
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });

  const storage = getStorage();
  await storage.delete(auth.userId, removed.storageRef, ctxr.ctx).catch(() => {});
  if (removed.thumbnailRef) {
    await storage.delete(auth.userId, removed.thumbnailRef, ctxr.ctx).catch(() => {});
  }
  if (removed.sizeBytes) await releaseQuota(auth.userId, removed.sizeBytes);

  return new NextResponse(null, { status: 204 });
}

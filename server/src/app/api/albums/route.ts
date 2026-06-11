import { NextRequest, NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { albumSummaries } from "@/lib/entries/album-queries";
import { getStorage } from "@/lib/storage/get-storage";
import { resolveStorageCtx, driveTokenFromHeader } from "@/lib/storage/build-storage-ctx";

// GET /api/albums — v1 albums = entries grouped by category, each with a count
// and a cover (latest entry's thumbnail, falling back to its media).
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const ctxr = await resolveStorageCtx(auth.userId, driveTokenFromHeader(req));
  if (ctxr.error) return ctxr.error;

  const storage = getStorage();
  const rows = await albumSummaries(auth.userId);
  const albums = await Promise.all(
    rows.map(async (r) => {
      const coverRef = r.coverThumbnailRef ?? r.coverStorageRef;
      const coverUrl = coverRef ? await storage.getUrl(auth.userId, coverRef, ctxr.ctx) : null;
      return {
        category: r.category,
        count: r.count,
        coverEntryId: r.coverEntryId,
        coverUrl,
      };
    }),
  );
  return NextResponse.json({ albums });
}

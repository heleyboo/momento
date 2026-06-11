import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage/get-storage";
import { LocalStorageAdapter } from "@/lib/storage/local-adapter";
import { isValidRef } from "@/lib/storage/object-key";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { findOwnedEntryByRef } from "@/lib/entries/entry-queries";

// Auth-gated media stream for the `local` provider. Cloud providers (s3/gcs/drive)
// return signed URLs from getUrl() and do not route through here.
//
// Catch-all `[...ref]` so the slash-separated ref (`userId/yyyy/mm/<uuid>.<ext>`)
// arrives as path segments — no percent-encoding of separators needed.
//
// Security: requires a valid session, then resolves ownership from the DB
// (entries.storage_ref → user_id == session). Ownership is NOT trusted from the
// ref's userId prefix. Any miss returns 404 (not 403) to avoid an existence oracle.

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webp: "image/webp",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string[] }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const { ref: segments } = await params;
  const ref = (segments ?? []).map((s) => decodeURIComponent(s)).join("/");

  if (!isValidRef(ref)) {
    // 404 (not 403) to avoid leaking which refs exist.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // DB-backed ownership: the requester must own the entry that holds this ref
  // (matches either the media or thumbnail ref).
  const owned = await findOwnedEntryByRef(auth.userId, ref);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const storage = getStorage();
  if (!(storage instanceof LocalStorageAdapter)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await storage.read(ref);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ext = ref.split(".").pop() ?? "";
  const contentType = EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "attachment",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

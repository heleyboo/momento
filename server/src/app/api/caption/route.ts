import { NextRequest, NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { getUserSettings } from "@/lib/settings/get-user-settings";
import { captionFromFrame } from "@/lib/ai/caption-from-frame";
import { sniffMime } from "@/lib/storage/media-types";

// POST /api/caption — poster-only, fast. Powers the capture-time shimmer in the
// iOS Review sheet (online). Body = raw image bytes (image/jpeg|png|heic).
// No media store, no DB write.

const MAX_POSTER_BYTES = 8 * 1024 * 1024; // 8 MB — a poster frame, not full media

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_POSTER_BYTES) {
    return NextResponse.json({ error: "poster too large" }, { status: 413 });
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_POSTER_BYTES) {
    return NextResponse.json({ error: "poster too large or empty" }, { status: 413 });
  }

  const mime = sniffMime(bytes);
  if (!mime || !mime.startsWith("image/")) {
    return NextResponse.json({ error: "poster must be an image" }, { status: 400 });
  }

  const settings = await getUserSettings(auth.userId);
  try {
    const result = await captionFromFrame(
      bytes,
      { captionLang: settings.captionLang, captionLength: settings.captionLength },
      mime,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "caption generation failed" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyGoogleIdToken } from "@/lib/auth/verify-google-id-token";
import { upsertUserFromGoogle, issueRefreshToken } from "@/lib/auth/auth-service";
import { signAccessToken } from "@/lib/auth/session-jwt";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";

// POST /api/auth/google — exchange a Google ID token for an app session.
const bodySchema = z.object({ idToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, bodySchema);
  if (isBodyError(parsed)) return parsed.error;

  const identity = await verifyGoogleIdToken(parsed.data.idToken);
  if (!identity) {
    return NextResponse.json({ error: "invalid Google ID token" }, { status: 401 });
  }

  const user = await upsertUserFromGoogle(identity);
  const [token, refreshToken] = await Promise.all([
    signAccessToken(user.id),
    issueRefreshToken(user.id),
  ]);

  return NextResponse.json({ token, refreshToken, user });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeRefreshToken, revokeRefreshToken } from "@/lib/auth/auth-service";
import { signAccessToken } from "@/lib/auth/session-jwt";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";

// POST /api/auth/refresh   { refreshToken } -> { token }      (new access token)
// DELETE /api/auth/refresh { refreshToken } -> 204            (sign out / revoke)
const bodySchema = z.object({ refreshToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, bodySchema);
  if (isBodyError(parsed)) return parsed.error;
  const userId = await consumeRefreshToken(parsed.data.refreshToken);
  if (!userId) {
    return NextResponse.json({ error: "invalid refresh token" }, { status: 401 });
  }
  const token = await signAccessToken(userId);
  return NextResponse.json({ token });
}

export async function DELETE(req: NextRequest) {
  const parsed = await parseJsonBody(req, bodySchema);
  if (isBodyError(parsed)) return parsed.error;
  await revokeRefreshToken(parsed.data.refreshToken);
  return new NextResponse(null, { status: 204 });
}

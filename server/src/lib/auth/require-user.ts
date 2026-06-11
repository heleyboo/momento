import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./session-jwt";

// Extracts + verifies the Bearer access token. Returns the userId, or a 401
// NextResponse to return directly from the handler.

export async function requireUser(
  req: NextRequest,
): Promise<{ userId: string } | { error: NextResponse }> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const userId = await verifyAccessToken(match[1]);
  if (!userId) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { userId };
}

export function isAuthError(
  r: { userId: string } | { error: NextResponse },
): r is { error: NextResponse } {
  return "error" in r;
}

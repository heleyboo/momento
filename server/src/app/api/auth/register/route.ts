import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";
import { registerWithPassword, AuthError } from "@/lib/auth/password-auth-service";
import { issueRefreshToken } from "@/lib/auth/auth-service";
import { signAccessToken } from "@/lib/auth/session-jwt";

// POST /api/auth/register { email, password, name? } → session.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const body = await parseJsonBody(req, schema);
  if (isBodyError(body)) return body.error;

  try {
    const user = await registerWithPassword(body.data.email, body.data.password, body.data.name);
    const [token, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      issueRefreshToken(user.id),
    ]);
    return NextResponse.json({ token, refreshToken, user }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "email already registered" }, { status: 409 });
    }
    throw e;
  }
}

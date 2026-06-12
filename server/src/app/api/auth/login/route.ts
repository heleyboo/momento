import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";
import { loginWithPassword, AuthError } from "@/lib/auth/password-auth-service";
import { issueRefreshToken } from "@/lib/auth/auth-service";
import { signAccessToken } from "@/lib/auth/session-jwt";

// POST /api/auth/login { email, password } → session.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await parseJsonBody(req, schema);
  if (isBodyError(body)) return body.error;

  try {
    const user = await loginWithPassword(body.data.email, body.data.password);
    const [token, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      issueRefreshToken(user.id),
    ]);
    return NextResponse.json({ token, refreshToken, user });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }
    throw e;
  }
}

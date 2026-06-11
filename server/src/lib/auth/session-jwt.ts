import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "node:crypto";

// Short-lived access JWT + opaque refresh token. The refresh token is stored
// hashed in the DB (refresh_tokens) so a session can be revoked. Access tokens
// are stateless and intentionally short so a leak has a small window.

const ACCESS_TTL_SEC = 60 * 30; // 30 minutes
export const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET missing or too short");
  }
  return new TextEncoder().encode(s);
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());
}

/** Returns the userId (`sub`) or null if the token is invalid/expired. */
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Generate an opaque refresh token (returned to client) + its DB hash. */
export function newRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
  };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

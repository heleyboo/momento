import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { users, settings, refreshTokens } from "@/db/schema";
import type { GoogleIdentity } from "./verify-google-id-token";
import { newRefreshToken, hashRefreshToken } from "./session-jwt";

// User upsert + default settings seed + refresh-token persistence/rotation.

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export async function upsertUserFromGoogle(identity: GoogleIdentity): Promise<SessionUser> {
  const [row] = await db
    .insert(users)
    .values({
      googleSub: identity.googleSub,
      email: identity.email,
      name: identity.name ?? null,
      avatarUrl: identity.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.googleSub,
      set: { email: identity.email, name: identity.name ?? null, avatarUrl: identity.avatarUrl ?? null },
    })
    .returning();

  // Seed default settings on first sign-in (idempotent).
  await db.insert(settings).values({ userId: row.id }).onConflictDoNothing();

  return { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatarUrl };
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const { token, hash, expiresAt } = newRefreshToken();
  await db.insert(refreshTokens).values({ userId, tokenHash: hash, expiresAt });
  return token;
}

/** Validate an opaque refresh token; returns the owning userId or null. */
export async function consumeRefreshToken(token: string): Promise<string | null> {
  const hash = hashRefreshToken(token);
  const [row] = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row?.userId ?? null;
}

/** Revoke a single refresh token (sign-out). */
export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashRefreshToken(token)));
}

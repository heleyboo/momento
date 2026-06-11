import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { signAccessToken, verifyAccessToken } from "../src/lib/auth/session-jwt";
import { verifyGoogleIdToken } from "../src/lib/auth/verify-google-id-token";
import {
  upsertUserFromGoogle,
  issueRefreshToken,
  consumeRefreshToken,
  revokeRefreshToken,
} from "../src/lib/auth/auth-service";

// Phase 2 verification: JWT roundtrip, Google-token rejection, user upsert +
// settings seed, refresh issue/consume/revoke. Cleans up its own test user.
async function main() {
  // 1. Access JWT roundtrip
  const uid = "00000000-0000-0000-0000-0000000000a2";
  const token = await signAccessToken(uid);
  if ((await verifyAccessToken(token)) !== uid) throw new Error("JWT roundtrip failed");
  if ((await verifyAccessToken("garbage.token.here")) !== null) throw new Error("bad JWT accepted");
  console.log("[auth] access JWT roundtrip + rejection ok");

  // 2. Google ID token verification rejects garbage
  if ((await verifyGoogleIdToken("not-a-real-token")) !== null) {
    throw new Error("invalid Google token accepted");
  }
  console.log("[auth] invalid Google ID token rejected ok");

  // 3. Upsert user + seed settings (idempotent)
  const identity = { googleSub: "test-sub-phase2", email: "p2@example.com", name: "P2" };
  const u1 = await upsertUserFromGoogle(identity);
  const u2 = await upsertUserFromGoogle(identity); // second call must not duplicate
  if (u1.id !== u2.id) throw new Error("user upsert duplicated");
  console.log("[auth] user upsert idempotent + settings seeded ok:", u1.id);

  // 4. Refresh token issue → consume → revoke → consume(null)
  const rt = await issueRefreshToken(u1.id);
  if ((await consumeRefreshToken(rt)) !== u1.id) throw new Error("refresh consume failed");
  await revokeRefreshToken(rt);
  if ((await consumeRefreshToken(rt)) !== null) throw new Error("revoked refresh still valid");
  console.log("[auth] refresh issue/consume/revoke ok");

  // cleanup (cascades settings + refresh_tokens)
  await db.delete(users).where(eq(users.id, u1.id));
  console.log("[auth] ALL PASS");
  process.exit(0);
}

main().catch((err) => {
  console.error("[auth] FAILED:", err);
  process.exit(1);
});

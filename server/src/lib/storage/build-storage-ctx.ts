import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { StorageCtx } from "./provider";
import { providerNeedsDriveToken } from "./get-storage";
import { verifyDriveToken } from "@/lib/auth/verify-drive-token";

// Builds the per-request StorageCtx. Only the `drive` provider needs one: it
// requires the user's forwarded Drive token + expected Google subject. The
// token is validated ONCE here (not per object) and the result memoized on the
// ctx. For app-owned providers (local/s3/gcs) this returns undefined.

export class DriveTokenError extends Error {}

export async function buildStorageCtx(
  userId: string,
  driveToken: string | undefined,
): Promise<StorageCtx | undefined> {
  if (!providerNeedsDriveToken()) return undefined;
  if (!driveToken) throw new DriveTokenError("Drive access token required");

  const [row] = await db
    .select({ googleSub: users.googleSub })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.googleSub) throw new DriveTokenError("user has no linked Google account");

  const check = await verifyDriveToken(driveToken, row.googleSub);
  if (!check.ok) throw new DriveTokenError(check.reason ?? "Drive token rejected");

  return { driveToken, expectedGoogleSub: row.googleSub, driveTokenValidated: true };
}

/** Reads the forwarded Drive token from a request header (used on read paths). */
export function driveTokenFromHeader(req: Request): string | undefined {
  return req.headers.get("x-drive-token") ?? undefined;
}

/**
 * Route-friendly wrapper: returns the ctx, or a 401 NextResponse when the Drive
 * token is missing/invalid (only possible under the `drive` provider). For
 * app-owned providers `ctx` is undefined and there is never an error.
 */
export async function resolveStorageCtx(
  userId: string,
  driveToken: string | undefined,
): Promise<{ ctx?: StorageCtx; error?: NextResponse }> {
  try {
    return { ctx: await buildStorageCtx(userId, driveToken) };
  } catch (e) {
    if (e instanceof DriveTokenError) {
      return { error: NextResponse.json({ error: e.message }, { status: 401 }) };
    }
    throw e;
  }
}

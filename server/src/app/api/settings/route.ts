import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { parseJsonBody, isBodyError } from "@/lib/http/parse-json-body";

// GET /api/settings — current user's settings (seeded at sign-in).
// PATCH /api/settings — partial update of the toggles / AI prefs.

function dto(row: typeof settings.$inferSelect) {
  return {
    autoSync: row.autoSync,
    wifiOnly: row.wifiOnly,
    aiCaption: row.aiCaption,
    geoTag: row.geoTag,
    autoCategorize: row.autoCategorize,
    captionLang: row.captionLang,
    captionLength: row.captionLength,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;
  const [row] = await db.select().from(settings).where(eq(settings.userId, auth.userId)).limit(1);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(dto(row));
}

const patchSchema = z
  .object({
    autoSync: z.boolean(),
    wifiOnly: z.boolean(),
    aiCaption: z.boolean(),
    geoTag: z.boolean(),
    autoCategorize: z.boolean(),
    captionLang: z.enum(["vi", "en"]),
    captionLength: z.enum(["short", "medium", "long"]),
  })
  .partial();

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const body = await parseJsonBody(req, patchSchema);
  if (isBodyError(body)) return body.error;
  if (Object.keys(body.data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const [row] = await db
    .update(settings)
    .set(body.data)
    .where(eq(settings.userId, auth.userId))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(dto(row));
}

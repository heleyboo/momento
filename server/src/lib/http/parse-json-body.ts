import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";

// Parse + validate a JSON request body against a zod schema. Returns the typed
// data or a 400 NextResponse — mirrors `requireUser`'s discriminated-union shape.

export async function parseJsonBody<T>(
  req: NextRequest,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: "invalid request body" }, { status: 400 }) };
  }
  return { data: parsed.data };
}

export function isBodyError<T>(
  r: { data: T } | { error: NextResponse },
): r is { error: NextResponse } {
  return "error" in r;
}

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Liveness + DB connectivity probe.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: false, error: (err as Error).message },
      { status: 503 },
    );
  }
}

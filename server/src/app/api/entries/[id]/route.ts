import { NextRequest, NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth/require-user";
import { getOwnedEntry } from "@/lib/entries/entry-queries";
import { toEntryDTO } from "@/lib/entries/entry-dto";

// GET /api/entries/:id — detail for an owned entry. PATCH/DELETE land in Phase 7
// (built against the Detail edit/delete UI).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth.error;

  const { id } = await params;
  const entry = await getOwnedEntry(auth.userId, id);
  if (!entry) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(await toEntryDTO(entry));
}

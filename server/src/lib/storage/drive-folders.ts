import { sql, and, eq } from "drizzle-orm";
import type { drive_v3 } from "googleapis";
import { db } from "@/db/client";
import { driveFolders } from "@/db/schema";

// Durable Drive app-folder resolution. The `drive.file` scope can't reliably
// re-list app-created folders after a restart, so the created folder id is
// persisted in `drive_folders`. A per-(user,path) advisory lock serializes
// lookup-or-create so concurrent uploads can't create duplicate folders.

const APP_FOLDER = "Momento"; // flat layout: one app folder per user (v1)

export async function getOrCreateAppFolder(
  userId: string,
  drive: drive_v3.Drive,
): Promise<string> {
  return db.transaction(async (tx) => {
    // Serialize folder creation for this (user, path).
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId + ":" + APP_FOLDER}))`);

    const [existing] = await tx
      .select({ driveFileId: driveFolders.driveFileId })
      .from(driveFolders)
      .where(and(eq(driveFolders.userId, userId), eq(driveFolders.path, APP_FOLDER)))
      .limit(1);
    if (existing) return existing.driveFileId;

    const res = await drive.files.create({
      requestBody: { name: APP_FOLDER, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });
    const folderId = res.data.id;
    if (!folderId) throw new Error("drive folder create returned no id");

    await tx.insert(driveFolders).values({ userId, path: APP_FOLDER, driveFileId: folderId });
    return folderId;
  });
}

import { Readable } from "node:stream";
import { google, type drive_v3 } from "googleapis";
import type { PutInput, PutResult, StorageProvider, StorageCtx } from "./provider";
import { extForMime } from "./media-types";
import { makeThumbnail } from "./make-thumbnail";
import { verifyDriveToken } from "@/lib/auth/verify-drive-token";
import { getOrCreateAppFolder } from "./drive-folders";

// User-owned Google Drive (drive.file scope). The access token is forwarded per
// request via ctx and validated (aud/scope/sub) before any call. Files live
// flat inside a single per-user app folder; the entry `ref` is the Drive fileId
// (not a path), so isValidRef does not apply and these refs never hit the local
// media route — getUrl returns Drive's own link.

export class DriveStorageAdapter implements StorageProvider {
  readonly name = "drive" as const;

  private async client(ctx?: StorageCtx): Promise<drive_v3.Drive> {
    if (!ctx?.driveToken) throw new Error("drive token required");
    // Token is normally validated once per request in buildStorageCtx; only
    // re-validate here if it wasn't (defensive fallback).
    if (!ctx.driveTokenValidated) {
      if (!ctx.expectedGoogleSub) throw new Error("expected google sub required");
      const check = await verifyDriveToken(ctx.driveToken, ctx.expectedGoogleSub);
      if (!check.ok) throw new Error(`drive token rejected: ${check.reason}`);
    }
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: ctx.driveToken });
    return google.drive({ version: "v3", auth });
  }

  async put(input: PutInput, ctx?: StorageCtx): Promise<PutResult> {
    const ext = extForMime(input.mime);
    if (!ext) throw new Error(`unsupported mime: ${input.mime}`);
    const drive = await this.client(ctx);
    const parent = await getOrCreateAppFolder(input.userId, drive);
    const base = input.key.split("/").pop() ?? input.key; // uuid (flat name)

    const media = await drive.files.create({
      requestBody: { name: `${base}.${ext}`, parents: [parent] },
      media: { mimeType: input.mime, body: Readable.from(input.bytes) },
      fields: "id",
    });
    const ref = media.data.id;
    if (!ref) throw new Error("drive file create returned no id");

    let thumbnailRef: string | undefined;
    if (input.thumbnail) {
      const webp = await makeThumbnail(input.mime, input.bytes, input.posterBytes);
      if (webp) {
        try {
          const thumb = await drive.files.create({
            requestBody: { name: `${base}_thumb.webp`, parents: [parent] },
            media: { mimeType: "image/webp", body: Readable.from(webp) },
            fields: "id",
          });
          thumbnailRef = thumb.data.id ?? undefined;
        } catch {
          // Non-fatal: media already uploaded; entry simply has no thumbnail.
          thumbnailRef = undefined;
        }
      }
    }
    return { ref, thumbnailRef };
  }

  async getUrl(_userId: string, ref: string, ctx?: StorageCtx): Promise<string> {
    const drive = await this.client(ctx);
    const res = await drive.files.get({ fileId: ref, fields: "webContentLink, thumbnailLink" });
    const url = res.data.webContentLink ?? res.data.thumbnailLink;
    if (!url) throw new Error("drive file has no content link");
    return url;
  }

  async delete(_userId: string, ref: string, ctx?: StorageCtx): Promise<void> {
    const drive = await this.client(ctx);
    await drive.files.delete({ fileId: ref });
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { PutInput, PutResult, StorageProvider } from "./provider";
import { extForMime, isThumbnailable } from "./media-types";
import { isValidRef, resolveWithinBase } from "./object-key";

// Local filesystem adapter: writes bytes under STORAGE_LOCAL_DIR. `getUrl`
// returns the auth-gated stream route; ownership is enforced there (Phase 2).
export class LocalStorageAdapter implements StorageProvider {
  readonly name = "local" as const;
  private readonly baseDir: string;

  constructor(baseDir = process.env.STORAGE_LOCAL_DIR ?? "./.media") {
    this.baseDir = path.resolve(baseDir);
  }

  async put(input: PutInput): Promise<PutResult> {
    const ext = extForMime(input.mime);
    if (!ext) throw new Error(`unsupported mime: ${input.mime}`);

    const ref = `${input.key}.${ext}`;
    if (!isValidRef(ref)) throw new Error(`invalid object key: ${ref}`);

    const target = resolveWithinBase(this.baseDir, ref);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.bytes);

    // Thumbnail source: prefer the poster frame (always a decodable JPEG, and
    // required for video/HEIC); else the media itself if it's a sharp-decodable
    // raster. Thumbnail failure must NOT fail media persistence — the media is
    // already written, so a thumb error degrades to "no thumbnail".
    let thumbnailRef: string | undefined;
    const thumbSource = input.posterBytes ?? (isThumbnailable(input.mime) ? input.bytes : undefined);
    if (input.thumbnail && thumbSource) {
      try {
        const candidateRef = `${input.key}_thumb.webp`;
        const thumbTarget = resolveWithinBase(this.baseDir, candidateRef);
        const webp = await sharp(thumbSource)
          .resize(400, 400, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 72 })
          .toBuffer();
        await fs.writeFile(thumbTarget, webp);
        thumbnailRef = candidateRef;
      } catch {
        thumbnailRef = undefined; // media persists; entry simply has no thumbnail
      }
    }

    return { ref, thumbnailRef };
  }

  // Local bytes are served through the app's own auth-gated catch-all route.
  // ref segments (uuid/date/name.ext) are URL-safe, so no encoding is needed —
  // the slashes must stay real separators for the `[...ref]` route to match.
  async getUrl(_userId: string, ref: string): Promise<string> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    return `/api/media/${ref}`;
  }

  async delete(_userId: string, ref: string): Promise<void> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    const target = resolveWithinBase(this.baseDir, ref);
    await fs.rm(target, { force: true });
  }

  /** Read raw bytes for the stream route. Throws if ref is invalid/escapes base. */
  async read(ref: string): Promise<Buffer> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    const target = resolveWithinBase(this.baseDir, ref);
    return fs.readFile(target);
  }
}

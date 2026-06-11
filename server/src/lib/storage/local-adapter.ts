import { promises as fs } from "node:fs";
import path from "node:path";
import type { PutInput, PutResult, StorageProvider } from "./provider";
import { extForMime } from "./media-types";
import { makeThumbnail } from "./make-thumbnail";
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

    // Thumbnail (non-fatal): generated from poster/media via the shared helper.
    let thumbnailRef: string | undefined;
    if (input.thumbnail) {
      const webp = await makeThumbnail(input.mime, input.bytes, input.posterBytes);
      if (webp) {
        thumbnailRef = `${input.key}_thumb.webp`;
        await fs.writeFile(resolveWithinBase(this.baseDir, thumbnailRef), webp);
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

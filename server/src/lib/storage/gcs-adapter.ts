import { Storage } from "@google-cloud/storage";
import type { PutInput, PutResult, StorageProvider } from "./provider";
import { extForMime } from "./media-types";
import { makeThumbnail } from "./make-thumbnail";
import { isValidRef } from "./object-key";

// App-owned Google Cloud Storage. Objects keyed by ref; reads return v4 signed
// URLs (signed locally with the service-account key — no network round-trip).
const SIGNED_URL_TTL_MS = 3600 * 1000;

export class GcsStorageAdapter implements StorageProvider {
  readonly name = "gcs" as const;
  private readonly storage: Storage;
  private readonly bucket: string;

  constructor() {
    this.bucket = required("GCS_BUCKET");
    // Credentials resolve from GOOGLE_APPLICATION_CREDENTIALS or GCS_KEY_FILE.
    const keyFilename = process.env.GCS_KEY_FILE;
    this.storage = new Storage(keyFilename ? { keyFilename } : {});
  }

  async put(input: PutInput): Promise<PutResult> {
    const ext = extForMime(input.mime);
    if (!ext) throw new Error(`unsupported mime: ${input.mime}`);
    const ref = `${input.key}.${ext}`;
    if (!isValidRef(ref)) throw new Error(`invalid object key: ${ref}`);

    const bucket = this.storage.bucket(this.bucket);
    await bucket.file(ref).save(input.bytes, { contentType: input.mime, resumable: false });

    let thumbnailRef: string | undefined;
    if (input.thumbnail) {
      const webp = await makeThumbnail(input.mime, input.bytes, input.posterBytes);
      if (webp) {
        thumbnailRef = `${input.key}_thumb.webp`;
        await bucket.file(thumbnailRef).save(webp, { contentType: "image/webp", resumable: false });
      }
    }
    return { ref, thumbnailRef };
  }

  async getUrl(_userId: string, ref: string): Promise<string> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    const [url] = await this.storage
      .bucket(this.bucket)
      .file(ref)
      .getSignedUrl({ version: "v4", action: "read", expires: Date.now() + SIGNED_URL_TTL_MS });
    return url;
  }

  async delete(_userId: string, ref: string): Promise<void> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    await this.storage.bucket(this.bucket).file(ref).delete({ ignoreNotFound: true });
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not configured`);
  return v;
}

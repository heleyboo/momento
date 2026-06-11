// Storage ports & adapters. iOS is storage-agnostic; only the backend knows
// which provider holds the bytes. Switching providers = STORAGE_PROVIDER env.
//
// NOTE: `StorageCtx` is intentionally NOT finalized in Phase 1 — only `local`
// ships now and it needs no ctx. The Drive adapter (Phase 7) will add the
// forwarded-token / folder-id fields it actually requires.

export type StorageProviderName = "local" | "s3" | "gcs" | "drive";

export interface StorageCtx {
  // Reserved for provider-specific per-request data (e.g. Drive forwarded token).
  // Finalized in Phase 7.
  driveToken?: string;
}

export interface PutResult {
  /** Opaque reference stored on the entry row; resolves back to bytes via getUrl. */
  ref: string;
  /** Optional reference to a generated thumbnail. */
  thumbnailRef?: string;
}

export interface PutInput {
  userId: string;
  /** Logical object key, e.g. `userId/yyyy/mm/<uuid>`. Extension is derived from mime. */
  key: string;
  bytes: Buffer;
  /** Detected MIME (server-derived, never client filename). */
  mime: string;
  /** Whether to generate + store a thumbnail. */
  thumbnail?: boolean;
  /**
   * Poster-frame JPEG to derive the thumbnail from. Required for videos (sharp
   * can't thumbnail a video); for images the media bytes are used if omitted.
   */
  posterBytes?: Buffer;
}

export interface StorageProvider {
  readonly name: StorageProviderName;
  put(input: PutInput, ctx?: StorageCtx): Promise<PutResult>;
  /** Returns a URL (signed/redirect) or a route path the client can fetch. */
  getUrl(userId: string, ref: string, ctx?: StorageCtx): Promise<string>;
  delete(userId: string, ref: string, ctx?: StorageCtx): Promise<void>;
}

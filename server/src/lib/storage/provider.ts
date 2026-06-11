// Storage ports & adapters. iOS is storage-agnostic; only the backend knows
// which provider holds the bytes. Switching providers = STORAGE_PROVIDER env.

export type StorageProviderName = "local" | "s3" | "gcs" | "drive";

// Per-request context. Only the `drive` provider uses it: the user's Drive
// access token is forwarded per request (never persisted) and validated against
// the expected Google subject before any Drive call.
export interface StorageCtx {
  driveToken?: string;
  expectedGoogleSub?: string;
  // Set once per request after the Drive token is validated, so adapters don't
  // re-hit Google's tokeninfo per object on multi-object reads.
  driveTokenValidated?: boolean;
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

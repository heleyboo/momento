// Magic-byte MIME allowlist + server-derived extensions. Never trust a client
// filename or Content-Type — sniff the bytes. Used by the local adapter now and
// the streaming upload parser in Phase 3.

export const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
} as const;

export type AllowedMime = keyof typeof ALLOWED_MIME;

export function extForMime(mime: string): string | null {
  return (ALLOWED_MIME as Record<string, string>)[mime] ?? null;
}

export function isAllowedMime(mime: string): mime is AllowedMime {
  return mime in ALLOWED_MIME;
}

/**
 * Detect MIME from leading magic bytes for the allowlisted formats.
 * Returns null when the bytes don't match any allowed type.
 */
export function sniffMime(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  // ISO-BMFF box at offset 4: "ftyp" → mp4 / mov / heic, brand decides which.
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand.startsWith("qt")) return "video/quicktime";
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("mif1")) {
      return "image/heic";
    }
    return "video/mp4";
  }

  return null;
}

/**
 * MIME types sharp can reliably decode for thumbnailing with the default
 * prebuilt binary. HEIC is excluded — stock sharp ships without libheif, so a
 * HEIC buffer throws. HEIC media relies on the JPEG poster frame for its thumb.
 */
export function isThumbnailable(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png";
}

import sharp from "sharp";
import { isThumbnailable } from "./media-types";

// Shared thumbnail generation for all storage adapters. Prefers the poster
// frame (always a decodable JPEG; required for video/HEIC), else the media
// bytes if they're a sharp-decodable raster. Failure returns null — callers
// must treat a missing thumbnail as non-fatal (media already persisted).

export async function makeThumbnail(
  mediaMime: string,
  mediaBytes: Buffer,
  posterBytes?: Buffer,
): Promise<Buffer | null> {
  const source = posterBytes ?? (isThumbnailable(mediaMime) ? mediaBytes : undefined);
  if (!source) return null;
  try {
    return await sharp(source)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
  } catch {
    return null;
  }
}

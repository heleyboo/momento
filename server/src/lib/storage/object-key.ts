import { randomUUID } from "node:crypto";
import path from "node:path";

// Object-key construction + ref validation shared by adapters and the media route.

// Strict ref shape: `<userId>/<yyyy>/<mm>/<name>.<ext>`. Rejects traversal,
// absolute paths, null bytes, and stray separators before any FS access.
// name allows uuid + optional `_thumb`-style suffix (lowercase alnum/_/-).
const REF_RE = /^[0-9a-f-]+\/\d{4}\/\d{2}\/[a-z0-9_-]+\.[a-z0-9]+$/;

export function isValidRef(ref: string): boolean {
  return typeof ref === "string" && ref.length <= 256 && REF_RE.test(ref);
}

/** Build the logical key prefix `userId/yyyy/mm/<uuid>` (extension added by adapter). */
export function buildObjectKey(userId: string, takenAt: Date): { key: string; id: string } {
  const yyyy = String(takenAt.getUTCFullYear());
  const mm = String(takenAt.getUTCMonth() + 1).padStart(2, "0");
  const id = randomUUID();
  return { key: `${userId}/${yyyy}/${mm}/${id}`, id };
}

/**
 * Resolve a ref against a base dir and assert it stays inside (defense in depth
 * on top of isValidRef). Throws on escape.
 */
export function resolveWithinBase(baseDir: string, ref: string): string {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, ref);
  const rel = path.relative(base, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path escapes storage base");
  }
  return resolved;
}

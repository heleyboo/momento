import { promises as fs } from "node:fs";
import sharp from "sharp";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";
import { buildObjectKey } from "../src/lib/storage/object-key";
import { sniffMime } from "../src/lib/storage/media-types";

// Phase 1 success-criterion check: local adapter put → getUrl → read → delete,
// including thumbnail generation and magic-byte MIME sniffing. Throwaway script.
async function main() {
  const dir = "./.media";
  const adapter = new LocalStorageAdapter(dir);
  const userId = "00000000-0000-0000-0000-000000000001";

  // Generate a real JPEG so sharp + sniff have valid input.
  const jpeg = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 30, g: 77, b: 43 } },
  })
    .jpeg()
    .toBuffer();

  const mime = sniffMime(jpeg);
  if (mime !== "image/jpeg") throw new Error(`sniff failed: got ${mime}`);

  const { key } = buildObjectKey(userId, new Date("2026-06-11T00:00:00Z"));
  const { ref, thumbnailRef } = await adapter.put({ userId, key, bytes: jpeg, mime, thumbnail: true });
  console.log("[verify] put ok:", { ref, thumbnailRef });

  if (!thumbnailRef) throw new Error("thumbnail not generated");

  const url = await adapter.getUrl(userId, ref);
  if (!url.startsWith("/api/media/")) throw new Error(`unexpected url: ${url}`);
  console.log("[verify] getUrl ok:", url);

  const back = await adapter.read(ref);
  if (back.length !== jpeg.length) throw new Error("read length mismatch");
  console.log("[verify] read ok:", back.length, "bytes");

  // Traversal must be rejected.
  let rejected = false;
  try {
    await adapter.read("../../etc/passwd");
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("traversal ref was NOT rejected");
  console.log("[verify] traversal rejected ok");

  await adapter.delete(userId, ref);
  await adapter.delete(userId, thumbnailRef);
  console.log("[verify] delete ok");

  await fs.rm(dir, { recursive: true, force: true });
  console.log("[verify] ALL PASS");
}

main().catch((err) => {
  console.error("[verify] FAILED:", err);
  process.exit(1);
});

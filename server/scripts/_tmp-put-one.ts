import sharp from "sharp";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";
import { buildObjectKey } from "../src/lib/storage/object-key";
import { sniffMime } from "../src/lib/storage/media-types";

async function main() {
  const a = new LocalStorageAdapter("./.media");
  const uid = "00000000-0000-0000-0000-000000000009";
  const jpeg = await sharp({ create: { width: 48, height: 48, channels: 3, background: { r: 1, g: 2, b: 3 } } }).jpeg().toBuffer();
  const { key } = buildObjectKey(uid, new Date("2026-06-11T00:00:00Z"));
  const { ref, thumbnailRef } = await a.put({ userId: uid, key, bytes: jpeg, mime: sniffMime(jpeg)!, thumbnail: true });
  console.log(JSON.stringify({ ref, thumbnailRef, url: await a.getUrl(uid, ref), bytes: jpeg.length }));
}
main().catch((e) => { console.error(e); process.exit(1); });

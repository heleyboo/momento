import { Readable } from "node:stream";
import Busboy from "busboy";

// Multipart parser with a HARD per-file byte cap. Unlike App Router's
// request.formData() (which buffers the entire body with no size limit), this
// bounds each file to `maxBytesPerFile` and aborts early on overflow — a single
// request can't exceed the cap. NOTE: the accepted bytes are still fully
// materialized in memory (Buffer.concat) because downstream needs a Buffer for
// MIME sniffing + sharp + storage.put; memory ceiling = cap × concurrent
// uploads. True streaming-to-storage (or presigned direct upload) is the scale
// path — see Phase 7.

export interface ParsedFile {
  buffer: Buffer;
  mime: string; // client-declared; callers MUST re-sniff magic bytes.
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  files: Record<string, ParsedFile>;
  tooLarge: boolean; // a file exceeded maxBytesPerFile
}

export async function parseMultipart(
  req: Request,
  maxBytesPerFile: number,
): Promise<ParsedMultipart> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error("expected multipart/form-data");
  }
  if (!req.body) throw new Error("empty body");

  return new Promise<ParsedMultipart>((resolve, reject) => {
    const bb = Busboy({ headers: { "content-type": contentType }, limits: { fileSize: maxBytesPerFile } });
    const fields: Record<string, string> = {};
    const files: Record<string, ParsedFile> = {};
    let tooLarge = false;

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("limit", () => {
        tooLarge = true;
        stream.resume(); // drain remainder so the parser can finish
      });
      stream.on("end", () => {
        if (!tooLarge) files[name] = { buffer: Buffer.concat(chunks), mime: info.mimeType };
      });
    });

    bb.on("error", reject);
    bb.on("close", () => resolve({ fields, files, tooLarge }));

    Readable.fromWeb(req.body as never).pipe(bb);
  });
}

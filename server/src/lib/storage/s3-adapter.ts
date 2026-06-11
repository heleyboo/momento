import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PutInput, PutResult, StorageProvider } from "./provider";
import { extForMime } from "./media-types";
import { makeThumbnail } from "./make-thumbnail";
import { isValidRef } from "./object-key";

// App-owned S3 (or S3-compatible, e.g. MinIO) storage. Objects keyed by ref
// (`userId/yyyy/mm/<uuid>.<ext>`); reads return time-limited presigned URLs.
const SIGNED_URL_TTL_SEC = 3600;

export class S3StorageAdapter implements StorageProvider {
  readonly name = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.S3_REGION ?? "us-east-1";
    const endpoint = process.env.S3_ENDPOINT; // set for MinIO/non-AWS
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = required("S3_BUCKET");
    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async put(input: PutInput): Promise<PutResult> {
    const ext = extForMime(input.mime);
    if (!ext) throw new Error(`unsupported mime: ${input.mime}`);
    const ref = `${input.key}.${ext}`;
    if (!isValidRef(ref)) throw new Error(`invalid object key: ${ref}`);

    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: ref, Body: input.bytes, ContentType: input.mime }),
    );

    let thumbnailRef: string | undefined;
    if (input.thumbnail) {
      const webp = await makeThumbnail(input.mime, input.bytes, input.posterBytes);
      if (webp) {
        thumbnailRef = `${input.key}_thumb.webp`;
        await this.client.send(
          new PutObjectCommand({ Bucket: this.bucket, Key: thumbnailRef, Body: webp, ContentType: "image/webp" }),
        );
      }
    }
    return { ref, thumbnailRef };
  }

  async getUrl(_userId: string, ref: string): Promise<string> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: ref }), {
      expiresIn: SIGNED_URL_TTL_SEC,
    });
  }

  async delete(_userId: string, ref: string): Promise<void> {
    if (!isValidRef(ref)) throw new Error("invalid ref");
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: ref }));
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not configured`);
  return v;
}

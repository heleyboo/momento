import type { StorageProvider, StorageProviderName } from "./provider";
import { LocalStorageAdapter } from "./local-adapter";
import { S3StorageAdapter } from "./s3-adapter";
import { GcsStorageAdapter } from "./gcs-adapter";
import { DriveStorageAdapter } from "./drive-adapter";

// Factory: single source of truth for provider selection. Switching providers
// is an env change (STORAGE_PROVIDER) with zero changes elsewhere. Adapters are
// constructed lazily so unused providers don't require their env to be set.
let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;

  const provider = (process.env.STORAGE_PROVIDER ?? "local") as StorageProviderName;
  switch (provider) {
    case "local":
      cached = new LocalStorageAdapter();
      break;
    case "s3":
      cached = new S3StorageAdapter();
      break;
    case "gcs":
      cached = new GcsStorageAdapter();
      break;
    case "drive":
      cached = new DriveStorageAdapter();
      break;
    default:
      throw new Error(`unknown STORAGE_PROVIDER: ${provider}`);
  }
  return cached;
}

/** True when the active provider needs a forwarded Drive token per request. */
export function providerNeedsDriveToken(): boolean {
  return (process.env.STORAGE_PROVIDER ?? "local") === "drive";
}

// Test/hot-reload escape hatch.
export function resetStorage(): void {
  cached = null;
}

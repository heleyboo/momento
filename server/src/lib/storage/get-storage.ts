import type { StorageProvider, StorageProviderName } from "./provider";
import { LocalStorageAdapter } from "./local-adapter";

// Factory: single source of truth for provider selection. Phase 1 ships `local`;
// s3 / gcs / drive adapters register here in Phase 7.
let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;

  const provider = (process.env.STORAGE_PROVIDER ?? "local") as StorageProviderName;
  switch (provider) {
    case "local":
      cached = new LocalStorageAdapter();
      return cached;
    case "s3":
    case "gcs":
    case "drive":
      throw new Error(`storage provider "${provider}" not implemented yet (Phase 7)`);
    default:
      throw new Error(`unknown STORAGE_PROVIDER: ${provider}`);
  }
}

// Test/hot-reload escape hatch.
export function resetStorage(): void {
  cached = null;
}

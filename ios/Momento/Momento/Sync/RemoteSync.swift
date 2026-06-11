import Foundation
import SwiftData

// Pull-down: fetch server entries and upsert them into the local store by
// clientEntryId (the cross-device bridge). Locally-created entries are matched
// and marked done; entries from other devices are inserted as remote-only.
enum RemoteSync {
    @MainActor
    static func pull(api: EntriesAPI, into context: ModelContext) async {
        guard let dtos = try? await api.list() else { return }
        for dto in dtos {
            guard let cid = UUID(uuidString: dto.clientEntryId) else { continue }
            let existing = try? context.fetch(
                FetchDescriptor<LocalEntry>(predicate: #Predicate { $0.clientEntryId == cid })
            ).first

            if let e = existing {
                e.serverId = dto.id
                e.remoteMediaUrl = dto.mediaUrl
                e.remoteThumbnailUrl = dto.thumbnailUrl
                // Don't clobber an unsynced local edit; refresh only settled rows.
                if e.syncState == .done {
                    e.caption = dto.caption
                    e.category = dto.category
                    e.captionSource = dto.captionSource
                }
            } else {
                let e = LocalEntry(
                    clientEntryId: cid,
                    kind: dto.kind,
                    caption: dto.caption,
                    captionSource: dto.captionSource,
                    category: dto.category,
                    takenAt: dto.takenDate ?? Date(),
                    location: dto.location,
                    durationSec: dto.durationSec,
                    syncState: .done
                )
                e.serverId = dto.id
                e.remoteMediaUrl = dto.mediaUrl
                e.remoteThumbnailUrl = dto.thumbnailUrl
                context.insert(e)
            }
        }
        try? context.save()
    }
}

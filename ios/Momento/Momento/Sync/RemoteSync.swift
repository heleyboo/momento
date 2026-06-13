import Foundation
import SwiftData

// Pull-down: fetch server posts and reconcile into the local store by
// clientEntryId. Posts with unsynced local media are left untouched (their local
// bytes are the only copy); settled (.done) posts get their remote URLs/caption
// refreshed; posts from other devices are inserted as remote-only.
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
                // Never clobber a post still being uploaded — its media hold the
                // only local copy. Refresh only settled posts.
                guard e.syncState == .done else { continue }
                e.serverId = dto.id
                e.caption = dto.caption
                e.category = dto.category
                e.captionSource = dto.captionSource
                for m in dto.media {
                    if let lm = e.media.first(where: { $0.position == m.position }) {
                        lm.remoteMediaUrl = m.url
                        lm.remoteThumbnailUrl = m.thumbnailUrl
                    }
                }
            } else {
                // Remote-only post (other device / fresh install): insert it +
                // its media with no local bytes (served from the remote URLs).
                let e = LocalEntry(
                    clientEntryId: cid,
                    caption: dto.caption,
                    captionSource: dto.captionSource,
                    category: dto.category,
                    takenAt: dto.takenDate ?? Date(),
                    location: dto.location,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    syncState: .done
                )
                e.serverId = dto.id
                context.insert(e)
                for m in dto.media.sorted(by: { $0.position < $1.position }) {
                    let lm = LocalMedia(
                        position: m.position,
                        kind: m.kind,
                        durationSec: m.durationSec,
                        remoteMediaUrl: m.url,
                        remoteThumbnailUrl: m.thumbnailUrl,
                        uploadState: .done
                    )
                    lm.entry = e
                    context.insert(lm)
                }
            }
        }
        try? context.save()
    }
}

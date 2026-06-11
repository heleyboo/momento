import Foundation
import SwiftData

enum SyncState: String, Codable {
    case pending     // captured, not yet uploaded
    case uploading   // upload in flight
    case done        // synced to backend
    case error       // upload failed, will retry
}

// Offline-first local store. A LocalEntry is created the moment a moment is
// captured (works offline); the sync queue uploads it when online. The backend
// dedupes on `clientEntryId`, so the same id can be re-sent safely.
@Model
final class LocalEntry {
    @Attribute(.unique) var clientEntryId: UUID
    var serverId: String?
    var kind: String              // "photo" | "video"
    var caption: String?
    var captionSource: String     // "ai" | "user"
    var category: String?
    var takenAt: Date
    var location: String?
    var durationSec: Double?
    var syncStateRaw: String
    var localMediaPath: String?   // filename in the media container
    var localPosterPath: String?  // poster-frame filename
    var thumbnailData: Data?      // small JPEG for instant timeline display
    var remoteMediaUrl: String?
    var remoteThumbnailUrl: String?
    var createdAt: Date

    var syncState: SyncState {
        get { SyncState(rawValue: syncStateRaw) ?? .pending }
        set { syncStateRaw = newValue.rawValue }
    }

    var isVideo: Bool { kind == "video" }

    init(
        clientEntryId: UUID = UUID(),
        kind: String,
        caption: String?,
        captionSource: String,
        category: String?,
        takenAt: Date,
        location: String? = nil,
        durationSec: Double? = nil,
        syncState: SyncState = .pending,
        localMediaPath: String? = nil,
        localPosterPath: String? = nil,
        thumbnailData: Data? = nil
    ) {
        self.clientEntryId = clientEntryId
        self.kind = kind
        self.caption = caption
        self.captionSource = captionSource
        self.category = category
        self.takenAt = takenAt
        self.location = location
        self.durationSec = durationSec
        self.syncStateRaw = syncState.rawValue
        self.localMediaPath = localMediaPath
        self.localPosterPath = localPosterPath
        self.thumbnailData = thumbnailData
        self.createdAt = Date()
    }
}

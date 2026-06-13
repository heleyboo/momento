import Foundation
import SwiftData

enum SyncState: String, Codable {
    case pending     // captured, not yet uploaded
    case uploading   // upload in flight
    case done        // synced to backend
    case error       // upload failed, will retry
}

// Offline-first local store. A LocalEntry is a POST created when moments are
// captured (works offline); its media live in LocalMedia children. The sync
// queue uploads each media then finalizes the post. Backend dedupes on
// clientEntryId, so the same id can be re-sent safely.
//
// The legacy single-media fields (localMediaPath/.../thumbnailData) are kept for
// a one-time launch backfill into a LocalMedia child; new posts leave them nil.
@Model
final class LocalEntry {
    @Attribute(.unique) var clientEntryId: UUID
    var serverId: String?
    var caption: String?
    var captionSource: String     // "ai" | "user"
    var category: String?
    var takenAt: Date
    var location: String?
    var latitude: Double?
    var longitude: Double?
    var syncStateRaw: String
    var createdAt: Date

    // One post → many ordered media.
    @Relationship(deleteRule: .cascade, inverse: \LocalMedia.entry)
    var media: [LocalMedia] = []

    // --- Legacy single-media fields (pre multi-media; backfilled into media) ---
    var kind: String?
    var durationSec: Double?
    var localMediaPath: String?
    var localPosterPath: String?
    var thumbnailData: Data?
    var remoteMediaUrl: String?
    var remoteThumbnailUrl: String?

    var syncState: SyncState {
        get { SyncState(rawValue: syncStateRaw) ?? .pending }
        set { syncStateRaw = newValue.rawValue }
    }

    /// Media in display order (position asc).
    var sortedMedia: [LocalMedia] { media.sorted { $0.position < $1.position } }
    /// Cover = first media (timeline thumbnail + AI-caption source).
    var cover: LocalMedia? { sortedMedia.first }
    var mediaCount: Int { media.count }
    var isVideo: Bool { cover?.isVideo ?? false }

    init(
        clientEntryId: UUID = UUID(),
        caption: String?,
        captionSource: String,
        category: String?,
        takenAt: Date,
        location: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        syncState: SyncState = .pending
    ) {
        self.clientEntryId = clientEntryId
        self.caption = caption
        self.captionSource = captionSource
        self.category = category
        self.takenAt = takenAt
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.syncStateRaw = syncState.rawValue
        self.createdAt = Date()
    }
}

// One media item (photo/video) belonging to a post. Uploaded independently
// (staged) then promoted by finalize. Holds local bytes for offline display +
// remote URLs once synced.
@Model
final class LocalMedia: Identifiable {
    var id: UUID { mediaClientId }
    var mediaClientId: UUID
    var position: Int
    var kind: String              // "photo" | "video"
    var localMediaPath: String?
    var localPosterPath: String?
    var thumbnailData: Data?      // small JPEG for instant display
    var durationSec: Double?
    var remoteMediaUrl: String?
    var remoteThumbnailUrl: String?
    var uploadStateRaw: String    // SyncState: pending/uploading/done/error
    var entry: LocalEntry?

    var uploadState: SyncState {
        get { SyncState(rawValue: uploadStateRaw) ?? .pending }
        set { uploadStateRaw = newValue.rawValue }
    }
    var isVideo: Bool { kind == "video" }

    init(
        mediaClientId: UUID = UUID(),
        position: Int,
        kind: String,
        localMediaPath: String? = nil,
        localPosterPath: String? = nil,
        thumbnailData: Data? = nil,
        durationSec: Double? = nil,
        remoteMediaUrl: String? = nil,
        remoteThumbnailUrl: String? = nil,
        uploadState: SyncState = .pending
    ) {
        self.mediaClientId = mediaClientId
        self.position = position
        self.kind = kind
        self.localMediaPath = localMediaPath
        self.localPosterPath = localPosterPath
        self.thumbnailData = thumbnailData
        self.durationSec = durationSec
        self.remoteMediaUrl = remoteMediaUrl
        self.remoteThumbnailUrl = remoteThumbnailUrl
        self.uploadStateRaw = uploadState.rawValue
    }
}

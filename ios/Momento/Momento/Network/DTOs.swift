import Foundation

// Wire models matching the backend API responses. Decoded directly; SwiftData
// persistence + offline cache arrive in Phase 5 (the create loop).

struct UserDTO: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let name: String?
    let avatarUrl: String?
}

struct AuthResponse: Codable {
    let token: String
    let refreshToken: String
    let user: UserDTO
}

struct MediaDTO: Codable, Identifiable, Hashable {
    let id: String
    let position: Int
    let kind: String          // "photo" | "video"
    let url: String
    let thumbnailUrl: String?
    let durationSec: Double?

    var isVideo: Bool { kind == "video" }
}

struct EntryDTO: Codable, Identifiable, Hashable {
    let id: String
    let clientEntryId: String
    let caption: String?
    let captionSource: String // "ai" | "user"
    let category: String?
    let takenAt: String        // ISO 8601
    let location: String?
    let syncStatus: String
    let media: [MediaDTO]
    let createdAt: String
    let updatedAt: String

    var cover: MediaDTO? { media.sorted { $0.position < $1.position }.first }
    var takenDate: Date? { ISO8601DateFormatter().date(from: takenAt) }
}

struct EntriesResponse: Codable {
    let entries: [EntryDTO]
}

struct AlbumDTO: Codable, Identifiable, Hashable {
    var id: String { category }
    let category: String
    let count: Int
    let coverEntryId: String?
    let coverUrl: String?
}

struct AlbumsResponse: Codable {
    let albums: [AlbumDTO]
}

struct SettingsDTO: Codable, Hashable {
    var autoSync: Bool
    var wifiOnly: Bool
    var aiCaption: Bool
    var geoTag: Bool
    var autoCategorize: Bool
    var captionLang: String
    var captionLength: String
}

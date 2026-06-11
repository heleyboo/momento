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

struct EntryDTO: Codable, Identifiable, Hashable {
    let id: String
    let clientEntryId: String
    let kind: String          // "photo" | "video"
    let caption: String?
    let captionSource: String // "ai" | "user"
    let category: String?
    let takenAt: String        // ISO 8601
    let location: String?
    let durationSec: Double?
    let syncStatus: String
    let mediaUrl: String
    let thumbnailUrl: String?
    let createdAt: String
    let updatedAt: String

    var isVideo: Bool { kind == "video" }
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

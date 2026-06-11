import Foundation

// Local media files (originals + poster frames) live in Application Support so
// they survive offline until the sync queue uploads them. LocalEntry stores
// just the filename; this resolves it to a URL.
enum MediaStore {
    private static var dir: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let media = base.appendingPathComponent("media", isDirectory: true)
        try? FileManager.default.createDirectory(at: media, withIntermediateDirectories: true)
        return media
    }

    static func url(for filename: String) -> URL { dir.appendingPathComponent(filename) }

    @discardableResult
    static func save(_ data: Data, ext: String) throws -> String {
        let filename = "\(UUID().uuidString).\(ext)"
        try data.write(to: url(for: filename))
        return filename
    }

    static func read(_ filename: String?) -> Data? {
        guard let filename else { return nil }
        return try? Data(contentsOf: url(for: filename))
    }

    static func delete(_ filename: String?) {
        guard let filename else { return }
        try? FileManager.default.removeItem(at: url(for: filename))
    }
}

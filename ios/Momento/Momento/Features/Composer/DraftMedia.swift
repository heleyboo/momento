import Foundation

// One item in the composer tray. Bytes are persisted to MediaStore immediately
// (offline-safe); the draft holds the filenames + a poster for preview/caption.
struct DraftMedia: Identifiable, Equatable {
    let id: UUID            // becomes the media's mediaClientId
    let kind: String        // "photo" | "video"
    let mediaPath: String   // MediaStore filename of the original
    let posterPath: String  // MediaStore filename of the poster JPEG
    let posterData: Data    // poster bytes (preview + cover caption)
    let durationSec: Double?
    let sizeBytes: Int
    let takenAt: Date       // real capture date (EXIF/AV metadata; now() for camera)

    static func == (a: DraftMedia, b: DraftMedia) -> Bool { a.id == b.id }
}

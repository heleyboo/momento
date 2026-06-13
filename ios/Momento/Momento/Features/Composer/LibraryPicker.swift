import SwiftUI
import PhotosUI
import CoreTransferable
import UniformTypeIdentifiers
import AVFoundation
import ImageIO
import UIKit

// A picked video, transferred as a file URL (NOT Data) so large videos don't
// blow memory. We copy it into a location we own.
struct Movie: Transferable {
    let url: URL
    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { movie in
            SentTransferredFile(movie.url)
        } importing: { received in
            let tmp = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString).appendingPathExtension("mov")
            try? FileManager.default.removeItem(at: tmp)
            try FileManager.default.copyItem(at: received.file, to: tmp)
            return Movie(url: tmp)
        }
    }
}

enum LibraryImport {
    // Loads one PhotosPicker selection into a DraftMedia (bytes persisted to
    // MediaStore). Photos are re-encoded to JPEG; videos copied file→file.
    static func draft(from item: PhotosPickerItem) async -> DraftMedia? {
        // Photo first: a decodable Data payload.
        if let data = try? await item.loadTransferable(type: Data.self),
           let image = UIImage(data: data) {
            // Read the original capture date from EXIF BEFORE re-encoding (which strips it).
            let date = exifDate(from: data) ?? Date()
            guard let jpeg = image.jpegData(compressionQuality: 0.9),
                  let poster = PosterFrame.fromImage(jpeg),
                  let mediaPath = try? MediaStore.save(jpeg, ext: "jpg"),
                  let posterPath = try? MediaStore.save(poster, ext: "jpg") else { return nil }
            return DraftMedia(id: UUID(), kind: "photo", mediaPath: mediaPath,
                              posterPath: posterPath, posterData: poster,
                              durationSec: nil, sizeBytes: jpeg.count, takenAt: date)
        }
        // Otherwise a video file.
        if let movie = try? await item.loadTransferable(type: Movie.self),
           let videoData = try? Data(contentsOf: movie.url),
           let (poster, dur) = await PosterFrame.fromVideo(movie.url) {
            let date = await videoDate(movie.url) ?? Date()
            try? FileManager.default.removeItem(at: movie.url)
            guard let mediaPath = try? MediaStore.save(videoData, ext: "mov"),
                  let posterPath = try? MediaStore.save(poster, ext: "jpg") else { return nil }
            return DraftMedia(id: UUID(), kind: "video", mediaPath: mediaPath,
                              posterPath: posterPath, posterData: poster,
                              durationSec: dur, sizeBytes: videoData.count, takenAt: date)
        }
        return nil
    }

    // EXIF DateTimeOriginal ("yyyy:MM:dd HH:mm:ss") from the original image bytes.
    private static func exifDate(from data: Data) -> Date? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let exif = props[kCGImagePropertyExifDictionary] as? [CFString: Any],
              let s = exif[kCGImagePropertyExifDateTimeOriginal] as? String
        else { return nil }
        let f = DateFormatter()
        f.dateFormat = "yyyy:MM:dd HH:mm:ss"
        return f.date(from: s)
    }

    private static func videoDate(_ url: URL) async -> Date? {
        let asset = AVURLAsset(url: url)
        guard let item = (try? await asset.load(.creationDate)) ?? nil else { return nil }
        return try? await item.load(.dateValue)
    }
}

import UIKit
import AVFoundation

// Produces the poster-frame JPEG used for AI captioning + the thumbnail. For
// video the frame is sampled at min(1s, duration/2) to skip the often-black
// first frame (matches the backend's caption strategy).
enum PosterFrame {
    static func fromImage(_ data: Data, maxDim: CGFloat = 1080) -> Data? {
        UIImage(data: data)?.scaledDown(maxDim: maxDim).jpegData(compressionQuality: 0.8)
    }

    static func fromVideo(_ url: URL) async -> (poster: Data, duration: Double)? {
        let asset = AVURLAsset(url: url)
        guard let duration = try? await asset.load(.duration) else { return nil }
        let seconds = CMTimeGetSeconds(duration)
        let at = CMTime(seconds: min(1.0, max(0, seconds / 2)), preferredTimescale: 600)
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        guard let cg = try? await gen.image(at: at).image else { return nil }
        guard let data = UIImage(cgImage: cg).scaledDown(maxDim: 1080).jpegData(compressionQuality: 0.8) else {
            return nil
        }
        return (data, seconds)
    }
}

extension UIImage {
    func scaledDown(maxDim: CGFloat) -> UIImage {
        let longest = max(size.width, size.height)
        guard longest > maxDim else { return self }
        let scale = maxDim / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}

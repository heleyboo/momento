import SwiftUI
import AVKit

// Full-screen player for a moment's video. Prefers the on-device original (no
// network/auth) and falls back to the backend URL — relative `/api/media/...`
// links get the session Bearer header (the media route is auth-gated), absolute
// links (s3/gcs/drive signed URLs) are played as-is.
struct VideoPlayerView: View {
    let entry: LocalEntry
    @Environment(AppState.self) private var app
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var failed = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if let player {
                VideoPlayer(player: player)
                    .ignoresSafeArea()
                    .onAppear { player.play() }
            } else if failed {
                VStack(spacing: 10) {
                    Image(systemName: "video.slash").font(.system(size: 40)).foregroundStyle(.white.opacity(0.8))
                    Text("Không phát được video này.").foregroundStyle(.white.opacity(0.8))
                }
            } else {
                ProgressView().tint(.white)
            }
        }
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 30)).foregroundStyle(.white.opacity(0.85))
                    .padding(16)
            }
        }
        .task { setup() }
    }

    private func setup() {
        guard let asset = resolveAsset() else { failed = true; return }
        player = AVPlayer(playerItem: AVPlayerItem(asset: asset))
    }

    private func resolveAsset() -> AVURLAsset? {
        // On-device original first — survives offline, needs no auth.
        if let name = entry.localMediaPath {
            let url = MediaStore.url(for: name)
            if FileManager.default.fileExists(atPath: url.path) { return AVURLAsset(url: url) }
        }
        guard let remote = entry.remoteMediaUrl else { return nil }
        if remote.hasPrefix("/") {
            guard let url = URL(string: AppConfig.apiBaseURL.absoluteString + remote) else { return nil }
            var headers: [String: String] = [:]
            if let token = app.session.accessToken { headers["Authorization"] = "Bearer \(token)" }
            return AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
        }
        return URL(string: remote).map { AVURLAsset(url: $0) }
    }
}

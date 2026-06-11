import SwiftUI
import UIKit

// Loads a media/thumbnail image. Relative URLs (`/api/media/...`, local
// provider) are resolved against the API base with the session Bearer token;
// absolute URLs (s3/gcs/drive signed links) are fetched as-is. AsyncImage can't
// add an auth header, hence this custom loader.
struct RemoteImage: View {
    let urlString: String?
    var contentMode: ContentMode = .fill

    @Environment(AppState.self) private var app
    @Environment(\.palette) private var palette
    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().aspectRatio(contentMode: contentMode)
            } else {
                StripedPlaceholder().overlay(alignment: .center) {
                    if failed { Image(systemName: "photo").foregroundStyle(palette.ter) }
                }
            }
        }
        .task(id: urlString) { await load() }
    }

    private func load() async {
        image = nil; failed = false
        guard let urlString else { failed = true; return }
        do {
            let data: Data
            if urlString.hasPrefix("/") {
                let req = app.api.makeRequest(urlString, method: "GET")
                data = try await app.api.raw(req)
            } else if let url = URL(string: urlString) {
                (data, _) = try await URLSession.shared.data(from: url)
            } else {
                failed = true; return
            }
            if let ui = UIImage(data: data) { image = ui } else { failed = true }
        } catch {
            failed = true
        }
    }
}

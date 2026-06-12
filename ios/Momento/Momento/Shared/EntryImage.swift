import SwiftUI
import UIKit

// Renders one media's image, preferring local bytes (instant, offline) then the
// remote URL. `preferFull` picks the original media for the Detail hero;
// otherwise the thumbnail is used.
struct EntryImage: View {
    let media: LocalMedia?
    var preferFull = false
    var contentMode: ContentMode = .fill

    var body: some View {
        if let data = media?.thumbnailData, let ui = UIImage(data: data) {
            Image(uiImage: ui).resizable().aspectRatio(contentMode: contentMode)
        } else if let url = remoteURL {
            RemoteImage(urlString: url, contentMode: contentMode)
        } else {
            StripedPlaceholder()
        }
    }

    private var remoteURL: String? {
        guard let media else { return nil }
        if preferFull {
            return media.remoteMediaUrl ?? media.remoteThumbnailUrl
        }
        return media.remoteThumbnailUrl ?? media.remoteMediaUrl
    }
}

import SwiftUI
import UIKit

// Renders an entry's image, preferring local bytes (instant, offline) then the
// remote URL. `preferFull` picks the original media for the Detail hero;
// otherwise the thumbnail is used.
struct EntryImage: View {
    let entry: LocalEntry
    var preferFull = false
    var contentMode: ContentMode = .fill

    var body: some View {
        if let data = entry.thumbnailData, let ui = UIImage(data: data) {
            Image(uiImage: ui).resizable().aspectRatio(contentMode: contentMode)
        } else if let url = remoteURL {
            RemoteImage(urlString: url, contentMode: contentMode)
        } else {
            StripedPlaceholder()
        }
    }

    private var remoteURL: String? {
        if preferFull {
            return entry.remoteMediaUrl ?? entry.remoteThumbnailUrl
        }
        return entry.remoteThumbnailUrl ?? entry.remoteMediaUrl
    }
}

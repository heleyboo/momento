import SwiftUI

// Facebook-style mosaic for a post's media: 1 full, 2 side-by-side, 3 = one wide
// + two, 4 = 2×2, 5+ = grid with a "+N" overlay on the last visible tile. Tapping
// any tile opens the full-screen pager at that index.
struct MediaCollage: View {
    let media: [LocalMedia]      // already position-sorted
    let onTap: (Int) -> Void

    private let gap: CGFloat = 2

    var body: some View {
        Group {
            switch media.count {
            case 0: EmptyView()
            case 1: tile(0, height: 360)
            case 2:
                HStack(spacing: gap) { tile(0, height: 240); tile(1, height: 240) }
            case 3:
                VStack(spacing: gap) {
                    tile(0, height: 210)
                    HStack(spacing: gap) { tile(1, height: 150); tile(2, height: 150) }
                }
            case 4:
                VStack(spacing: gap) {
                    HStack(spacing: gap) { tile(0, height: 170); tile(1, height: 170) }
                    HStack(spacing: gap) { tile(2, height: 170); tile(3, height: 170) }
                }
            default:
                VStack(spacing: gap) {
                    HStack(spacing: gap) { tile(0, height: 180); tile(1, height: 180) }
                    HStack(spacing: gap) {
                        tile(2, height: 130); tile(3, height: 130)
                        tile(4, height: 130, more: media.count - 5)
                    }
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }

    private func tile(_ i: Int, height: CGFloat, more: Int = 0) -> some View {
        EntryImage(media: media[i])
            .frame(maxWidth: .infinity).frame(height: height).clipped()
            .overlay(alignment: .center) {
                if media[i].isVideo {
                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 34)).foregroundStyle(.white.opacity(0.9))
                }
            }
            .overlay {
                if more > 0 {
                    ZStack {
                        Color.black.opacity(0.45)
                        Text("+\(more)").font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
                    }
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { onTap(i) }
    }
}

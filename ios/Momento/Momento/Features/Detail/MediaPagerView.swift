import SwiftUI

// Full-screen swipeable viewer over a post's media, opened from the collage.
// Photos fit the screen; videos show a play button → the AVKit player.
struct MediaPagerView: View {
    let media: [LocalMedia]      // position-sorted
    @State var index: Int
    @Environment(\.dismiss) private var dismiss
    @State private var playMedia: LocalMedia?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            TabView(selection: $index) {
                ForEach(Array(media.enumerated()), id: \.element.id) { i, m in
                    EntryImage(media: m, preferFull: true, contentMode: .fit)
                        .overlay(alignment: .center) {
                            if m.isVideo {
                                Image(systemName: "play.circle.fill")
                                    .font(.system(size: 70)).foregroundStyle(.white.opacity(0.92))
                                    .onTapGesture { playMedia = m }
                            }
                        }
                        .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: media.count > 1 ? .always : .never))
            .indexViewStyle(.page(backgroundDisplayMode: .interactive))
        }
        // Swipe up to close the viewer. simultaneousGesture so horizontal paging
        // still works; only a clearly-vertical upward flick dismisses.
        .simultaneousGesture(
            DragGesture(minimumDistance: 24).onEnded { v in
                if v.translation.height < -80, abs(v.translation.height) > abs(v.translation.width) {
                    dismiss()
                }
            }
        )
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 30)).foregroundStyle(.white.opacity(0.85)).padding(16)
            }
        }
        .overlay(alignment: .topLeading) {
            if media.count > 1 {
                Text("\(index + 1)/\(media.count)")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(.black.opacity(0.4), in: Capsule()).padding(16)
            }
        }
        .fullScreenCover(item: $playMedia) { VideoPlayerView(media: $0) }
    }
}

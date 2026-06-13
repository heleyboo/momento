import SwiftUI

// Full-screen swipeable viewer over a post's media. Photos pinch/double-tap to
// zoom; videos show a play button → the AVKit player. Swipe up/down to dismiss
// (disabled while a photo is zoomed).
struct MediaPagerView: View {
    let media: [LocalMedia]      // position-sorted
    @State var index: Int
    @Environment(\.dismiss) private var dismiss
    @State private var playMedia: LocalMedia?
    @State private var isZoomed = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            TabView(selection: $index) {
                ForEach(Array(media.enumerated()), id: \.element.id) { i, m in
                    ZoomableImage(media: m, isZoomed: $isZoomed)
                        .overlay(alignment: .center) {
                            if m.isVideo {
                                Image(systemName: "play.circle.fill")
                                    .font(.system(size: 70)).foregroundStyle(.white.opacity(0.92))
                                    .onTapGesture { Haptics.tap(); playMedia = m }
                            }
                        }
                        .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: media.count > 1 ? .always : .never))
            .indexViewStyle(.page(backgroundDisplayMode: .interactive))
        }
        // Swipe up/down to close (only when not zoomed). simultaneousGesture so
        // horizontal paging still works.
        .simultaneousGesture(
            DragGesture(minimumDistance: 24).onEnded { v in
                guard !isZoomed else { return }
                if abs(v.translation.height) > 80, abs(v.translation.height) > abs(v.translation.width) {
                    Haptics.tap(); dismiss()
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
        .onChange(of: index) { _, _ in isZoomed = false }
        .fullScreenCover(item: $playMedia) { VideoPlayerView(media: $0) }
    }
}

// Pinch + double-tap to zoom, pan when zoomed. Reports `isZoomed` up so the pager
// can disable swipe-to-dismiss while zoomed.
private struct ZoomableImage: View {
    let media: LocalMedia
    @Binding var isZoomed: Bool

    @State private var scale: CGFloat = 1
    @State private var steady: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var steadyOffset: CGSize = .zero

    var body: some View {
        EntryImage(media: media, preferFull: true, contentMode: .fit)
            .scaleEffect(scale)
            .offset(offset)
            .gesture(
                MagnificationGesture()
                    .onChanged { v in scale = min(max(steady * v, 1), 4); report() }
                    .onEnded { _ in steady = scale; if scale <= 1 { reset() }; report() }
            )
            // Pan only when zoomed; .none lets the drag fall through to paging at 1x.
            .highPriorityGesture(
                DragGesture()
                    .onChanged { v in
                        offset = CGSize(width: steadyOffset.width + v.translation.width,
                                        height: steadyOffset.height + v.translation.height)
                    }
                    .onEnded { _ in steadyOffset = offset },
                including: scale > 1 ? .all : .none
            )
            .onTapGesture(count: 2) {
                withAnimation(.spring(duration: 0.25)) {
                    if scale > 1 { reset() } else { scale = 2.5; steady = 2.5 }
                }
                report()
            }
            .onDisappear { reset(); report() }
    }

    private func reset() { scale = 1; steady = 1; offset = .zero; steadyOffset = .zero }
    private func report() { isZoomed = scale > 1.01 }
}

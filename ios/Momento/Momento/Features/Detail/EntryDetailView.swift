import SwiftUI

// Full-screen view of one moment. Read-only here; edit/delete affordances (PATCH/
// DELETE) are Phase 7's iOS work.
struct EntryDetailView: View {
    let entry: LocalEntry
    @Environment(\.palette) private var palette
    @State private var playMedia: LocalMedia?
    @State private var page = 0

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                carousel

                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Label(dateText, systemImage: "calendar")
                            .font(.system(size: 14)).foregroundStyle(palette.sub)
                        Spacer()
                        if let cat = entry.category { CategoryChip(category: cat) }
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(entry.captionSource == "ai" ? "✨ CAPTION DO AI TẠO" : "CAPTION")
                            .font(Typo.groupLabel).foregroundStyle(palette.accent)
                        Text(entry.caption ?? "—")
                            .font(Typo.captionLg).foregroundStyle(palette.ink)
                    }

                    metaCard
                }
                .padding(16)
            }
        }
        .background(palette.bg.ignoresSafeArea())
        .navigationTitle("Khoảnh khắc")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(item: $playMedia) { VideoPlayerView(media: $0) }
    }

    // Swipeable gallery over the post's media; tap a video to play it.
    private var carousel: some View {
        let items = entry.sortedMedia
        return TabView(selection: $page) {
            ForEach(Array(items.enumerated()), id: \.element.id) { idx, media in
                EntryImage(media: media, preferFull: true)
                    .frame(maxWidth: .infinity).frame(height: 392).clipped()
                    .overlay(alignment: .center) {
                        if media.isVideo {
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 66)).foregroundStyle(.white.opacity(0.9))
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { if media.isVideo { playMedia = media } }
                    .tag(idx)
            }
        }
        .frame(height: 392)
        .tabViewStyle(.page(indexDisplayMode: items.count > 1 ? .automatic : .never))
        .indexViewStyle(.page(backgroundDisplayMode: .interactive))
    }

    private var metaCard: some View {
        VStack(spacing: 0) {
            metaRow(icon: "mappin", label: "Vị trí", value: entry.location ?? "—")
            Divider().overlay(palette.sep)
            metaRow(icon: "square.grid.2x2", label: "Album", value: entry.category ?? "—")
            Divider().overlay(palette.sep)
            metaRow(icon: entry.isVideo ? "video" : "photo", label: "Định dạng",
                    value: entry.isVideo ? "Video" : "Ảnh")
        }
        .padding(.horizontal, 14)
        .background(RoundedRectangle(cornerRadius: 18).fill(palette.card))
    }

    private func metaRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Label(label, systemImage: icon).font(.system(size: 14)).foregroundStyle(palette.sub)
            Spacer()
            Text(value).font(.system(size: 14, weight: .medium)).foregroundStyle(palette.ink)
        }
        .padding(.vertical, 12)
    }

    private var dateText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "vi_VN")
        f.dateFormat = "d MMMM yyyy · HH:mm"
        return f.string(from: entry.takenAt)
    }
}

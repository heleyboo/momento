import SwiftUI
import SwiftData

// Album tab: entries grouped by category (local-first, offline). Tap an album →
// the entries in that category. Mirrors the backend GET /api/albums shape.
struct AlbumView: View {
    @Environment(\.palette) private var palette
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var entries: [LocalEntry]
    @State private var notice: String?

    private struct Album: Identifiable {
        var id: String { category }
        let category: String
        let count: Int
        let cover: LocalEntry
    }

    private var albums: [Album] {
        var order: [String] = []
        var buckets: [String: [LocalEntry]] = [:]
        for e in entries {
            guard let cat = e.category else { continue }
            if buckets[cat] == nil { order.append(cat); buckets[cat] = [] }
            buckets[cat]?.append(e)
        }
        return order.compactMap { cat in
            guard let items = buckets[cat], let cover = items.first else { return nil }
            return Album(category: cat, count: items.count, cover: cover)
        }
        .sorted { $0.count > $1.count }
    }

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                    if albums.isEmpty {
                        emptyState
                    } else {
                        if recentCount >= 3 { aiSuggestion }
                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(albums) { album in
                                NavigationLink(value: album.category) { cell(album) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(16)
            }
            .bottomBarInset()
            .background(palette.bg.ignoresSafeArea())
            .overlay(alignment: .bottom) { toast }
            .navigationDestination(for: String.self) { CategoryEntriesView(category: $0) }
            .navigationDestination(for: LocalEntry.self) { EntryDetailView(entry: $0) }
        }
    }

    // Moments captured in the last 30 days — drives the AI suggestion teaser.
    private var recentCount: Int {
        let cutoff = Date().addingTimeInterval(-30 * 86400)
        return entries.filter { $0.takenAt >= cutoff }.count
    }

    // AI album suggestion (design). The grouping engine is a later feature, so
    // "Tạo" is a teaser for now.
    private var aiSuggestion: some View {
        HStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 22)).foregroundStyle(palette.accent)
                .frame(width: 40, height: 40)
                .background(RoundedRectangle(cornerRadius: 11).fill(palette.card))
            VStack(alignment: .leading, spacing: 1) {
                Text("AI gợi ý album mới")
                    .font(.system(size: 14.5, weight: .semibold)).foregroundStyle(palette.ink)
                Text("Gom \(recentCount) khoảnh khắc gần đây thành một album?")
                    .font(.system(size: 13)).foregroundStyle(palette.sub).lineLimit(2)
            }
            Spacer(minLength: 8)
            Button { notice = "Tính năng đang được phát triển." } label: {
                Text("Tạo").font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(palette.accentText)
                    .padding(.horizontal, 15).padding(.vertical, 8)
                    .background(palette.accent, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 15).padding(.vertical, 14)
        .background(RoundedRectangle(cornerRadius: 18).fill(palette.accent.opacity(0.12)))
    }

    private var toast: some View {
        Group {
            if let notice {
                Text(notice).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(.black.opacity(0.8), in: Capsule()).padding(.bottom, 24)
                    .task { try? await Task.sleep(for: .seconds(2)); self.notice = nil }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Album").font(Typo.largeTitle).foregroundStyle(palette.ink)
            Text("\(albums.count) chủ đề · \(entries.count) khoảnh khắc")
                .font(.system(size: 13.5, weight: .medium)).foregroundStyle(palette.sub)
        }
    }

    private func cell(_ album: Album) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Color.clear drives a reliable 1:1 square from the column width; the
            // image fills it via overlay (EntryImage has no intrinsic size).
            Color.clear
                .aspectRatio(1, contentMode: .fit)
                .overlay { EntryImage(media: album.cover.cover, contentMode: .fill) }
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .overlay(alignment: .topLeading) {
                    Circle().fill(CategoryColors.color(for: album.category))
                        .frame(width: 10, height: 10)
                        .overlay(Circle().stroke(.white.opacity(0.6), lineWidth: 2))
                        .padding(9)
                }
            VStack(alignment: .leading, spacing: 1) {
                Text(album.category).font(.system(size: 15.5, weight: .semibold)).foregroundStyle(palette.ink)
                Text("\(album.count) mục").font(.system(size: 13)).foregroundStyle(palette.sub)
            }
            .padding(.leading, 2)
        }
    }

    private var emptyState: some View {
        Text("Chưa có album nào.")
            .font(Typo.caption).foregroundStyle(palette.sub)
            .frame(maxWidth: .infinity).padding(.top, 80)
    }
}

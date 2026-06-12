import SwiftUI
import SwiftData

// Album tab: entries grouped by category (local-first, offline). Tap an album →
// the entries in that category. Mirrors the backend GET /api/albums shape.
struct AlbumView: View {
    @Environment(\.palette) private var palette
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var entries: [LocalEntry]

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
            .background(palette.bg.ignoresSafeArea())
            .navigationDestination(for: String.self) { CategoryEntriesView(category: $0) }
            .navigationDestination(for: LocalEntry.self) { EntryDetailView(entry: $0) }
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
            EntryImage(media: album.cover.cover)
                .aspectRatio(1, contentMode: .fill)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .overlay(alignment: .topLeading) {
                    Circle().fill(CategoryColors.color(for: album.category))
                        .frame(width: 12, height: 12)
                        .overlay(Circle().stroke(.white, lineWidth: 2))
                        .padding(10)
                }
            Text(album.category).font(.system(size: 15.5, weight: .semibold)).foregroundStyle(palette.ink)
            Text("\(album.count) mục").font(.system(size: 13)).foregroundStyle(palette.sub)
        }
    }

    private var emptyState: some View {
        Text("Chưa có album nào.")
            .font(Typo.caption).foregroundStyle(palette.sub)
            .frame(maxWidth: .infinity).padding(.top, 80)
    }
}

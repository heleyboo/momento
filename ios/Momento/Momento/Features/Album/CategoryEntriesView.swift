import SwiftUI
import SwiftData

// Entries within one category album. Pushed from AlbumView; the LocalEntry
// navigation destination is registered by the parent stack.
struct CategoryEntriesView: View {
    let category: String
    @Environment(\.palette) private var palette
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var all: [LocalEntry]

    private var items: [LocalEntry] { all.filter { $0.category == category } }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(items) { entry in
                    NavigationLink(value: entry) { EntryCardView(entry: entry) }
                        .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
        .bottomBarInset()
        .background(palette.bg.ignoresSafeArea())
        .navigationTitle(category)
        .navigationBarTitleDisplayMode(.inline)
    }
}

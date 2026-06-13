import SwiftUI

// Swipe left/right between posts. Wraps the per-post detail in a horizontal paged
// TabView over the list the user came from (timeline / category / search),
// opened at the tapped post. Horizontal paging is orthogonal to each page's
// vertical scroll and the media collage's tap, so there's no gesture conflict.
struct EntryPagerView: View {
    let entries: [LocalEntry]
    @State private var index: Int

    init(entries: [LocalEntry], startIndex: Int) {
        self.entries = entries
        _index = State(initialValue: startIndex)
    }

    var body: some View {
        TabView(selection: $index) {
            ForEach(Array(entries.enumerated()), id: \.element.id) { i, entry in
                EntryDetailView(entry: entry).tag(i)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .navigationTitle("Khoảnh khắc")
        .navigationBarTitleDisplayMode(.inline)
    }
}

import SwiftUI
import SwiftData

// Search tab: local-first keyword search over captions + kind filter. Reuses
// EntryCardView for results and EntryDetailView on tap.
struct SearchView: View {
    @Environment(\.palette) private var palette
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var all: [LocalEntry]
    @State private var query = ""
    @State private var kind: KindFilter = .all

    enum KindFilter: String, CaseIterable { case all = "Tất cả", photo = "Ảnh", video = "Video" }

    private var results: [LocalEntry] {
        all.filter { e in
            let kindOK = kind == .all || (kind == .photo && !e.isVideo) || (kind == .video && e.isVideo)
            let queryOK = query.isEmpty || (e.caption?.localizedCaseInsensitiveContains(query) ?? false)
            return kindOK && queryOK
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                searchField
                filterChips
                resultsList
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .background(palette.bg.ignoresSafeArea())
            .navigationTitle("Tìm kiếm")
        }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(palette.ter)
            TextField("Tìm trong caption…", text: $query)
                .foregroundStyle(palette.ink)
                .autocorrectionDisabled()
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(palette.ter)
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 13).fill(palette.fieldBg))
        .overlay(RoundedRectangle(cornerRadius: 13).stroke(palette.sep, lineWidth: 0.5))
    }

    private var filterChips: some View {
        HStack(spacing: 8) {
            ForEach(KindFilter.allCases, id: \.self) { f in
                let on = kind == f
                Button { kind = f } label: {
                    Text(f.rawValue).font(.system(size: 13, weight: .medium))
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .background(Capsule().fill(on ? palette.accent : palette.card))
                        .foregroundStyle(on ? palette.accentText : palette.ink)
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
    }

    private var resultsList: some View {
        Group {
            if results.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "magnifyingglass").font(.system(size: 30)).foregroundStyle(palette.ter)
                    Text("Không tìm thấy khoảnh khắc nào.")
                        .font(Typo.caption).foregroundStyle(palette.sub)
                }
                .frame(maxWidth: .infinity).padding(.top, 80)
            } else {
                ScrollView {
                    Text("\(results.count) KẾT QUẢ")
                        .font(Typo.groupLabel).foregroundStyle(palette.sub)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(.top, 4)
                    LazyVStack(spacing: 10) {
                        ForEach(results) { entry in
                            NavigationLink {
                                EntryPagerView(entries: results,
                                               startIndex: results.firstIndex { $0.id == entry.id } ?? 0)
                            } label: {
                                EntryCardView(entry: entry, highlight: query)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .bottomBarInset()
            }
        }
    }
}

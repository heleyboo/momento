import SwiftUI
import SwiftData

// Home tab: day-grouped moments from the local store (offline-first). A refresh
// pulls server entries into SwiftData and kicks the sync queue.
struct TimelineView: View {
    @Environment(AppState.self) private var app
    @Environment(SyncQueue.self) private var sync
    @Environment(\.modelContext) private var context
    @Environment(\.palette) private var palette
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var entries: [LocalEntry]

    private struct DayGroup: Identifiable {
        let id: String
        let label: String
        let items: [LocalEntry]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 18) {
                    header
                    if entries.isEmpty { emptyState }
                    ForEach(groups) { group in
                        Section {
                            ForEach(group.items) { entry in
                                NavigationLink {
                                    EntryPagerView(entries: entries,
                                                   startIndex: entries.firstIndex { $0.id == entry.id } ?? 0)
                                } label: { EntryCardView(entry: entry) }
                                    .buttonStyle(.plain)
                            }
                        } header: {
                            Text(group.label).font(Typo.daySection)
                                .foregroundStyle(palette.ink).padding(.top, 4)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
            .bottomBarInset()
            .background(palette.bg.ignoresSafeArea())
            .refreshable { await refresh() }
            .task { await refresh() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Nhật ký").font(Typo.largeTitle).foregroundStyle(palette.ink)
            Label("\(entries.count) khoảnh khắc đã lưu", systemImage: "sparkles")
                .font(.system(size: 13.5, weight: .medium)).foregroundStyle(palette.sub)
        }
        .padding(.top, 8)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "camera").font(.system(size: 34)).foregroundStyle(palette.ter)
            Text("Chưa có khoảnh khắc nào.\nChạm + để ghi lại khoảnh khắc đầu tiên.")
                .multilineTextAlignment(.center).font(Typo.caption).foregroundStyle(palette.sub)
        }
        .frame(maxWidth: .infinity).padding(.top, 80)
    }

    private var groups: [DayGroup] {
        let cal = Calendar.current
        var order: [String] = []
        var buckets: [String: [LocalEntry]] = [:]
        for e in entries {
            let key = ISO8601DateFormatter().string(from: cal.startOfDay(for: e.takenAt))
            if buckets[key] == nil { order.append(key); buckets[key] = [] }
            buckets[key]?.append(e)
        }
        return order.map { key in
            DayGroup(id: key, label: Self.dayLabel(buckets[key]?.first?.takenAt), items: buckets[key] ?? [])
        }
    }

    private func refresh() async {
        await RemoteSync.pull(api: app.entries, into: context)
        await sync.syncPending()
    }

    private static func dayLabel(_ date: Date?) -> String {
        guard let date else { return "" }
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Hôm nay" }
        if cal.isDateInYesterday(date) { return "Hôm qua" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "vi_VN")
        f.dateFormat = "EEEE, d MMMM"
        return f.string(from: date).capitalized
    }
}

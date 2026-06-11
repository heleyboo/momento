import SwiftUI

// Home tab: day-grouped list of moments. Read-only in Phase 4 (create loop = P5).
struct TimelineView: View {
    @Environment(AppState.self) private var app
    @Environment(\.palette) private var palette
    @State private var vm = TimelineViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 18) {
                    header
                    if vm.entries.isEmpty && !vm.isLoading {
                        emptyState
                    }
                    ForEach(vm.groups) { group in
                        Section {
                            ForEach(group.entries) { entry in
                                NavigationLink(value: entry) {
                                    EntryCardView(entry: entry)
                                }
                                .buttonStyle(.plain)
                            }
                        } header: {
                            Text(group.label)
                                .font(Typo.daySection)
                                .foregroundStyle(palette.ink)
                                .padding(.top, 4)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 110)
            }
            .background(palette.bg.ignoresSafeArea())
            .navigationDestination(for: EntryDTO.self) { EntryDetailView(entry: $0) }
            .overlay { if vm.isLoading { ProgressView().tint(palette.accent) } }
            .refreshable { await vm.load(using: app.entries) }
            .task { await vm.load(using: app.entries) }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Nhật ký").font(Typo.largeTitle).foregroundStyle(palette.ink)
            Label("\(vm.entries.count) khoảnh khắc đã lưu", systemImage: "sparkles")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(palette.sub)
        }
        .padding(.top, 8)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "camera").font(.system(size: 34)).foregroundStyle(palette.ter)
            Text(vm.errorMessage ?? "Chưa có khoảnh khắc nào.\nChạm + để ghi lại khoảnh khắc đầu tiên.")
                .multilineTextAlignment(.center)
                .font(Typo.caption)
                .foregroundStyle(palette.sub)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 80)
    }
}

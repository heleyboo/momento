import SwiftUI

// Full-screen content for one moment: media collage + caption/meta. The edit/
// delete menu lives on EntryPagerView (the nav container), since a toolbar inside
// a paged TabView doesn't reliably surface to the navigation bar.
// Identifiable wrapper so the full-screen media pager can present at a tapped index.
private struct PagerStart: Identifiable { let id = UUID(); let index: Int }

struct EntryDetailView: View {
    let entry: LocalEntry
    @Environment(\.palette) private var palette
    @State private var pager: PagerStart?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                MediaCollage(media: entry.sortedMedia) { pager = PagerStart(index: $0) }
                    .padding(.bottom, 4)

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
        .bottomBarInset()
        .background(palette.bg.ignoresSafeArea())
        .fullScreenCover(item: $pager) { p in
            MediaPagerView(media: entry.sortedMedia, index: p.index)
        }
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

// Edit caption + category for a post. Dismisses only when onSave succeeds.
struct EditPostSheet: View {
    let entry: LocalEntry
    let onSave: (String, String) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @Environment(\.palette) private var palette
    @State private var caption: String
    @State private var category: String
    @State private var saving = false

    init(entry: LocalEntry, onSave: @escaping (String, String) async -> Bool) {
        self.entry = entry
        self.onSave = onSave
        _caption = State(initialValue: entry.caption ?? "")
        _category = State(initialValue: entry.category ?? "Đời thường")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("CAPTION").font(Typo.groupLabel).foregroundStyle(palette.sub)
                        TextEditor(text: $caption)
                            .font(Typo.caption).foregroundStyle(palette.ink)
                            .frame(minHeight: 100).padding(8)
                            .background(RoundedRectangle(cornerRadius: 14).fill(palette.card))
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("NHÃN PHÂN LOẠI").font(Typo.groupLabel).foregroundStyle(palette.sub)
                        FlowPills(items: CategoryColors.all, selected: $category)
                    }
                }
                .padding(16)
            }
            .background(palette.bg.ignoresSafeArea())
            .navigationTitle("Sửa khoảnh khắc")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Huỷ") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Lưu") {
                        saving = true
                        Task { if await onSave(caption, category) { dismiss() }; saving = false }
                    }.disabled(saving)
                }
            }
        }
    }
}

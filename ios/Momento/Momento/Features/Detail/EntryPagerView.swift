import SwiftUI
import SwiftData

// Swipe left/right between posts. Wraps the per-post detail in a horizontal paged
// TabView over the list the user came from (timeline / category / search), opened
// at the tapped post. Owns the edit/delete menu (acting on the current page) —
// a toolbar inside the TabView pages wouldn't reliably reach the nav bar.
struct EntryPagerView: View {
    let entries: [LocalEntry]
    @State private var index: Int

    @Environment(AppState.self) private var app
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var showEdit = false
    @State private var confirmDelete = false
    @State private var notice: String?

    init(entries: [LocalEntry], startIndex: Int) {
        self.entries = entries
        _index = State(initialValue: startIndex)
    }

    private var current: LocalEntry? { entries.indices.contains(index) ? entries[index] : nil }

    var body: some View {
        TabView(selection: $index) {
            ForEach(Array(entries.enumerated()), id: \.element.id) { i, entry in
                EntryDetailView(entry: entry).tag(i)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .navigationTitle("Khoảnh khắc")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { showEdit = true } label: { Label("Sửa", systemImage: "pencil") }
                    Button(role: .destructive) { confirmDelete = true } label: { Label("Xoá", systemImage: "trash") }
                } label: { Image(systemName: "ellipsis.circle") }
                .disabled(current == nil)
            }
        }
        .confirmationDialog("Xoá khoảnh khắc này?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Xoá", role: .destructive) { delete() }
            Button("Huỷ", role: .cancel) {}
        }
        .sheet(isPresented: $showEdit) {
            if let current { EditPostSheet(entry: current, onSave: saveEdit).momentoThemeAuto() }
        }
        .overlay(alignment: .bottom) { toast }
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

    // Synced post → server first (needs network); unsynced local draft → local
    // only (its caption syncs on finalize). Returns success so the sheet dismisses.
    private func saveEdit(caption: String, category: String) async -> Bool {
        guard let entry = current else { return false }
        let trimmed = caption.trimmingCharacters(in: .whitespacesAndNewlines)
        let cap = trimmed.isEmpty ? nil : trimmed
        if let id = entry.serverId {
            do { _ = try await app.entries.update(id: id, caption: cap, category: category) }
            catch { notice = "Sửa thất bại — kiểm tra mạng"; return false }
        }
        entry.caption = cap
        entry.category = category
        entry.captionSource = "user"
        try? context.save()
        Haptics.success()
        return true
    }

    private func delete() {
        guard let entry = current else { return }
        Task { @MainActor in
            if let id = entry.serverId {
                do { try await app.entries.delete(id: id) }
                catch { notice = "Xoá thất bại — kiểm tra mạng"; return }
            }
            for m in entry.media {
                MediaStore.delete(m.localMediaPath)
                MediaStore.delete(m.localPosterPath)
            }
            context.delete(entry)
            try? context.save()
            Haptics.success()
            dismiss()
        }
    }
}

import SwiftUI
import SwiftData
import UIKit

// After composing: request an AI caption from the cover (when online), let the
// user edit it + pick a category, then save the post (LocalEntry + LocalMedia)
// and kick the sync queue.
struct ReviewView: View {
    let drafts: [DraftMedia]
    let onSaved: () -> Void

    private var cover: DraftMedia? { drafts.first }

    @Environment(\.palette) private var palette
    @Environment(AppState.self) private var app
    @Environment(SyncQueue.self) private var sync
    @Environment(\.modelContext) private var context

    @State private var caption = ""
    @State private var aiCaption = ""
    @State private var captionLoading = false
    @State private var captionError: String?
    @State private var category = "Đời thường"
    @State private var saving = false
    @State private var locTask: Task<PlaceInfo?, Never>?
    @State private var displayLocation: String?

    var body: some View {
        VStack(spacing: 0) {
            preview
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    captionSection
                    categorySection
                    if let displayLocation {
                        Label(displayLocation, systemImage: "mappin.and.ellipse")
                            .font(.system(size: 13.5, weight: .medium))
                            .foregroundStyle(palette.sub)
                    }
                }
                .padding(16)
            }
            saveBar
        }
        .background(palette.bg.ignoresSafeArea())
        .task { await requestCaption() }
        .task { await resolveLocation() }
    }

    // Geotag the post when the user enabled it: kick off location capture early so
    // it's ready by save time (save() awaits this task). No-op if off/denied.
    private func resolveLocation() async {
        guard let s = try? await app.settings.get(), s.geoTag else { return }
        let task = Task { await LocationProvider.shared.place() }
        locTask = task
        displayLocation = await task.value?.name   // surface it on the Review screen
    }

    private var preview: some View {
        Group {
            if let data = cover?.posterData, let ui = UIImage(data: data) {
                Image(uiImage: ui).resizable().aspectRatio(contentMode: .fill)
            } else {
                StripedPlaceholder()
            }
        }
        .frame(height: 260).frame(maxWidth: .infinity).clipped()
        .overlay(alignment: .bottomTrailing) {
            if drafts.count > 1 {
                Text("\(drafts.count) mục").font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white).padding(.horizontal, 10).padding(.vertical, 5)
                    .background(.black.opacity(0.6), in: Capsule()).padding(10)
            }
        }
    }

    private var captionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("CAPTION DO AI GỢI Ý", systemImage: "sparkles")
                .font(Typo.groupLabel).foregroundStyle(palette.accent)
            if captionLoading {
                HStack(spacing: 8) {
                    ProgressView().tint(palette.accent)
                    Text("AI đang viết caption…").font(Typo.caption).foregroundStyle(palette.sub)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 14).fill(palette.card))
            } else {
                TextEditor(text: $caption)
                    .font(Typo.caption).foregroundStyle(palette.ink)
                    .frame(minHeight: 90).padding(8)
                    .background(RoundedRectangle(cornerRadius: 14).fill(palette.card))
                if app.session.driveToken == nil && aiCaption.isEmpty {
                    Text("Caption sẽ được tạo khi có mạng.")
                        .font(.system(size: 12)).foregroundStyle(palette.ter)
                }
                if let captionError {
                    Text(captionError)
                        .font(.system(size: 12)).foregroundStyle(.red)
                }
            }
        }
    }

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("NHÃN PHÂN LOẠI").font(Typo.groupLabel).foregroundStyle(palette.sub)
            FlowPills(items: CategoryColors.all, selected: $category)
        }
    }

    private var saveBar: some View {
        Button(action: save) {
            HStack(spacing: 8) {
                if saving {
                    ProgressView().tint(palette.accentText)
                }
                Text(saving ? "Đang lưu…" : "Lưu khoảnh khắc")
                    .font(.system(size: 16, weight: .semibold))
            }
            .frame(maxWidth: .infinity).padding(.vertical, 15)
            .background(RoundedRectangle(cornerRadius: 16).fill(palette.accent.opacity(saving ? 0.7 : 1)))
            .foregroundStyle(palette.accentText)
        }
        .disabled(saving || captionLoading)
        .padding(16)
    }

    private func requestCaption() async {
        guard let poster = cover?.posterData else { return }
        captionLoading = true
        defer { captionLoading = false }
        let create = CreateAPI(client: app.api, session: app.session)
        do {
            let result = try await create.caption(poster: poster)
            aiCaption = result.caption
            if caption.isEmpty { caption = result.caption }
            category = result.category
        } catch {
            // Surface why so caption failures are diagnosable.
            captionError = "Caption lỗi: \(Self.reason(error))"
        }
    }

    private static func reason(_ error: Error) -> String {
        switch error {
        case APIError.unauthorized: return "401 (token hết hạn?)"
        case APIError.http(let code): return "HTTP \(code)"
        case APIError.decoding: return "phản hồi không hợp lệ"
        case APIError.transport(let e): return "mạng: \(e.localizedDescription)"
        default: return error.localizedDescription
        }
    }

    private func save() {
        saving = true
        Task { @MainActor in
            // Wait for the geotag capture (if any) so the post isn't saved before
            // the location resolves. nil when off/denied/unavailable.
            let place = await locTask?.value ?? nil
            // Source = "ai" only if the caption is the untouched AI suggestion.
            let source = (!aiCaption.isEmpty && caption == aiCaption) ? "ai" : "user"
            let post = LocalEntry(
                caption: caption.isEmpty ? nil : caption,
                captionSource: source,
                category: category,
                // Real capture date of the cover (EXIF/AV for library, now for camera).
                takenAt: cover?.takenAt ?? Date(),
                location: place?.name,
                latitude: place?.latitude,
                longitude: place?.longitude
            )
            context.insert(post)
            for (idx, d) in drafts.enumerated() {
                let media = LocalMedia(
                    mediaClientId: d.id,
                    position: idx,
                    kind: d.kind,
                    localMediaPath: d.mediaPath,
                    localPosterPath: d.posterPath,
                    thumbnailData: d.posterData,
                    durationSec: d.durationSec
                )
                media.entry = post
                context.insert(media)
            }
            try? context.save()
            Haptics.success()
            await sync.syncPending()
            // Open the new post's detail in the timeline after the composer closes.
            app.pendingDetail = post
            onSaved()
        }
    }
}

// Simple wrapping pill selector for categories.
struct FlowPills: View {
    let items: [String]
    @Binding var selected: String
    @Environment(\.palette) private var palette

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { item in
                let isOn = item == selected
                Button { selected = item } label: {
                    HStack(spacing: 5) {
                        Circle().fill(CategoryColors.color(for: item)).frame(width: 6, height: 6)
                        Text(item).font(.system(size: 13, weight: .medium))
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 999)
                        .fill(isOn ? palette.accent : palette.card))
                    .foregroundStyle(isOn ? palette.accentText : palette.ink)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

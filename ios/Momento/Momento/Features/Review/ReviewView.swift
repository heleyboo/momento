import SwiftUI
import SwiftData
import UIKit

// After capture: request an AI caption (when online), let the user edit it and
// pick a category, then save a local pending entry and kick the sync queue.
struct ReviewView: View {
    let captured: CapturedMedia
    let onSaved: () -> Void

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

    var body: some View {
        VStack(spacing: 0) {
            preview
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    captionSection
                    categorySection
                }
                .padding(16)
            }
            saveBar
        }
        .background(palette.bg.ignoresSafeArea())
        .task { await requestCaption() }
    }

    private var preview: some View {
        Group {
            if let ui = UIImage(data: captured.posterData) {
                Image(uiImage: ui).resizable().aspectRatio(contentMode: .fill)
            } else {
                StripedPlaceholder()
            }
        }
        .frame(height: 260).frame(maxWidth: .infinity).clipped()
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
            Text(saving ? "Đang lưu…" : "Lưu khoảnh khắc")
                .font(.system(size: 16, weight: .semibold))
                .frame(maxWidth: .infinity).padding(.vertical, 15)
                .background(RoundedRectangle(cornerRadius: 16).fill(palette.accent))
                .foregroundStyle(palette.accentText)
        }
        .disabled(saving || captionLoading)
        .padding(16)
    }

    private func requestCaption() async {
        captionLoading = true
        defer { captionLoading = false }
        let create = CreateAPI(client: app.api, session: app.session)
        do {
            let result = try await create.caption(poster: captured.posterData)
            aiCaption = result.caption
            if caption.isEmpty { caption = result.caption }
            category = result.category
        } catch {
            // Surface why so caption failures are diagnosable (was silently swallowed).
            captionError = "Caption lỗi: \(Self.reason(error)) · poster \(captured.posterData.count) B"
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
        let mediaName = try? MediaStore.save(captured.mediaData, ext: captured.mediaExt)
        let posterName = try? MediaStore.save(captured.posterData, ext: "jpg")
        // Source = "ai" only if the caption is the untouched AI suggestion.
        let source = (!aiCaption.isEmpty && caption == aiCaption) ? "ai" : "user"
        let entry = LocalEntry(
            kind: captured.kind == .video ? "video" : "photo",
            caption: caption.isEmpty ? nil : caption,
            captionSource: source,
            category: category,
            takenAt: Date(),
            durationSec: captured.durationSec,
            localMediaPath: mediaName,
            localPosterPath: posterName,
            thumbnailData: captured.posterData
        )
        context.insert(entry)
        try? context.save()
        Task { await sync.syncPending() }
        onSaved()
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

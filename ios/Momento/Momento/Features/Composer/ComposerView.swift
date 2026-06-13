import SwiftUI
import PhotosUI
import UIKit

// Compose a post from many media: capture several with the camera and/or pick
// from the photo library into a tray, choose the cover, then review + save.
struct ComposerView: View {
    let onFinished: () -> Void

    @Environment(\.palette) private var palette
    @State private var drafts: [DraftMedia] = []
    @State private var showCamera = false
    @State private var picks: [PhotosPickerItem] = []
    @State private var importing = false
    @State private var goReview = false
    @State private var notice: String?

    private let maxCount = 20
    private let maxTotalBytes = 500 * 1024 * 1024

    private var totalBytes: Int { drafts.reduce(0) { $0 + $1.sizeBytes } }
    private var canAddMore: Bool { drafts.count < maxCount && totalBytes < maxTotalBytes }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if drafts.isEmpty { empty } else { tray }
                        addRow
                    }
                    .padding(16)
                }
                continueBar
            }
            .background(palette.bg.ignoresSafeArea())
            .navigationTitle("Khoảnh khắc mới")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Đóng") { onFinished() }
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraView(onCaptured: addCaptured, onFinished: { showCamera = false })
                    .momentoThemeAuto()
            }
            .navigationDestination(isPresented: $goReview) {
                ReviewView(drafts: drafts, onSaved: onFinished)
            }
            .onChange(of: picks) { _, items in Task { await importPicks(items) } }
            .overlay(alignment: .bottom) { toast }
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "photo.on.rectangle.angled").font(.system(size: 34)).foregroundStyle(palette.ter)
            Text("Thêm ảnh/video cho khoảnh khắc này").font(Typo.caption).foregroundStyle(palette.sub)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 40)
    }

    private var tray: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(drafts.count)/\(maxCount) · chạm để chọn ảnh bìa")
                .font(.system(size: 13)).foregroundStyle(palette.sub)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
                ForEach(Array(drafts.enumerated()), id: \.element.id) { idx, d in
                    cell(d, isCover: idx == 0)
                }
            }
        }
    }

    private func cell(_ d: DraftMedia, isCover: Bool) -> some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if let ui = UIImage(data: d.posterData) {
                    Image(uiImage: ui).resizable().aspectRatio(contentMode: .fill)
                } else { StripedPlaceholder() }
            }
            .frame(width: 96, height: 96).clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(alignment: .bottomLeading) {
                if d.kind == "video" {
                    Image(systemName: "play.fill").font(.system(size: 9)).foregroundStyle(.white)
                        .padding(4).background(.black.opacity(0.55), in: Circle()).padding(4)
                }
            }
            .overlay(alignment: .bottomTrailing) {
                if isCover {
                    Text("Bìa").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(palette.accent, in: Capsule()).padding(4)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { setCover(d) }

            Button { remove(d) } label: {
                Image(systemName: "xmark.circle.fill").font(.system(size: 18))
                    .foregroundStyle(.white, .black.opacity(0.5))
            }
            .padding(4)
        }
    }

    private var addRow: some View {
        HStack(spacing: 12) {
            Button { showCamera = true } label: { addTile("camera", "Chụp") }
                .disabled(!canAddMore)
            PhotosPicker(
                selection: $picks,
                maxSelectionCount: max(0, maxCount - drafts.count),
                matching: .any(of: [.images, .videos])
            ) { addTile("photo.on.rectangle", "Thư viện") }
                .disabled(!canAddMore)
            if importing { ProgressView().tint(palette.accent) }
            Spacer()
        }
    }

    private func addTile(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 22))
            Text(label).font(.system(size: 12, weight: .medium))
        }
        .foregroundStyle(palette.accent)
        .frame(width: 96, height: 96)
        .background(RoundedRectangle(cornerRadius: 12).strokeBorder(palette.sep, style: StrokeStyle(lineWidth: 1, dash: [4])))
    }

    private var continueBar: some View {
        Button { goReview = true } label: {
            Text("Tiếp tục")
                .font(.system(size: 16, weight: .semibold))
                .frame(maxWidth: .infinity).padding(.vertical, 15)
                .background(RoundedRectangle(cornerRadius: 16).fill(drafts.isEmpty ? palette.ter : palette.accent))
                .foregroundStyle(palette.accentText)
        }
        .disabled(drafts.isEmpty)
        .padding(16)
    }

    private var toast: some View {
        Group {
            if let notice {
                Text(notice).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(.black.opacity(0.8), in: Capsule()).padding(.bottom, 90)
                    .task { try? await Task.sleep(for: .seconds(2)); self.notice = nil }
            }
        }
    }

    // MARK: - Mutations
    private func setCover(_ d: DraftMedia) {
        guard let idx = drafts.firstIndex(of: d), idx != 0 else { return }
        drafts.remove(at: idx)
        drafts.insert(d, at: 0)
    }

    private func remove(_ d: DraftMedia) {
        MediaStore.delete(d.mediaPath)
        MediaStore.delete(d.posterPath)
        drafts.removeAll { $0.id == d.id }
    }

    private func addCaptured(_ m: CapturedMedia) {
        guard canAddMore else { notice = "Đã đạt giới hạn"; return }
        guard let mediaPath = try? MediaStore.save(m.mediaData, ext: m.mediaExt),
              let posterPath = try? MediaStore.save(m.posterData, ext: "jpg") else { return }
        drafts.append(DraftMedia(
            id: UUID(), kind: m.kind == .video ? "video" : "photo",
            mediaPath: mediaPath, posterPath: posterPath, posterData: m.posterData,
            durationSec: m.durationSec, sizeBytes: m.mediaData.count, takenAt: Date()
        ))
    }

    private func importPicks(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        importing = true
        defer { importing = false; picks = [] }
        for item in items {
            guard canAddMore else { notice = "Tối đa \(maxCount) mục / 500MB"; break }
            if let d = await LibraryImport.draft(from: item) {
                if totalBytes + d.sizeBytes > maxTotalBytes {
                    MediaStore.delete(d.mediaPath); MediaStore.delete(d.posterPath)
                    notice = "Vượt 500MB/bài"; break
                }
                drafts.append(d)
            }
        }
    }
}

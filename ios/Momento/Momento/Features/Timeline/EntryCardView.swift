import SwiftUI

// Timeline row: thumbnail + meta (time · category) + caption + sync status.
// Matches the handoff's card (radius 20, thumbnail 72, gap layout).
struct EntryCardView: View {
    let entry: EntryDTO
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            thumbnail
            VStack(alignment: .leading, spacing: 6) {
                metaRow
                Text(entry.caption ?? "—")
                    .font(Typo.caption)
                    .foregroundStyle(palette.ink)
                    .lineLimit(3)
                if entry.syncStatus == "uploading" || entry.syncStatus == "pending" {
                    Label("Đang tải lên…", systemImage: "arrow.triangle.2.circlepath")
                        .font(.system(size: 12))
                        .foregroundStyle(palette.accent)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 20).fill(palette.card))
    }

    private var thumbnail: some View {
        RemoteImage(urlString: entry.thumbnailUrl ?? entry.mediaUrl)
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(alignment: .bottomTrailing) {
                if entry.isVideo {
                    Image(systemName: "play.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(.white)
                        .padding(4)
                        .background(.black.opacity(0.55), in: Circle())
                        .padding(4)
                }
            }
    }

    private var metaRow: some View {
        HStack(spacing: 6) {
            Text(timeText)
                .font(Typo.meta)
                .foregroundStyle(palette.ter)
            if let cat = entry.category {
                Circle().fill(palette.ter).frame(width: 3, height: 3)
                CategoryChip(category: cat)
            }
        }
    }

    private var timeText: String {
        guard let d = entry.takenDate else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "vi_VN")
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}

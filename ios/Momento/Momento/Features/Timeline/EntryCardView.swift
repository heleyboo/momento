import SwiftUI

// Timeline row: thumbnail + meta (time · category) + caption + sync status.
// `highlight` (set by Search) marks matching caption ranges with an accent bg.
struct EntryCardView: View {
    let entry: LocalEntry
    var highlight: String? = nil
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            thumbnail
            VStack(alignment: .leading, spacing: 6) {
                metaRow
                if let loc = entry.location, !loc.isEmpty {
                    Label(loc, systemImage: "mappin.and.ellipse")
                        .font(.system(size: 12.5)).foregroundStyle(palette.sub)
                        .lineLimit(1)
                }
                Text(captionText)
                    .font(Typo.caption)
                    .foregroundStyle(palette.ink)
                    .lineLimit(3)
                if entry.syncState == .uploading || entry.syncState == .pending {
                    Label("Đang tải lên…", systemImage: "arrow.triangle.2.circlepath")
                        .font(.system(size: 12)).foregroundStyle(palette.accent)
                } else if entry.syncState == .error {
                    Label("Lỗi đồng bộ · sẽ thử lại", systemImage: "exclamationmark.triangle")
                        .font(.system(size: 12)).foregroundStyle(.orange)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 20).fill(palette.card))
    }

    private var thumbnail: some View {
        EntryImage(media: entry.cover)
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(alignment: .bottomTrailing) {
                if entry.isVideo {
                    Image(systemName: "play.fill")
                        .font(.system(size: 9)).foregroundStyle(.white)
                        .padding(4).background(.black.opacity(0.55), in: Circle()).padding(4)
                }
            }
            .overlay(alignment: .topTrailing) {
                if entry.mediaCount > 1 {
                    Text("+\(entry.mediaCount - 1)")
                        .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(.black.opacity(0.6), in: Capsule()).padding(4)
                }
            }
    }

    private var metaRow: some View {
        HStack(spacing: 6) {
            Text(timeText).font(Typo.meta).foregroundStyle(palette.ter)
            if let cat = entry.category {
                Circle().fill(palette.ter).frame(width: 3, height: 3)
                CategoryChip(category: cat)
            }
        }
    }

    private var timeText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "vi_VN")
        f.dateFormat = "HH:mm"
        return f.string(from: entry.takenAt)
    }

    // Caption with every occurrence of `highlight` marked (accent background).
    private var captionText: AttributedString {
        let raw = entry.caption ?? "—"
        var attr = AttributedString(raw)
        guard let query = highlight, !query.isEmpty else { return attr }

        var from = raw.startIndex
        while let r = raw.range(of: query, options: [.caseInsensitive, .diacriticInsensitive],
                               range: from..<raw.endIndex) {
            if let lo = AttributedString.Index(r.lowerBound, within: attr),
               let hi = AttributedString.Index(r.upperBound, within: attr) {
                attr[lo..<hi].backgroundColor = palette.accent.opacity(0.28)
            }
            from = r.upperBound
            if from == raw.endIndex { break }
        }
        return attr
    }
}

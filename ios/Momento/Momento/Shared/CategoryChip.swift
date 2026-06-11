import SwiftUI

// Pill showing a category with its color dot (Timeline meta row, Detail).
struct CategoryChip: View {
    let category: String
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(CategoryColors.color(for: category))
                .frame(width: 6, height: 6)
            Text(category)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(palette.chipText)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(Capsule().fill(palette.chipBg))
    }
}

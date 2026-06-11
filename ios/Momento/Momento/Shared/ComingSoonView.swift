import SwiftUI

// Placeholder for tabs/flows whose UI lands in later phases (Album/Search/
// Settings screens, Camera). Keeps the shell navigable in Phase 4.
struct ComingSoonView: View {
    let title: String
    var symbol: String = "hammer"
    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: symbol).font(.system(size: 40)).foregroundStyle(palette.ter)
            Text(title).font(Typo.galleryTitle).foregroundStyle(palette.ink)
            Text("Sắp có").font(Typo.caption).foregroundStyle(palette.sub)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(palette.bg.ignoresSafeArea())
    }
}

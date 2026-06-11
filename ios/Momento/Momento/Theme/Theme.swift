import SwiftUI

// Typography scale from the handoff (SF Pro = system font). Weights/sizes match
// the design's spec so views don't hard-code fonts.
enum Typo {
    static let largeTitle = Font.system(size: 34, weight: .bold)        // nav title
    static let daySection = Font.system(size: 19, weight: .bold)        // day header
    static let galleryTitle = Font.system(size: 22, weight: .bold)
    static let caption = Font.system(size: 15.5, weight: .regular)      // body caption
    static let captionLg = Font.system(size: 19, weight: .regular)      // detail caption
    static let meta = Font.system(size: 12.5, weight: .semibold)        // time/meta
    static let groupLabel = Font.system(size: 12.5, weight: .semibold)  // uppercase labels
    static let tabLabel = Font.system(size: 10.5, weight: .medium)
}

// Palette injected through the environment so any view can read the active
// (light/dark) tokens via `@Environment(\.palette)`.
private struct PaletteKey: EnvironmentKey {
    static let defaultValue: Palette = .light
}

extension EnvironmentValues {
    var palette: Palette {
        get { self[PaletteKey.self] }
        set { self[PaletteKey.self] = newValue }
    }
}

extension View {
    // Resolves the palette from the current color scheme and injects it.
    func momentoTheme(_ scheme: ColorScheme) -> some View {
        environment(\.palette, Palette.resolve(scheme))
    }
}

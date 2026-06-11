import SwiftUI

// Design tokens from the handoff (Base = Sage, Accent = Forest), resolved per
// color scheme. Derived tokens (sub/ter/sep) come from `ink` at fixed opacities.
// Source of truth: design_handoff_photo_journal/README.md → Design Tokens.
struct Palette {
    // Base
    let appBg: Color      // canvas behind the device (sage)
    let bg: Color         // screen background (ivory)
    let card: Color
    let card2: Color
    let ink: Color        // primary text (navy)
    let fieldBg: Color
    let stripeA: Color
    let stripeB: Color
    // Accent (Forest)
    let accent: Color
    let accentText: Color // text/icon on an accent fill
    let chipText: Color
    let chipBg: Color

    // Derived
    var sub: Color { ink.opacity(isDark ? 0.64 : 0.56) }
    var ter: Color { ink.opacity(isDark ? 0.42 : 0.34) }
    var sep: Color { ink.opacity(isDark ? 0.11 : 0.08) }
    let isDark: Bool

    static let light = Palette(
        appBg: Color.hex("#a9bba2"),
        bg: Color.hex("#f6f3e9"),
        card: Color.hex("#ffffff"),
        card2: Color.hex("#f3efe2"),
        ink: Color.hex("#15273a"),
        fieldBg: Color.hex("#f1ede0"),
        stripeA: Color.hex("#e7e8d8"),
        stripeB: Color.hex("#d7dcc6"),
        accent: Color.hex("#1e4d2b"),
        accentText: Color.hex("#ffffff"),
        chipText: Color.hex("#1e4d2b"),
        chipBg: Color.hex("#1e4d2b").opacity(0.12),
        isDark: false
    )

    static let dark = Palette(
        appBg: Color.hex("#0a0e0f"),
        bg: Color.hex("#13181a"),
        card: Color.hex("#1b2224"),
        card2: Color.hex("#242c2e"),
        ink: Color.hex("#ecf1ec"),
        fieldBg: Color.hex("#242c2e"),
        stripeA: Color.hex("#1f2829"),
        stripeB: Color.hex("#293433"),
        accent: Color.hex("#4e9e6a"),
        accentText: Color.hex("#0a0e0f"),
        chipText: Color.hex("#8fcfa3"),
        chipBg: Color.hex("#4e9e6a").opacity(0.20),
        isDark: true
    )

    static func resolve(_ scheme: ColorScheme) -> Palette {
        scheme == .dark ? .dark : .light
    }
}

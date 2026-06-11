import SwiftUI

// Hex → Color helper so design tokens can be expressed as the handoff's hex
// values. A static factory (not an init) avoids overload ambiguity with
// SwiftUI's `Color(_ name:)` asset initializer. Supports #RGB, #RRGGBB, #RRGGBBAA.
extension Color {
    static func hex(_ string: String) -> Color {
        let s = string.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        let r, g, b, a: Double
        switch s.count {
        case 3: // RGB (12-bit)
            r = Double((value >> 8) & 0xF) / 15
            g = Double((value >> 4) & 0xF) / 15
            b = Double(value & 0xF) / 15
            a = 1
        case 8: // RRGGBBAA
            r = Double((value >> 24) & 0xFF) / 255
            g = Double((value >> 16) & 0xFF) / 255
            b = Double((value >> 8) & 0xFF) / 255
            a = Double(value & 0xFF) / 255
        default: // RRGGBB
            r = Double((value >> 16) & 0xFF) / 255
            g = Double((value >> 8) & 0xFF) / 255
            b = Double(value & 0xFF) / 255
            a = 1
        }
        return Color(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

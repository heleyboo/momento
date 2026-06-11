import SwiftUI

// Category dot colors. The handoff specifies these in oklch; SwiftUI has no
// oklch initializer on the stable API, so these are close sRGB equivalents of
// the documented hues. Keys match the backend's category labels exactly.
enum CategoryColors {
    static let all = ["Du lịch", "Gia đình", "Công việc", "Đời thường", "Sức khỏe"]

    private static let map: [String: Color] = [
        "Du lịch": Color.hex("#3b82c4"),   // oklch(0.62 0.13 230) blue
        "Gia đình": Color.hex("#d97b45"),  // oklch(0.64 0.15 30) orange
        "Công việc": Color.hex("#7a5fc0"), // oklch(0.58 0.13 280) purple
        "Đời thường": Color.hex("#3f9560"),// oklch(0.58 0.13 155) green
        "Sức khỏe": Color.hex("#c75f86"),  // oklch(0.62 0.14 350) pink
    ]

    static func color(for category: String?) -> Color {
        guard let category, let c = map[category] else { return Color.hex("#8a8f88") }
        return c
    }
}

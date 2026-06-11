import SwiftUI

// Loads entries from the API and groups them by day for the timeline. In-memory
// for Phase 4; SwiftData caching + the offline sync queue arrive in Phase 5.
@MainActor
@Observable
final class TimelineViewModel {
    var entries: [EntryDTO] = []
    var isLoading = false
    var errorMessage: String?

    struct DayGroup: Identifiable {
        let id: String
        let label: String
        let entries: [EntryDTO]
    }

    var groups: [DayGroup] {
        let cal = Calendar.current
        // Preserve newest-first order; bucket by day key.
        var order: [String] = []
        var buckets: [String: [EntryDTO]] = [:]
        for e in entries {
            let day = e.takenDate.map { cal.startOfDay(for: $0) } ?? .distantPast
            let key = ISO8601DateFormatter().string(from: day)
            if buckets[key] == nil { order.append(key); buckets[key] = [] }
            buckets[key]?.append(e)
        }
        return order.map { key in
            let first = buckets[key]?.first?.takenDate
            return DayGroup(id: key, label: Self.dayLabel(first), entries: buckets[key] ?? [])
        }
    }

    func load(using api: EntriesAPI) async {
        isLoading = true; errorMessage = nil
        do { entries = try await api.list() }
        catch { errorMessage = "Không tải được khoảnh khắc." }
        isLoading = false
    }

    private static func dayLabel(_ date: Date?) -> String {
        guard let date else { return "" }
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Hôm nay" }
        if cal.isDateInYesterday(date) { return "Hôm qua" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "vi_VN")
        f.dateFormat = "EEEE, d MMMM"
        return f.string(from: date).capitalized
    }
}

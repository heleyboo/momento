import Foundation
import SwiftData

// Drives offline-first upload. Captured entries persist locally as `.pending`;
// this queue uploads them when the network allows, transitioning the state and
// folding in the server's caption. Backend idempotency (clientEntryId) makes
// re-sends safe, so crash recovery simply re-enqueues stuck `.uploading` rows.
@MainActor
@Observable
final class SyncQueue {
    private let context: ModelContext
    private let monitor: NetworkMonitor
    private let api: CreateAPI
    var wifiOnly = false

    private var running = false

    init(context: ModelContext, monitor: NetworkMonitor, api: CreateAPI) {
        self.context = context
        self.monitor = monitor
        self.api = api
    }

    // On launch, any row left `.uploading` (app killed mid-upload) → re-enqueue.
    func recoverOnLaunch() {
        let d = FetchDescriptor<LocalEntry>(predicate: #Predicate { $0.syncStateRaw == "uploading" })
        guard let stuck = try? context.fetch(d), !stuck.isEmpty else { return }
        for e in stuck { e.syncState = .pending }
        try? context.save()
    }

    func syncPending() async {
        guard !running, monitor.canUpload(wifiOnly: wifiOnly) else { return }
        running = true
        defer { running = false }

        let d = FetchDescriptor<LocalEntry>(
            predicate: #Predicate { $0.syncStateRaw == "pending" || $0.syncStateRaw == "error" },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        guard let items = try? context.fetch(d) else { return }
        for entry in items {
            guard monitor.canUpload(wifiOnly: wifiOnly) else { break }
            await upload(entry)
        }
    }

    private func upload(_ entry: LocalEntry) async {
        guard let mediaData = MediaStore.read(entry.localMediaPath),
              let posterData = MediaStore.read(entry.localPosterPath) else {
            entry.syncState = .error
            try? context.save()
            return
        }

        entry.syncState = .uploading
        try? context.save()

        let (ext, mime) = entry.isVideo ? ("mov", "video/quicktime") : ("jpg", "image/jpeg")
        let params = CreateEntryParams(
            clientEntryId: entry.clientEntryId,
            kind: entry.kind,
            takenAt: entry.takenAt,
            // Send the caption we already generated (AI or user). Sending nil only
            // when truly absent (offline capture) lets the server fill it in — this
            // avoids a redundant server-side caption call and, crucially, stops a
            // failed server regeneration from blanking a good local caption.
            caption: entry.caption,
            captionSource: entry.captionSource,
            category: entry.category,
            location: entry.location,
            durationSec: entry.durationSec,
            mediaData: mediaData,
            mediaExt: ext,
            mediaMime: mime,
            posterData: posterData
        )

        do {
            let dto = try await api.create(params)
            entry.serverId = dto.id
            entry.remoteMediaUrl = dto.mediaUrl
            entry.remoteThumbnailUrl = dto.thumbnailUrl
            // Adopt server-filled caption only for AI entries and only when the
            // server actually returned one — never overwrite a good caption with nil.
            if entry.captionSource == "ai" {
                if let c = dto.caption, !c.isEmpty { entry.caption = c }
                if let cat = dto.category { entry.category = cat }
            }
            entry.syncState = .done
            try? context.save()
        } catch {
            entry.syncState = .error
            try? context.save()
        }
    }
}

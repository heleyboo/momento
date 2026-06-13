import Foundation
import SwiftData

// Drives offline-first upload. A post (LocalEntry) persists locally with its
// media (LocalMedia) the moment it's composed; this queue stages each media
// independently then finalizes the post. Backend idempotency (clientEntryId +
// mediaClientId) makes re-sends safe, so crash recovery re-enqueues stuck rows.
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

    // On launch: (1) backfill legacy single-media entries into a LocalMedia
    // child; (2) re-enqueue any media stuck in `.uploading` (app killed mid-send).
    func recoverOnLaunch() {
        backfillLegacy()
        let d = FetchDescriptor<LocalMedia>(predicate: #Predicate { $0.uploadStateRaw == "uploading" })
        if let stuck = try? context.fetch(d) {
            for m in stuck { m.uploadState = .pending }
        }
        try? context.save()
    }

    // One-time migration: a pre-multi-media LocalEntry carries its media inline.
    // Wrap it in a single LocalMedia so the rest of the app is media-only.
    private func backfillLegacy() {
        let d = FetchDescriptor<LocalEntry>(predicate: #Predicate { $0.localMediaPath != nil })
        guard let legacy = try? context.fetch(d) else { return }
        for e in legacy where e.media.isEmpty {
            let m = LocalMedia(
                position: 0,
                kind: e.kind ?? "photo",
                localMediaPath: e.localMediaPath,
                localPosterPath: e.localPosterPath,
                thumbnailData: e.thumbnailData,
                durationSec: e.durationSec,
                remoteMediaUrl: e.remoteMediaUrl,
                remoteThumbnailUrl: e.remoteThumbnailUrl,
                uploadState: e.syncState == .done ? .done : .pending
            )
            m.entry = e
            context.insert(m)
            // Clear the legacy fields so the backfill never runs twice.
            e.localMediaPath = nil
            e.localPosterPath = nil
            e.thumbnailData = nil
        }
    }

    func syncPending() async {
        guard !running, monitor.canUpload(wifiOnly: wifiOnly) else { return }
        running = true
        defer { running = false }

        let d = FetchDescriptor<LocalEntry>(
            predicate: #Predicate { $0.syncStateRaw != "done" },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        guard let posts = try? context.fetch(d) else { return }
        for post in posts {
            guard monitor.canUpload(wifiOnly: wifiOnly) else { break }
            await uploadPost(post)
        }
    }

    private func uploadPost(_ post: LocalEntry) async {
        let items = post.sortedMedia
        guard !items.isEmpty else { return }

        // Stage each media that isn't done yet.
        for media in items where media.uploadState != .done {
            guard monitor.canUpload(wifiOnly: wifiOnly) else { return }
            await stage(media, clientEntryId: post.clientEntryId)
        }

        // All media uploaded → finalize the post.
        guard items.allSatisfy({ $0.uploadState == .done }) else {
            post.syncState = .error
            try? context.save()
            return
        }

        do {
            let dto = try await withRetry {
                try await self.api.finalize(
                    clientEntryId: post.clientEntryId,
                    // Send the caption we have; nil only if truly absent (server fills in).
                    caption: post.caption,
                    captionSource: post.captionSource,
                    category: post.category,
                    takenAt: post.takenAt,
                    location: post.location,
                    latitude: post.latitude,
                    longitude: post.longitude,
                    mediaClientIds: items.map { $0.mediaClientId }
                )
            }
            post.serverId = dto.id
            // Adopt server-filled caption only for AI posts and only when present.
            if post.captionSource == "ai" {
                if let c = dto.caption, !c.isEmpty { post.caption = c }
                if let cat = dto.category { post.category = cat }
            }
            // Map remote URLs back onto each media by position.
            for m in dto.media {
                if let local = items.first(where: { $0.position == m.position }) {
                    local.remoteMediaUrl = m.url
                    local.remoteThumbnailUrl = m.thumbnailUrl
                }
            }
            post.syncState = .done
            try? context.save()
        } catch {
            post.syncState = .error
            try? context.save()
        }
    }

    private func stage(_ media: LocalMedia, clientEntryId: UUID) async {
        guard let mediaData = MediaStore.read(media.localMediaPath),
              let posterData = MediaStore.read(media.localPosterPath) else {
            media.uploadState = .error
            try? context.save()
            return
        }
        media.uploadState = .uploading
        try? context.save()

        let (ext, mime) = media.isVideo ? ("mov", "video/quicktime") : ("jpg", "image/jpeg")
        do {
            try await withRetry {
                try await self.api.stageMedia(StageMediaParams(
                    clientEntryId: clientEntryId,
                    mediaClientId: media.mediaClientId,
                    kind: media.kind,
                    mediaData: mediaData,
                    mediaExt: ext,
                    mediaMime: mime,
                    posterData: posterData,
                    durationSec: media.durationSec
                ))
            }
            media.uploadState = .done
            try? context.save()
        } catch {
            media.uploadState = .error
            try? context.save()
        }
    }

    // Retries transient failures (network drop, server 5xx) with backoff before
    // giving up to .error. Permanent failures (4xx / auth) throw immediately —
    // re-sending won't help. Stops early if the network goes away mid-backoff;
    // the row stays non-done and a later trigger (reconnect/foreground) retries.
    private func withRetry<T>(_ op: () async throws -> T) async throws -> T {
        let delays: [UInt64] = [1, 3, 7] // seconds
        var attempt = 0
        while true {
            do { return try await op() }
            catch {
                guard isTransient(error), attempt < delays.count,
                      monitor.canUpload(wifiOnly: wifiOnly) else { throw error }
                try? await Task.sleep(for: .seconds(delays[attempt]))
                attempt += 1
            }
        }
    }

    private func isTransient(_ error: Error) -> Bool {
        switch error {
        case APIError.transport: return true            // connection lost / timed out
        case APIError.http(let code): return code >= 500 || code < 0
        default: return false                            // 4xx / unauthorized / decoding = permanent
        }
    }
}

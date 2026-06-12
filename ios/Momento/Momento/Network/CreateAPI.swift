import Foundation
import UIKit

struct CaptionResult: Decodable {
    let caption: String
    let category: String
}

// One media to stage (uploaded independently before the post is finalized).
struct StageMediaParams {
    let clientEntryId: UUID
    let mediaClientId: UUID
    let kind: String           // "photo" | "video"
    let mediaData: Data
    let mediaExt: String       // "jpg" | "mov" | ...
    let mediaMime: String
    let posterData: Data
    let durationSec: Double?
}

// Per-media upload + post finalize. Drive token (when present) is forwarded so
// the backend can use the user's Drive under provider=drive.
struct CreateAPI {
    let client: APIClient
    let session: SessionStore

    func caption(poster: Data) async throws -> CaptionResult {
        // Captioning only needs a small frame; send a downscaled copy so the
        // upload stays tiny (a full-res poster can stall the request on slower
        // links). The stored poster/thumbnail keeps its original resolution.
        let small = UIImage(data: poster)?.scaledDown(maxDim: 640)
            .jpegData(compressionQuality: 0.5) ?? poster
        var req = client.makeRequest("/api/caption", method: "POST")
        req.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        req.httpBody = small
        let data = try await client.raw(req)
        return try JSONDecoder().decode(CaptionResult.self, from: data)
    }

    /// Stage one media (idempotent on mediaClientId). Bytes only — no post yet.
    func stageMedia(_ p: StageMediaParams) async throws {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = client.makeRequest("/api/media", method: "POST")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var meta: [String: Any] = [
            "clientEntryId": p.clientEntryId.uuidString.lowercased(),
            "mediaClientId": p.mediaClientId.uuidString.lowercased(),
            "kind": p.kind,
        ]
        if let dur = p.durationSec { meta["durationSec"] = dur }
        let metaJSON = String(data: try JSONSerialization.data(withJSONObject: meta), encoding: .utf8) ?? "{}"

        var body = Data()
        body.appendFile(boundary, name: "media", filename: "media.\(p.mediaExt)", mime: p.mediaMime, data: p.mediaData)
        body.appendFile(boundary, name: "poster", filename: "poster.jpg", mime: "image/jpeg", data: p.posterData)
        body.appendField(boundary, name: "meta", value: metaJSON)
        if let token = session.driveToken {
            body.appendField(boundary, name: "driveToken", value: token)
        }
        body.appendString("--\(boundary)--\r\n")
        req.httpBody = body
        _ = try await client.raw(req)
    }

    /// Finalize a post from already-staged media (ordered → position by index).
    func finalize(
        clientEntryId: UUID,
        caption: String?,
        captionSource: String,
        category: String?,
        takenAt: Date,
        location: String?,
        mediaClientIds: [UUID]
    ) async throws -> EntryDTO {
        var req = client.makeRequest("/api/entries", method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: Any] = [
            "clientEntryId": clientEntryId.uuidString.lowercased(),
            "captionSource": captionSource,
            "takenAt": ISO8601DateFormatter().string(from: takenAt),
            "media": mediaClientIds.map { $0.uuidString.lowercased() },
        ]
        if let caption { body["caption"] = caption }
        if let category { body["category"] = category }
        if let location { body["location"] = location }
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let data = try await client.raw(req)
        return try JSONDecoder().decode(EntryDTO.self, from: data)
    }
}

private extension Data {
    mutating func appendString(_ s: String) { append(Data(s.utf8)) }

    mutating func appendField(_ boundary: String, name: String, value: String) {
        appendString("--\(boundary)\r\n")
        appendString("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
        appendString("\(value)\r\n")
    }

    mutating func appendFile(_ boundary: String, name: String, filename: String, mime: String, data: Data) {
        appendString("--\(boundary)\r\n")
        appendString("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n")
        appendString("Content-Type: \(mime)\r\n\r\n")
        append(data)
        appendString("\r\n")
    }
}

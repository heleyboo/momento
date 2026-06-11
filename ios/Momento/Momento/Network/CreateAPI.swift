import Foundation

struct CaptionResult: Decodable {
    let caption: String
    let category: String
}

// Parameters for creating an entry. clientEntryId is the idempotency key.
struct CreateEntryParams {
    let clientEntryId: UUID
    let kind: String
    let takenAt: Date
    let caption: String?
    let captionSource: String
    let category: String?
    let location: String?
    let durationSec: Double?
    let mediaData: Data
    let mediaExt: String       // "jpg" | "mp4" | ...
    let mediaMime: String
    let posterData: Data
}

// Capture-time caption + entry creation (multipart upload). Drive token (when
// present) is forwarded so the backend can use the user's Drive under provider=drive.
struct CreateAPI {
    let client: APIClient
    let session: SessionStore

    func caption(poster: Data) async throws -> CaptionResult {
        var req = client.makeRequest("/api/caption", method: "POST")
        req.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        req.httpBody = poster
        let data = try await client.raw(req)
        return try JSONDecoder().decode(CaptionResult.self, from: data)
    }

    func create(_ p: CreateEntryParams) async throws -> EntryDTO {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = client.makeRequest("/api/entries", method: "POST")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var meta: [String: Any] = [
            "clientEntryId": p.clientEntryId.uuidString.lowercased(),
            "kind": p.kind,
            "takenAt": ISO8601DateFormatter().string(from: p.takenAt),
            "captionSource": p.captionSource,
        ]
        if let caption = p.caption { meta["caption"] = caption }
        if let category = p.category { meta["category"] = category }
        if let location = p.location { meta["location"] = location }
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

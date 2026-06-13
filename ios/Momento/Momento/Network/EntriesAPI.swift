import Foundation

// Endpoint wrappers for entries / albums. Search filters are passed as query
// items; the backend enforces user scoping.
struct EntriesAPI {
    let client: APIClient

    func list(q: String? = nil, kind: String? = nil, category: String? = nil) async throws -> [EntryDTO] {
        var query: [URLQueryItem] = []
        if let q, !q.isEmpty { query.append(.init(name: "q", value: q)) }
        if let kind { query.append(.init(name: "kind", value: kind)) }
        if let category { query.append(.init(name: "cat", value: category)) }
        let resp: EntriesResponse = try await client.get("/api/entries", query: query)
        return resp.entries
    }

    func detail(id: String) async throws -> EntryDTO {
        try await client.get("/api/entries/\(id)")
    }

    /// Edit caption/category. A user caption edit flips captionSource to "user".
    func update(id: String, caption: String?, category: String?) async throws -> EntryDTO {
        var req = client.makeRequest("/api/entries/\(id)", method: "PATCH")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: String] = [:]
        if let caption { body["caption"] = caption }
        if let category { body["category"] = category }
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let data = try await client.raw(req)
        return try JSONDecoder().decode(EntryDTO.self, from: data)
    }

    func delete(id: String) async throws {
        let req = client.makeRequest("/api/entries/\(id)", method: "DELETE")
        _ = try await client.raw(req)
    }

    func albums() async throws -> [AlbumDTO] {
        let resp: AlbumsResponse = try await client.get("/api/albums")
        return resp.albums
    }
}

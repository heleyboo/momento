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

    func albums() async throws -> [AlbumDTO] {
        let resp: AlbumsResponse = try await client.get("/api/albums")
        return resp.albums
    }
}

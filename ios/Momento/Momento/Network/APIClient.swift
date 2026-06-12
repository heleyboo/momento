import Foundation

enum APIError: Error {
    case unauthorized
    case http(Int)
    case decoding
    case transport(Error)
}

// Thin async HTTP client. Injects the session Bearer token and transparently
// refreshes once on 401 (via /api/auth/refresh) before failing.
final class APIClient {
    private let session: SessionStore
    private let base = AppConfig.apiBaseURL
    private let urlSession = URLSession.shared

    init(session: SessionStore) { self.session = session }

    func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        try await send(makeRequest(path, method: "GET", query: query))
    }

    func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data = try await raw(request)
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw APIError.decoding }
    }

    /// Performs the request, refreshing the token once on 401.
    func raw(_ request: URLRequest, retrying: Bool = true) async throws -> Data {
        var req = request
        if let token = session.accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, resp): (Data, URLResponse)
        do { (data, resp) = try await urlSession.data(for: req) }
        catch { throw APIError.transport(error) }

        guard let http = resp as? HTTPURLResponse else { throw APIError.http(-1) }
        if http.statusCode == 401, retrying, await refresh() {
            return try await raw(request, retrying: false)
        }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 {
                // Unrecoverable 401 (no/expired refresh — e.g. the backend was
                // switched and the stored token is now invalid): drop the dead
                // session so the app returns to login instead of silently erroring.
                if session.accessToken != nil { await MainActor.run { session.signOut() } }
                throw APIError.unauthorized
            }
            throw APIError.http(http.statusCode)
        }
        return data
    }

    func makeRequest(_ path: String, method: String, query: [URLQueryItem] = []) -> URLRequest {
        var comps = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var req = URLRequest(url: comps.url!)
        req.httpMethod = method
        return req
    }

    // Exchanges the refresh token for a new access token. Returns success.
    private func refresh() async -> Bool {
        guard let refreshToken = session.refreshToken else { return false }
        var req = makeRequest("/api/auth/refresh", method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONEncoder().encode(["refreshToken": refreshToken] as [String: String])
        guard let (data, resp) = try? await urlSession.data(for: req),
              let http = resp as? HTTPURLResponse, http.statusCode == 200,
              let body = try? JSONDecoder().decode([String: String].self, from: data),
              let token = body["token"] else {
            return false
        }
        session.updateAccessToken(token)
        return true
    }
}

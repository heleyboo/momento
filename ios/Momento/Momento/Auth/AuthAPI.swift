import Foundation

// Orchestrates sign-in: Google OAuth (PKCE) → exchange the ID token at the
// backend → persist the session + Drive token.
@MainActor
struct AuthAPI {
    let client: APIClient
    let session: SessionStore
    private let google = GoogleAuthService()

    func signIn() async throws {
        let tokens = try await google.signIn()

        var req = client.makeRequest("/api/auth/google", method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["idToken": tokens.idToken] as [String: String])

        let data = try await client.raw(req)
        let auth = try JSONDecoder().decode(AuthResponse.self, from: data)
        session.save(auth: auth, driveToken: tokens.driveAccessToken)
    }

    func login(email: String, password: String) async throws {
        try await exchange("/api/auth/login", ["email": email, "password": password])
    }

    func register(email: String, password: String, name: String?) async throws {
        var body = ["email": email, "password": password]
        if let name, !name.isEmpty { body["name"] = name }
        try await exchange("/api/auth/register", body)
    }

    // POSTs credentials and persists the returned session. No Drive token for
    // email/password accounts (Drive sync only applies to Google sign-in).
    private func exchange(_ path: String, _ body: [String: String]) async throws {
        var req = client.makeRequest(path, method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(body)
        let data = try await client.raw(req)
        let auth = try JSONDecoder().decode(AuthResponse.self, from: data)
        session.save(auth: auth, driveToken: nil)
    }

    func signOut() {
        // Best-effort backend revoke; local sign-out is authoritative.
        if let refresh = session.refreshToken {
            Task {
                var req = client.makeRequest("/api/auth/refresh", method: "DELETE")
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpBody = try? JSONEncoder().encode(["refreshToken": refresh] as [String: String])
                _ = try? await client.raw(req)
            }
        }
        session.signOut()
    }
}

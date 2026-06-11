import Foundation
import AuthenticationServices
import CryptoKit

// Dependency-free Google Sign-In via OAuth 2.0 + PKCE using the system
// ASWebAuthenticationSession (no GoogleSignIn SPM package). Returns the Google
// ID token (for /api/auth/google) and a drive.file access token (for the Drive
// storage provider). Requires AppConfig.googleClientID + the reversed-client-ID
// URL scheme registered in Info.plist.

struct GoogleTokens {
    let idToken: String
    let driveAccessToken: String?
}

enum GoogleAuthError: Error { case cancelled, noCode, tokenExchangeFailed }

@MainActor
final class GoogleAuthService: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var webSession: ASWebAuthenticationSession?

    func signIn() async throws -> GoogleTokens {
        let verifier = Self.randomURLSafe(64)
        let challenge = Self.s256Challenge(verifier)
        let redirectURI = "\(AppConfig.googleRedirectScheme):/oauth2redirect"

        var comps = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        comps.queryItems = [
            .init(name: "client_id", value: AppConfig.googleClientID),
            .init(name: "redirect_uri", value: redirectURI),
            .init(name: "response_type", value: "code"),
            .init(name: "scope", value: AppConfig.oauthScopes.joined(separator: " ")),
            .init(name: "code_challenge", value: challenge),
            .init(name: "code_challenge_method", value: "S256"),
        ]

        let callbackURL = try await authorize(url: comps.url!)
        guard let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value else {
            throw GoogleAuthError.noCode
        }
        return try await exchange(code: code, verifier: verifier, redirectURI: redirectURI)
    }

    private func authorize(url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(
                url: url, callbackURLScheme: AppConfig.googleRedirectScheme
            ) { callback, error in
                if let callback { cont.resume(returning: callback) }
                else { cont.resume(throwing: error ?? GoogleAuthError.cancelled) }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.webSession = session
            session.start()
        }
    }

    private func exchange(code: String, verifier: String, redirectURI: String) async throws -> GoogleTokens {
        var req = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let form = [
            "code": code,
            "client_id": AppConfig.googleClientID,
            "redirect_uri": redirectURI,
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        ]
        req.httpBody = form.map { "\($0)=\($1.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? $1)" }
            .joined(separator: "&").data(using: .utf8)

        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200,
              let token = try? JSONDecoder().decode(GoogleTokenResponse.self, from: data) else {
            throw GoogleAuthError.tokenExchangeFailed
        }
        return GoogleTokens(idToken: token.id_token, driveAccessToken: token.access_token)
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        ASPresentationAnchor()
    }

    // MARK: - PKCE helpers
    private static func randomURLSafe(_ count: Int) -> String {
        var bytes = [UInt8](repeating: 0, count: count)
        _ = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
        return Data(bytes).base64URLEncoded()
    }

    private static func s256Challenge(_ verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return Data(digest).base64URLEncoded()
    }
}

private struct GoogleTokenResponse: Decodable {
    let id_token: String
    let access_token: String?
}

private extension Data {
    func base64URLEncoded() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

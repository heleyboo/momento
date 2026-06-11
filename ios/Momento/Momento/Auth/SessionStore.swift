import Foundation
import Security

// Persists the session (access + refresh tokens, optional Drive token, user)
// in the Keychain. Observable so the UI can react to sign-in / sign-out.
@Observable
final class SessionStore {
    private(set) var accessToken: String?
    private(set) var refreshToken: String?
    private(set) var driveToken: String?
    private(set) var user: UserDTO?

    var isSignedIn: Bool { accessToken != nil }

    private let service = "minhanh.Momento.session"

    init() {
        accessToken = read("accessToken")
        refreshToken = read("refreshToken")
        driveToken = read("driveToken")
        if let data = readData("user") {
            user = try? JSONDecoder().decode(UserDTO.self, from: data)
        }
    }

    func save(auth: AuthResponse, driveToken: String?) {
        self.accessToken = auth.token
        self.refreshToken = auth.refreshToken
        self.user = auth.user
        self.driveToken = driveToken
        write("accessToken", auth.token)
        write("refreshToken", auth.refreshToken)
        if let driveToken { write("driveToken", driveToken) } else { delete("driveToken") }
        if let data = try? JSONEncoder().encode(auth.user) { writeData("user", data) }
    }

    func updateAccessToken(_ token: String) {
        accessToken = token
        write("accessToken", token)
    }

    func signOut() {
        accessToken = nil; refreshToken = nil; driveToken = nil; user = nil
        ["accessToken", "refreshToken", "driveToken", "user"].forEach(delete)
    }

    // MARK: - Keychain primitives
    private func write(_ key: String, _ value: String) { writeData(key, Data(value.utf8)) }
    private func read(_ key: String) -> String? { readData(key).flatMap { String(data: $0, encoding: .utf8) } }

    private func writeData(_ key: String, _ data: Data) {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrService as String: service,
                                kSecAttrAccount as String: key]
        SecItemDelete(q as CFDictionary)
        var add = q
        add[kSecValueData as String] = data
        SecItemAdd(add as CFDictionary, nil)
    }

    private func readData(_ key: String) -> Data? {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrService as String: service,
                                kSecAttrAccount as String: key,
                                kSecReturnData as String: true,
                                kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        return SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess ? out as? Data : nil
    }

    private func delete(_ key: String) {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrService as String: service,
                                kSecAttrAccount as String: key]
        SecItemDelete(q as CFDictionary)
    }
}

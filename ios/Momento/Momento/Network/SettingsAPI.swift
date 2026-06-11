import Foundation

// GET/PATCH /api/settings. PATCH accepts a partial object; here we send the
// full current settings after a toggle for simplicity.
struct SettingsAPI {
    let client: APIClient

    func get() async throws -> SettingsDTO {
        try await client.get("/api/settings")
    }

    func update(_ settings: SettingsDTO) async throws -> SettingsDTO {
        var req = client.makeRequest("/api/settings", method: "PATCH")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(settings)
        let data = try await client.raw(req)
        return try JSONDecoder().decode(SettingsDTO.self, from: data)
    }
}

import SwiftUI

// Root dependency container, created once and shared via the environment.
@MainActor
@Observable
final class AppState {
    let session: SessionStore
    let api: APIClient
    let entries: EntriesAPI
    let auth: AuthAPI
    let create: CreateAPI
    let settings: SettingsAPI
    let monitor = NetworkMonitor()

    /// Set after saving a post so the timeline opens its detail (then cleared).
    var pendingDetail: LocalEntry?

    init() {
        let session = SessionStore()
        let api = APIClient(session: session)
        self.session = session
        self.api = api
        self.entries = EntriesAPI(client: api)
        self.auth = AuthAPI(client: api, session: session)
        self.create = CreateAPI(client: api, session: session)
        self.settings = SettingsAPI(client: api)
        monitor.start()
    }
}

import SwiftUI

// Root dependency container, created once and shared via the environment.
@MainActor
@Observable
final class AppState {
    let session: SessionStore
    let api: APIClient
    let entries: EntriesAPI
    let auth: AuthAPI

    init() {
        let session = SessionStore()
        let api = APIClient(session: session)
        self.session = session
        self.api = api
        self.entries = EntriesAPI(client: api)
        self.auth = AuthAPI(client: api, session: session)
    }
}

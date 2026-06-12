//
//  MomentoApp.swift
//  Momento
//

import SwiftUI
import SwiftData

@main
struct MomentoApp: App {
    private let container: ModelContainer
    @State private var app: AppState
    @State private var sync: SyncQueue

    init() {
        // Adding LocalMedia is an additive schema change (lightweight migration).
        // If the store can't open (corrupt/incompatible), reset rather than crash
        // on launch — synced posts re-pull from the server.
        let container: ModelContainer
        do {
            container = try ModelContainer(for: LocalEntry.self, LocalMedia.self)
        } catch {
            let url = URL.applicationSupportDirectory.appending(path: "default.store")
            try? FileManager.default.removeItem(at: url)
            container = try! ModelContainer(for: LocalEntry.self, LocalMedia.self)
        }
        let app = AppState()
        let sync = SyncQueue(context: container.mainContext, monitor: app.monitor, api: app.create)
        self.container = container
        _app = State(initialValue: app)
        _sync = State(initialValue: sync)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
                .environment(sync)
                .modelContainer(container)
                .task {
                    sync.recoverOnLaunch()        // re-enqueue rows stuck in .uploading
                    await sync.syncPending()
                }
        }
    }
}

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
        let container = try! ModelContainer(for: LocalEntry.self)
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

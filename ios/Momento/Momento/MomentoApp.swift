//
//  MomentoApp.swift
//  Momento
//

import SwiftUI

@main
struct MomentoApp: App {
    @State private var app = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
        }
    }
}

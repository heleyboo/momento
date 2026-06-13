import SwiftUI

// Top-level gate: signed-in → main tabs, else sign-in. Injects the resolved
// palette for the current color scheme.
struct RootView: View {
    @Environment(AppState.self) private var app
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Group {
            if app.session.isSignedIn {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .momentoTheme(scheme)
    }
}

enum MomentoTab: Hashable { case timeline, album, search, settings }

struct MainTabView: View {
    @Environment(\.palette) private var palette
    @Environment(AppState.self) private var app
    @State private var tab: MomentoTab = .timeline
    @State private var showCamera = false

    // Height each screen's scroll content reserves at the bottom so it clears the
    // floating tab bar (applied via .bottomBarInset() inside each NavigationStack —
    // an outer safeAreaInset doesn't reach scroll views inside a NavigationStack).
    static let barInset: CGFloat = 72

    var body: some View {
        ZStack(alignment: .bottom) {
            content
            tabBar
        }
        .background(palette.bg.ignoresSafeArea())
        .fullScreenCover(isPresented: $showCamera) {
            ComposerView(onFinished: { showCamera = false })
                .momentoThemeAuto()
        }
        // A just-saved post opens its detail on the timeline tab.
        .onChange(of: app.pendingDetail?.clientEntryId) { _, id in
            if id != nil { tab = .timeline }
        }
    }

    @ViewBuilder private var content: some View {
        switch tab {
        case .timeline: TimelineView()
        case .album: AlbumView()
        case .search: SearchView()
        case .settings: SettingsView()
        }
    }

    // Custom bar with a raised center FAB (per the handoff).
    private var tabBar: some View {
        HStack(spacing: 0) {
            tabItem(.timeline, "list.bullet", "Nhật ký")
            tabItem(.album, "square.grid.2x2", "Album")
            fab
            tabItem(.search, "magnifyingglass", "Tìm kiếm")
            tabItem(.settings, "gearshape", "Cài đặt")
        }
        .padding(.top, 8)
        .padding(.horizontal, 8)
        .background(palette.bg.opacity(0.96))
        .overlay(alignment: .top) { Rectangle().fill(palette.sep).frame(height: 0.5) }
    }

    private func tabItem(_ value: MomentoTab, _ icon: String, _ label: String) -> some View {
        let active = tab == value
        return Button { tab = value } label: {
            VStack(spacing: 3) {
                Image(systemName: icon).font(.system(size: 20))
                Text(label).font(Typo.tabLabel)
            }
            .foregroundStyle(active ? palette.accent : palette.ter)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    private var fab: some View {
        Button { showCamera = true } label: {
            Image(systemName: "plus")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(palette.accentText)
                .frame(width: 56, height: 56)
                .background(Circle().fill(palette.accent))
                .shadow(color: palette.accent.opacity(0.45), radius: 9, y: 6)
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
        .offset(y: -18)
    }
}

extension View {
    /// Reserves space at the bottom of a scroll view / list so its content clears
    /// the floating tab bar. Apply on the ScrollView/List INSIDE each tab's
    /// NavigationStack (an outer safeAreaInset doesn't reach inside it).
    func bottomBarInset() -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            Color.clear.frame(height: MainTabView.barInset)
        }
    }
}


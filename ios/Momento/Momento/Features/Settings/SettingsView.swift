import SwiftUI

// Settings tab: account + sync/AI preferences (server-backed via /api/settings).
// Toggling a field PATCHes the full settings object; wifi-only also updates the
// live sync queue.
struct SettingsView: View {
    @Environment(AppState.self) private var app
    @Environment(SyncQueue.self) private var sync
    @Environment(\.palette) private var palette
    @State private var settings: SettingsDTO?

    var body: some View {
        NavigationStack {
            List {
                accountSection
                Section("ĐỒNG BỘ") {
                    Toggle("Tự động đồng bộ", isOn: bool(\.autoSync))
                    Toggle("Chỉ qua Wi-Fi", isOn: bool(\.wifiOnly))
                }
                Section("AI CAPTION") {
                    Toggle("Tự động tạo caption", isOn: bool(\.aiCaption))
                    Picker("Ngôn ngữ caption", selection: string(\.captionLang)) {
                        Text("Tiếng Việt").tag("vi"); Text("English").tag("en")
                    }
                    Picker("Độ dài mô tả", selection: string(\.captionLength)) {
                        Text("Ngắn").tag("short"); Text("Vừa").tag("medium"); Text("Dài").tag("long")
                    }
                }
                Section("KHÁC") {
                    Toggle("Gắn vị trí vào khoảnh khắc", isOn: bool(\.geoTag))
                    Toggle("Tự động phân loại bằng AI", isOn: bool(\.autoCategorize))
                }
                Section {
                    Button("Đăng xuất", role: .destructive) { app.auth.signOut() }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(palette.bg.ignoresSafeArea())
            .tint(palette.accent)
            .navigationTitle("Cài đặt")
            .task { settings = try? await app.settings.get() }
        }
    }

    private var accountSection: some View {
        Section {
            HStack(spacing: 12) {
                Circle().fill(palette.accent.opacity(0.2))
                    .frame(width: 48, height: 48)
                    .overlay(Text(initials).font(.headline).foregroundStyle(palette.accent))
                VStack(alignment: .leading, spacing: 2) {
                    Text(app.session.user?.name ?? "Momento")
                        .font(.system(size: 16, weight: .semibold)).foregroundStyle(palette.ink)
                    Text(app.session.user?.email ?? "")
                        .font(.system(size: 13)).foregroundStyle(palette.sub)
                }
                Spacer()
                Label("Đã kết nối", systemImage: "circle.fill")
                    .font(.system(size: 11, weight: .medium))
                    .labelStyle(.titleOnly)
                    .foregroundStyle(palette.accent)
            }
        }
    }

    private var initials: String {
        let name = app.session.user?.name ?? app.session.user?.email ?? "M"
        return String(name.prefix(1)).uppercased()
    }

    // PATCH the full object on any change; keep local copy in sync.
    private func persist(_ updated: SettingsDTO) {
        settings = updated
        Task { settings = try? await app.settings.update(updated) }
    }

    private func bool(_ kp: WritableKeyPath<SettingsDTO, Bool>) -> Binding<Bool> {
        Binding(
            get: { settings?[keyPath: kp] ?? false },
            set: { newValue in
                guard var s = settings else { return }
                s[keyPath: kp] = newValue
                if kp == \SettingsDTO.wifiOnly { sync.wifiOnly = newValue }
                persist(s)
            }
        )
    }

    private func string(_ kp: WritableKeyPath<SettingsDTO, String>) -> Binding<String> {
        Binding(
            get: { settings?[keyPath: kp] ?? "" },
            set: { newValue in
                guard var s = settings else { return }
                s[keyPath: kp] = newValue
                persist(s)
            }
        )
    }
}

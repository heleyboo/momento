import SwiftUI

// Auth gate. Triggers the Google OAuth (PKCE) flow; on success AppState.session
// becomes signed-in and RootView swaps to the main tabs.
struct SignInView: View {
    @Environment(AppState.self) private var app
    @Environment(\.palette) private var palette
    @State private var isWorking = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "sparkles.rectangle.stack")
                .font(.system(size: 56)).foregroundStyle(palette.accent)
            VStack(spacing: 6) {
                Text("Momento").font(Typo.largeTitle).foregroundStyle(palette.ink)
                Text("Nhật ký khoảnh khắc bằng ảnh & video")
                    .font(Typo.caption).foregroundStyle(palette.sub)
            }
            Spacer()
            if let error {
                Text(error).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center)
            }
            Button(action: signIn) {
                HStack {
                    if isWorking { ProgressView().tint(palette.accentText) }
                    Text(isWorking ? "Đang đăng nhập…" : "Đăng nhập với Google")
                        .font(.system(size: 16, weight: .semibold))
                }
                .frame(maxWidth: .infinity).padding(.vertical, 15)
                .background(RoundedRectangle(cornerRadius: 16).fill(palette.accent))
                .foregroundStyle(palette.accentText)
            }
            .disabled(isWorking)
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(palette.bg.ignoresSafeArea())
    }

    private func signIn() {
        isWorking = true; error = nil
        Task {
            do { try await app.auth.signIn() }
            catch { self.error = "Đăng nhập thất bại. Thử lại." }
            isWorking = false
        }
    }
}

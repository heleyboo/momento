import SwiftUI

// Sign-in screen (design handoff). Email/password is real; Google is real OAuth;
// Apple/Facebook need provider setup → they show a "coming soon" notice.
struct LoginView: View {
    @Environment(AppState.self) private var app
    @Environment(\.palette) private var palette

    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var error: String?
    @State private var notice: String?
    @State private var showSignup = false

    var body: some View {
        AuthShell {
            VStack(spacing: 0) {
                AuthBrand()
                AuthTitle(title: "Chào mừng trở lại", subtitle: "Tiếp tục cuốn nhật ký của bạn")
                    .padding(.top, 28).padding(.bottom, 26)

                AuthField(label: "Email", icon: "envelope", text: $email,
                          placeholder: "email@example.com", keyboard: .emailAddress)
                    .padding(.bottom, 18)
                AuthField(label: "Mật khẩu", icon: "lock", text: $password,
                          placeholder: "••••••••", isSecure: true, showStrength: true)

                HStack {
                    Spacer()
                    Button("Quên mật khẩu?") { notice = "Tính năng đang được phát triển." }
                        .font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.accent)
                }
                .padding(.top, 12).padding(.bottom, 22)

                if let error { errorText(error) }
                AuthCTA(label: "Đăng nhập", loading: loading) { submit() }
                AuthDivider(label: "hoặc đăng nhập với")
                SocialRow(onGoogle: googleSignIn) { notice = "\($0) sắp được hỗ trợ." }

                footer.padding(.top, 28)
            }
        }
        .overlay(alignment: .bottom) { toast }
        .sheet(isPresented: $showSignup) { SignupView().momentoThemeAuto() }
    }

    private var footer: some View {
        HStack(spacing: 4) {
            Text("Chưa có tài khoản?").foregroundStyle(palette.sub)
            Button("Đăng ký") { showSignup = true }
                .foregroundStyle(palette.accent).fontWeight(.bold)
        }
        .font(.system(size: 14.5))
    }

    private func errorText(_ msg: String) -> some View {
        Text(msg).font(.footnote).foregroundStyle(.red)
            .frame(maxWidth: .infinity).padding(.bottom, 10)
    }

    private var toast: some View {
        Group {
            if let notice {
                Text(notice).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(.black.opacity(0.8), in: Capsule())
                    .padding(.bottom, 24)
                    .task {
                        try? await Task.sleep(for: .seconds(2))
                        self.notice = nil
                    }
            }
        }
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty else { error = "Nhập email và mật khẩu."; return }
        loading = true; error = nil
        Task {
            defer { loading = false }
            do { try await app.auth.login(email: email, password: password) }
            catch { self.error = "Email hoặc mật khẩu không đúng." }
        }
    }

    private func googleSignIn() {
        loading = true; error = nil
        Task {
            defer { loading = false }
            do { try await app.auth.signIn() }
            catch { self.error = "Đăng nhập Google thất bại." }
        }
    }
}

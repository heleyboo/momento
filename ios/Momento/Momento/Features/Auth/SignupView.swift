import SwiftUI

// Create-account screen (design handoff). On success the session updates and the
// root view swaps to the main tabs, dismissing this sheet.
struct SignupView: View {
    @Environment(AppState.self) private var app
    @Environment(\.palette) private var palette
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var error: String?
    @State private var notice: String?

    var body: some View {
        AuthShell {
            VStack(spacing: 0) {
                AuthBrand()
                AuthTitle(title: "Tạo tài khoản", subtitle: "Bắt đầu lưu giữ khoảnh khắc của bạn")
                    .padding(.top, 20).padding(.bottom, 26)

                AuthField(label: "Tên hiển thị", icon: "person", text: $name,
                          placeholder: "Minh Anh", autocap: .words)
                    .padding(.bottom, 18)
                AuthField(label: "Email", icon: "envelope", text: $email,
                          placeholder: "email@example.com", keyboard: .emailAddress)
                    .padding(.bottom, 18)
                AuthField(label: "Mật khẩu", icon: "lock", text: $password,
                          placeholder: "Tối thiểu 8 ký tự", isSecure: true, showStrength: true)

                if let error { errorText(error) }
                AuthCTA(label: "Đăng ký", loading: loading) { submit() }
                    .padding(.top, 22)
                AuthDivider(label: "hoặc đăng ký với")
                SocialRow(onGoogle: googleSignIn) { notice = "\($0) sắp được hỗ trợ." }

                footer.padding(.top, 22)
            }
        }
        .overlay(alignment: .bottom) { toast }
    }

    private var footer: some View {
        HStack(spacing: 4) {
            Text("Đã có tài khoản?").foregroundStyle(palette.sub)
            Button("Đăng nhập") { dismiss() }.foregroundStyle(palette.accent).fontWeight(.bold)
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
                    .task { try? await Task.sleep(for: .seconds(2)); self.notice = nil }
            }
        }
    }

    private func submit() {
        guard email.contains("@"), password.count >= 8 else {
            error = "Email hợp lệ và mật khẩu ≥ 8 ký tự."
            return
        }
        loading = true; error = nil
        Task {
            defer { loading = false }
            do { try await app.auth.register(email: email, password: password, name: name) }
            catch APIError.http(409) { self.error = "Email đã được đăng ký." }
            catch { self.error = "Đăng ký thất bại. Thử lại." }
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

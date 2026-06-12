import SwiftUI
import UIKit

// Shared building blocks for the auth screens, matching the design handoff
// (Sage/Forest, gradient wash, sparkle title, rounded icon fields, pill CTA).

// Soft sage→ivory wash at the top + scrollable content.
struct AuthShell<Content: View>: View {
    @Environment(\.palette) private var palette
    @ViewBuilder var content: Content

    var body: some View {
        ZStack(alignment: .top) {
            palette.bg.ignoresSafeArea()
            LinearGradient(
                colors: [palette.accent.opacity(palette.isDark ? 0.16 : 0.13), palette.accent.opacity(0)],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 280).frame(maxWidth: .infinity).ignoresSafeArea(edges: .top)
            ScrollView {
                content.padding(.horizontal, 24).padding(.top, 36).padding(.bottom, 36)
            }
        }
    }
}

struct AuthBrand: View {
    @Environment(\.palette) private var palette
    var body: some View {
        HStack(spacing: 9) {
            RoundedRectangle(cornerRadius: 10).fill(palette.accent)
                .frame(width: 32, height: 32)
                .overlay(Image(systemName: "camera").font(.system(size: 16)).foregroundStyle(palette.accentText))
            Text("Nhật ký").font(.system(size: 18, weight: .heavy)).foregroundStyle(palette.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct AuthTitle: View {
    let title: String
    let subtitle: String
    @Environment(\.palette) private var palette
    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: "sparkles").font(.system(size: 16)).foregroundStyle(palette.accent)
                Text(title).font(.system(size: 28, weight: .heavy)).foregroundStyle(palette.ink)
                Image(systemName: "sparkles").font(.system(size: 16)).foregroundStyle(palette.accent)
            }
            Text(subtitle).font(.system(size: 15)).foregroundStyle(palette.sub)
        }
        .frame(maxWidth: .infinity)
    }
}

struct AuthField: View {
    let label: String
    let icon: String
    @Binding var text: String
    var placeholder = ""
    var isSecure = false
    var showStrength = false
    var keyboard: UIKeyboardType = .default
    var autocap: TextInputAutocapitalization = .never

    @State private var reveal = false
    @Environment(\.palette) private var palette

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.system(size: 14.5, weight: .semibold)).foregroundStyle(palette.ink)
            HStack(spacing: 11) {
                Image(systemName: icon).font(.system(size: 18)).foregroundStyle(palette.sub).frame(width: 22)
                Group {
                    if isSecure && !reveal { SecureField(placeholder, text: $text) }
                    else { TextField(placeholder, text: $text) }
                }
                .font(.system(size: 16)).foregroundStyle(palette.ink)
                .keyboardType(keyboard).textInputAutocapitalization(autocap).autocorrectionDisabled()
                if showStrength && !text.isEmpty {
                    Text(strength).font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.accent)
                }
                if isSecure {
                    Button { reveal.toggle() } label: {
                        Image(systemName: reveal ? "eye.slash" : "eye").foregroundStyle(palette.ter)
                    }
                }
            }
            .padding(.horizontal, 15).frame(height: 56)
            .background(RoundedRectangle(cornerRadius: 16).fill(palette.fieldBg))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(palette.sep, lineWidth: 1))
        }
    }

    private var strength: String { text.count >= 8 ? "Mạnh" : text.count >= 6 ? "Vừa" : "Yếu" }
}

struct AuthCTA: View {
    let label: String
    var loading = false
    let action: () -> Void
    @Environment(\.palette) private var palette
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if loading { ProgressView().tint(palette.accentText) }
                Text(label).font(.system(size: 17, weight: .bold))
            }
            .frame(maxWidth: .infinity).frame(height: 56)
            .background(RoundedRectangle(cornerRadius: 16).fill(palette.accent))
            .foregroundStyle(palette.accentText)
            .shadow(color: palette.accent.opacity(0.32), radius: 10, y: 8)
        }
        .disabled(loading)
    }
}

struct AuthDivider: View {
    let label: String
    @Environment(\.palette) private var palette
    var body: some View {
        HStack(spacing: 12) {
            Rectangle().fill(palette.sep).frame(height: 1)
            Text(label).font(.system(size: 13)).foregroundStyle(palette.sub).fixedSize()
            Rectangle().fill(palette.sep).frame(height: 1)
        }
        .padding(.vertical, 22)
    }
}

// Social row. Google is wired to real OAuth; Apple/Facebook need provider setup
// (entitlement / app credentials) → they signal "not supported yet".
struct SocialRow: View {
    let onGoogle: () -> Void
    let onUnsupported: (String) -> Void
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(spacing: 16) {
            socialButton { Text("G").font(.system(size: 20, weight: .bold)).foregroundStyle(Color.hex("#4285F4")) } action: { onGoogle() }
            socialButton { Image(systemName: "applelogo").font(.system(size: 22)).foregroundStyle(palette.ink) } action: { onUnsupported("Apple") }
            socialButton { Text("f").font(.system(size: 24, weight: .heavy)).foregroundStyle(Color.hex("#1877F2")) } action: { onUnsupported("Facebook") }
        }
        .frame(maxWidth: .infinity)
    }

    private func socialButton<L: View>(@ViewBuilder label: () -> L, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            label().frame(width: 52, height: 52)
                .background(Circle().fill(palette.card))
                .overlay(Circle().stroke(palette.sep, lineWidth: 1))
        }
    }
}

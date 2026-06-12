import Foundation

// App configuration. Fill these in before building (mirrors the backend needing
// GOOGLE_CLIENT_ID_IOS). For a physical device, point apiBaseURL at your Mac's
// LAN IP, not localhost.
enum AppConfig {
    /// Backend base URL. Simulator can use localhost; a device needs the Mac's
    /// LAN IP (must share the same Wi-Fi). Update this if your IP changes.
    static let apiBaseURL = URL(string: "http://192.168.2.31:3000")!

    /// iOS OAuth client ID from Google Cloud Console.
    static let googleClientID = "892406728763-5bgos3th00pkahij6rmcls9jmqs7t43t.apps.googleusercontent.com"

    /// Redirect URI = reversed client ID (register as a URL scheme in Info.plist).
    static let googleRedirectScheme = "com.googleusercontent.apps.892406728763-5bgos3th00pkahij6rmcls9jmqs7t43t"

    static let oauthScopes = [
        "openid", "email", "profile",
        "https://www.googleapis.com/auth/drive.file",
    ]
}

import Foundation

// App configuration. Fill these in before building (mirrors the backend needing
// GOOGLE_CLIENT_ID_IOS). For a physical device, point apiBaseURL at your Mac's
// LAN IP, not localhost.
enum AppConfig {
    /// Backend base URL (production). For local dev against the Mac, point this at
    /// the Mac's LAN IP (e.g. "http://192.168.x.x:3000") and re-add an ATS
    /// arbitrary-loads exception in Info.plist for cleartext HTTP.
    static let apiBaseURL = URL(string: "https://momento.phuongdungtransport.com")!

    /// iOS OAuth client ID from Google Cloud Console.
    static let googleClientID = "892406728763-5bgos3th00pkahij6rmcls9jmqs7t43t.apps.googleusercontent.com"

    /// Redirect URI = reversed client ID (register as a URL scheme in Info.plist).
    static let googleRedirectScheme = "com.googleusercontent.apps.892406728763-5bgos3th00pkahij6rmcls9jmqs7t43t"

    static let oauthScopes = [
        "openid", "email", "profile",
        "https://www.googleapis.com/auth/drive.file",
    ]
}

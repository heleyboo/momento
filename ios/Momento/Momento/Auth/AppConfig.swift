import Foundation

// App configuration. Fill these in before building (mirrors the backend needing
// GOOGLE_CLIENT_ID_IOS). For a physical device, point apiBaseURL at your Mac's
// LAN IP, not localhost.
enum AppConfig {
    /// Backend base URL. Simulator can use localhost; a device needs the LAN IP.
    static let apiBaseURL = URL(string: "http://localhost:3000")!

    /// iOS OAuth client ID from Google Cloud Console.
    static let googleClientID = "YOUR_CLIENT_ID.apps.googleusercontent.com"

    /// Redirect URI = reversed client ID (register as a URL scheme in Info.plist).
    static let googleRedirectScheme = "com.googleusercontent.apps.YOUR_CLIENT_ID"

    static let oauthScopes = [
        "openid", "email", "profile",
        "https://www.googleapis.com/auth/drive.file",
    ]
}

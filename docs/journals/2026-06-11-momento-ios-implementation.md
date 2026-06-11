# Journal — Momento iOS implementation

**Date:** 2026-06-11 · **Plan:** `plans/260611-1116-momento-photo-video-journal/` (Phases 4, 5 + Album/Search/Settings) · **Branch:** main

## What happened

Built the full SwiftUI app on top of the completed backend, then confirmed each slice **builds in Xcode** before committing. Four commits:
- **P4** — shell, theme, networking, read-only Timeline.
- **P5** — offline-first create loop (camera, review, sync queue).
- **+** Album, Search, Settings screens (the deferred iOS UI for P6/P7).

The app is now feature-complete end-to-end: sign in → capture → AI caption → save (offline-first) → sync → timeline / album / search / settings.

## Architecture (iOS)

- **Theme** — design tokens as `Palette` (Sage+Forest, light/dark) + `CategoryColors` + `Typo`, injected via `@Environment(\.palette)`. Hex only in `Color.hex`/`Palette`.
- **Data** — `LocalEntry` (`@Model`, SwiftData) is the single display source; the create loop inserts `.pending` rows that show instantly, and `RemoteSync.pull` upserts server entries by `clientEntryId`. Timeline/Album/Search all read `@Query LocalEntry` → offline-first + one set of reusable views (`EntryCardView`, `EntryImage`, `EntryDetailView`).
- **Networking** — `APIClient` (Bearer + transparent refresh-on-401), `EntriesAPI`/`CreateAPI`/`SettingsAPI`, `RemoteImage` (authed loader — `AsyncImage` can't send the Bearer header local media needs).
- **Capture** — `CameraController` (AVFoundation photo+video via continuations) + `CameraPreview` + `CameraView`; `PosterFrame` samples video at `min(1s, dur/2)`.
- **Sync** — `SyncQueue` (`NWPathMonitor` gate, launch sweep `.uploading`→`.pending`, idempotent multipart upload, caption-conflict rule), `MediaStore` (local media files in Application Support).

## Key decisions

- **Google Sign-In via `ASWebAuthenticationSession` + PKCE**, not the GoogleSignIn SPM SDK — adding/registering an SPM package wasn't doable from this environment, and the PKCE web flow is a pure system framework that yields both the ID token (for `/api/auth/google`) and the Drive `drive.file` access token.
- **SwiftData moved P4 → P5** — P4's Timeline was DTO-in-memory; the `@Model` + offline cache/sync queue landed in P5 where the create loop actually exercises them.
- **Album + Search query local SwiftData**, not the backend endpoints — offline-capable and reuses the timeline's views. The backend album/search APIs remain for cross-device/scale; iOS v1 stays local-first (KISS).
- **Settings is genuinely server-backed** (`/api/settings`) — preferences persist across devices; "Wi-Fi only" also updates the live `SyncQueue`.

## Friction / notes

- **The live SourceKit diagnostics were almost entirely false positives** — the in-session checker runs without the iOS SDK and analyzes files individually, so it reported "Cannot find type X" for same-module symbols and "No such module 'UIKit'". Confirmed harmless: every slice built clean in Xcode. The only *real* fixes were file-local: `Color.hex(...)` (overload clash with `Color(_:)`), explicit `[String:String]` on `JSONEncoder().encode`, `Data.append(String)` → helper, and a missing `import UIKit`. (Saved to project memory.)
- Xcode 16 **synchronized folders** (`PBXFileSystemSynchronizedRootGroup`) — new `.swift` files under `ios/Momento/Momento/` auto-join the build; no `.pbxproj` edits.
- `xcodebuild` isn't available from this shell (Command Line Tools only, not full Xcode) — builds were verified by the user in Xcode.app after each slice.

## Must-configure before running (not code)

- Google OAuth iOS client ID in `Auth/AppConfig.swift` + reversed-client-ID **URL scheme** in Info.plist.
- `NSCameraUsageDescription` + `NSMicrophoneUsageDescription` (Info.plist / `INFOPLIST_KEY_*`) — the app crashes on camera access without them.
- `apiBaseURL` = `localhost:3000` for simulator; a device needs the Mac LAN IP + ATS exception (or TLS).

## Deferred / follow-ups

- Search caption **highlighting** (range-based) — results currently reuse `EntryCardView` without highlight.
- `SessionStore`/`CameraController` cross-thread mutation — fine under Swift 5 language mode; revisit for strict concurrency.
- Sync retry is "next-pass", no timed exponential backoff yet.
- Detail edit/delete affordances (PATCH/DELETE exist on the backend) not yet surfaced in the iOS Detail screen.
- Live verification still pending creds: Gemini caption, GCS, Drive.

## Open questions

1. Drive read path: is `webContentLink` fetchable by the iOS client without extra auth, or does it need a backend proxy? (verify during live Drive testing)
2. Should Album/Search move to the backend endpoints for true cross-device parity, or stay local-first for v1?

# Journal — Multi-Media Posts, Production Deploy & On-Device Auth

**Date:** 2026-06-12 → 06-13 · **Scope:** iOS + backend (Next.js/Drizzle/Postgres)

Single long session. Three arcs: (1) finish on-device auth + AI captioning against a real iPhone, (2) stand up production, (3) ship Facebook-style multi-media posts end-to-end and deploy.

---

## 1. On-device auth + captioning (debug-heavy)

Got Google Sign-In, camera, and AI caption working on a **physical iPhone** (not Simulator). Most of the time went to environment issues, not code:

- **OAuth `403 access_denied`** — app in Google "Testing" mode; the tester email wasn't added. Fix in Cloud Console, not code.
- **"Đăng nhập Google thất bại"** then **caption "timed out"** — root cause was the **Mac LAN IP changing** (`192.168.2.31` → `192.168.88.173`) while `AppConfig.apiBaseURL` was hardcoded. The flaky `curl` results that looked like "hairpin" were actually the IP moving. Lesson: on a device build, *first* re-check `ipconfig getifaddr en0`.
- **Camera silently dead** — missing `NSCameraUsageDescription`/`NSMicrophoneUsageDescription`. iOS terminates the app on capture without them.
- **Cleartext HTTP to LAN** needs an ATS `NSAllowsArbitraryLoads` exception (dev only). Project uses `GENERATE_INFOPLIST_FILE=YES` + a real `Info.plist` via `INFOPLIST_FILE`.
- **Gemini `gemini-2.0-flash` → 429** (free-tier quota 0). Switched default to `gemini-2.5-flash`.
- **Caption lost on upload** — the sync queue sent `nil` for AI captions then overwrote the local caption with the server's (rate-limited → null) response. Fix: send the already-generated caption; never clobber with an empty server value. This rule carried into the multi-media finalize.

Added **auto sign-out on an unrecoverable 401** so switching backends (different `JWT_SECRET`) drops the stale session to the login screen instead of erroring on every request.

**Takeaway:** on-device debugging is mostly environment. Surfacing the *real* error (HTTP code / transport reason) instead of a generic "thất bại" string was what unblocked each step.

---

## 2. Production server

Deployed the backend to a shared Ubuntu box (`root@180.93.2.51`) already running mk-limousine (:3000) + n8n. Momento runs under pm2 `momento` on **:3100** (3000 taken), nginx reverse proxy → HTTPS via certbot at **momento.phuongdungtransport.com**, Postgres 14 local, local storage provider. Boot-persistence via pm2 systemd. Did not disturb the other apps.

Gotchas: `package-lock.json` isn't in the repo → use `npm install`, not `npm ci`. `migrate.ts` had a silent localhost fallback → made it **fail-fast without `DATABASE_URL`** so a deploy shell can't migrate the wrong DB.

---

## 3. Multi-media posts (1 post → many photos/videos)

Full brainstorm → plan → **red-team** → implement (6 phases) → deploy. The red-team was the highest-leverage step: 4 hostile reviewers found ~20 evidence-backed issues, several Critical. Key decisions that came out of it:

- **No `staged_media` table** — media stage directly into `entry_media` with `entry_id NULL` (idempotent on `user+client_entry_id+media_client_id`); finalize just `UPDATE`s `entry_id`+position. Simpler, and it fixes ownership + dedup in one move.
- **Quota reserved at finalize, not stage** — abandoned drafts cost only disk, never quota; no cleanup cron needed.
- **Finalize is user-scoped + count-checked** — blocks a cross-user IDOR (finalize a post referencing someone else's staged media).
- **Per-media upload** (Approach A) instead of one giant multipart — directly motivated by the large-body timeouts already seen this session.
- **Server caption fallback kept** (cover poster, local provider) so a failed client caption doesn't vanish.
- **Ownership/serve/delete cut over to `entry_media`** before dropping the legacy `entries` columns (Critical: the media-serve + DELETE paths read `entries.storage_ref`, which phase 6 drops).
- iOS: chose **additive schema + launch code-backfill** (wrap each old `LocalEntry`'s inline media into one `LocalMedia`) over a custom SwiftData `VersionedSchema` migration — lightweight, no launch-crash risk, preserves offline-unsynced data. Container creation falls back to a store reset instead of `try!` crashing.
- iOS pull reconcile: skip posts whose media aren't all `.done` (protects unsynced local bytes) — strictly safer than position/id matching.

### The migration bug that almost lost prod data
`migrate.ts` ran the legacy backfill as a **post-migrate JS step**, i.e. *after* drizzle applied all pending migrations. On a fresh prod jumping `0003 → 0006` in one pass, the 0006 column-drop ran **before** the backfill → the backfill's `information_schema` guard saw the columns gone and skipped → the existing entry's media would have been orphaned. Local survived only because it had migrated incrementally.

Caught it by **restoring the prod `pg_dump` into a scratch local DB and running the real migration path** before touching prod. Fix: move the backfill **inline into migration 0004** (runs in-sequence, before the 0006 drop). Re-validated on the prod-data clone: entry backfilled with refs preserved, columns dropped, no loss. Then deployed (dump → pull → migrate → build → restart), verified the legacy entry returns `media[]` with a working URL.

**Takeaway:** post-migrate "data fix-up" steps are a trap when migrations can apply in a single pass. Order-sensitive backfills belong **inside the migration sequence**, and a dump-restore dry-run is cheap insurance before an irreversible prod drop.

---

## 4. Detail UI (Facebook-style) + polish

- Detail screen: **mosaic collage** (1 full / 2 / 1+2 / 2×2 / +N) opening a full-screen swipeable pager with video playback — replaced the plain carousel.
- **Tab-bar scroll bug:** `safeAreaInset(edge:.bottom)` applied *outside* a per-tab `NavigationStack` doesn't reach the scroll views inside it, so content hid behind the floating bar. Fix: a `.bottomBarInset()` modifier applied **directly on each screen's ScrollView/List** inside its NavigationStack.
- Album: square cells via `Color.clear.aspectRatio(1).overlay(image)` (EntryImage has no intrinsic size); added the AI-suggestion teaser card from the design ("Tạo" is an honest "coming soon" — AI grouping is v1.1).

---

## Status

Live on prod: email/password + Google auth, multi-media capture (camera + PhotosPicker), AI caption from cover, timeline "+N", Facebook-style detail, video playback. All 6 multi-media plan phases complete; no data loss on the prod migration.

## Unresolved / deferred
- AI album auto-grouping (v1.1) — card is a teaser only.
- `entries.duration_sec` left as a harmless dead column (not worth another migration).
- Apple/Facebook sign-in still "coming soon" (need provider setup).
- GCS/Drive storage providers unverified live (no creds).

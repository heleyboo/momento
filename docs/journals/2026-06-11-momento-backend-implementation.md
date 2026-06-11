# Journal — Momento backend implementation

**Date:** 2026-06-11 · **Plan:** `plans/260611-1116-momento-photo-video-journal/` (4/7) · **Branch:** main

## What happened

Full arc in one session: **brainstorm → design doc → 7-phase plan → adversarial red-team → implemented + verified the entire backend**. Momento is a photo/video journal (iOS SwiftUI + Next.js backend) with AI auto-captioning, offline-first sync, and pluggable cloud storage.

Backend phases shipped, each verified live + code-reviewed, committed:
- **P1 Infra & Storage** — Next.js (App Router) + Postgres (docker-compose, port 5433) + Drizzle (6 tables) + `StorageProvider` ports/adapters (`local`) + path-hardened media route.
- **P2 Auth** — Google ID-token verify → short-lived access JWT + revocable hashed refresh tokens; DB-backed media ownership; drive-token validator.
- **P3 Entries API** — streaming uploads (byte-capped), idempotent create (`client_entry_id`), per-user quota, orphan-safe cleanup, Gemini Flash captioning + `/api/caption`.
- **P7 Settings & Cloud Providers** — `/api/settings`; s3/gcs/drive adapters; PATCH/DELETE entries with IDOR + album cross-ownership guards.
- **P6 Search & Albums** — trigram caption search + kind/cat/date filters; category-grouped albums.

## Key decisions

- **Pluggable storage** (`STORAGE_PROVIDER` env, iOS storage-agnostic) — user requirement; switching providers is one env var. `local` default; `s3` verified vs MinIO; `gcs`/`drive` code-complete.
- **Drive-token forwarding** reconciled with "upload via backend": iOS owns the OAuth token, forwards it per-request; backend validates (aud/scope/sub) and never persists it.
- **Caption decoupled** into `POST /api/caption` (capture-time shimmer) + create flow; poster-frame at `min(1s, dur/2)` for video. Resolved the offline-UX contradiction the red-team caught.
- **Scope cuts to v1.1** (red-team, user-confirmed): AI album suggestion, `unaccent` accent-folding search.
- **Sequencing fixes** (red-team): P6 depends on P5; PATCH/DELETE moved P3→P7 to build against real UI.

## Red-team payoff

22 raw findings → 15 applied. The four Criticals would have bitten hard in implementation:
1. App Router `request.formData()` buffers the whole body (no `sizeLimit` knob) → OOM on real video. Switched to busboy streaming + hard cap.
2. Idempotency key existed only as an iOS comment — never wired to the backend. Added `client_entry_id` UNIQUE + `ON CONFLICT`.
3. `/api/media/:ref` ownership was a slogan + path-traversal risk. DB-backed ownership + ref regex + path canonicalization.
4. `drive.file` can't reliably re-traverse a localized folder tree + concurrent-create race. Flat layout + durable `drive_folders` table + advisory lock.

Per-phase `code-reviewer` then caught real bugs the plan didn't: single-segment `[ref]` route couldn't serve slash paths (→ catch-all `[...ref]`); HEIC thumbnail would 500 real iOS uploads (→ poster-preferred + isolated, non-fatal); Drive token re-validated per object on list reads (N+1 `tokeninfo` storm → validate once/request).

## Impact / state

API fully supports the app: auth + sessions, full entry lifecycle, captioning, category albums, settings, 4 storage backends. All committed; **no secrets in git** (verified `server/.env` ignored each commit).

## Friction / notes

- Postgres remapped to host **5433** — 5432 was taken by another local container (`mk_limousine_db`).
- `plans/**` and most of `.claude/` are gitignored in this repo (CK convention) — plan/design/red-team docs live locally, not version-controlled.
- An Xcode project already exists at `ios/Momento/` (created mid-session); added an iOS `.gitignore` to keep `xcuserdata` out.
- tsx top-level await was flaky here — wrapped verification scripts in `main()`.

## Deferred (environment/credential-gated)

- **iOS Phases 4, 5 + UI of 6/7** (SwiftUI shell, camera→review→offline-sync, Settings/Album/Search screens) — need a macOS/Xcode toolchain to compile + verify.
- **Live verification pending creds:** Gemini caption (`GEMINI_API_KEY`), GCS (bucket/SA), Drive (real OAuth token) — all code-complete + reviewed.

## Open questions

1. Drive read path: is `webContentLink` actually fetchable by the iOS client, or does the read path need to proxy bytes? (verify during live Drive testing)
2. Search latency at scale not yet measured (`EXPLAIN ANALYZE` on a 10k-row seed) before prod.
3. Quota reconciliation job (thumbnail bytes uncounted; crash-leak between reserve and insert) — deferred maintenance task.

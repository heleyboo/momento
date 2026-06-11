# Momento

A photo/video journal: capture a moment, let **AI auto-write the caption**, and revisit your days as a timeline. iOS app + Next.js backend, with **offline-first** capture and **pluggable cloud storage** (your own Google Drive, S3, GCS, or local).

> Status: **backend complete & verified** (auth, entries, captioning, search, albums, settings, 4 storage providers). iOS app in progress.

## How it works

```
iOS (SwiftUI)                    Next.js backend                    Storage
─────────────                    ───────────────                    ───────
capture photo/video  ──upload──▶ POST /api/entries  ──Gemini Flash──▶ caption + category
  (offline-first,                  (streaming, idempotent,            (poster frame)
   SwiftData queue)                 quota-guarded)        ──put──────▶ local | s3 | gcs | drive
timeline / search    ◀──────────  GET  /api/entries?q=&kind=&cat=…
albums               ◀──────────  GET  /api/albums  (by category)
```

- **AI captions** — Gemini Flash describes the moment from a representative frame (photo & video); user can edit.
- **Offline-first** — capture works without network; a sync queue uploads when back online.
- **Pluggable storage** — `STORAGE_PROVIDER` env switches where media lives; the app is storage-agnostic. Drive uses the user's own account (token forwarded per request, never stored).
- **Multi-user** — Google Sign-In; short-lived access JWT + revocable refresh tokens; every query is owner-scoped.

## Stack

| Area | Tech |
|------|------|
| Backend | Next.js (App Router), TypeScript, Drizzle ORM, Postgres 16 |
| AI | Google Gemini Flash (vision → caption + category) |
| Storage | local FS · AWS S3 (MinIO-compatible) · Google Cloud Storage · Google Drive |
| Auth | Google Sign-In + `jose` JWT sessions |
| iOS | SwiftUI, SwiftData (offline-first), AVFoundation |

## Repo layout

```
server/   Next.js backend (API, Drizzle schema, storage adapters, docker-compose)
ios/      SwiftUI app (Xcode project)
docs/     journals + project docs
```

## Quick start (backend)

```bash
cd server
cp .env.example .env          # local-dev defaults work as-is; add GEMINI_API_KEY for captions
npm install
docker compose up -d          # Postgres (:5433) + MinIO (:9000)
npm run db:migrate
npm run dev                    # http://localhost:3000
curl localhost:3000/api/health # {"ok":true,"db":true}
```

See [`server/README.md`](server/README.md) for the full API surface, auth/OAuth setup, and storage configuration.

## API at a glance

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/google` · `POST/DELETE /api/auth/refresh` | Google Sign-In → session; refresh / revoke |
| `POST /api/caption` | Caption a poster frame (capture-time) |
| `POST /api/entries` · `GET /api/entries?q=&kind=&cat=&from=&to=` | Create (idempotent) · list/search |
| `GET/PATCH/DELETE /api/entries/:id` | Detail · edit · remove |
| `GET /api/albums` | Entries grouped by category |
| `GET/PATCH /api/settings` | Sync / AI / storage preferences |
| `GET /api/media/:ref` | Auth-gated media stream (local provider) |

## Roadmap

- [x] Backend: infra, auth, entries + captioning, search & albums, settings, storage adapters
- [ ] iOS: shell + theme, camera → review → offline sync, album/search/settings screens
- [ ] Live verification: GCS / Drive providers (need cloud creds)
- [ ] v1.1: AI album suggestion, accent-insensitive search

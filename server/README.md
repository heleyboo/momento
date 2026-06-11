# Momento Server

Next.js (App Router) backend for the Momento photo/video journal. Postgres via
docker-compose, Drizzle ORM, pluggable storage (`local` default; `s3`/`gcs`/`drive`
land in Phase 7).

## Prerequisites
- Node 20+ (tested on 24)
- Docker + Docker Compose

## Setup

```bash
cp .env.example .env          # adjust if needed (local dev defaults work as-is)
npm install
docker compose up -d          # Postgres on :5432
npm run db:generate           # generate SQL migrations from schema (first time)
npm run db:migrate            # apply migrations + pg_trgm + caption trigram index
npm run dev                   # http://localhost:3000
```

## Health check
```bash
curl localhost:3000/api/health   # -> {"ok":true,"db":true}
```

## Storage
- `STORAGE_PROVIDER=local` writes bytes under `STORAGE_LOCAL_DIR` (default `./.media`).
- `local` media is served through the auth-gated `/api/media/:ref` route (ownership
  enforced in Phase 2). Cloud providers return signed URLs instead.
- Verify the local adapter round-trip:
  ```bash
  npx tsx scripts/verify-storage-roundtrip.ts
  ```

## Auth (Phase 2)

Google Sign-In on iOS → backend session.

### Google Cloud setup
1. Create a project in Google Cloud Console → APIs & Services.
2. Configure the OAuth consent screen (External; add test users while unverified).
3. Create an **OAuth client ID of type iOS** → copy the client ID into
   `GOOGLE_CLIENT_ID_IOS` (the backend verifies that ID tokens carry this as `aud`).
4. Scopes requested by the app: `openid email profile https://www.googleapis.com/auth/drive.file`
   (`drive.file` is least-privilege; only needed when `STORAGE_PROVIDER=drive`).
5. Set a strong `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).

### Endpoints
- `POST /api/auth/google {idToken}` → `{token, refreshToken, user}` (verifies ID token, upserts user, seeds settings).
- `POST /api/auth/refresh {refreshToken}` → `{token}` (new short-lived access token).
- `DELETE /api/auth/refresh {refreshToken}` → 204 (revoke / sign out).
- Protected routes expect `Authorization: Bearer <access token>`. Access tokens
  are short-lived (30 min); refresh tokens are stored hashed and revocable.

### Verify
```bash
set -a && . ./.env && set +a
npx tsx scripts/verify-auth-lifecycle.ts
```

> The iOS GoogleSignIn integration (obtaining the ID token + storing the session
> in Keychain) lands in Phase 4, where the Xcode app target exists to compile it.

## Phases
See `../plans/260611-1116-momento-photo-video-journal/` for the full plan.

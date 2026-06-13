# Journal — Feature Expansion (edit/delete, memories, map, UI polish)

**Date:** 2026-06-13 (evening) · **Scope:** iOS + one additive backend migration.

Brainstormed a feature shortlist, the user picked four, built them in sequence — each its own design→implement→on-device-build→commit loop.

## 1. Edit / delete posts
Detail was read-only though the backend already had `PATCH`/`DELETE /api/entries/[id]`. Added `EntriesAPI.update/delete` + an edit sheet (caption + category) and a delete confirmation.
- **Server-first for synced posts, local-only for drafts:** edit/delete a `.done` post hits the server first (fails loudly on no network); an unsynced draft edits/deletes locally (its caption rides the next finalize). Avoids local↔server desync.
- **Toolbar placement gotcha:** the detail is always inside the paged `EntryPagerView` (TabView). A `.toolbar` *inside* a TabView page doesn't reliably surface to the nav bar — so the ⋯ menu lives on `EntryPagerView`, acting on the current page (`entries[index]`). Delete cleans local media files then pops back.

## 2. On This Day + real capture date
The real fix here was foundational: **`takenAt` was the save time, not the capture date** — so library imports (even year-old photos) landed under "today", and "On this day" would never fire.
- Read the original date from **EXIF `DateTimeOriginal`** (photos, via ImageIO) and **AVAsset `.creationDate`** (videos) at import — *no Photos permission needed*, since we already hold the bytes. Read EXIF from the **original** data before re-encoding to JPEG (which strips it). Camera keeps `now()`.
- Timeline now sorts by real date; "On this day" surfaces posts from the same month/day in earlier years. Importing a photo dated exactly one year ago today makes the section light up immediately — testable, not vaporware.

## 3. Memories map
`location` was only a reverse-geocoded *name*; a map needs coordinates. Added `latitude`/`longitude`:
- **Additive nullable columns** (migration 0007) → finalize accepts them, DTO returns them. Because they're optional, old app ↔ new backend and new app ↔ old backend both work (zod strips unknown keys; optional decode tolerates missing) — **no lockstep, deploy anytime.** Deployed to prod first so the installed app's new posts get stored coords.
- `LocationProvider.place()` now returns a `PlaceInfo` (name + lat/lng). `MapMemoriesView` (MapKit) drops thumbnail pins; tap → the post pager.

## 4. UI polish (the gesture-heavy one)
- **Haptics** on save/delete/viewer (tiny `Haptics` enum).
- **Shimmer** sweep on loading remote images (replaces the static placeholder).
- **Pinch + double-tap zoom** in the full-screen viewer. The hard part is gesture coexistence with TabView paging + swipe-to-dismiss. Key trick: `.highPriorityGesture(pan, including: scale > 1 ? .all : .none)` — the pan is masked off at 1× so horizontal paging still works, and active only when zoomed. Swipe-to-dismiss is gated on an `isZoomed` flag reported up from each page (reset on page change).
- **Hero zoom transition** card→detail via iOS 18 `.matchedTransitionSource(id:in:)` + `.navigationTransition(.zoom(sourceID:in:))`. Applied to the timeline only (a post appearing in both timeline and the memories row would collide on a shared source id).

## Patterns that held up this session
- **Additive schema changes are free to deploy** — optional columns + zod-strips-unknown means no breaking window, unlike the multi-media DTO swap which needed a runbook.
- **Capture the real metadata at the source** (EXIF/AV date, GPS coords) rather than approximating — it unlocks features (on-this-day, map) cheaply later.
- **Put toolbars/menus on the nav container, not inside TabView pages.**

## Status
All four shipped to prod. App: multi-media posts, FB collage, swipe-between-posts, AI caption (billed), albums, caption search, geotag + memories map, On-This-Day, edit/delete, offline-first with auto-retry, and polish (zoom, hero transition, haptics, shimmer).

## Deferred
- Apple/Facebook sign-in (Apple needs the $99 program; Facebook needs the SDK + app review — guides in `docs/auth-credentials-setup.md`).
- AI album auto-grouping (teaser card only).
- Hero transition on category/search lists (timeline-only for now).
- `CLGeocoder` deprecated on iOS 26 — works, migrate to MapKit later.

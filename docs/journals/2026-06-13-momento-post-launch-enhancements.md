# Journal — Post-Launch Enhancements (geotag, upload retry, swipe, UX)

**Date:** 2026-06-13 · **Scope:** iOS + a prod ops fix · Follows the multi-media launch.

After multi-media shipped to prod, a run of refinements driven by on-device use. All against the live prod backend (`momento.phuongdungtransport.com`), app installed untethered.

## Gemini caption: free-tier → billing
Captions started 502-ing on prod. Diagnosis chain: 502 from `/api/caption` → Gemini `429 RESOURCE_EXHAUSTED`. The error metric was `...-FreeTier` — proof the key's **project** was still free-tier even after the user "enabled billing": the billing account had been linked to a *different* project than the API key's. Fix: a new key created **inside the billing-enabled project**, swapped into prod `.env` (+ local). Verified key → 200, `/api/caption` → real caption.
**Takeaway:** "billing enabled" ≠ "this key is paid". The 429 `details.violations[].quotaId` tells you the tier — read it before assuming propagation delay.

## Geotag posts
The geotag toggle existed in settings but was never wired — no CoreLocation, `save()` never set `location`. Built `LocationProvider` (one-shot `CLLocationManager` + `CLGeocoder` reverse-geocode → "District, Province"), gated on the `geoTag` setting. First attempt failed: a **race** — `place()` (permission + GPS fix + geocode = seconds) hadn't resolved before the user tapped Save. Fix: kick off a `Task<String?>` on Review open and **await it inside `save()`** (shows "Đang lưu…"). Also hardened the auth continuation to ignore `.notDetermined` fires (only resume once the user actually decides). Location now shows on Review, the timeline card, and detail. Backend/DTO already carried `location` from the multi-media work — only capture was missing.

## Upload retry on flaky network
Data model already re-swept non-`done` posts each `syncPending`, but there were **no triggers** when the network returned and **no backoff**. Added:
- `NetworkMonitor.onReconnect` — fires on offline→online edge → `syncPending()`.
- Foreground trigger (`scenePhase == .active`).
- `SyncQueue.withRetry` around stage/finalize: retries **transient** errors (transport, 5xx) with 1s/3s/7s backoff; throws immediately on **permanent** ones (4xx/401/decoding — re-sending won't help); bails if the network drops mid-backoff (a later trigger retries).
Net: a post that fails offline auto-completes when connectivity returns, the app foregrounds, or on pull-to-refresh.

## Swipe between posts
Detail showed one post; users wanted to swipe left/right between posts. Wrapped the detail in `EntryPagerView` — a horizontal paged `TabView` over **the list the user came from** (timeline / category / search), opened at the tapped index. Replaced value-based `LocalEntry` navigation with list+index destinations at the 3 call sites. Horizontal paging is orthogonal to each page's vertical scroll and the collage's tap → no gesture conflict; `TabView` lazy-renders adjacent pages so it stays light.

## UX fixes
- **Tab-bar scroll clipping (all tabs):** `safeAreaInset(edge:.bottom)` applied *outside* a per-tab `NavigationStack` does NOT reach the scroll views inside it — content hid behind the floating bar. Fix: a `.bottomBarInset()` modifier applied **directly on each screen's ScrollView/List** (and on pushed detail/category screens, which the root-level tab-bar overlay also covers).
- **Album layout:** square cells via `Color.clear.aspectRatio(1).overlay(image)` (EntryImage has no intrinsic size, so `aspectRatio` on it collapsed). Added the AI album-suggestion teaser card from the design — honest "coming soon" toast (AI grouping is v1.1).

## Status
Prod is feature-complete for v1: multi-media posts, FB-style collage, swipe-between-posts, AI caption (billed), geotag, offline-first with auto-retry. App runs untethered (free Apple ID build = 7-day signing).

## Deferred
- AI album auto-grouping (v1.1).
- Apple/Facebook sign-in (provider setup).
- TestFlight / paid Apple account for non-tethered distribution > 7 days.
- `CLGeocoder` is deprecated on iOS 26 (still works) — migrate to `MKReverseGeocodingRequest` later.

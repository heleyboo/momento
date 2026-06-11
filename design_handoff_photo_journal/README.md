# Handoff: Nhật ký Hình ảnh & Video (Photo/Video Journal — iOS)

## Overview
Ứng dụng iOS dạng **nhật ký hình ảnh/video**: người dùng ghi lại khoảnh khắc hằng ngày bằng ảnh/video, **AI tự sinh caption** mô tả, sắp xếp theo dòng thời gian, **phân loại theo chủ đề**, và **đồng bộ Google Drive**. Bộ thiết kế gồm 6 màn chính + một luồng tạo entry hoàn chỉnh (camera → chụp → AI caption → chọn nhãn → lưu → đồng bộ → xem chi tiết).

**Phong cách thị giác**: xem `style-reference.png` (ảnh tham chiếu của khách) — nền **sage**, màn **ivory/kem**, **thẻ trắng** bo góc mềm, tiêu đề **navy đậm**, accent **xanh rừng đậm**, tab bar có **nút "+" tròn xanh ở giữa**. Chi tiết token ở mục **Hệ màu & Theming** + **Design Tokens**.

## About the Design Files
Các file trong gói này là **bản tham chiếu thiết kế dựng bằng HTML/React (Babel in-browser)** — prototype thể hiện *giao diện và hành vi mong muốn*, **không phải code production để copy nguyên**. Nhiệm vụ là **dựng lại các thiết kế này trong môi trường codebase đích** theo pattern/library sẵn có của dự án.

- Nếu app đích là **iOS native** → SwiftUI là lựa chọn tự nhiên (thiết kế đã bám Apple HIG: nav title lớn, grouped list, tab bar, sheet, switch chuẩn iOS).
- Nếu là **React Native / Expo** → tái dựng bằng component RN tương ứng.
- Layout, token màu, typography, spacing trong tài liệu này là nguồn chân lý; hãy tái tạo **pixel-perfect** nhưng dùng component hệ thống của nền tảng (UISwitch/Toggle thật, SF Symbols thật, v.v.).

## Fidelity
**High-fidelity (hifi).** Màu sắc, typography, spacing, bo góc, và tương tác đều là bản cuối. Hãy dựng lại chính xác. Hai điểm cần thay khi lên native:
- Các **icon đang vẽ bằng SVG line** → thay bằng **SF Symbols** tương ứng (gợi ý ở mục Assets).
- Các **ô ảnh sọc chéo (striped placeholder)** là chỗ dành cho ảnh/video thật của người dùng — thay bằng `AsyncImage`/thumbnail thật.

## Hệ màu & Theming (QUAN TRỌNG)
Thiết kế có **2 trục màu độc lập**, mỗi trục có biến thể **Light/Dark**:
1. **Accent (Tông màu)** — màu nhấn cho nút, nhãn, giờ, trạng thái. **Mặc định đã chốt: Xanh rừng (forest) — `#1e4d2b`.**
2. **Base (Màu nền)** — màu chính nền + thẻ. **Mặc định đã chốt: Sage — nền sage dịu, màn ivory, thẻ trắng, chữ navy.**

> **Định hướng thẩm mỹ (theo ảnh tham chiếu của khách):** nền **sage xanh dịu** làm canvas, màn hình **ivory/kem**, **thẻ trắng** bo góc mềm, tiêu đề **navy đậm**, accent **xanh rừng đậm** cho nút/nhãn/tiến trình; nhiều khoảng trắng, ấm và tối giản. Nút chính = full-width xanh rừng, chữ trắng, radius ~14–16.

Hãy triển khai như **design tokens / theme** (không hard-code rải rác). Bảng giá trị đầy đủ ở mục **Design Tokens**. Sản phẩm thật chỉ cần ship **mặc định Sage + Forest**, nhưng kiến trúc token nên tách accent/base để dễ đổi (các tông/nền khác đã dựng sẵn trong `shared.jsx`).

---

## Screens / Views

> Khung tham chiếu: iPhone 402 × 874 pt (như iPhone 16). Status bar cao ~58pt, Dynamic Island. Home indicator dưới cùng. Tab bar cao ~83pt (49 nội dung + 34 safe area).

### 1. Timeline (Trang chủ) — `tab: timeline`
- **Purpose**: Xem lại các khoảnh khắc theo dòng thời gian, mở chi tiết, tạo entry mới.
- **Layout**: Cuộn dọc. Header (title lớn "Nhật ký" + dòng phụ có icon sparkle "{n} khoảnh khắc đã lưu"). Nội dung nhóm theo ngày: mỗi nhóm có **section header** (vd "Hôm nay" 19pt/700 + ngày "Thứ Tư, 10 Tháng 6" 13.5pt/500 màu tertiary). Dưới là danh sách **thẻ entry**, gap 10pt, padding ngang 16pt.
- **Thẻ entry (card)**: nền `card`, radius 20, padding 10, bóng nhẹ (light) / viền 0.5px `sep` (dark). Bố cục hàng ngang:
  - Thumbnail 72×72, radius 14 (video có badge thời lượng góc dưới-phải: nền đen 55%, icon play + "0:18").
  - Cột phải: hàng meta (giờ 12.5pt/640 tertiary · chấm tròn 3px · **chip nhãn**), rồi caption 15.5pt/480 line-height 1.32, `text-wrap: pretty`.
  - Trạng thái upload (entry mới): dòng nhỏ accent "⟳ Đang tải lên Google Drive…" + spinner; sau ~1.8s biến mất (đã đồng bộ).
- **Chip nhãn**: pill, nền `chipBg`, chữ `chipText`, 12pt/590, có **chấm tròn 6px màu theo danh mục** (xem Category colors).
- **FAB "+"**: tròn 60×60, nền accent, icon "+" 28px màu accentText, góc phải-dưới (right 18, bottom 104 — nổi trên tab bar), bóng `0 8px 22px rgba(accent,0.5)`. → mở Camera.
- **Tap thẻ** → màn Chi tiết. Có hiệu ứng nhấn `scale(0.985)`.
- **Bản thiết kế còn có biến thể B "Tạp chí"** (ảnh hero lớn 220pt mỗi ngày + caption phủ gradient đen, các entry phụ thu nhỏ) — xem `timeline.jsx` (`TimelineEditorial`). Bản đã chốt dùng **biến thể A (danh sách thẻ)**.

### 2. Chụp/Quay (Camera) — overlay toàn màn, nền đen
- **Purpose**: Chụp ảnh / quay video trong app.
- **Layout**: Viewfinder full-bleed (đen). 
  - Top (y≈60): nút đóng "✕" trái + nút flash phải (glass tròn 44, nền đen 32%, blur).
  - y≈118: pill gợi ý "✨ AI sẽ tự viết caption sau khi chụp" (nền đen 42%, blur).
  - Cụm dưới (gradient đen lên): **mode toggle** "ẢNH | VIDEO" (13pt/720, letter-spacing 1.2; mode đang chọn màu accent, còn lại trắng 62%). Hàng nút: thumbnail thư viện 48×48 viền trắng | **nút chụp** tròn 78 viền trắng 4px (lõi trắng 64 khi Ảnh / vuông đỏ #ff4b3e bo 9 khi Video) | nút lật camera (glass).
- **Tap nút chụp** → flash trắng nhanh (~0.32s) → màn AI caption.
- File: `capture.jsx` `CameraScreen`, prototype `proto-screens.jsx` `ProtoCamera`.

### 3. AI tạo caption (Review) — overlay; ảnh vừa chụp + sheet kéo lên
- **Purpose**: Sau khi chụp, AI gợi ý caption (sửa được), chọn nhãn, lưu & đồng bộ.
- **Layout**: Phần trên (cao ~270) là ảnh/video vừa chụp (nền đen) với nút back "‹" trái + nút "Chụp lại" phải. **Sheet** bo góc trên 28 trượt lên, nền `bg`, có grabber.
  - **Khối caption AI**: nhãn "✨ CAPTION DO AI GỢI Ý" (12.5pt/680 accent) + "✎ Sửa được". 
    - **Trạng thái generating (~1.4s)**: thẻ `card` chứa "⟳ AI đang viết caption…" + 3 thanh **shimmer** (skeleton).
    - **Trạng thái xong**: `textarea` chỉnh được chứa caption; dưới có dòng "📍 Thêm vị trí" (ngăn bằng separator).
  - **Nhãn phân loại**: tiêu đề "NHÃN PHÂN LOẠI" + badge "✨ AI đề xuất". Hàng pill chọn 1 (Du lịch / Gia đình / Đời thường / Công việc / Sức khỏe); pill đang chọn nền accent chữ accentText, còn lại nền card viền sep + chấm màu danh mục. Mặc định chọn "Đời thường".
  - **Hàng Google Drive**: icon cloud-up trong ô bo, "Tự động tải lên Google Drive / Khi lưu, ảnh sẽ được đồng bộ", trạng thái "Bật".
  - **Thanh lưu dính đáy**: nút "Lưu khoảnh khắc" 52pt, radius 16, nền accent (mờ + disabled khi đang generating, chữ "Đang chuẩn bị…").
- **Lưu** → tạo entry mới (sync: uploading), về Timeline, sau ~1.8s chuyển done.
- File: prototype `proto-screens2.jsx` `ProtoReview`; tĩnh `capture.jsx` `CaptureReview`.

### 4. Chi tiết entry (Detail) — overlay toàn màn
- **Purpose**: Xem 1 khoảnh khắc lớn.
- **Layout**: Hero ảnh/video cao 392 (video có nút play tròn 66 giữa). Back "‹" + "⋯" overlay trên hero. Nội dung cuộn:
  - Hàng: "📅 {ngày} · {giờ}" (14pt sub) + chip nhãn (size md).
  - Khối caption: "✨ CAPTION DO AI TẠO" + "✎ Sửa"; caption 19pt/480 line-height 1.45.
  - **Card meta** (radius 18): 3 hàng — 📍 Vị trí / {loc}; ▥ Album / {cat}; 🎬|📷 Định dạng / "Video · 0:18" hoặc "Ảnh · JPG". Mỗi hàng: icon + label sub + value phải `text`/520.
  - **Card trạng thái Drive**: nền `rgba(accent, .10/.14)`, icon cloud trong ô card, "Đã đồng bộ Google Drive / Nhật ký / 2026 / Tháng 6", + badge tròn check màu accent.
  - **Thanh hành động đáy** (glass): Sửa · Đổi album · Tải xuống · **Xoá** (màu đỏ #e0533c).
- File: prototype `proto-screens2.jsx` `ProtoDetail`; tĩnh `detail-album.jsx` `EntryDetail`.

### 5. Album / Phân loại — `tab: album`
- **Purpose**: Gom entry theo chủ đề; AI gợi ý album.
- **Layout**: Header "Album" (title lớn) + "+" accent; dòng phụ "6 chủ đề · 85 khoảnh khắc".
  - **Banner AI gợi ý** (dismiss được): nền `rgba(accent,.11/.16)`, icon sparkle trong ô, "AI gợi ý album mới / Gom 9 ảnh gần đây thành 'Đà Lạt 2026'?", nút "Tạo" (nền accent).
  - **Lưới 2 cột**, gap 14: mỗi album = ảnh bìa vuông (radius 18, có **chấm màu danh mục** góc trên-trái viền trắng) + tên (15.5pt/620) + "{n} mục" (13pt sub).
- File: `proto-screens3.jsx` `ProtoAlbum`; tĩnh `detail-album.jsx` `AlbumScreen`.

### 6. Tìm kiếm & lọc — `tab: search`
- **Purpose**: Tìm theo từ khoá trong caption; lọc theo loại/ngày/nhãn.
- **Layout**: Header "Tìm kiếm". **Ô tìm**: nền `fieldBg`, radius 13, viền sep, icon search + `input` + nút xoá "✕" tròn. **Hàng chip lọc**: "Tất cả / Ảnh / Video" (chọn 1, đang chọn nền accent) + "Mọi thời gian ▾", "Mọi nhãn ▾". Tiêu đề "{n} KẾT QUẢ". Danh sách kết quả như thẻ entry rút gọn (thumbnail 64), **từ khoá khớp được highlight** (nền `rgba(accent,.28)`). Có **empty state** "Không tìm thấy khoảnh khắc nào." khi 0 kết quả.
- Logic: lọc `cap.includes(query)` (lowercase) AND theo `kind`. Tap kết quả → Chi tiết.
- File: `proto-screens3.jsx` `ProtoSearch`; tĩnh `search-settings.jsx` `SearchScreen`.

### 7. Cài đặt — `tab: settings`
- **Purpose**: Kết nối Drive, bật/tắt đồng bộ, lưu trữ, tuỳ chọn AI.
- **Layout**: Header "Cài đặt". Các **nhóm grouped-list** (card radius 18, margin ngang 16, header chữ nhỏ uppercase sub):
  - **(không header)**: hàng tài khoản — avatar tròn 48, "Minh Anh / minhanh@gmail.com", badge "● Đã kết nối" (accent).
  - **ĐỒNG BỘ GOOGLE DRIVE**: "Tự động đồng bộ" (sub "Tải lên ngay sau khi lưu") + **switch**; "Chỉ qua Wi-Fi" + switch; hàng **Dung lượng đã dùng** "3,2 / 15 GB" + **progress bar** (21%, nền `rgba(text,.1)`, fill accent).
  - **AI CAPTION**: "Tự động tạo caption" + switch; "Ngôn ngữ caption" → "Tiếng Việt ›"; "Độ dài mô tả" → "Vừa ›".
  - **KHÁC**: "Gắn vị trí vào khoảnh khắc" + switch (mặc định off); "Tự động phân loại bằng AI" + switch.
- **Switch (iOS)**: 51×31 pill, knob 27 trắng bóng, nền accent khi on / `rgba(text,.16)` khi off; knob trượt (transition .2s). Mỗi hàng có ô icon 30×30 radius 8 nền `rgba(accent,.16)` icon accent.
- File: `proto-screens3.jsx` `ProtoSettings`; tĩnh `search-settings.jsx` `SettingsScreen`.

---

## Interactions & Behavior

### Luồng tạo entry (core flow)
1. Timeline → tap **FAB "+"** → mở **Camera** (modal từ dưới).
2. Camera: chọn **Ảnh/Video** → tap **nút chụp** → **flash trắng** ~0.32s → mở **Review**.
3. Review: hiện **shimmer "AI đang viết caption…"** ~1.4s → điền caption (sửa được). Người dùng chọn **nhãn**, có thể sửa caption.
4. Tap **Lưu khoảnh khắc** → đóng overlay, về **Timeline**, entry mới chèn đầu nhóm "Hôm nay" với trạng thái **uploading** (spinner "Đang tải lên Google Drive…").
5. Sau **~1.8s** → entry chuyển **done** (ẩn spinner). (Mô phỏng upload Drive; thật sẽ là tiến trình upload + retry.)
6. Tap entry bất kỳ → **Chi tiết**.

### Điều hướng
- **Tab bar 4 mục**: Nhật ký (timeline) · Album · Tìm kiếm · Cài đặt. Mục active màu accent + đậm hơn.
- **Overlay** (Camera/Review/Detail) phủ toàn màn, z-index trên tab bar. Back/đóng quay lại màn trước. Review "Chụp lại"/back → về Camera; Camera "✕" → về Timeline.
- **Status bar** luôn hiển thị; **màu chữ status bar = trắng** khi đang ở overlay (camera/review/detail) hoặc Dark mode, ngược lại **đen**.

### Animations & transitions
- **Flash chụp**: trắng, opacity 0→0.92→0 trong ~0.32s.
- **Switch/segment/chip**: transition màu/vị trí .12–.2s.
- **Nhấn thẻ**: `scale(0.985)` .12s.
- ⚠️ **Lưu ý kỹ thuật từ prototype**: KHÔNG dùng entrance animation kiểu "trượt từ ngoài vào" với fill giữ trạng thái ẩn cho nội dung bắt buộc hiển thị — nếu animation bị tạm dừng (tab nền) nội dung sẽ kẹt ngoài màn. Trên native (SwiftUI `.transition`/`withAnimation`) không gặp vấn đề này; cứ dùng push/sheet chuẩn của hệ thống.
- Spinner xoay (loop), shimmer skeleton (loop) cho trạng thái chờ.

### States cần có
- Loading: AI đang sinh caption (shimmer); entry đang upload (spinner).
- Empty: tìm kiếm 0 kết quả (đã có); nên thêm Timeline rỗng & Album rỗng.
- (Đề xuất mở rộng, chưa thiết kế): lỗi đồng bộ / chờ Wi-Fi / retry; xoá có xác nhận (action sheet).

## State Management
- `mode`: 'light' | 'dark' (theme).
- `tab`: 'timeline' | 'album' | 'search' | 'settings'.
- `overlay`: null | { type: 'camera' } | { type: 'review', kind } | { type: 'detail', entry }.
- `entries`: mảng entry. Mỗi entry:
  ```
  { id, day, date, time, cap, cat, kind: 'photo'|'video', ph, dur?, sync: 'uploading'|'done', loc }
  ```
  Nhóm hiển thị bằng `day` (giữ thứ tự xuất hiện).
- `flash`: boolean (hiệu ứng chụp).
- Settings: mỗi toggle là 1 boolean (sync, wifi, aiCaption, geo, autoCategory).
- Search: `query` (string), `kind` filter.
- **Data fetching thật (khi lên production)**: load entries từ store/local DB; AI caption = gọi API mô tả ảnh (vision→text); upload Google Drive qua Drive API + trạng thái tiến trình; auto-phân loại nhãn bằng AI.

## Design Tokens

### Accent — Vàng nắng (amber) — *mặc định*
| Token | Light | Dark |
|---|---|---|
| accent | `#f0a012` | `#f8bc4d` |
| accentText (chữ/icon trên nền accent) | `#3a2600` | `#1c1408` |
| chipText | `#a86e00` | `#f9c873` |
| chipBg | `rgba(accent, 0.14)` | `rgba(accent, 0.20)` |

> Các tông accent khác đã dựng sẵn (nếu muốn theme): San hô `#fb6f4c`/`#ff8a63`, Hồng đào `#ec5a8d`/`#ff86ae`, Xanh ngọc `#0fa493`/`#3ed4c2`, Xanh biển `#3b82e8`/`#6ca6ff`, Tím `#8b5cf0`/`#b390ff`, Đất nung `#e9692e`/`#f7a05e`. Chi tiết trong `shared.jsx` → `PALETTES`.

### Base — Sage — *mặc định*
| Token | Light | Dark |
|---|---|---|
| **appBg** (canvas sage sau thiết bị) | `#a9bba2` | `#0a0e0f` |
| bg (nền màn / ivory) | `#f6f3e9` | `#13181a` |
| card | `#ffffff` | `#1b2224` |
| card2 | `#f3efe2` | `#242c2e` |
| ink (text chính / navy) | `#15273a` | `#ecf1ec` |
| fieldBg (ô input) | `#f1ede0` | `#242c2e` |
| stripeA / stripeB (placeholder sọc) | `#e7e8d8` / `#d7dcc6` | `#1f2829` / `#293433` |

> Lưu ý: **appBg là màu sage** dùng làm nền canvas/wallpaper sau khung điện thoại (giống ảnh tham chiếu); bên trong app dùng **bg ivory + card trắng**. Trên native, sage thường chỉ hiện ở màn nền/onboarding; app nội dung dùng ivory + trắng.
> Base khác: Giấy ấm (paper), Trắng sạch (snow), Cát (sand), Xanh khói (mist), Hồng phấn (blush) — trong `shared.jsx` → `BASES`.

### Token dẫn xuất (từ ink/bg)
- `sub` (text phụ) = `rgba(ink, 0.56)` light / `0.64` dark
- `ter` (tertiary) = `rgba(ink, 0.34)` / `0.42`
- `sep` (separator) = `rgba(ink, 0.08)` / `0.11`
- `barBg` (tab/action bar, blur) = `rgba(bg, 0.78)` + `backdrop-filter: blur(22px) saturate(180%)`
- `barBorder` = `rgba(ink, 0.08)`

### Category colors (chấm nhãn) — oklch
| Danh mục | Màu |
|---|---|
| Du lịch | `oklch(0.62 0.13 230)` (xanh dương) |
| Gia đình | `oklch(0.64 0.15 30)` (cam) |
| Công việc | `oklch(0.58 0.13 280)` (tím) |
| Đời thường | `oklch(0.58 0.13 155)` (xanh lá) |
| Sức khỏe | `oklch(0.62 0.14 350)` (hồng) |

### Pastel category tiles (`CAT_TILE` — chữ ký style tham chiếu)
Mỗi danh mục có một **tile bo góc mềm nền pastel + icon line đậm màu** (giống list "What's your goal?" trong ảnh). Dùng cho icon danh mục ở list chọn nhãn / Album.
| Danh mục | Nền (light) | Nền (dark) | Màu icon | glyph |
|---|---|---|---|---|
| Du lịch | `#dcebf5` | `#1d2f3c` | `#3f7fb0` | pin |
| Gia đình | `#f7e2d4` | `#3a2a20` | `#c4763f` | camera |
| Công việc | `#e7e0f3` | `#2a2438` | `#7a5fc0` | grid |
| Đời thường | `#dcefe0` | `#1e2f24` | `#3f9560` | sparkle |
| Sức khỏe | `#f6dde3` | `#382128` | `#bb5878` | play |

### Typography
- Font: **SF Pro** (system: `-apple-system`). Native: dùng `.system()`.
- Title lớn (nav): 34pt / weight 760 / letter-spacing 0.3
- Section header ngày: 19pt / 700
- Tiêu đề card/section: 22pt / 720 (gallery)
- Body caption: 15.5–19pt / 470–500, line-height 1.32–1.45, `text-wrap: pretty`
- Meta/giờ: 12–14pt / 600–640
- Nhãn nhóm (uppercase): 12.5–13pt / 600–680, letter-spacing 0.2–0.3
- Tab label: 10.5pt / 500 (active 640)
- **Số liệu (giờ, dung lượng)**: dùng `tabular-nums`.

### Spacing & shape
- Padding ngang màn: 16–20. Gap thẻ: 10–14.
- Radius: thẻ entry 20, card/meta 18, ô input/icon-cell 8–13, thumbnail 13–14, album bìa 18, pill/chip 999, nút lưu 16, **FAB tab bar 56×56 / avatar 999**, sheet top 28, device 48.
- Bóng: thẻ light `0 1px 2px rgba(0,0,0,0.05)`; **FAB "+" `0 6px 18px rgba(accent,0.45)`** + viền `bg` 3px; sheet `0 -10px 40px rgba(0,0,0,0.4)`.
- Hit target ≥ 44pt.

## Assets
- **Không có ảnh thật** — mọi ảnh là **placeholder sọc chéo** (repeating-linear-gradient 135deg, stripeA/stripeB) + nhãn monospace mô tả nội dung (vd "cà phê sáng", "hoàng hôn"). Thay bằng ảnh/video thật của người dùng.
- **Icon**: hiện vẽ bằng SVG line (trong `shared.jsx` → hàm `Icon`). Map sang **SF Symbols** gợi ý: timeline→`list.bullet`, grid→`square.grid.2x2`, search→`magnifyingglass`, gear→`gearshape`, plus→`plus`, camera→`camera`, chevron→`chevron.right`, close→`xmark`, flash→`bolt.fill`, flip→`arrow.triangle.2.circlepath.camera`, play→`play.fill`, pin→`mappin`, sparkle→`sparkles`, edit→`pencil`, cloud→`checkmark.icloud`, cloudUp→`icloud.and.arrow.up`, library→`photo.on.rectangle`, video→`video`, calendar→`calendar`.
- **Avatar Google**: placeholder tròn — thay bằng ảnh tài khoản thật.
- Không có asset thương hiệu Anthropic. "Google Drive" chỉ là nhãn tính năng — dùng branding Google Drive đúng guideline khi tích hợp thật.

## Files (trong gói này)
Mã nguồn React tham chiếu (Babel in-browser, không có build step):
- `Nhật ký hình ảnh.html` — **bản gallery**: 6 màn cạnh nhau + bộ chọn Tông màu / Màu nền / Sáng-Tối.
- `Nhật ký hình ảnh — Prototype.html` — **bản bấm chạy được**: luồng tạo entry + điều hướng đầy đủ.
- `shared.jsx` — **design tokens** (`theme`, `PALETTES`, `BASES`, `CATEGORIES`), `Icon`, `Placeholder`, `Chip`, `VideoBadge`, `TabBar`.
- `timeline.jsx` — Timeline A (`TimelineCardList`) + B (`TimelineEditorial`).
- `capture.jsx` — `CameraScreen`, `CaptureReview` (tĩnh).
- `detail-album.jsx` — `EntryDetail`, `AlbumScreen`, `Switch` (tĩnh).
- `search-settings.jsx` — `SearchScreen`, `SettingsScreen` (tĩnh).
- `proto-screens.jsx`, `proto-screens2.jsx`, `proto-screens3.jsx` — bản **interactive** của các màn.
- `proto-app.jsx` — **controller luồng**: nav stack, capture→AI→save, mô phỏng đồng bộ.
- `ios-frame.jsx` — khung iPhone (status bar / dynamic island / home indicator). Trên native KHÔNG cần — hệ thống tự lo.

> Mở 2 file `.html` bằng trình duyệt để xem trực tiếp. Bản gallery để soi chi tiết từng màn; bản prototype để cảm nhận luồng và tương tác.

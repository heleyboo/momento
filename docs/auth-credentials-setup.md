# Hướng dẫn lấy Credentials cho Đăng nhập (Google & Apple)

Tài liệu này hướng dẫn chi tiết cách lấy thông tin đăng nhập (credentials) cho **Google Sign-In** và **Sign in with Apple**, rồi cắm vào đúng chỗ trong codebase Momento.

**Thông tin định danh app cần nhớ:**

| Mục | Giá trị |
|-----|---------|
| Bundle Identifier (iOS) | `minhanh.Momento` |
| Backend base URL (dev) | `http://localhost:3000` |
| Google ID token audience (backend) | env `GOOGLE_CLIENT_ID_IOS` |
| iOS đọc client ID ở | `ios/Momento/Momento/Auth/AppConfig.swift` |

> Hiện trạng: **Google = chạy thật**, **Apple/Facebook = đang để nút "sắp hỗ trợ"**. Phần Apple bên dưới là để bạn chuẩn bị credentials trước; phần code native chưa nối (xem mục [Apple → Bước nối code](#bước-6-nối-code-native-phần-còn-thiếu)).

---

## Phần 1 — Google Sign-In

iOS dùng OAuth 2.0 + PKCE qua `ASWebAuthenticationSession` (không cần SDK GoogleSignIn). Luồng: app mở trình duyệt Google → người dùng đồng ý → Google trả `authorization code` về URL scheme của app → app đổi lấy `id_token` (gửi backend xác thực) + `access_token` cho Drive.

### Bước 1: Tạo Google Cloud Project

1. Vào <https://console.cloud.google.com/>.
2. Góc trên cùng, bấm dropdown project → **New Project**.
3. Đặt tên (vd `Momento`) → **Create**. Chờ ~10s rồi chọn project vừa tạo.

### Bước 2: Cấu hình OAuth Consent Screen

Bắt buộc làm trước khi tạo client ID.

1. Menu trái → **APIs & Services** → **OAuth consent screen**.
2. **User Type**: chọn **External** (cho phép tài khoản Google bất kỳ) → **Create**.
3. Điền:
   - **App name**: `Momento`
   - **User support email**: email của bạn
   - **Developer contact information**: email của bạn
   - (Logo, domain có thể bỏ trống ở giai đoạn dev)
4. **Save and Continue**.
5. **Scopes** → **Add or Remove Scopes**, thêm:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file` ← scope **nhạy cảm** (sensitive), dùng để upload media lên Google Drive của người dùng.
6. **Save and Continue**.
7. **Test users** → **Add Users**: thêm chính email Google bạn sẽ dùng để test.
   - Ở chế độ **Testing**, chỉ các test user này đăng nhập được. Đủ để dev.
   - Muốn cho người ngoài dùng → phải **Publish app** và Google sẽ **verify** (do có scope `drive.file` nhạy cảm — cần submit review, mất vài ngày đến vài tuần). Giai đoạn dev cứ để Testing.

### Bước 3: Tạo OAuth Client ID (loại iOS)

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. **Application type**: **iOS**.
3. **Name**: `Momento iOS`.
4. **Bundle ID**: `minhanh.Momento` (phải khớp tuyệt đối với `PRODUCT_BUNDLE_IDENTIFIER` của project).
5. **Create**.
6. Màn hình hiện ra **Client ID** dạng:
   ```
   123456789-abcdefg.apps.googleusercontent.com
   ```
   Copy lại. (Client của loại iOS **không có client secret** — đúng theo PKCE.)

### Bước 4: Cắm Client ID vào iOS

Mở `ios/Momento/Momento/Auth/AppConfig.swift`, sửa 2 dòng:

```swift
// Lấy nguyên Client ID vừa copy
static let googleClientID = "123456789-abcdefg.apps.googleusercontent.com"

// Reversed client ID: ĐẢO ngược thứ tự 2 phần quanh dấu chấm cuối.
// Quy tắc: bỏ phần ".apps.googleusercontent.com", đảo còn lại, rồi gắn tiền tố
//   com.googleusercontent.apps.<phần-id>
// Ví dụ ID trên → scheme:
static let googleRedirectScheme = "com.googleusercontent.apps.123456789-abcdefg"
```

> **Reversed client ID** = `com.googleusercontent.apps.` + phần đứng trước `.apps.googleusercontent.com`.
> VD `123456789-abcdefg.apps.googleusercontent.com` → `com.googleusercontent.apps.123456789-abcdefg`.

### Bước 5: Đăng ký URL Scheme trong Info.plist (Xcode)

App cần "bắt" được redirect quay về. Trong Xcode:

1. Chọn target **Momento** → tab **Info**.
2. Mục **URL Types** → bấm **+**.
3. **URL Schemes**: dán đúng giá trị `googleRedirectScheme` ở trên (`com.googleusercontent.apps.123456789-abcdefg`).
4. Identifier có thể để trống hoặc đặt `google`.

> Nếu project dùng file `Info.plist` riêng, thêm khối sau (thay scheme của bạn):
> ```xml
> <key>CFBundleURLTypes</key>
> <array>
>   <dict>
>     <key>CFBundleURLSchemes</key>
>     <array>
>       <string>com.googleusercontent.apps.123456789-abcdefg</string>
>     </array>
>   </dict>
> </array>
> ```

### Bước 6: Cấu hình Backend

ID token mà app gửi lên `/api/auth/google` được backend xác thực với **audience = client ID**. Phải khớp.

Trong `server/.env`:

```bash
GOOGLE_CLIENT_ID_IOS=123456789-abcdefg.apps.googleusercontent.com
```

> Backend đọc biến này tại `server/src/lib/auth/verify-google-id-token.ts`. Nếu sai/thiếu → mọi đăng nhập Google trả về 401.

### Bước 7: Kiểm thử Google

1. Khởi động Postgres + backend: `cd server && docker compose up -d && npm run dev`.
2. **Simulator** dùng được `http://localhost:3000`. **Máy thật** phải đổi `AppConfig.apiBaseURL` sang IP LAN của Mac (vd `http://192.168.1.10:3000`) và cùng mạng Wi-Fi.
3. Build app → bấm nút Google → đăng nhập bằng **test user** đã thêm ở Bước 2.7.
4. Lần đầu sẽ có màn hình xin quyền (email, profile, Drive). Đồng ý.
5. Vào được timeline = thành công. Nếu lỗi:
   - `401` → `GOOGLE_CLIENT_ID_IOS` không khớp client ID.
   - Trình duyệt báo `redirect_uri_mismatch` / `invalid` → Bundle ID khi tạo client (Bước 3.4) không khớp, hoặc URL scheme (Bước 5) sai.
   - `access_blocked` / app chưa verified → email đăng nhập chưa nằm trong Test users.

---

## Phần 2 — Sign in with Apple

> **Yêu cầu bắt buộc:** tài khoản **Apple Developer Program** (99 USD/năm). Sign in with Apple không hoạt động với tài khoản Apple ID free.

iOS native dùng `ASAuthorizationAppleIDProvider` (framework `AuthenticationServices`). App nhận về một **identity token** (JWT) → gửi backend → backend xác thực JWT với public keys của Apple, kiểm tra `audience = Bundle ID`.

### Bước 1: Bật capability cho App ID

1. Vào <https://developer.apple.com/account> → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Tìm/ tạo App ID khớp `minhanh.Momento`:
   - Nếu chưa có: **+** → **App IDs** → **App** → **Description** = Momento, **Bundle ID = Explicit** = `minhanh.Momento`.
3. Trong danh sách **Capabilities**, tick **Sign In with Apple** → **Save**.

### Bước 2: Bật capability trong Xcode

1. Chọn target **Momento** → tab **Signing & Capabilities**.
2. Đảm bảo **Team** đã chọn đúng (tài khoản Apple Developer).
3. Bấm **+ Capability** → thêm **Sign in with Apple**.
   - Xcode tự tạo/cập nhật file `Momento.entitlements` với key `com.apple.developer.applesignin`.

> Với **app iOS native**, **chỉ cần** bước 1 + 2 là đủ để hiện nút Apple và lấy được identity token. **Không bắt buộc** tạo Service ID hay key `.p8` (những thứ đó chỉ cần cho web / Android / "Apple as OAuth provider").

### Bước 3 (TÙY CHỌN): Service ID + Key — chỉ khi cần web/backend-side OAuth

Bỏ qua nếu chỉ làm app iOS. Cần khi muốn đăng nhập Apple từ web hoặc tự verify bằng client-secret tự ký:

1. **Key (.p8):** Identifiers → **Keys** → **+** → tick **Sign in with Apple** → Configure (chọn Primary App ID `minhanh.Momento`) → **Continue** → **Register** → **Download** file `AuthKey_XXXXXXXXXX.p8` (**chỉ tải được 1 lần**). Ghi lại **Key ID** (10 ký tự).
2. **Team ID:** góc trên phải trang Developer (10 ký tự, vd `A1B2C3D4E5`).
3. **Service ID** (chỉ cho web redirect): Identifiers → **+** → **Services IDs** → đặt Identifier (vd `minhanh.Momento.web`) → bật Sign in with Apple → khai báo Domains + Return URLs.
4. **Client secret** = một JWT bạn tự ký bằng `.p8` (ES256), gồm `iss`=Team ID, `sub`=Service ID/Bundle ID, `aud`=`https://appleid.apple.com`, hết hạn ≤ 6 tháng.

### Bước 4: Env backend cho Apple (khi nối code)

Thêm vào `server/.env` (các key này **chưa được code đọc** — sẽ thêm khi nối phần native):

```bash
# Audience để verify identity token của Apple (chính là Bundle ID app native)
APPLE_CLIENT_ID_IOS=minhanh.Momento

# Chỉ cần nếu dùng Service ID / client secret (Bước 3):
# APPLE_TEAM_ID=A1B2C3D4E5
# APPLE_KEY_ID=XXXXXXXXXX
# APPLE_SERVICE_ID=minhanh.Momento.web
# APPLE_PRIVATE_KEY_PATH=./AuthKey_XXXXXXXXXX.p8
```

### Bước 5: Lưu ý quan trọng về Apple

- **Email ẩn (Hide My Email):** người dùng có thể chọn ẩn email → Apple cấp một địa chỉ relay `xxx@privaterelay.appleid.com`. Backend nên coi `sub` (Apple user ID, ổn định) là khóa định danh chính, không phải email.
- **Tên + email chỉ trả về LẦN ĐẦU:** Apple chỉ gửi `fullName`/`email` ở lần authorize đầu tiên. Phải lưu ngay; các lần sau chỉ có `sub` + identity token.
- **Bắt buộc nếu đã có social login khác:** App Store yêu cầu app có đăng nhập bên thứ ba (Google/Facebook) thì **phải** có cả Sign in with Apple mới được duyệt. Tức là để lên store, Apple là bắt buộc chứ không tùy chọn.

### Bước 6: Nối code native (phần còn thiếu)

Hiện code chỉ render nút Apple và báo "sắp hỗ trợ" (`ios/Momento/Momento/Features/Auth/AuthComponents.swift`, `onUnsupported`). Để chạy thật cần (chưa làm — ngoài phạm vi credentials):

1. **iOS:** dùng `ASAuthorizationAppleIDProvider` + `ASAuthorizationController`, lấy `credential.identityToken` → POST lên endpoint mới `POST /api/auth/apple`.
2. **Backend:** tạo `verify-apple-id-token.ts` xác thực JWT với JWKS `https://appleid.apple.com/auth/keys`, check `aud == APPLE_CLIENT_ID_IOS`, `iss == https://appleid.apple.com`; rồi tái dùng logic tạo/khớp user như Google (`google_sub` đã nullable nên thêm cột `apple_sub` tương tự).

---

## Tóm tắt nơi cắm credentials

| Credential | Lấy từ đâu | Cắm vào đâu |
|------------|-----------|-------------|
| Google iOS Client ID | Cloud Console → Credentials (loại iOS) | `AppConfig.googleClientID` **và** `server/.env` `GOOGLE_CLIENT_ID_IOS` |
| Google Reversed Client ID | Đảo từ Client ID | `AppConfig.googleRedirectScheme` **và** URL Types trong Xcode |
| Apple App ID + capability | developer.apple.com → Identifiers | Xcode → Signing & Capabilities → Sign in with Apple |
| Apple Bundle ID | `minhanh.Momento` | (tương lai) `server/.env` `APPLE_CLIENT_ID_IOS` |
| Apple Key `.p8` / Key ID / Team ID / Service ID | developer.apple.com → Keys / Identifiers | Chỉ khi làm web/backend OAuth (Bước 3–4) |

## Bảo mật

- **KHÔNG** commit `server/.env` hay file `AuthKey_*.p8` lên git (đã được `.gitignore`).
- `JWT_SECRET` của backend phải sinh ngẫu nhiên ở production:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
- Client ID **không phải** bí mật (lộ ra cũng không sao); client secret / `.p8` / `JWT_SECRET` **là** bí mật.

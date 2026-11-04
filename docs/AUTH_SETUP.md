# Hội Vào Hang — Supabase Auth & database

## Trạng thái triển khai

Ứng dụng gọi Supabase Auth thật qua SDK; không có chế độ đăng nhập giả trong mã ứng dụng. Khi thiếu cấu hình, các nút hiển thị hướng dẫn và không tạo tài khoản cục bộ. Chưa liên kết project Supabase cho repository này. Project “NeoLao” trong kết nối tài khoản chưa được xác định là project của game, nên không được thay đổi. Chưa áp dụng migration lên cloud, chưa chạy Security Advisors trên project đích, chưa xác minh OAuth/email delivery thực tế.

Tính năng thanh toán thật chưa bật. Không có API nạp tiền hoặc nút cộng xu thử. API mua hàng chỉ hoạt động khi backend có secret hợp lệ và database đã được migrate. Vật phẩm đã mua được lưu và hiển thị trong hành trang; việc tiêu thụ/cấp hiệu ứng trả phí realtime sẽ cần luồng backend riêng. Các hiệu ứng xem thử cũ vẫn chỉ là xem thử miễn phí.

## 1. Chọn project và khai báo môi trường

Chọn project dành cho game trong Supabase Dashboard. Không dùng project của ứng dụng khác nếu chưa xác nhận phạm vi. Không cần tạo thêm project nếu đã có project thích hợp.

- Copy `.env.example` sang `.env` tại root cho backend.
- Copy `apps/web/.env.example` sang `apps/web/.env.local` cho Vite.
- Điền cùng `SUPABASE_URL` và `VITE_SUPABASE_URL` lấy từ Project Settings → API.
- Publishable key dùng được trong browser; điền ở cả backend và frontend.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ đặt trong môi trường backend, tuyệt đối không đặt tên bắt đầu bằng `VITE_`.
- Backend cần publishable key để xác minh JWT và đọc profile theo RLS. Service role chỉ cần cho giao dịch.
- `VITE_AUTH_REDIRECT_URL` là origin công khai (ví dụ `https://game.example.com`).
- Để trống `VITE_BACKEND_URL` / `VITE_WEBSOCKET_URL` khi dùng proxy cùng origin; nếu tách backend, điền URL backend và cho phép frontend origin qua `CORS_ORIGINS`.
- Restart Vite sau khi đổi env. Secrets không commit lên Git.

## 2. Áp dụng migration

Repo có `supabase/config.toml` và migration versioned được tạo bằng Supabase CLI. Đã kiểm tra CLI 3.0.0; CLI v3 mặc định target local. Luôn kiểm tra `--help` của CLI cài trên máy trước khi áp dụng lên hosted project.

Local (cần Docker daemon chạy):

```sh
npx supabase start
npx supabase db reset
npx supabase migration list
npx supabase db advisors
```

`db reset` chỉ dùng với local database có thể xóa để dựng lại. Lấy URL/key local từ `npx supabase status` và cấu hình env.

Hosted project:

```sh
npx supabase link --help
npx supabase db push --help
npx supabase migration list --help
npx supabase db advisors --help
```

Dùng project ref đã chọn, `link --project-ref <ref>`, sau đó dùng target linked/remote đúng với `--help` phiên bản CLI. Kiểm tra project/ref và danh sách pending migrations trước khi push. CLI v3 có bước xác nhận thay đổi hosted. Có thể áp dụng chính file SQL trong SQL Editor của project đích nếu không dùng CLI; khi đó cần đồng bộ migration history trước lần CLI push tiếp theo.

Chạy Security Advisors trên project đích sau migration. Kiểm tra RLS bật trên cả sáu bảng, không có quyền ghi từ browser vào ví/ledger/purchases/payment_orders, chỉ cho sửa nickname/favorite_team/avatar_key. Các hàm transaction là `SECURITY INVOKER`, chỉ service_role được gọi. Hàm trigger `SECURITY DEFINER` nằm trong private schema, search_path cố định và không cho client execute.

## 3. Email, xác minh và khôi phục

Trong Authentication → Providers, bật Email; bật xác minh email. Đặt password minimum 8 trở lên và cấu hình SMTP production. Local config bật xác minh; xem thư local trong giao diện mail của Supabase (`supabase status` hiển thị URL).

Authentication → URL Configuration:

- Site URL: `http://localhost:5173` ở local, HTTPS origin thật ở production.
- Allowlist chính xác: `http://localhost:5173/auth/callback`, `http://localhost:5173/auth/reset-password`.
- Nếu dùng `127.0.0.1`, thêm cả hai đường dẫn tương ứng.
- Production thêm `https://<domain>/auth/callback` và `https://<domain>/auth/reset-password`.

Ứng dụng dùng PKCE và SDK tự trao đổi code để khôi phục session. Mở link trong cùng browser đã bắt đầu luồng để giữ code verifier; nếu mở thiết bị/browser khác, yêu cầu link mới trên thiết bị đó. Không ghi token vào log hoặc URL tùy ý. Khi đặt lại password thành công ứng dụng đăng xuất, đưa về đăng nhập.

Frontend hosting phải rewrite các đường dẫn SPA (`/auth/callback`, `/auth/reset-password`) sang `index.html`. Vite dev đã hỗ trợ fallback. Reverse proxy cũng cần chuyển tiếp `/api` và `/socket.io` đến backend.

## 4. Google OAuth

Trong Google Cloud Console, tạo OAuth client loại Web application. Cấu hình consent screen, domain và test users nếu đang Testing. Authorized JavaScript origins: frontend local/production. Authorized redirect URI của Google là `https://<project-ref>.supabase.co/auth/v1/callback` (lấy chính xác callback URL từ Supabase Dashboard).

Bật Google trong Supabase Authentication, điền Client ID và Client Secret tại Dashboard. Không đưa Client Secret vào env frontend. Trên frontend bấm “Tiếp tục bằng Google”, chấp nhận hoặc hủy và kiểm tra callback. Frontend kiểm tra `/auth/v1/settings` trước khi redirect để hiển thị hướng dẫn nếu provider chưa bật.

## 5. Facebook OAuth

Trong Meta for Developers, tạo Facebook Developer App thích hợp với Facebook Login. Thêm Facebook Login và Web platform; cấu hình App Domains, Website URL, privacy policy URL và data deletion callback/instructions theo Dashboard Meta.

Trong Facebook Login settings, bật Web OAuth Login và Client OAuth Login; Valid OAuth Redirect URIs phải chứa chính xác Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`. Điền App ID/App Secret trong Facebook provider của Supabase.

Chế độ Development chỉ cho app roles/test users. Đăng nhập công khai cần chuyển app Live, hoàn thành yêu cầu xét duyệt/quyền/verification mà Meta yêu cầu cho cấu hình cụ thể. Kiểm tra quyền email; Facebook có thể không trả email. Hồ sơ dùng Supabase UUID, không yêu cầu email và không tạo user phụ từ frontend. Provider bật không đồng nghĩa app Meta đã được duyệt: cần thử tài khoản ngoài app roles trước khi phát hành.

## 6. Chơi khách và liên kết tài khoản

Bật Anonymous Sign-ins trong Authentication. Production nên cấu hình CAPTCHA/rate limits và vòng đời anonymous users theo tài liệu Supabase. Tài khoản khách là Supabase user thật, mang role authenticated, không phải local profile giả.

Khách có thể dùng game, chat và khám phá; backend chặn mua vật phẩm trả phí bằng `user.is_anonymous`, database kiểm tra lại `auth.users.is_anonymous`. Việc không có email không tự động đồng nghĩa với khách, vì Facebook có thể không cung cấp email.

Nâng cấp OAuth dùng `linkIdentity`, ưu tiên giữ nguyên UUID. Mặc định `VITE_IDENTITY_LINKING_ENABLED=false`; luồng liên kết khóa và giải thích lý do. Chỉ bật sau khi bật Manual Linking trong Supabase và chạy các ca kiểm chứng trên project đích:

1. Khách → danh tính Google mới: UUID, profile, wallet phải giữ nguyên.
2. Khách → danh tính Facebook mới, cả trường hợp không có email.
3. Hủy OAuth, provider disabled, code hết hạn: profile khách còn nguyên.
4. Danh tính đã thuộc user khác: báo xung đột; không chuyển ví hoặc tài sản.
5. Refresh callback nhiều lần: vẫn một profile và một wallet.

Nếu muốn vào tài khoản đã tồn tại, người chơi đăng xuất rồi đăng nhập riêng; UI giải thích khách chưa liên kết có thể mất quyền truy cập. Không có RPC gộp ví. Liên kết email cho khách chưa bật trong bản này; dùng Google/Facebook sau khi luồng linking được xác minh, hoặc tạo tài khoản email riêng, không gộp tài sản tự động.

Tài liệu: [Anonymous Sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Facebook](https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook).

## 7. Ví và API

`GET` dữ liệu qua `read_wallet()` với session người chơi. RPC `SECURITY INVOKER` giữ RLS và chuyển bigint sang chuỗi trước JSON, tránh mất độ chính xác trong JavaScript. Lịch sử/vật phẩm hiển thị tối đa 100 bản ghi gần nhất.

`POST /api/purchases`:

```text
Authorization: Bearer <access_token>
Idempotency-Key: <UUID giữ nguyên khi retry cùng một giao dịch>
Content-Type: application/json

{"itemId":"tomato"}
```

Backend xác minh JWT qua Supabase `getUser`, lấy UUID từ user được xác thực, kiểm tra khách, rồi gọi `purchase_item`. Giá do database đọc; dữ liệu giá/userId từ browser không được dùng. RPC khóa wallet, kiểm tra số dư và idempotency, ghi purchase + debit + ledger cùng transaction. Dùng lại key với item khác bị từ chối. Key retry trong UI được giữ khi lỗi, cấp key mới khi thành công.

`settle_payment` chỉ chuẩn bị cho backend webhook tương lai. Chưa có route gọi hàm này. Trước khi dùng phải xác minh chữ ký và dữ liệu provider gồm order, amount, currency, reference; không dùng return URL làm bằng chứng trả tiền. RPC kiểm tra provider/amount/status, unique provider reference và ledger key; cùng webhook không cộng hai lần.

Socket.IO bắt buộc `auth.accessToken`, xác minh qua Supabase. Join đọc profile với JWT đó; bỏ qua user_id/nickname browser gửi. Token refresh cập nhật phiên socket, token hết hạn ngừng xử lý packet và ngắt kết nối. Vị trí và chat không được ghi Supabase mỗi giây.

## 8. Chạy và kiểm thử

```sh
npm install
npm run dev
npm run build
npx tsx --test tests/database.test.ts tests/realtime.test.ts
npm run test:auth
```

Database tests thực thi migration trên PostgreSQL nhúng PGlite: RLS, quyền cột, trùng profile/wallet, số dư âm, bigint, chặn khách, replay/mismatch thanh toán, replay purchase, insufficient balance và rollback sau debit.

Realtime tests tạo HTTP Auth fixture chỉ trong tests và backend ở port riêng 3102. Browser tests dùng fixture ở 55441, backend 3111, Vite 5184; không thay đổi server dev đang chạy. Fixture là contract test của SDK/UI, không chứng minh email delivery hoặc OAuth thật. Không fixture nào được import vào ứng dụng.

Playwright chụp `docs/auth-<width>x<height>.png` ở 1440×900, 1920×1080, 1366×768, 768×1024, 390×844, 360×800 và 430×932. Kiểm tra form đăng ký, lỗi password, reset neutral message, chơi khách, khôi phục phiên/profile, ví khóa thanh toán và logout. Kiểm tra OAuth thành công và account linking thật vẫn cần credentials/project đích.

Các test game cũ có thể cần cập nhật theo bản đồ 3D đang được thay đổi độc lập; không coi lỗi tọa độ legacy là kết quả kiểm thử Auth thành công.

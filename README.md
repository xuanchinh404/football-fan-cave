# Hội Vào Hang — Football Fan Cave 3D

Bản chơi thử web game 3D góc nhìn thứ ba: **Three.js + React Three Fiber + Rapier**, React + TypeScript + Vite, Node.js + Socket.IO. Đại Sảnh Chung có **ba tầng cao độ và chín cổng hang**; Hang Quỷ Đỏ có nội thất 3D vào/ra được, tám nội thất khác ghi rõ sắp ra mắt. Nhân vật đi tự do, camera xoay 360°, collision capsule và cầu có cao độ thật. Thế giới được dựng từ mesh 3D; không dùng ảnh toàn cảnh làm nền/sàn.

## Chạy bản thử

Yêu cầu Node.js 22+ và npm.

```bash
npm ci
npm run dev
```

Mở [bản chơi thử 3D](http://localhost:5173/playtest). Không cần cấu hình Supabase để thử renderer ở URL này. `/` vẫn dùng luồng AuthGateway hiện có và cần cấu hình Supabase. Auth, profile, ví, ledger và giao dịch dùng hệ thống Supabase hiện có. Socket.IO bổ sung cao độ, kiểm tra đường đi nhiều tầng và tốc độ chạy; không bỏ qua token xác thực.

Frontend ở 5173 proxy `/api` và `/socket.io` tới server 3001. Chỉ chạy frontend vẫn khám phá được offline:

```bash
npm run dev -w apps/web
```

## Điều khiển

- WASD / phím mũi tên hoặc joystick: di chuyển theo camera. Giữ Shift hoặc nút Chạy để chạy.
- Kéo chuột / vuốt trên cảnh: xoay camera; cuộn: zoom; R: đưa camera về sau nhân vật.
- Đi qua giữa cổng Hang Quỷ Đỏ, hoặc đến gần và nhấn E / Tương tác để vào phòng. Cổng phía sau vị trí xuất hiện trong hang đưa bạn trở lại sảnh.
- Nút Toàn cảnh cho góc nhìn từ trên cao; Cổng chính cho góc nhìn ngược. Có Low / Medium / High trong Cài đặt.
- Enter mở chat; Esc đóng cửa sổ. React HUD, minimap, biểu cảm và chụp cảnh được nối qua event bridge.

## Cấu trúc

```text
apps/web/src/game/GameCanvas.tsx       Canvas R3F + Physics
apps/web/src/game/three/World3D.tsx    Input, capsule, camera, event bridge, realtime
apps/web/src/game/three/Environments.tsx  Hai môi trường và collider
apps/web/src/game/three/Models.tsx    Mô hình procedural 3D
apps/web/src/game/three/worldLayout.ts   Quy đổi tọa độ, phạm vi playtest
apps/web/src/auth/                   Luồng Supabase hiện có
apps/web/src/account/                Ví và nâng cấp tài khoản hiện có
apps/server/src/index.ts             HTTP + Socket.IO hiện có
packages/shared/                    Giao thức, bản đồ và validator hiện có
```

Mã Phaser và asset 2D cũ được giữ làm tham chiếu; renderer mới không tải chúng. Chín cổng, sân trước, đấu trường, đền, quầy, góc ảnh, sân sút bóng và khu giao lưu được dựng 3D; không tuyên bố đã có nội thất cho tám hang chưa phát hành. Tài liệu README trước chuyển đổi nằm trong [hồ sơ 2D cũ](docs/legacy-2d-readme.md).

## Kiểm tra

Bộ kiểm tra dùng backend/Auth fixture và bản build trình duyệt riêng, không tác động database production:

```bash
npm test
npm run test:e2e
npm run build
```

E2E mới kiểm tra camera xoay đủ vòng, collision, đi bộ ra/vào hang qua server, cao độ cầu, joystick và viewport mobile. Các test Phaser cũ vẫn được lưu riêng qua `npm run test:e2e:legacy`.

[Quy hoạch và giao thức nhiều tầng](docs/grand-hall-layout.md) · [Danh sách GLB, quyền nguồn và asset cần sản xuất](docs/asset-production-plan.md). Bộ asset Blender/GLB đã thay mô hình mẫu; vẫn cần art pass để đạt độ chi tiết cinematic của concept. Chưa benchmark trên điện thoại thật hoặc xác minh lại OAuth/thanh toán production. Báo cáo chuyển đổi engine lần đầu được giữ tại [3d-playtest.md](docs/3d-playtest.md) như hồ sơ lịch sử.

## Supabase Auth, hồ sơ và ví xu

Trang chủ hiện dùng Supabase Auth (email, Google/Facebook, Anonymous Sign-in) trước khi vào game. Xem [hướng dẫn cấu hình và giới hạn đã kiểm chứng](docs/AUTH_SETUP.md), [nguồn artwork](docs/AUTH_ARTWORK.md) và `.env.example`. Khi thiếu Supabase, giao diện báo cấu hình còn thiếu; không có đăng nhập giả hoặc nạp xu demo. Migration nằm trong `supabase/migrations`. Chạy `npm run test:auth` để kiểm tra giao diện và SDK contract trên fixture cục bộ; OAuth thật cần cấu hình project đích.

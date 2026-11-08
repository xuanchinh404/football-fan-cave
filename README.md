# Hội Vào Hang — Football Fan Cave 3D

Bản chơi thử web game 3D góc nhìn thứ ba: **Three.js + React Three Fiber + Rapier**, React + TypeScript + Vite, Node.js + Socket.IO. Đại Sảnh Chung có **ba tầng cao độ và chín cổng hang**. Cả chín cửa tự mở và nối trực tiếp với sảnh trú ẩn trong cùng world 3D. MU, Chelsea, Arsenal và Liverpool có thêm phòng truyền thống riêng. Nhân vật đi tự do, camera xoay 360°, collision capsule và cầu có cao độ thật. Thế giới được dựng từ mesh 3D; không dùng ảnh toàn cảnh làm nền/sàn.

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
- Đi tới cổng đội bạn yêu thích. Cửa tự mở từ cả hai phía. Theo đường hầm để vào sảnh trú ẩn và trở lại Đại Sảnh.
- Nút Toàn cảnh cho góc nhìn từ trên cao; Cổng chính cho góc nhìn ngược. Có Low / Medium / High trong Cài đặt.
- Enter mở chat; Esc đóng cửa sổ. React HUD, minimap, biểu cảm và chụp cảnh được nối qua event bridge.

## Cấu trúc

```text
apps/web/src/game/GameCanvas.tsx       Canvas R3F + Physics
apps/web/src/game/three/World3D.tsx    Input, capsule, camera, event bridge, realtime
apps/web/src/game/three/Environments.tsx  Giữ chín hang và Đại Sảnh trong cùng world, tải nội thất chi tiết theo khoảng cách
apps/web/src/game/three/Models.tsx    Mô hình procedural 3D
apps/web/src/game/three/worldLayout.ts   Quy đổi tọa độ, phạm vi playtest
apps/web/src/auth/                   Luồng Supabase hiện có
apps/web/src/account/                Ví và nâng cấp tài khoản hiện có
apps/server/src/index.ts             HTTP + Socket.IO hiện có
packages/shared/                    Giao thức, bản đồ và validator hiện có
```

Mã Phaser và asset 2D cũ được giữ làm tham chiếu; renderer mới không tải chúng. Chín cổng, đường hầm, sảnh trú ẩn, sân trước và các khu sinh hoạt đều dùng hình học 3D. Xem [bản đồ kết nối và kết quả kiểm thử](docs/visual-qa/connected-caves/README.md). Tài liệu README trước chuyển đổi nằm trong [hồ sơ 2D cũ](docs/legacy-2d-readme.md).

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

## Bàn giao nâng cấp Đại Sảnh 3D

Xem [báo cáo kiểm chứng, ảnh desktop/toàn cảnh/mobile và các giới hạn còn lại](docs/grand-hall-verification.md). Bản đồ có ba tầng cao độ, chín cổng hang và 11 GLB nguyên bản. Mục tiêu đồ họa cinematic của concept vẫn cần tiếp tục sản xuất asset; báo cáo không coi bản kỹ thuật hiện tại là nghiệm thu mỹ thuật cuối cùng.

## Hang MU và Phòng Hoài Niệm 3D

Đi từ Đại Sảnh qua cổng MU; vòng qua bục Sảnh Trú Ẩn để đến hành lang kín dẫn vào Phòng Hoài Niệm. Phòng riêng có 68 cúp, gallery HLV, timeline, 11 bust huyền thoại và kiosk thông tin. E hoặc click khi đến gần hiện vật để đọc. Cổng phía nam bảo tàng về hang; cổng phía nam hang về Đại Sảnh. Space/nút Nhảy, Shift/Chạy, B biểu cảm, P chụp ảnh, K cà khịa.

Xem [phân tích repo, cấu trúc scene, danh sách file và checklist kiểm tra](docs/mu-3d-implementation.md). Kiosk media hiện là placeholder; bảng tỷ số là minh họa. Nhảy dùng physics cục bộ, remote vẫn đồng bộ cao độ sàn.

## Hang The Blues và Phòng Truyền Thống Chelsea

Từ Đại Sảnh, lên tầng hai và đi qua cổng Chelsea. Góc Tâm Sự nằm bên trái. Hành lang lên bốn bậc thang bên phải dẫn đến Phòng Truyền Thống, với 12 nhóm cúp, gallery HLV, tượng Drogba, timeline và tư liệu các trận chung kết. Đến gần hiện vật rồi nhấn E hoặc chạm Tương tác để mở thông tin. Cổng phía nam bảo tàng đưa bạn trở về hành lang. Cổng phía nam hang đưa bạn ra đúng sân trước cổng Chelsea ở Đại Sảnh.

[Báo cáo bàn giao Chelsea](docs/chelsea-3d-implementation.md) · [Ảnh kiểm thử và video](docs/visual-qa/chelsea/README.md)

## Tạo asset 3D từ ảnh

[Xem cách dùng TRELLIS.2 và tích hợp GLB vào game](docs/trellis-2.md).


## Hang Arsenal và Phòng Truyền Thống Arsenal

Chạy `npm run dev`, mở [bản chơi thử 3D](http://localhost:5173/playtest) rồi lên tầng hai Đại Sảnh. Đi về phía tây đến cổng Hang Pháo Thủ. Góc Tâm Sự nằm bên trái sảnh. Bên phải là cổng dẫn qua hành lang vào Phòng Truyền Thống. Đi sát tủ cúp hoặc hiện vật và nhấn E, hoặc chạm nút Tương tác. Cổng phía nam bảo tàng đưa bạn về hành lang. Cổng Ra Hang đưa bạn về sân trước cổng Arsenal.

[Bàn giao Arsenal 3D](docs/arsenal-3d-implementation.md) · [Ảnh kiểm thử Chromium](docs/visual-qa/arsenal/README.md).


## Hang Liverpool

Từ Đại Sảnh Chung, lên tầng hai và đi qua cổng Liverpool. Góc Tâm Sự và Lounge nằm bên trái Sảnh Trú Ẩn. Hành lang có các vòm và đèn đỏ vàng ở bên phải dẫn tới Phòng Truyền Thống. Đến gần sofa hoặc hiện vật rồi nhấn E hay chạm Tương tác. Cổng trong bảo tàng đưa bạn về hành lang. Cổng Ra Hang bên phải đưa bạn về đúng sân trước cổng Liverpool ở Đại Sảnh.

Xem [ảnh game, hướng dẫn kiểm thử và bàn giao asset Liverpool](docs/visual-qa/liverpool/README.md).

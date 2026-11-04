# Hội Vào Hang

Web game 2D fantasy bóng đá, React + TypeScript + Vite + Phaser 3, Node.js + Socket.IO. Đồ họa gốc kết hợp sprite 2.5D, texture và SVG, được dựng từ các object riêng, có bản đồ lớn, camera, chiều sâu và collision; ảnh tham chiếu không được sử dụng làm nền. Không dùng logo câu lạc bộ hoặc ảnh cầu thủ.

## Chạy local

Yêu cầu Node.js 22+ và npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Mở http://localhost:5173. Frontend 5173 proxy Socket.IO và `/api` đến backend 3001. Có thể chạy riêng:

```bash
npm run dev -w apps/web
npm run dev -w apps/server
```

Chỉ chạy frontend vẫn chơi được demo cùng NPC. Kết nối server thất bại sẽ tự thử lại. Khi server trở lại, nhân vật gia nhập phiên mới tại quảng trường. Khi chạy từ máy khác trong LAN, thêm origin frontend vào `CORS_ORIGINS`; Vite dùng proxy cùng origin nên không cần gán địa chỉ backend trong client. Muốn chơi qua Internet cần VPS/domain/HTTPS hoặc một tunnel được cấu hình riêng; localhost không dùng chung giữa các máy.

## Cách chơi

1. Bấm **Vào thế giới**, chọn nickname, màu áo và avatar.
2. Di chuyển bằng WASD, mũi tên hoặc joystick kéo bằng chuột/cảm ứng.
3. Đi đến cổng hang phát sáng, nhấn **E** hoặc bấm nút tương tác. Lối ra nằm phía nam nội thất.
4. **Enter** mở chat. Người trong cùng phòng nhìn thấy nhau và trò chuyện realtime. Bấm nickname trong chat để chặn tin nhắn trong phiên hoặc báo cáo.
5. Thanh công cụ dưới cùng có biểu cảm, sticker, chụp cảnh game và cà khịa. Hiệu ứng cà khịa là xem thử cục bộ, không có mua hàng.
6. Bản đồ nhỏ cập nhật vị trí thật; bấm để mở bản đồ lớn. Nút mời bạn sao chép origin hiện tại.

## Đã triển khai

- Quảng trường 2400 × 1800, camera bám theo, va chạm và trượt dọc vật cản.
- Hang Chung và năm hang đội bóng: Quỷ Đỏ, Pháo Thủ, The Kop, The Blues, Citizens. Mỗi khu là scene state/map riêng, có sảnh, quầy, khu truyền thống, khu giao lưu và lối ra; có thể tiếp tục đi lại.
- Nhân vật chibi có hướng, idle, walking/bobbing, tên, màu áo, bóng và bong bóng thoại. NPC được gắn nhãn; NPC ở Hang Quỷ Đỏ vẫn hoạt động khi có multiplayer và không được tính vào online.
- Server quản lý danh tính theo socket, rooms tối đa 60 người/instance, snapshots 10 Hz theo tầm nhìn 1050 đơn vị, interpolation từ xa; vị trí client gửi tối đa khoảng 15 Hz và được server kiểm tra tốc độ, đường đi, biên, vật cản.
- Online count do server tính; demo không hiển thị số online giả. Mất kết nối vẫn chơi được; kết nối lại mở phiên tạm thời mới.
- Chat/phòng, biểu cảm, giới hạn spam, ẩn chat, chặn trong phiên, báo cáo vào log server. Không có hệ thống kiểm duyệt trực tuyến, không cam kết xử lý báo cáo.
- Hiệu ứng mưa cà chua, loa, banner cố định và pháo giấy cục bộ, cooldown. Chưa có thanh toán; nút xem thử không cấp quyền hay ghi nhận giao dịch.
- Ủng hộ lấy cấu hình qua `/api/config`. Chưa có `SUPPORT_URL` thì hiển thị trạng thái chưa khả dụng. Chỉ chấp nhận link HTTPS trong UI.
- Biển vị trí tài trợ được ghi nhãn; nhà tài trợ cấu hình bằng `SPONSOR_NAME`.
- Responsive desktop/mobile, chat thu gọn, joystick, fullscreen và xuất PNG cảnh game.

## Cấu trúc

```text
apps/web/src/
  game/       Phaser, MapLoader, PlayerController, NpcController, bridge
  network/    Socket.IO client
  ui/         Minimap, Joystick
  App.tsx     HUD, guest onboarding, chat và các cửa sổ tương tác
apps/server/src/index.ts  HTTP API, rooms, validation, rate limits
packages/shared/         Teams, maps, collisions, interactions, limits
assets/                  Thông tin asset và quyền sử dụng
deploy/nginx.conf         Proxy HTTP + WebSocket, static build
tests/                   Unit, socket integration, Playwright gameplay
```

`TEAMS`, `PORTALS`, `interactions()`, `obstacles()` và `spawn()` trong `packages/shared/world.ts` là dữ liệu mở rộng map. `game/assets.ts` chứa nguồn SVG; `MapLoader` chịu trách nhiệm tạo lớp cảnh. Hang Quỷ Đỏ có môi trường riêng 4096 × 3072 với sảnh, khán đài/ghế, quầy, hai khu qua cổng phụ và minimap thật. Các hang còn lại dùng chung bộ kit/bố cục sảnh cơ bản. Hướng dẫn chi tiết: [Hang Quỷ Đỏ](docs/red-devils-cave.md).

## Kiểm tra

Khởi động server trước khi chạy kiểm tra tích hợp:

```bash
npm run dev
# Terminal thứ hai
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm test`: spawn, cổng, collision, lọc dữ liệu, token bucket; hai client socket, chat đúng danh tính, reconnect, chặn teleport và flood. Playwright: tạo khách, di chuyển đến Hang Quỷ Đỏ và trở ra bằng phím, hai phiên trình duyệt, chat realtime, mobile/offline/effect. Đây là kiểm tra chức năng, chưa phải benchmark tải hay chứng nhận hiệu năng trên thiết bị thật.

## Docker / VPS

```bash
cp .env.example .env
# Đổi CORS_ORIGINS thành origin công khai (bao gồm protocol/port).
docker compose up --build -d
```

Mở http://localhost:8080. Web dùng Nginx, server không publish cổng ra Internet. Health check `/api/health` được proxy qua Nginx. Đặt HTTPS reverse proxy trước cổng 8080 trên VPS (ví dụ Caddy/Traefik) và cấu hình origin tương ứng. `docker compose down` dừng dịch vụ; RAM phiên chơi bị xóa khi server khởi động lại. Không dùng database hoặc Redis.

## Giới hạn và hướng nâng cấp

- Quảng trường đã có bộ art raster 2.5D gốc và HUD fantasy đỏ/vàng; xem `docs/visual-redesign.md`. Chuyển động dùng view trước/sau và bobbing, chưa có animation skeletal hoặc sprite sheet walking đầy đủ.
- Hang Quỷ Đỏ đã có bố cục và khu vực riêng; các hang khác vẫn dùng chung nội thất. Art hang mới còn chủ yếu là vector, cần bổ sung bộ raster cùng phong cách để đạt độ chi tiết concept.
- Chưa có thanh toán, QR cấu hình, CMS tài trợ, dịch vụ quảng cáo, dữ liệu bóng đá có giấy phép, hệ thống moderation hoặc lịch sự kiện trực tiếp.
- Báo cáo chỉ vào stdout; cần quy trình người kiểm duyệt và nơi nhận bền vững trước khi mở cộng đồng công khai.
- Chưa benchmark vài trăm CCU; 60 FPS là mục tiêu. HUD hiển thị FPS thực của Phaser. Cần đo thiết bị mobile thật, atlas textures, giảm draw calls/particles và thêm quality presets.
- Hiện một process RAM, không scale ngang. Nâng cấp spatial partition, load test, ingress limits, observability và phân phối room trước khi mở tải lớn.
- Không tự động kích hoạt hiệu ứng sau redirect thanh toán. Tích hợp sau này cần webhook đã xác thực, chống replay, idempotency và chỉ server được phát quyền.

Chi tiết kiểm thử thực tế xem `docs/verification.md`.

## Phòng Truyền Thống — Hall of Legends

Từ Hang Quỷ Đỏ, đi đến biển **Phòng Truyền Thống** phía bắc tượng bóng vàng (2048, 1100), nhấn **E**. Bảo tàng có bảy khu nối liền, 68 cúp độc lập (đủ 20 chức vô địch quốc gia), 32 bảng nhiệm kỳ HLV, dòng thời gian và khu chụp ảnh. WASD/phím mũi tên hoặc joystick để đi; E xem hiện vật; Esc đóng. Multiplayer và chat dùng phòng riêng, không có database.

Chạy `npm run validate:museum` và `npx playwright test tests/e2e/museum.spec.ts` để kiểm tra. Xem [hồ sơ triển khai, nguồn dữ liệu và giới hạn đồ họa](docs/hall-of-legends.md).

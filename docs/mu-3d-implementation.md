# Hang Quỷ Đỏ và Phòng Hoài Niệm 3D

## A. Repository trước khi sửa

`GameCanvas.tsx` đã khởi tạo React Three Fiber và Rapier. `World3D.tsx` quản lý capsule, input, camera raycast, event bridge và snapshot Socket.IO. `GrandHall.tsx` dựng Đại Sảnh Chung. `Environments.tsx` trước đây dựng nội thất MU mẫu; `worldLayout.ts` chỉ mở `plaza` và `united`, lọc bỏ cổng `hall-entry`.

Backend đã hỗ trợ room `hall-of-legends`, kiểm tra khoảng cách tới cổng và trả người chơi về tọa độ hành lang. Bộ dữ liệu bảo tàng có 68 cúp, 32 giai đoạn HLV, 8 giai đoạn lịch sử và 3 trận tiêu biểu. Không cần thay Auth, Supabase, wallet, ledger hoặc handler server để mở thêm scene.

## B. Cấu trúc thực hiện

- `plaza` → `GrandHall`: giữ thế giới và chín cổng hiện có.
- `united` → `RedDevilsCave`: sảnh trú ẩn, bảng trận minh họa, trident, đá đỏ, tinh thể, lounge có TV/sofa/bàn và fan ngồi than thở; quầy cà khịa; cổng ra riêng.
- `hall-of-legends` → `RedDevilsMuseum`: phòng kín riêng, hành lang trung tâm, 68 cúp trên bục có biển mùa giải; nhiều hình cup/shield/globe/spire; gallery HLV, timeline, tượng Sir Alex, 11 bust huyền thoại và kiosk tư liệu.

Lối bảo tàng là một hành lang hẹp có hai vách đá đục và trần, kết thúc bằng cổng sáng. Nội thất bảo tàng chỉ được mount sau chuyển room. Các trigger là Rapier sensor; character controller loại sensor khỏi phép quét collision. E/nút Tương tác dùng được khi ở gần cổng hoặc hiện vật. Server vẫn xác minh vị trí và room.

Collider nội thất lấy footprint từ `RED_CAVE.obstacles` / `hallObstacles`; chúng cũng được validator server sử dụng. Thêm footprint cho bàn lounge, lưng sofa, vách hành lang, cột, kiosk, bust và trụ cổng. Mesh tường, sàn, trần, bục, furniture và cúp có chiều sâu. CanvasTexture chỉ dùng cho chữ/biển nhỏ; không dùng ảnh reference làm thế giới.

## C. File tạo / sửa

Tạo:

- `apps/web/src/game/three/IndoorKit.tsx`: sàn instancing, tường, trần, môi trường ánh sáng, plaque, banner, doorway, bộ collider.
- `apps/web/src/game/three/RedDevilsCave.tsx`: nội thất hang MU.
- `apps/web/src/game/three/RedDevilsMuseum.tsx`: nội thất bảo tàng và hotspot.
- `apps/web/src/ui/red-cave-3d.css`: HUD tông đỏ/vàng, chỉ dẫn và nút nhảy.
- `packages/shared/museum/legends.ts`: 11 huyền thoại, thông tin, tọa độ và nguồn.

Sửa:

- `Environments.tsx`, `World3D.tsx`, `worldLayout.ts`: ba scene, trigger, camera trong phòng, lọc sensor, nhảy, phím B/P/K.
- `App.tsx`, `Minimap.tsx`, `CaveMinimap.tsx`, `MuseumMinimap.tsx`, `MuseumHUD.tsx`: modal theo khoảng cách, bản đồ đúng từng phòng, breadcrumb và chỉ dẫn.
- `packages/shared/cave.ts`, `world.ts`, `museum/index.ts`, `museumLayout.json`: footprint, portal, exhibit và spawn an toàn.
- `tests/world3d.test.ts`, `tests/museum.test.ts`, `tests/e2e/world3d.spec.ts`: hồi quy dữ liệu và đi bộ qua scene.

## D. Điều khiển / hành vi

WASD hoặc phím mũi tên di chuyển theo camera; Shift chạy; Space hoặc nút Nhảy để nhảy. Joystick hỗ trợ mobile; giữ nút Chạy đi tiến nhanh. Kéo/vuốt xoay camera 360°, cuộn để zoom, R đặt camera về hướng nhân vật. Enter chat; B biểu cảm; P chụp PNG; K quầy cà khịa; E đọc/tương tác; Esc đóng modal. Mở modal hoặc đang nhập chat chặn di chuyển và nhảy. Mất focus xóa input.

Đi vòng qua bục giữa sảnh để đến hành lang phía sau. Đi vào vùng cổng hoặc nhấn E để vào Phòng Hoài Niệm. Bảo tàng có cổng về hang ở phía nam; trong hang cổng phía nam đưa về Đại Sảnh Chung. Có cooldown chống chuyển phòng lặp khi vừa xuất hiện.

Bấm/hover hiện vật trong 3D; bấm từ xa sẽ nhắc đến gần. Khi đứng gần, bấm hoặc E mở modal có mô tả và đường dẫn nguồn. Dữ liệu HLV đánh dấu **Michael Carrick — hiện tại**, Ruben Amorim đã kết thúc nhiệm kỳ. Danh hiệu Anh là **7 First Division + 13 Premier League = 20**, không cộng thành 33. Tổng 68 có cả Intercontinental Cup và các Community Shield đồng vô địch.

## E. Chạy và kiểm tra

```bash
npm ci
npm run dev
# http://localhost:5173/playtest

npm test
npm run test:e2e
npm run build
npm run validate:museum
```

`/playtest` khám phá được offline. `/` giữ luồng đăng nhập Supabase. Bộ Playwright tự chạy Auth fixture, server và build riêng; không dùng database production.

Checklist manual:

1. Đi bộ từ Đại Sảnh qua cổng MU. Xác nhận scene đổi, profile/chat/HUD còn hoạt động.
2. Đi thẳng vào bục giữa: capsule dừng. Đi vòng hai phía, thử bàn lounge, lưng sofa, vách hành lang và cột.
3. Vào Góc Tâm Sự; ngồi/đứng bằng E, chat, biểu cảm, chụp PNG. Bảng trận ghi rõ minh họa.
4. Đi vào hành lang: hai vách che nội thất; qua cổng mới thấy phòng bảo tàng riêng.
5. Đi quanh các cúp; nhìn mặt bên và mặt sau bục; xem giao nhau vật thể/che khuất/ánh sáng thay đổi khi xoay camera.
6. Đến gần cúp, HLV, timeline, bust hoặc kiosk: E/click mở thông tin. Mở modal rồi giữ WASD: nhân vật đứng yên.
7. Kéo 360°, zoom sát/xa, ép camera vào tường và cột; camera rút về phía nhân vật.
8. Nhảy, chờ tiếp đất; về hang rồi về Đại Sảnh. Không bị bật qua cổng liên tục sau chuyển phòng.
9. Viewport 390×844: joystick, vuốt xoay, nút nhảy/chạy, bản đồ theo đúng room, không có cuộn ngang.

## Giới hạn có chủ đích

Mô hình procedural và bust cách điệu; chưa phải asset/portrait chất lượng cinematic của concept. Không phát video hoặc nạp thư viện ảnh có bản quyền: kiosk có thông tin và placeholder rõ ràng. Kết quả MU 0–3 là ví dụ, không phải dữ liệu trận mới nhất trực tiếp. Camera raycast chạy client. Nhảy có physics cục bộ; server/remote vẫn dùng cao độ mặt sàn được xác minh, chưa đồng bộ hoạt ảnh nhảy. Collider đồ nội thất được kiểm tra chung trên mặt phẳng; không hỗ trợ nhảy vượt qua tủ/bục. Chưa benchmark điện thoại thật hoặc OAuth/thanh toán production.

Nguồn: [Manchester United Trophy Room](https://www.manutd.com/en/club/history/trophy-room), [Michael Carrick](https://www.manutd.com/en/man-utd-head-coach-and-staff/michael-carrick), [Legends](https://www.manutd.com/en/players-and-staff/legends), [Rapier/R3F API](https://pmndrs.github.io/react-three-rapier/index.html).

## Kết quả xác minh

- `npm test`: 25/25 kiểm tra dữ liệu, đường đi, collider footprint, server, token, RLS và giao dịch trên fixture qua.
- `npm run validate:museum`: 68 cúp, 20 danh hiệu quốc gia, 32 giai đoạn HLV, 124 exhibit hợp lệ.
- `npm run build`: frontend và server qua; Vite vẫn cảnh báo chunk Rapier khoảng 2,26 MB trước gzip.
- E2E online chuyên cho MU đã đi bộ trọn vòng Đại Sảnh → Hang MU → Phòng Hoài Niệm → Hang MU → Đại Sảnh. Kiểm tra va chạm bục/cúp, jump, modal khóa di chuyển, E đọc cúp/HLV/huyền thoại/kiosk/timeline, orbit >2π, camera gặp tường rút vào; không teleport nhân vật trong test.
- E2E mobile/offline 390×844 đã vào cả hai nội thất bằng đường đi thật, dùng joystick, kéo camera, nút Nhảy, minimap riêng và kiểm tra không cuộn ngang. Đây là Chromium emulation, chưa phải điện thoại thật.
- Sửa hai lỗi tìm được bằng trình duyệt: sensor cần cờ `EXCLUDE_SENSORS` trên character controller; controller của scene cũ phải ngừng cập nhật ngay khi map thay đổi để tránh ghi đè vị trí xuất hiện của scene mới.
- Chạy toàn bộ `npm run test:e2e` sau tích hợp: **7/7 qua** trong 4,3 phút, gồm hồi quy chín cổng/ba tầng, cầu, minigame, ảnh chụp, chất lượng đồ họa, mobile, chat/multiplayer, đăng nhập/ví trên fixture và hai kịch bản MU mới.

Ảnh trình duyệt: [Sảnh trú ẩn](mu-3d-refuge.png) · [Góc tâm sự](mu-3d-lounge.png) · [Phòng Hoài Niệm](mu-3d-museum.png) · [Thông tin HLV](mu-3d-manager.png) · [Hang trên mobile](mu-3d-cave-mobile.png) · [Bảo tàng trên mobile](mu-3d-museum-mobile.png).

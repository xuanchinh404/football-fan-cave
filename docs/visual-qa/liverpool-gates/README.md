# Đại Sảnh Chung ↔ Hang Liverpool

Trước đây có hai cửa ở hai scene. Ngưỡng cửa phát yêu cầu đi qua, máy chủ trả về `joined`, rồi client gọi `travel`. Client thay nội thất, đặt lại vị trí capsule, xoá vận tốc và đặt lại góc camera. Nhánh ngoại tuyến gọi `travel` trực tiếp.

## World và các vùng

Đại Sảnh, cổng, đường hầm The Kop và Sảnh Trú Ẩn cùng nằm trong một world Three.js và Rapier. Cửa ở vị trí `(-15, 7, -29.7)` theo mét. Sảnh nghỉ nối với mặt sân tầng hai ở cao độ 7 m. Đường hầm dài khoảng 19 m, có 32 bậc dẫn xuống 8 m. Rapier dùng collider dốc liên tục bên dưới mặt bậc để capsule và camera không nảy qua từng bậc. Sàn, trần, tường, vòm và ánh sáng đều là hình học và đèn 3D. Mesh chính của Sảnh Trú Ẩn được tải khi mở world.

Đi qua ngưỡng chỉ cập nhật vùng của HUD, minimap và chat. Character controller, avatar, trạng thái di chuyển, camera và kết nối Socket.IO tiếp tục chạy. Hai vùng gửi tọa độ di chuyển chung và dùng cùng một instance Socket.IO. Avatar hai bên cửa dùng cùng hệ tọa độ để nội suy vị trí. Máy chủ xác định vùng từ đường đi đã kiểm tra và lọc chat theo vùng.

Cửa đôi dùng bản lề và collider Rapier xoay theo từng cánh. Người chơi ở trong khoảng 3,9 m từ hai phía kích hoạt mở cửa trong 1,35 giây. Khi vùng trống 2,5 giây, cửa bắt đầu đóng. Nếu có người quay lại, cửa đảo chiều từ góc hiện tại. Máy chủ phát cùng lịch mở và đóng cho cả instance. Chế độ ngoại tuyến dùng chung máy trạng thái. Âm bản lề dùng Web Audio.

Cơ chế cửa có cấu hình vị trí, góc, màu và tên đội. Luồng liền mạch hiện áp dụng cho Đại Sảnh ↔ Hang Liverpool. Phòng Truyền Thống Liverpool và tám hang khác dùng cơ chế di chuyển riêng hiện có.

## File thay đổi

| Phần | File |
| --- | --- |
| Tọa độ chung, mặt bằng, cao độ, vùng và trạng thái cửa | `packages/shared/grandHall.ts`, `packages/shared/world.ts`, `packages/shared/caveGates.ts`, `packages/shared/liverpool/layout.ts`, `packages/shared/liverpool/connection.ts` |
| Đồng bộ di chuyển, cửa, avatar và chat | `apps/server/src/index.ts` |
| World, controller, camera, ánh xạ tọa độ và cửa | `apps/web/src/game/three/World3D.tsx`, `worldLayout.ts`, `Environments.tsx`, `GrandHall.tsx`, `CaveGate.tsx` |
| Tải nội thất, đường hầm và ánh sáng | `apps/web/src/game/three/BlenderAsset.tsx`, `liverpool/LiverpoolCaveScene.tsx`, `liverpool/LiverpoolKit.tsx`, `liverpool/LiverpoolTunnel.tsx` |
| HUD và hướng dẫn | `apps/web/src/App.tsx`, `apps/web/src/game/bridge.ts`, `apps/web/src/game/three/playtest.css` |
| Kiểm thử | `tests/liverpool.test.ts`, `tests/world.test.ts`, `tests/world3d.test.ts`, `tests/helpers/world3d.ts`, `tests/e2e/liverpool.spec.ts`, `tests/e2e/world3d.spec.ts` |

Các ảnh PNG trong thư mục này ghi lại cơ chế cổng cũ.

## Kiểm thử

- `npm run build` thành công cho web và server. Vite báo cảnh báo kích thước chunk.
- `npm test` qua 36 bài.
- Lượt desktop kiểm tra hai lần đổi vùng, một phiên Socket.IO và một controller xuyên suốt. Bài kiểm thử cũng xác nhận không có lệnh sửa vị trí, màn hình tải trong hành trình, hoặc đặt lại góc camera khi đi qua cửa.
- Kiểm thử Chromium 390×844 đã đi khứ hồi qua cửa bằng joystick cảm ứng. Hai máy khách Chromium đi ngược chiều qua cùng một cửa, thấy trạng thái cửa đồng bộ và giữ phiên kết nối khi đổi vùng.
- Bài camera kiểm tra giới hạn tay đòn dưới trần hầm, dưới vòm sảnh và trên sàn, cũng như xoay đủ 360° trong hang.
- Bài hồi quy Đại Sảnh đã đi lên Bayern và PSG, qua các sân trước Real Madrid và Barcelona, rồi kiểm tra luồng vào và ra Hang Quỷ Đỏ.
- [Video Đại Sảnh ↔ Hang Liverpool](liverpool-round-trip.mp4) dài 40 giây. Tệp bắt đầu sau lúc tải trang, rồi giữ nguyên một lượt chạy. Video Playwright ghi hình và không có rãnh âm thanh.

# Chín hang nối với Đại Sảnh Chung

Tám cổng còn lại dùng cơ chế cửa vật lý đã kiểm thử ở Liverpool. Đại Sảnh, cửa, đường hầm và sảnh trú ẩn nằm trong cùng world Three.js/Rapier. Cửa giữ nguyên cao độ từng tầng. Sáu tuyến mới tầng hai đi qua các đoạn dốc dưới sân, còn tuyến Bayern và PSG nối tiếp sân tầng ba.

- MU, Arsenal và Chelsea giữ các sảnh đã có. Phần vách ở lối ra nối trực tiếp với đường hầm mới. Phòng Truyền Thống vẫn dùng lối riêng ở cuối sảnh.
- Bayern, PSG, Real Madrid và Barcelona có sảnh trú ẩn mới, với bảng tên, cờ và bảng màu theo đội. Đường hầm Manchester City nối thẳng tới sảnh Blue Moon và hành lang Phòng Truyền Thống cùng world.
- Cửa đôi tự mở trong khoảng 3,9 m. Collider xoay cùng cánh cửa. Cửa giữ mở khi có người trong vùng và bắt đầu đóng sau 2,5 giây kể từ lúc vùng cửa trống.
- Các hang và Đại Sảnh dùng một hệ tọa độ di chuyển, một controller và cùng instance Socket.IO. Máy chủ xác thực mặt sàn, ngưỡng và trạng thái từng cửa. Chat và minimap cập nhật theo vùng.
- Nội thất chi tiết của MU, Chelsea, Arsenal và Manchester City được tải theo khoảng cách. Các đoạn nối và cửa dùng hình học nhẹ. Liverpool giữ đường hầm và bộ nội thất hiện có.

## File triển khai

| Phần | File |
| --- | --- |
| Tọa độ, mặt bằng, vùng di chuyển, trạng thái và nhận diện cửa | `packages/shared/caveConnections.ts`, `caveGates.ts`, `grandHall.ts`, `world.ts`, `liverpool/connection.ts`, `liverpool/layout.ts` |
| Xác thực di chuyển và đồng bộ nhiều cửa | `apps/server/src/index.ts` |
| World, đường hầm, cửa và sảnh mới | `apps/web/src/game/three/ConnectedCaves.tsx`, `CaveGate.tsx`, `Environments.tsx`, `GrandHall.tsx`, `World3D.tsx`, `worldLayout.ts` |
| Vách lối vào, ánh sáng và collider nội thất | `apps/web/src/game/three/IndoorKit.tsx`, `ChelseaKit.tsx`, `FortressKit.tsx`, `liverpool/LiverpoolKit.tsx`, `city/CityExhibits.tsx` |
| HUD, hướng dẫn và minimap | `apps/web/src/App.tsx`, `apps/web/src/ui/Minimap.tsx` |
| Kiểm thử | `tests/cave-connections.test.ts`, `tests/world3d.test.ts`, `tests/e2e/cave-connections.spec.ts`, `tests/e2e/world3d.spec.ts`, `tests/e2e/arsenal.spec.ts`, `tests/e2e/chelsea.spec.ts`, `package.json` |

## Kiểm thử

- Web và server build thành công. `npm test` qua 45 bài.
- `npx playwright test tests/e2e/cave-connections.spec.ts` kiểm tra lối đi khứ hồi qua từng cổng, cửa đóng lại khi trống, camera, controller và phiên Socket.IO. Bộ kiểm thử cũng có hai máy khách đi ngược chiều qua cửa Arsenal và joystick cảm ứng trên màn hình 390×844.
- Đặt `FFC_CAVE_TOUR` tới thư mục đầu ra để bật bài quay một lượt đi qua tám tuyến mới.

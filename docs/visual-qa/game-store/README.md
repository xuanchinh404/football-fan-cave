# Phố Cửa Hàng · Hội Vào Hang

## Giai đoạn 1 · Cửa hàng, túi đồ và ví

- `packages/shared/store/products.ts` giữ nguyên 100 SKU có giá trong yêu cầu, gồm 71 món Xu và 29 món KC. `catalog.ts` cấu hình 25 quyền lợi miễn phí, 10 nhóm, giới hạn mua, mẫu 3D và thành phần cố định của từng combo.
- `StoreStreet` đặt bốn quầy phía nam Đại Sảnh. `grandHall.ts` chia sẻ vị trí tương tác và vật cản với game server. Người chơi đi bộ tới quầy, nhấn **F** hoặc chạm nút tương tác. Có thể mở toàn bộ danh mục bằng **K**.
- `StorePanel`, `StorePreview`, `StoreHUD` và `useStore` cung cấp giao diện Việt/Anh, tìm kiếm, lọc, xem mẫu 3D, mua, lịch sử ví, túi đồ và năm ô nhanh.
- Migration `20261108094909_game_store.sql` thêm KC vào ví hiện có, ghi đơn và biến động vào lịch sử, khóa ví khi thay đổi dữ liệu và lưu khóa yêu cầu để xử lý lại an toàn. Giá được tra theo SKU trên server.
- Phiên bản này cấp 500 Xu và 100 KC khi khởi tạo cửa hàng cho tài khoản mới hoặc cũ. Ngày đầu cấp cả 19 món cơ bản và 6 quyền lợi tiêu hao hằng ngày. Từ ngày tiếp theo, nút nhận thưởng cấp 100 Xu, 10 KC và lượng tiêu hao theo catalogue. `STORE_TIMEZONE` mặc định là `Asia/Ho_Chi_Minh`. Mua hàng yêu cầu tài khoản đã liên kết theo chính sách ví hiện có.

## Giai đoạn 2 · Cầm và ném

- `apps/server/src/store.ts`, `physics.ts` và `StoreWorldEffects` dùng chung cấu hình quỹ đạo. Máy chủ xác nhận món đang cầm, trừ một đơn vị, tính điểm va chạm và phát kết quả tới các phiên trong phòng. Bia tập nằm trong Đấu Trường Cà Khịa.
- Chọn ô bằng **1–5** hoặc chạm vào thanh ô nhanh. Kéo camera để ngắm, nhấn **Q** hoặc chạm **Ném**. Máy chủ chỉ ghi nhận va chạm avatar trong đấu trường khi cả hai người đã bật tham gia. Người chơi có thể tắt hiệu ứng của người khác trong túi đồ.
- Cà chua chín, cà chua thối, trứng, bóng nước, bánh kem và các đồ ném còn lại dùng model tạm. Khăn giấy, xẻng, gối, cúp và bảng tỷ số dùng model tạm riêng và có thể gửi cho người chơi đang online. Phản ứng khi trúng chỉ thay đổi hình ảnh.

## Giai đoạn 3 · Trang bị và biểu cảm

- `PlayerAvatar3D`, `Models` và `avatarStore` đổi màu các phần áo, quần và giày trên rig hiện có. Phụ kiện gắn theo vị trí xương tay, đầu, cổ hoặc ngực. Xem thử trong bảng cửa hàng dùng avatar riêng. Trang bị thật được đồng bộ trong snapshot multiplayer.
- Các động tác cười, khóc, vẫy, nhảy ăn mừng và trêu dùng clip hiện có. Vung tay ném, ôm đầu, ngồi co gối, khoanh tay, ăn vạ, trượt gối, quỳ lạy và điệu nhảy đặc biệt dùng keyframe tạm. Một số biến thể nâng cao dùng chung clip với bản cơ bản.

## Giai đoạn 4 · Thú cưng, hiệu ứng, quà và nội thất

- Trang bị một thú cưng. Thú cưng chạy theo phía sau, có nhịp idle và không có collider. Hiệu ứng đang trang bị bám avatar hoặc để lại dấu trên đường di chuyển.
- Gửi quà chuyển đúng một món trong cùng giao dịch. Người nhận có thể tắt quà cà khịa. Hiệu ứng quà hiển thị khi cả hai tài khoản cho phép.
- Phòng trang trí là khu 3D riêng trong giao diện. Chạm sàn để di chuyển mẫu, xoay 90°, đặt hoặc thu hồi. Server giới hạn số món, kiểm tra chồng lấn và giữ lối vào thông thoáng.
- Có 95 SKU trả phí được mở bán. Sofa `P073`, bàn `P075` và cúp `P086` tái sử dụng GLB của dự án trong khung xem trước. Các model còn lại đang dùng mesh tạm. `P021`, `P022`, `P043`, `P044` và `P064` hiển thị trong danh mục ở trạng thái chưa mở bán.

## Xác minh và chạy lại

```sh
npm run build
npm test
FFC_TEST_STORE=1 npx playwright test tests/e2e/store.spec.ts
```

Bộ kiểm thử cửa hàng áp dụng migration vào PostgreSQL nhúng PGlite, gọi backend Socket.IO thật và dùng fixture đăng nhập cục bộ. Môi trường Supabase đang phục vụ người chơi cần áp dụng migration này theo quy trình triển khai hiện có.

- Build Vite và TypeScript web/server đạt. Vite báo chunk vật lý vượt ngưỡng cảnh báo 1.600 kB.
- `npm test` đạt 49/49, gồm kiểm tra dữ liệu, quyền gọi RPC, giao dịch lặp, thưởng ngày, hai loại tiền, quà, va chạm và đường đi tới chín sân trước hang.
- Bốn kịch bản Playwright của cửa hàng đã đạt qua các lần chạy. Desktop kiểm tra đi bộ tới quầy trên cùng scene, mua lặp, thiếu tiền, cầm và ném trúng bia, tường và người chơi đồng ý, chuyển quà, đặt và thu hồi đồ, mua áo và lưu trang bị khi kết nối lại. Mobile kiểm tra túi đồ, chuyển ngôn ngữ và lọc KC. Một kịch bản riêng đăng xuất và đăng nhập lại bằng biểu mẫu của game, xác nhận món đã mua và số dư được giữ nguyên. Kịch bản 11 người trong phòng kiểm tra mua KC, gọi và cất thú cưng, phụ kiện, biểu cảm và ghi nhận 49–52 FPS trên máy thử.
- Luồng đi và về liên tục ở PSG và joystick mobile ở Hang Citizens đã qua kiểm thử trình duyệt. Walkthrough Quỷ Đỏ/Phòng Truyền Thống và bước trở ra từ đường hầm Quỷ Đỏ chưa qua kiểm thử trình duyệt. Bài walkthrough tổng hợp chín hang cũng gặp lỗi điều hướng trên bản đối chiếu trước khi nối giao diện cửa hàng.

## Ảnh và video trong game

- [Phố Cửa Hàng nhìn từ Đại Sảnh](01-shop-from-hall.png) · [Quầy Cà Khịa nhìn gần](02-booth.png)
- [Giao diện mua hàng](03-purchase.png) · [Túi đồ](04-inventory.png) · [Avatar cầm cà chua](05-holding-tomato.png)
- [Va chạm trong hai phiên](06-multiplayer-impact.png) · [Phòng trang trí](07-private-room.png) · [Áo đã mặc](08-equipped-jersey.png)
- [Giao diện mobile](09-mobile.png) · [Thú cưng với 10 avatar từ xa](10-pet.png)
- [Video ném vào bia và tường](throw-practice.mp4) · [Video hai góc nhìn multiplayer](throw-multiplayer.mp4) · [Video mua và mặc áo](buy-and-equip-jersey.mp4)

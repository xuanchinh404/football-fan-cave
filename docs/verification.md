# Kết quả xác minh Hang Quỷ Đỏ

Ngày 04/11/2026, macOS / Node.js, Chromium headless. Bản kiểm tra cuối dùng production build qua preview localhost:5175, Socket.IO localhost:3001; tránh trang dev tự tải lại khi repo được cập nhật.

## Kết quả

- `npm run build`: đạt TypeScript cho web/server và Vite production build.
- `npm test`: **10/10 đạt**. Spawn an toàn, kích thước map, vị trí về quảng trường, mọi điểm tương tác có đường đi từ spawn, collision/tunneling, chọn tương tác gần nhất khi các vùng cổng chồng nhau, validation/rate limits và kiểm tra socket thật.
- **7 kịch bản Playwright đạt trên bản cuối**, gồm 4 bài nền tảng trong lần chạy suite và 3 bài hang mở rộng được chạy lại riêng sau các sửa lỗi. Không tuyên bố một lần chạy suite duy nhất đã đạt cả bảy khi các vòng trước có lỗi.

## Những luồng đã kiểm tra

1. Tạo nhân vật; dùng phím đi từ quảng trường tới cổng Quỷ Đỏ, nhấn E để vào hang và xuất hiện đúng spawn.
2. Đi lại và camera theo nhân vật trên bản đồ lớn; minimap cập nhật tọa độ thực.
3. Đi vào collision tượng rồi dừng ở biên; unit test kiểm tra thêm đá, quầy, biên map và đường đi xuyên vật cản.
4. Tương tác tượng bóng vàng, bảng hoạt động và màn hình tỉ số ghi rõ minh họa.
5. Tới khán đài, E ngồi và E đứng dậy; kiểm tra lại thao tác liên tiếp sau khi bỏ phụ thuộc trạng thái HUD trễ.
6. Qua cổng tím; tới góc chụp ảnh, tải PNG; quay lại sảnh bằng cổng phụ.
7. Qua cổng xanh; mở bảng sự kiện từ cấu hình; quay về sảnh.
8. Đi tới Quầy Cà Khịa, mở popup và xem thử mưa cà chua; xác nhận thông báo không phát sinh thanh toán.
9. Tùy chọn giảm hiệu ứng bật/tắt trong hang giữ đúng map.
10. Đi tới lối ra phía nam, về quảng trường tại X 1280 / Y 640 gần cổng Quỷ Đỏ.
11. Hai browser contexts thật vào cùng phòng hang, nhìn thấy nhau, số người trong phòng là 2, chat phòng và chat gần, đồng bộ biểu cảm.
12. Một người ra quảng trường: người còn lại không còn thấy nhân vật đó, số người trong phòng giảm còn 1.
13. Ngắt/kết nối lại từ UI; demo có NPC, phiên live mới được tạo khi nối lại. NPC của hang được gắn nhãn và không tính vào online.
14. Mobile viewport 390 × 844: joystick di chuyển nhân vật trong hang, nút tương tác hiện, bản đồ lớn mở được, xuất ảnh hoạt động, không tràn chiều ngang. Demo offline và hiệu ứng cũng được kiểm tra ở viewport mobile.

Bài khám phá đi bằng bàn phím qua các đường đi thật; không đặt nhân vật sẵn tại đối tượng bằng teleport kiểm thử. Việc qua cổng phụ là tính năng gameplay được scene/server xử lý.

## Ảnh kiểm tra

`red-cave-hall.png`, `red-cave-mobile.png`, `cave.png`, `mobile.png` là ảnh game đang chạy, chỉ dùng cho tài liệu; không được tải làm nền gameplay.

## Các lỗi đã sửa trong vòng kiểm tra

- Nhấn E liên tiếp khi ngồi ở demo dùng trạng thái trực tiếp trong scene.
- Phím E sử dụng tọa độ thực của scene và gửi vị trí mới nhất trước yêu cầu tương tác tới server.
- Các vùng tương tác chồng nhau chọn vật thể gần nhất thay vì thứ tự trong cấu hình.
- Bài kiểm thử đi vòng qua màn hình có collision; nút xem thử được tìm trong đúng dialog, tránh chọn biển hiệu phía sau popup.

## Giới hạn

- Chưa kiểm tra trên điện thoại vật lý, benchmark tải lớn hoặc chứng nhận 60 FPS trên máy yếu. Kiểm tra mobile dùng pointer trong viewport mô phỏng.
- Đồ họa hang phần lớn là vector/gradient, kết hợp nhân vật raster và glow; **chưa đạt chất lượng cinematic của ảnh concept**. Cần bổ sung kit vách đá, sàn, công trình và animation đồng bộ phong cách. Stairs chưa có hệ cao độ vật lý; nước chưa có shader phản xạ.
- Dữ liệu trận đấu là demo; hoạt động từ file cấu hình. Chat toàn cầu chưa triển khai và được đánh dấu rõ trên UI.
- Không có thanh toán, database, kiểm duyệt bền vững, API bóng đá hoặc triển khai VPS/HTTPS trong task này.
- Chưa có kiểm thử toàn tuyến riêng cho các hang đội khác. Chúng tiếp tục dùng engine và nội thất hiện có.

# Hang Quỷ Đỏ

## Chạy và khám phá

Trong thư mục dự án, chạy `npm run dev`, mở http://localhost:5173, chọn **Vào thế giới** và đặt nickname. Đi tới cổng **Hang Quỷ Đỏ** phía bắc quảng trường, nhấn **E**. WASD / mũi tên hoặc joystick điều khiển nhân vật; camera bám theo trên bản đồ 4096 × 3072.

- Sảnh chính: tượng bóng vàng, bảng hoạt động và NPC có nhãn riêng.
- Bên trái: màn hình sân bóng gốc, tỉ số ghi rõ DEMO; sáu ghế có thể ngồi/đứng bằng E. Di chuyển cũng đứng dậy.
- Bên phải: Quầy Cà Khịa, xem thử cà chua, loa, banner và pháo giấy. Hiệu ứng cục bộ, giới hạn tần suất, không thanh toán.
- Phía bắc trái: cổng tím tới khu giải trí, góc chụp ảnh. E tại điểm quay lại đưa về sảnh.
- Phía bắc phải: cổng xanh tới khu sự kiện; bảng hoạt động lấy từ cấu hình. E tại điểm quay lại đưa về sảnh.
- Phía nam: portal quảng trường; trở về tọa độ gần cổng Quỷ Đỏ, không reload trang.
- Cài đặt → Giảm hiệu ứng ánh sáng: giảm hiệu ứng xem thử, ngừng motes, nhấp nháy và chuyển động trang trí trong hang. Cài đặt này hiện áp dụng trong phiên.

## Kiến trúc

`packages/shared/cave.ts` định nghĩa kích thước, biên, collision, khu vực minimap, NPC, ghế và hoạt động. `world.ts` cung cấp tương tác, spawn, kiểm tra đường đi và vị trí trở về dùng chung client/server.

`game/cave/RedDevilsCaveScene.ts` dựng môi trường riêng thông qua vòng đời `WorldScene` hiện có. Không tạo engine, socket hoặc bộ điều khiển nhân vật thứ hai. `CaveAssets.ts` chứa SVG gốc cho từng công trình/đá/cờ/đèn/cổng; tái sử dụng nhân vật raster hiện có. Sàn dùng texture lặp, các props là object độc lập có depth; không sử dụng ảnh concept làm nền toàn cảnh. Phaser cull image theo camera; graphics tĩnh, các glow và particles được giữ thưa.

`ui/CaveMinimap.tsx` dùng đúng kích thước 4096 × 3072, collision và tọa độ khu vực trong cấu hình. Vị trí người chơi được cập nhật từ scene.

Socket room có khóa `cave:red-devils`, instance đầu là `cave:red-devils:0`, tối đa 60 người mỗi instance. Snapshot 10 Hz lọc theo phạm vi 1050 đơn vị. Server kiểm tra tốc độ và đường đi. Cổng phụ giữ nguyên room và được server xác nhận từ khoảng cách tương tác. Ghế có trạng thái đồng bộ qua snapshot. Phím E gửi vị trí mới nhất trước yêu cầu tương tác; các vùng gần nhau chọn đối tượng gần nhất. Chat phòng và chat gần (600 đơn vị) được server định tuyến; chat toàn cầu được đánh dấu chưa triển khai. Tổng online và số người trong phòng do server tính, NPC không được tính vào online. Trạng thái lưu tạm trong RAM.

## Mức độ đồ họa

Bản đồ có thể đi lại và tương tác thực, đủ các khu chức năng. Đồ họa hang hiện chủ yếu là vector có gradient, ánh sáng cộng, hạt sáng và một số nhân vật raster; **chưa đạt độ chi tiết cinematic của ảnh tham chiếu**. Cần bổ sung kit vách đá/roof nhiều góc, atlas nền đá vẽ tay có phản chiếu, cầu thang/cầu gỗ, quầy và khán đài raster cùng phong cách, nhiều khung animation nhân vật. Hiện stairs là nền minh họa có thể đi qua, không có hệ cao độ vật lý. Nước là dải chuyển động và phản chiếu màu, chưa có shader phản xạ.

Không sử dụng logo chính thức, hình cầu thủ hoặc video truyền hình trong phần hang mới. Màn hình sân bóng được vẽ bằng asset gốc. Dữ liệu trận đấu và lịch hoạt động là demo/cấu hình, chưa tích hợp API bóng đá hay dịch vụ sự kiện.

Các ảnh trong `docs/` là ảnh kiểm thử, không được game tải làm background. Xem kết quả xác minh thực tế trong `verification.md`.

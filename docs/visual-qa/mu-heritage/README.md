# Phòng Truyền Thống Manchester United

Phòng `hall-of-legends` trong bản R3F dùng đại sảnh 28 × 24 m, vòm cao khoảng 10,7 m và thảm rộng 6,4 m. Người chơi vào từ phía nam, nhìn về dãy cúp và chân dung. Tượng Sir Alex ở bên trái. Bảng lịch sử với bốn ảnh tư liệu ở tường bên phải.

## Hiện vật và dữ liệu

| Tủ trưng bày | Số danh hiệu |
| --- | --- |
| Vô địch quốc gia Anh | 20 |
| FA Cup | 13 |
| League Cup | 6 |
| European Cup / Champions League | 3 |
| UEFA Europa League | 1 |
| UEFA Cup Winners’ Cup | 1 |
| UEFA Super Cup | 1 |
| FIFA Club World Cup | 1 |
| Community Shield | 21 |

Mỗi tủ chứa một mô hình đại diện và mở danh sách các mùa vô địch. Tủ vô địch Anh gộp 7 First Division và 13 Premier League. Intercontinental Cup được lưu trong kho tư liệu bên cửa ra. Cơ sở dữ liệu giữ đủ 68 danh hiệu và 32 hồ sơ HLV. Tám HLV tiêu biểu xuất hiện trên tường theo thứ tự thời gian. Tất cả hồ sơ HLV có thể mở từ danh mục bên cửa ra. [Bảng danh hiệu của CLB](https://www.manutd.com/en/club/history/trophy-room) · [Danh sách HLV chính thức sau chiến tranh](https://www.manutd.com/en/news/uniteds-permanent-post-war-bosses-in-full) · [Hợp đồng của Michael Carrick](https://www.manutd.com/en/news/michael-carrick-continues-as-man-united-head-coach-2026)

Nhãn chính của phòng, hiện vật và bảng thông tin có bản tiếng Việt và tiếng Anh theo ngôn ngữ tài liệu. Bảng lịch sử dùng bốn ảnh lưu cục bộ và hiện thông tin ghi công. [Nguồn và giấy phép ảnh](../../../apps/web/public/art/mu-history/credits.md)

## Thay đổi triển khai

- `RedDevilsMuseum.tsx` thay dãy bệ theo từng mùa, bệ HLV, bục lịch sử, dãy tượng cầu thủ và các cột giữa sàn bằng kiến trúc vòm và các khu trưng bày sát tường. Các hồ sơ và trận đấu được chuyển vào giao diện tra cứu.
- `packages/shared/museum/hall.ts`, `museumLayout.json`, `museum/index.ts`, `world.ts` và `worldLayout.ts` cập nhật mặt bằng, điểm tiếp cận và vật cản dùng chung giữa client và server. Sàn có hai cụm vật cản hiện vật, gồm dãy tủ và bệ tượng.
- `World3D.tsx`, `App.tsx`, `RedDevilsCave.tsx`, `MuseumHUD.tsx`, `MuseumMinimap.tsx`, `RedDevilsExhibitPanel.tsx` và `museum.css` nối phím F, thao tác chạm, bảng thông tin, nhãn và sơ đồ mới. Cổng về hang vẫn dùng luồng di chuyển hiện có.
- `ManagerPortraitBoard.tsx` hỗ trợ đường dẫn ảnh riêng theo từng khung. Phòng MU tái sử dụng bảng chân dung và tám GLB cúp có sẵn. Tượng Sir Alex và Cup Winners’ Cup dùng mesh nháp. Chân dung MU dùng atlas minh họa hiện có.
- `tests/museum.test.ts` và bài MU trong `tests/e2e/world3d.spec.ts` kiểm tra lối đi, điểm tương tác và hành trình thực tế.

## Ảnh chạy thật

- [Từ cửa vào](01-entrance.png)
- [Dãy cúp và chân dung](02-trophy-wall.png)
- [Khu tượng Sir Alex](03-ferguson-statue.png)
- [Tường lịch sử](04-history-wall.png)
- [Cửa vào trên mobile](05-mobile-entrance.png)
- [Bảng thông tin cúp trên mobile](06-mobile-exhibit.png)
- [Video tham quan, 29 giây](walkthrough.mp4)

## Kiểm thử

- `npm run build` hoàn tất cho web và server. Vite báo cảnh báo kích thước chunk.
- `npm test` đạt 36/36. `npm run validate:museum` xác nhận 68 danh hiệu, 32 hồ sơ HLV và 124 hồ sơ hiện vật.
- Playwright desktop đi qua Hang MU vào sảnh, chạy thẳng trên thảm, mở cả chín tủ bằng phím F, bấm vào chân dung Carrick, mở tượng và bốn mốc lịch sử. Bài kiểm tra cũng xoay camera hơn 360°, giữ góc nhìn dọc, thử va chạm với tủ, bệ và tường, rồi quay về Hang MU.
- Playwright mobile mô phỏng Chromium 390 × 844, kiểm tra joystick bằng sự kiện chạm, nút nhảy, xoay camera, mở tủ bằng nút tương tác và quay về Hang MU.
- Kiểm tra Liverpool qua tuyến đi thẳng đã vào bảo tàng, mở League Cup và quay về Hang Liverpool. Bài mobile Liverpool cũng đã mở League Cup và quay về Hang Liverpool, sau đó hết thời gian ở đoạn trở ra quảng trường. Bài Liverpool desktop đầy đủ hết thời gian ở lounge trước khi vào bảo tàng. Các đoạn đường đó nằm ngoài thay đổi của phòng MU.

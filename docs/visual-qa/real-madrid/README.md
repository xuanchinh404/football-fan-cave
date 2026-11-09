# Hang Real Madrid

## Thiết kế và tích hợp

- Cổng ở cao độ 7 m của Đại Sảnh. Hai cánh cửa dùng collider bản lề của Rapier và thời gian đóng mở chung qua Socket.IO. Đường hầm đưa người chơi xuống sảnh ở cao độ −47 m, bên dưới các phòng liền kề.
- Sảnh rộng 32 × 30 m, cao 12 m. Lounge nằm bên trái, cầu thang cẩm thạch nằm giữa và hành lang rộng 6 m dẫn tới bảo tàng bên phải. Bảo tàng rộng 30 m theo mặt trưng bày, sâu 24 m và cao 11 m. Dãy cúp đặt sát cuối phòng. Cùng đường hầm đó dẫn về Đại Sảnh.
- Điều khiển, camera, avatar và phiên Socket.IO tiếp tục trong cùng thế giới. Sảnh và bảo tàng chung khu chat Real Madrid. Bốn vị trí sofa có animation ngồi và kiểm tra ghế đang có người trên máy chủ.
- HUD có minimap theo tọa độ nhân vật, menu Việt–Anh, tương tác bàn phím và nút cảm ứng. Các thao tác chat, biểu cảm, chụp ảnh và cửa hàng dùng cơ chế có sẵn của game.

## Dữ liệu và tài sản

- 48 HLV và 64 nhiệm kỳ đội một trong danh mục có phiên bản trong mã nguồn. Bản tiếng Tây Ban Nha bắt đầu năm 1927 và ghi nhận đủ các nhiệm kỳ đã nhập. Danh mục giữ nguyên thứ tự và phạm vi năm hiển thị của nguồn, kể cả nhiệm kỳ ngắn và lặp lại. Các mốc trước năm 1927 nằm ngoài danh mục này. [Lịch sử HLV tiếng Tây Ban Nha](https://www.realmadrid.com/es-ES/el-club/historia/futbol/primer-equipo-masculino/entrenadores)
- Đối chiếu ngày 09/11/2026. Bản tiếng Anh vẫn hiển thị Arbeloa ở đầu trang. Bản tiếng Tây Ban Nha, thông báo tháng 6 và hồ sơ đội một đều xác nhận Mourinho là HLV hiện tại. [Bản tiếng Anh](https://www.realmadrid.com/en-US/the-club/history/football/first-team/coaches) · [Thông báo bổ nhiệm](https://www.realmadrid.com/en-US/news/club/latest-news/comunicado-oficial-mourinho-11-06-2026) · [Hồ sơ Mourinho](https://www.realmadrid.com/en-US/football/first-team/players/jose-mourinho)
- Hồ sơ có năm cho mọi nhiệm kỳ và ngày chính xác khi có nguồn đối chiếu. Sáu HLV có ảnh, các mục còn lại có khung tên. Tiểu sử và thành tích chi tiết có ở các hồ sơ đã bổ sung nguồn.
- 14 hạng mục danh hiệu, trong đó bảy loại có mô hình cúp đặt trong phòng. Tổng số của từng hạng mục lấy từ danh sách mùa giải trong nguồn. Có chín trận lịch sử, tám mốc, 12 hồ sơ huyền thoại và bốn ảnh lưu trữ. [Danh hiệu](https://www.realmadrid.com/en-US/the-club/track-record/football) · [Lịch sử CLB](https://www.realmadrid.com/en-US/the-club/history/football/first-team) · [Ảnh và giấy phép](../../../apps/web/public/art/real/credits.html)
- Kiến trúc, áo trưng bày, huy hiệu RM cách điệu, sư tử, cúp và tượng Carlo đều là mesh dựng bằng Three.js. Tượng Carlo là mẫu 3D sơ bộ. Avatar dùng rig chibi-fan-07-rigged.glb của game.
- Bảng kết quả hiển thị trạng thái chờ dữ liệu vì chưa có feed kết quả đội một Real Madrid đã tích hợp.

## Mã nguồn

- packages/shared/real/ chứa bố cục, tập dữ liệu nguồn và nội dung song ngữ. caveConnections.ts và world.ts dùng bố cục chung để kiểm tra đường đi và tương tác.
- apps/web/src/game/three/real/ chứa RealCaveScene và bộ mesh kiến trúc. Environments, ConnectedCaves, CaveGate, GrandHall, worldLayout và World3D nối hang vào thế giới và bộ điều khiển hiện có.
- RealMadrid.tsx, real-madrid.css và App.tsx cung cấp HUD, sơ đồ và trình duyệt nội dung. apps/server/src/index.ts xử lý ghế và trạng thái ngồi realtime.
- tests/real-madrid.test.ts kiểm tra nguồn, ID, thứ tự, bộ lọc, HLV hiện tại và đường đi. tests/e2e/real-madrid.spec.ts chạy hành trình và tương tác trong Chromium.

## Kiểm thử và tư liệu trong game

- Build Vite và typecheck cho web và server đã qua. Vite báo kích thước chunk Rapier đã có trong game.
- Bộ kiểm thử tự động chạy 57 bài. Ba lượt Chromium của Real Madrid kiểm tra hành trình khứ hồi, cầu thang, ngồi/đứng, tương tác bảo tàng, năm thời kỳ HLV, hai phiên Socket.IO và joystick cảm ứng. Kiểm tra hồi quy hai tuyến liền kề Arsenal và Quỷ Đỏ đã qua. Kiểm tra đường đi phía máy chủ bao phủ cả chín cổng.
- [Sảnh từ cửa vào](01-san-tru-an.png) · [Góc Tâm Sự](02-goc-tam-su.png) · [Bảo tàng từ cửa vào](03-phong-truyen-thong.png) · [Dãy cúp](04-day-cup.png)
- [HLV giai đoạn 2020–nay](05-hlv-hien-dai.png) · [HLV trước 1950](06-hlv-giai-doan-dau.png) · [Hồ sơ Carlo Ancelotti](07-ho-so-ancelotti.png)
- [Video hành trình khứ hồi](hanh-trinh.mp4) ghi trực tiếp từ Chromium, dài khoảng 76 giây.

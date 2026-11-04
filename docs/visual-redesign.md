# Visual redesign — 04/11/2026

Image A thiếu vật liệu, bố cục theo chiều sâu, scale nhân vật và cấp bậc HUD. Bản redesign thay bộ asset nền tảng, không chỉ chỉnh màu.

## Đã thay đổi

- Kit 22 texture WebP gốc: cổng hang phát sáng có đá/hoa/đèn chi tiết, thác nước và núi xa, cây 3D stylized, quầy mái ngói, đài bóng vàng, cầu và fan chibi.
- Quảng trường dựng từ nền cỏ, lát đá mask, đường/cầu thang tới cổng, đạo cụ riêng, đảo hoa, suối/cá, đèn và các lớp tiền/trung/hậu cảnh.
- Hang Quỷ Đỏ có cổng lớn nhất, biển tên và huy hiệu được render bằng text thật, không baked vào hình. Các hang còn lại có palette và vortex riêng.
- Camera framing theo cả chiều rộng và chiều cao viewport; nhân vật chính lớn hơn NPC, có view trước/sau tùy hướng di chuyển và vòng chỉ báo dưới chân.
- NPC sân khấu tồn tại độc lập với người chơi live, đều ghi nhãn NPC và không cộng vào số online. Demo offline vẫn có NPC bổ sung.
- HUD dark glossy đỏ/vàng: logo lửa, nav đỏ, nút ủng hộ vàng, chat sáng/chữ lớn hơn, minimap tròn có glow/icon và mũi tên theo hướng nhân vật, action buttons tròn, menu gỗ và nút giữ để tiến lên.
- Input từ nút di chuyển mới dùng cùng luồng joystick/tốc độ/validation hiện có. Không bổ sung boost hoặc teleport cục bộ.
- Asset gốc và prompts: xem `assets/README.md` và `assets/source/prompts.json`.

## Bám theo Image B và giới hạn

Màu sắc, chất lượng vật liệu của portal/cây/công trình, motif đèn lồng–thác nước, bảng gỗ, đài bóng và HUD được đưa gần phong cách ảnh mục tiêu hơn. Cổng, sprite, giao diện, đường đi và nhân vật là các lớp riêng của game đang chạy.

Game vẫn dùng thế giới tọa độ 2D với sprite prerender 2.5D. Chưa có địa hình 3D với cao độ vật lý, animation skeletal hoặc sprite sheet walking đầy đủ. Chuyển động hiện gồm đổi view trước/sau, bobbing, hướng nhìn và shadow. Việc đạt cùng độ sâu phối cảnh như một cảnh 3D hoàn chỉnh cần terrain và bộ animation/lighting chuyên biệt.

Không thay số online bằng số giả, không đưa logo câu lạc bộ trong ảnh tham chiếu vào game. Thông tin trận đấu tiếp tục được gắn nhãn minh họa.

## Kiểm thử bản redesign

- TypeScript web/server và Vite production build thành công.
- 10 kiểm tra logic/server qua: bản đồ, spawn/cổng, collision, giới hạn tốc độ, xác thực dữ liệu, chat và reconnect.
- Đã xác minh 7 kịch bản Playwright qua các vòng chạy: luồng quảng trường và vào/ra hang; hai phiên chat realtime; mobile/offline/joystick/effect; reconnect; khám phá nội thất và tương tác; hai người trong hang với chat gần/emoji/leave room; mobile hang, minimap và xuất ảnh.
- Các bài dài được xác minh trên preview production ở cổng 5175 để tránh live reload của repository đang được cập nhật. Chromium đầy đủ dùng Metal trên macOS; đây là kiểm tra chức năng, không phải benchmark trên thiết bị người dùng.
- Ảnh `redesign-desktop.png` và `redesign-mobile.png` là ảnh chụp demo đang chạy, không phải asset nền. NPC được ghi nhãn, số online không giả lập.
- Chưa thử điện thoại vật lý, chưa xác nhận mục tiêu 60 FPS hoặc tải lớn. Game dùng sprite 2.5D và animation đơn giản, còn có thể nâng cấp texture atlas, walking frames và lighting/terrain để tiến gần concept 3D hơn.

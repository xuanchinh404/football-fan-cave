# Tài nguyên đồ họa

## Bộ raster hiện có

`apps/web/public/art/` chứa các props độc lập và nhân vật của dự án; file nguồn nằm trong `assets/source/`. Metadata `assets/source/prompts.json` ghi bộ nguồn được tạo bằng image_gen ngày 04/11/2026. `scripts/prepare-art.mjs` tách atlas và xuất WebP có alpha. Giữ các file nguồn và hồ sơ nguồn gốc khi thay hoặc phân phối bộ art.

## Bộ Hang Quỷ Đỏ

`apps/web/src/game/cave/CaveAssets.ts` chứa artwork SVG gốc được viết cho bản đồ: đá đỏ, tinh thể, cờ đinh ba chung, đèn, biển hiệu, cổng, quầy, màn hình sân bóng demo, ghế, bảng hoạt động và tượng bóng vàng. Mỗi asset được raster hóa thành texture riêng của Phaser. Sàn, hoa, bậc thang, ánh sáng và particles được tạo bằng code trong `RedDevilsCaveScene.ts`. Hang sử dụng lại nhân vật và cây từ bộ raster hiện có.

Không sao chép pixel từ ảnh tham chiếu vào bản đồ. Không có logo câu lạc bộ, ảnh cầu thủ hoặc hình truyền hình trong các asset mới. Màn hình bóng đá là sân và nhân vật hình học gốc, có chữ DEMO. Đinh ba là ký hiệu chung tự thiết kế.

Lucide icons dùng theo ISC; Phaser và React theo MIT; Be Vietnam Pro từ Google Fonts theo OFL, có system fallback khi offline. Emoji do font hệ điều hành render.

## Phần art cần bổ sung

Hang hiện kết hợp vector với nhân vật raster, chưa đạt độ chi tiết cinematic của concept. Các hạng mục tiếp theo: bộ vách đá/roof nhiều góc, atlas nền đá vẽ tay, props quầy/khán đài/cầu gỗ đồng bộ phong cách, shader nước/phản xạ và animation sprite nhiều khung. Có thể thay từng texture độc lập, giữ nguyên tọa độ gameplay và collision dùng chung với server.

## Bộ Phòng Truyền Thống

`assets/source/museum-ferguson-bust.png` và bản runtime `apps/web/public/art/museum-ferguson-bust.png` là tượng đồng tạo riêng bằng image_gen ngày 04/11/2026, có alpha thật. Prompt và hồ sơ nguồn gốc nằm trong `assets/source/museum-art.json`. Đây là sprite độc lập, không phải hình nền bảo tàng; không sao chép tượng tại Old Trafford. Các texture cúp cách điệu, kính, sàn, khung tranh và ánh sáng được dựng trong `HallOfLegendsScene.ts`.

# Bàn giao Hang Arsenal và Phòng Truyền Thống Arsenal

Cập nhật 07/11/2026. Chạy `npm run dev`, mở [bản thử](http://localhost:5173/playtest) và lên tầng hai Đại Sảnh. Cổng Arsenal nằm ở phía tây. Từ điểm xuất hiện trong hang, đi sang phải qua vòm Phòng Truyền Thống và theo hành lang đến cuối đường. Nhấn E hoặc chạm Tương tác khi đứng gần hiện vật. Dùng cổng phía nam bảo tàng để quay về hang và cổng Ra Hang để về Đại Sảnh. [Ảnh gameplay desktop và mobile](visual-qa/arsenal/README.md).

| Hạng mục | Trạng thái | Nội dung |
| --- | --- | --- |
| Hang Arsenal | Gameplay hoàn tất | Cổng vòm, cầu thang sáu bậc, bục pháo, hai pháo cổ trang trí, pha lê ruby, cờ, thảm, sofa và NPC trang trí có nhãn. Bảng Arsenal–Tottenham ghi rõ DEMO. |
| Phòng Truyền Thống | Gameplay hoàn tất | Scene riêng sau hành lang. Sáu nhóm cúp, tám HLV tiêu biểu, chín huyền thoại, mười mốc lịch sử, ba trận đấu, kiosk tư liệu và thống kê. |
| Điều khiển | Đã kiểm tra | Va chạm capsule Rapier, bậc thang có cao độ, tủ cúp cản đường, orbit 360°, camera tránh vật cản, bàn phím, joystick và thao tác chạm. |
| Realtime | Đã kiểm tra với fixture | Hai người chơi nhìn thấy nhau và chat trong đúng room. Tin nhắn đã nhận được giữ trong bộ đệm của phiên khi quay lại phòng. Tên và đội yêu thích theo hồ sơ. |
| Tượng Wenger | Placeholder có nhãn | Bệ, huy hiệu pháo và ánh sáng đã tích hợp. Tượng chân dung đang chờ model có hình dáng và quyền sử dụng phù hợp. |
| Mức độ hoàn thiện mỹ thuật | Một phần so với concept | Bộ props Blender có vật liệu PBR, normal map đá và ánh sáng trong scene. Các tủ, kiosk và cột vẫn cách điệu đơn giản. Thiếu chân dung và ảnh trận đấu được cấp phép, mô hình tượng Wenger và lớp chi tiết vật liệu như concept. |

## File mới và file chỉnh sửa

- Scene và mô hình không gian mới nằm ở `apps/web/src/game/three/ArsenalCave.tsx`, `ArsenalMuseum.tsx`, `FortressKit.tsx` và `MuseumKit.tsx`.
- Dữ liệu và tọa độ nguồn nằm ở `packages/shared/arsenal/content.ts` và `layout.ts`. Cả Rapier lẫn Socket.IO lấy vùng cản từ cùng footprint. Hai room dùng khóa `cave:arsenal` và `museum:arsenal`.
- HUD và panel mới nằm ở `apps/web/src/ui/ArsenalHUD.tsx`, `arsenal-3d.css`, `MuseumExhibitPanel.tsx` và `TeamMinimap.tsx`. Minimap đội dùng chung thay cho `ChelseaMinimap.tsx`.
- `packages/shared/world.ts`, `grandHall.ts`, `apps/server/src/index.ts`, `Environments.tsx`, `GrandHall.tsx`, `World3D.tsx` và `worldLayout.ts` nối trạng thái mở cổng, cảm biến, nạp scene theo phòng và điểm đến có kiểm tra phía server. `App.tsx` và `Minimap.tsx` nối HUD, chat và nội dung theo phòng.
- `RedDevilsMuseum.tsx` và `ChelseaMuseum.tsx` dùng chung `ManagerGallery` với Arsenal. Chelsea và Arsenal còn chia sẻ `TrophyCase`, vỏ hang có vòm, minimap và panel hiện vật. `IndoorKit.tsx` chia sẻ biển, môi trường phản chiếu và collider. Ba đội dùng chung `Exhibit`, bộ điều khiển và hệ thống chuyển phòng.
- Pipeline mới gồm `tools/blender/arsenal.py`, các mục `gunners-*` trong `assets/blender-manifest.json`, GLB trong `apps/web/public/models/blender/` và báo cáo cùng ba preview trong `docs/asset-previews/blender-overhaul/`.
- Kiểm thử mới ở `tests/arsenal.test.ts` và `tests/e2e/arsenal.spec.ts`. `package.json` đưa Arsenal vào lệnh E2E mặc định.

## Asset Blender

13 GLB mới, tổng khoảng 1,19 MB và đều dùng Meshopt. Chạy `npm run blender:assets` với Blender để tái tạo.

- Kiến trúc và nội thất gồm `gunners-arch.glb`, `gunners-masonry.glb`, `gunners-cannon.glb`, `gunners-emblem.glb`, `gunners-sofa.glb`, `gunners-ruby.glb`, `gunners-shirt.glb`.
- Mẫu cúp gồm `gunners-cup-league.glb`, `gunners-cup-fa.glb`, `gunners-cup-league-cup.glb`, `gunners-cup-winners.glb`, `gunners-cup-fairs.glb`, `gunners-cup-shield.glb`.
- Dùng lại đèn hổ phách có bản nhẹ, cụm hoa, bàn fan, vật liệu mặt đá và hệ thống avatar của dự án. Huy hiệu pháo là thiết kế gốc. [Hồ sơ nguồn asset](../apps/web/public/models/blender/LICENSE.md).

## Dữ liệu lịch sử

Thống kê theo từng nhóm cho đội một nam, chốt 07/11/2026. Arsenal có 14 chức vô địch Anh gồm 10 First Division và 4 Premier League, 14 FA Cup, 2 League Cup, 1 European Cup Winners’ Cup, 1 Inter-Cities Fairs Cup và 18 Charity/Community Shield, trong đó kỳ 1991 chia sẻ với Tottenham. Mùa 2025/26 và Shield 2026 được đối chiếu riêng vì phần tổng quan lịch sử của CLB còn dùng số cũ. [Arsenal History](https://www.arsenal.com/history) · [Premier League 2025/26](https://www.premierleague.com/en/news/4662306) · [FA Community Shield 2026](https://www.thefa.com/news/2026/aug/16/fa-community-shield-2026-report-16082026) · [Hồ sơ các kỳ Shield](https://www.rsssf.org/tablese/engsupcuphist.html).

Gallery trưng bày các HLV tiêu biểu. Nhãn HLV hiện tại lấy từ dữ liệu nội dung. Mikel Arteta được Premier League xác nhận gia hạn với Arsenal tháng 10/2026. [Thông báo gia hạn](https://www.premierleague.com/en/news/4729992/mikel-arteta-signs-new-contract-with-arsenal).

## Kiểm thử

- `npm test` đạt 31/31. Kiểm tra Arsenal bao gồm mọi điểm tiếp cận, các cổng, bậc thang và dữ liệu danh hiệu. Các ca server kiểm tra xác thực, giới hạn chuyển động và ví qua fixture.
- `npm run test:e2e` đạt 13/13 trên Chromium với web và backend fixture cục bộ. Ba ca Arsenal kiểm tra lượt đi bộ khứ hồi, mobile giả lập và hai tài khoản realtime. Mười ca hồi quy kiểm tra Đại Sảnh, MU, Chelsea, camera, chat, xác thực và giao diện ví.
- `npm run build` đạt cho web và server. Vite vẫn báo kích thước chunk Rapier khoảng 2,26 MB trước gzip.
- `npm run blender:assets -- --validate` đạt. Từng GLB được kiểm tra container, buffer, Meshopt, hình học và giới hạn kích thước.
- Mobile là giả lập trên Chromium desktop. Chưa đo hiệu năng trên thiết bị thật hoặc kiểm thử Safari/Edge trong lượt này.

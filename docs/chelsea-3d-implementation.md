# Bàn giao Hang The Blues và Phòng Truyền Thống Chelsea

Cập nhật ngày 05/11/2026. Mở `/playtest` bằng `npm run dev` và đi tới cổng Chelsea ở tầng hai Đại Sảnh. Hang và bảo tàng là hai scene 3D trên cùng renderer và cùng bộ điều khiển nhân vật. [Xem bộ ảnh và video ghi trong Chromium](visual-qa/chelsea/README.md).

| Hạng mục | Trạng thái | Nội dung |
| --- | --- | --- |
| Hang The Blues | Chơi được | Sảnh đá sapphire, vòm, cột, đèn vàng, sư tử, bảng tỷ số demo, góc sofa, chỗ ngồi, hành lang bên phải và cổng ra ở phía nam. |
| Phòng Truyền Thống | Chơi được | 12 tủ cúp, 10 cụm hồ sơ HLV với 50 nhiệm kỳ, 9 huyền thoại, tượng tưởng niệm Drogba, 9 mốc lịch sử, hai trận chung kết Champions League và kiosk tư liệu. E hoặc chạm khi đứng gần mở panel, Esc hoặc nút đóng để tiếp tục. |
| Chuyển phòng | Đã kiểm tra | Đại Sảnh → Hang The Blues → hành lang → Phòng Truyền Thống và chiều ngược lại. Đi qua giữa cổng để chuyển phòng. Người chơi trở về phía trước cổng Chelsea tại Đại Sảnh. |
| Va chạm và camera | Đã kiểm tra | Capsule Rapier, bốn bậc thang có cao độ, vách, sofa, bục, tủ kính và vùng kích hoạt dùng chung tọa độ với server. Camera xoay 360°, zoom và thu khoảng cách khi gặp vật cản. Biển trong hành lang đặt dọc vách để giữ góc nhìn theo sau. |
| Realtime | Đã kiểm tra với fixture | Hai tài khoản vào được cả hai phòng, thấy avatar và trao đổi chat cùng phòng. Server cập nhật room membership và số người khi chuyển phòng. Tên và màu áo theo profile, NPC trang trí không tính vào số người. |
| Nội dung trực tiếp và tư liệu | Một phần | Tỷ số Chelsea–Arsenal gắn nhãn DEMO. Kiosk tư liệu có liên kết đọc. Chưa có feed bóng đá, ảnh chân dung hoặc video được cấp phép. Một số mùa cúp và nhiệm kỳ mới có hồ sơ tóm tắt. |
| Đồ họa | Một phần so với concept | Mô hình, ánh sáng và sàn PBR đã tích hợp. Tượng Drogba là minh họa cách điệu, các bục huyền thoại dùng mẫu tượng chung. Ba NPC có động tác tại chỗ. Chưa có đám đông đi lại, chân dung riêng, hiệu ứng phản xạ gương hoặc mức chi tiết vật liệu như concept. |

## File và phần tái sử dụng

- `apps/web/src/game/three/ChelseaCave.tsx`, `ChelseaMuseum.tsx`, `ChelseaKit.tsx` dựng hai scene, tủ, vòm, đá, tinh thể và thảm. `Exhibit.tsx` tách tương tác hiện vật dùng chung với `RedDevilsMuseum.tsx`.
- `Environments.tsx` tải module nội thất theo phòng. `IndoorKit.tsx` dùng lại ánh sáng môi trường, collider nội thất và biển chữ từ MU. `World3D.tsx` giữ capsule, input, orbit, camera collision, sensor, avatar và đồng bộ remote. `AssetModel.tsx` dùng lại bộ tải GLB và bổ sung clip Cry/Facepalm từ rig hiện có.
- `packages/shared/chelsea/layout.ts`, `content.ts`, `packages/shared/world.ts`, `grandHall.ts`, `apps/web/src/game/three/worldLayout.ts` và `apps/server/src/index.ts` nối bố cục, dữ liệu và chuyển phòng. Map `chelsea` vào room `cave:chelsea`, map `chelsea-museum` vào room `museum:chelsea`. Client offline và server dùng chung hàm chọn điểm đến.
- `App.tsx`, `ChelseaHUD.tsx`, `ChelseaMinimap.tsx`, `chelsea-3d.css` và `Minimap.tsx` thêm nội dung Chelsea vào HUD React. Các điều khiển hồ sơ, chat, ví, biểu cảm, chụp ảnh, chặn tin nhắn và báo cáo dùng giao diện chung.
- `tests/chelsea.test.ts`, `tests/e2e/chelsea.spec.ts`, `tests/helpers/world3d.ts` và `package.json` thêm kiểm tra layout, hành trình thật qua các cổng, mở hiện vật, hồi quy hai phòng Socket.IO và mobile.

## Asset và nguồn nội dung

11 GLB mới gồm `blues-column`, `blues-sofa`, `blues-lion`, `blues-footballer` và bảy mẫu `blues-trophy-{cup,europe,globe,league,shield,spire,world}`. Hang dùng lại `lantern.glb`, `fan-table.glb` và avatar `fan-chibi.glb`. Có hai texture đá tự tạo gồm base color và normal map. Có thể tái tạo bằng `node scripts/models/build-chelsea.mjs`. [Hồ sơ nguồn mô hình](../apps/web/public/models/LICENSE.md).

Danh hiệu theo từng nhóm của Chelsea FC. Sáu chức vô địch Anh gồm một First Division và năm Premier League. Hồ sơ thế giới ghi giải 2021 theo tên phân loại hiện tại của Chelsea FC và tách riêng FIFA Club World Cup 2025. [Tủ danh hiệu Chelsea FC](https://www.chelseafc.com/en/mens-trophy-cabinet-asia).

Phòng trưng bày ghi Xabi Alonso bắt đầu nhiệm kỳ ngày 01/07/2026. Các nhiệm kỳ cũ dùng năm để trình bày, gồm các lần trở lại và nhiệm kỳ tạm quyền. Mỗi panel có liên kết nguồn. [Thông báo bổ nhiệm Xabi Alonso](https://www.chelseafc.com/en/news/article/xabi-alonso-appointed-chelsea-manager) · [Hồ sơ các đời HLV](https://www.bounder.friardale.co.uk/Managers.htm) · [Thông báo chia tay Liam Rosenior](https://www.chelseafc.com/en/news/article/club-statement-liam-rosenior).

## Kết quả kiểm thử

- `npm test` đạt 28/28 ca, gồm kiểm tra đường đi tới từng điểm tương tác Chelsea, chuyển phòng và hồi quy dữ liệu, auth, ví.
- `npm run test:e2e` đạt 10/10 ca trên Chromium. Ba ca Chelsea gồm hành trình desktop online trọn vòng, mobile emulation offline và hai tài khoản realtime. Bảy ca hồi quy bao gồm Đại Sảnh, MU, chat, hồ sơ và ví qua fixture.
- `npm run build` đạt cho web và server. Vite báo kích thước bundle Rapier khoảng 2,26 MB trước gzip.
- Kiểm thử dùng máy chủ cục bộ và Auth fixture. Edge, Safari và thiết bị di động thật chưa được kiểm tra trong lượt này.

Hiệu năng ghi trên Apple M4, Chromium headless, sáu mẫu cách nhau 250 ms cho mỗi góc đứng sau khi tải scene. Số tam giác và lượt vẽ do Three.js báo, gồm các lượt render phục vụ bóng khi bật.

| Cấu hình | Scene | FPS ghi nhận | Lượt vẽ | Tam giác |
| --- | --- | ---: | ---: | ---: |
| Desktop 1440×900 · Medium | Hang | 60 | 409 | 663.970 |
| Desktop 1440×900 · Medium | Bảo tàng | 60 | 682 | 614.738 |
| Mobile emulation 390×844 · Low | Hang | 54–60 | 123 | 193.752 |
| Mobile emulation 390×844 · Low | Bảo tàng | 60–61 | 155 | 136.060 |

Các cảnh đá và gạch dùng instancing. Bóng và hạt bụi giảm ở Low, bloom dùng ở High. Kết quả trên viewport giả lập chạy trên Mac và chưa đo tốc độ tải lần đầu hoặc FPS trên điện thoại.

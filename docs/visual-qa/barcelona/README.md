# Hang Barça và Phòng Truyền Thống

Đại Sảnh, cửa hai cánh, đường dốc, Sảnh Trú Ẩn, Góc Tâm Sự và Phòng Truyền Thống dùng cùng một thế giới 3D. Máy chủ giữ một vùng Barcelona cho cả sảnh và bảo tàng. Cửa dùng bộ điều khiển bản lề, collider, âm thanh và trạng thái Socket.IO sẵn có. Cổng Barcelona giữ tọa độ ở Đại Sảnh. Lối ra dùng lại đường đã đi vào.

## Dữ liệu trưng bày

- **63 HLV, 75 nhiệm kỳ.** Chụp lại đủ 61 hồ sơ và 73 nhiệm kỳ trong danh mục CLB ngày 09/11/2026. Bổ sung hai nhiệm kỳ thay thế được CLB ghi riêng của Jordi Roura và Sergi Barjuan. Mỗi nhiệm kỳ có ID riêng, kể cả nhiệm kỳ trùng năm với HLV khác. Các bộ lọc dùng khoảng năm giao nhau nên một nhiệm kỳ qua mốc năm sẽ xuất hiện trong cả hai giai đoạn liên quan. [Danh mục HLV](https://www.fcbarcelona.com/en/club/history/coaches), [Jordi Roura](https://www.fcbarcelona.com/en/news/1146944/roura-to-lead-barca-in-tito-vilanovas-absence), [Sergi Barjuan](https://www.fcbarcelona.com/en/football/first-team/noticies/2312224/sergi-barjuan-nou-entrenador-interi-del-fc-barcelona)
- Trạng thái đương nhiệm lấy từ nhiệm kỳ mở trong dữ liệu. Hồ sơ Hansi Flick liên kết thông báo gia hạn đến 30/06/2028. [Thông báo của CLB](https://www.fcbarcelona.com/en/football/first-team/news/4505340/hansi-flick-extends-contract-until-2028)
- **Bảy hiện vật đại diện** gồm La Liga (29), Copa del Rey (32), Champions League (5), Siêu cúp UEFA (5), FIFA Club World Cup (3), Siêu cúp Tây Ban Nha (16) và Cúp C2 châu Âu (4). Số lượng lấy từ danh sách mùa giải của từng giải. [Danh hiệu đội một](https://www.fcbarcelona.com/en/football/primer-equipo/palmares)
- Bộ sưu tập có 15 huyền thoại, sáu trận và tám dấu mốc. Hồ sơ có nguồn đối chiếu. Các video được mở trên trang CLB khi có tư liệu tương ứng. [Huyền thoại](https://www.fcbarcelona.com/en/club/history/legendary-players), [Các trận chung kết](https://www.fcbarcelona.com/en/news/1673565/stat-of-the-day-8-european-cup-finals), [Lịch sử CLB](https://www.fcbarcelona.com/en/club/history/decade-by-decade)
- Bảng tỷ số đọc kết quả đội nam qua `GET /api/barcelona/result`. Máy chủ lưu đệm 10 phút khi có kết quả. Bảng dùng trạng thái chưa cập nhật nếu nguồn không trả được kết quả hợp lệ. [Kết quả chính thức](https://www.fcbarcelona.com/en/football/first-team/results)

## Tệp và component

| Tệp | Vai trò |
| --- | --- |
| [BarcelonaCave](../../../apps/web/src/game/three/barcelona/BarcelonaCave.tsx), [BarcelonaArchitecture](../../../apps/web/src/game/three/barcelona/BarcelonaArchitecture.tsx), [BarcelonaHeritage](../../../apps/web/src/game/three/barcelona/BarcelonaHeritage.tsx) | Sảnh, sofa, cầu thang, hành lang, bảo tàng, bảng tên động, tường HLV và hiện vật 3D |
| [BarcelonaHUD](../../../apps/web/src/ui/BarcelonaHUD.tsx), [BarcelonaMinimap](../../../apps/web/src/ui/BarcelonaMinimap.tsx), [barcelona.css](../../../apps/web/src/ui/barcelona.css) | Tám mục tra cứu, hồ sơ nhiệm kỳ, ví hiện có, bộ chọn tiếng Việt/Anh và minimap theo tọa độ |
| [barcaPhoto](../../../apps/web/src/game/three/barcelona/barcaPhoto.ts), [useBarcaLanguage](../../../apps/web/src/game/three/barcelona/useBarcaLanguage.ts), [useBarcaMatch](../../../apps/web/src/game/three/barcelona/useBarcaMatch.ts) | Nguồn texture tư liệu, lựa chọn ngôn ngữ và cập nhật tỷ số |
| [packages/shared/barcelona](../../../packages/shared/barcelona) | Sơ đồ mét và tọa độ mạng, định nghĩa tương tác, danh mục CLB, nội dung song ngữ và parser kết quả |
| [caveConnections](../../../packages/shared/caveConnections.ts), [world](../../../packages/shared/world.ts), [worldLayout](../../../apps/web/src/game/three/worldLayout.ts), [ConnectedCaves](../../../apps/web/src/game/three/ConnectedCaves.tsx), [Environments](../../../apps/web/src/game/three/Environments.tsx), [GrandHall](../../../apps/web/src/game/three/GrandHall.tsx) | Nối đường dốc và các phòng vật lý, thẩm định đường đi, đổi ánh sáng dần và ẩn geometry bên ngoài khi đã vào sâu |
| [App](../../../apps/web/src/App.tsx), [World3D](../../../apps/web/src/game/three/World3D.tsx), [Minimap](../../../apps/web/src/ui/Minimap.tsx), [server index](../../../apps/server/src/index.ts) | Ghép giao diện với gameplay, vùng tương tác F, đồng bộ ngồi và đứng |
| [barcaMatch](../../../apps/server/src/barcaMatch.ts), [barcaPhotos](../../../apps/server/src/barcaPhotos.ts), [.env.example](../../../.env.example) | Truy xuất tỷ số và ảnh có kiểm soát |
| [crest.svg](../../../apps/web/public/art/barcelona/crest.svg) | Huy hiệu SVG dùng trên texture và HUD |
| [barcelona.test.ts](../../../tests/barcelona.test.ts), [barcelona.spec.ts](../../../tests/e2e/barcelona.spec.ts), [package.json](../../../package.json) | Kiểm tra dữ liệu, lối đi, tương tác và hành trình desktop/mobile |

## Asset và phạm vi

- Dùng lại `blues-lion.glb` cho hai tượng trên vòm chính. Avatar dùng `chibi-fan-07-rigged.glb` của game. Cổng và Đại Sảnh tiếp tục dùng asset chung.
- Tượng Pep hiện là **placeholder 3D bằng mesh**. Các cúp là mẫu đại diện bằng mesh; khung, đèn, cửa, sofa và đá vòm được dựng trong scene.
- Ảnh tư liệu lấy qua proxy giới hạn theo ID chính thức. Đặt `BARCA_ARCHIVE_PHOTOS=1` trên backend khi chạy bản duyệt nội bộ hoặc khi đã có quyền hiển thị. Mặc định dùng khung tên và liên kết nguồn. Cần quyền dùng ảnh và huy hiệu trước khi phát hành thương mại.
- Hang dùng lại hồ sơ, chat, biểu cảm, chụp ảnh và trang phục của game. Vật phẩm ném tiếp tục dùng khu cà khịa có đồng ý ở Đại Sảnh. Game chưa có tiến trình XP phía máy chủ.
- Phiên kiểm thử multiplayer dùng máy chủ Socket.IO thật với tài khoản từ fixture xác thực. Mobile là Chromium giả lập màn hình cảm ứng. Số FPS là mẫu tại thời điểm chụp, ghi trong [metrics.json](metrics.json).

## Kết quả kiểm thử

- `npm run build` hoàn tất trên bản sao cục bộ với cùng mã nguồn. Build kiểm tra kiểu TypeScript của web và server. Vite có cảnh báo kích thước chunk Rapier dùng chung.
- `npm test` qua 57 bài, gồm đối chiếu danh sách và nhiệm kỳ HLV, số cúp, parser kết quả và lối đi.
- Playwright đi và về qua đủ chín cổng hang. Lượt desktop Barça kiểm tra cầu thang, sofa, năm bộ lọc HLV, hồ sơ nhiệm kỳ, từng cúp, huyền thoại và dòng thời gian trong cùng phiên.
- Lượt hai người kiểm tra cửa có người đứng chặn, nhảy, joystick cảm ứng, hai ngôn ngữ, minimap, animation ngồi và đứng ở máy khác, và chat.
- Cảnh nội thất ở các ảnh chụp đạt 58–60 FPS trên môi trường kiểm thử. Các phép đo gồm 234–419 draw call và khoảng 78–117 nghìn tam giác trên desktop. [Số liệu từng ảnh](metrics.json)

## Ảnh và video trong game

1. [Sảnh Trú Ẩn](01-san-tru-an.png)
2. [Góc Tâm Sự](02-goc-tam-su.png)
3. [Phòng Truyền Thống từ cửa vào](03-phong-truyen-thong.png)
4. [Tường HLV giai đoạn hiện tại](04-buc-tuong-hlv.png)
5. [Tường HLV sau khi chọn 1912–1949](05-buc-tuong-hlv-giai-doan-khac.png)
6. [Dãy cúp](06-day-cup.png)
7. [Tượng Pep Guardiola](07-tuong-pep.png)
8. [Góc Tâm Sự trên mobile với hai người chơi](08-mobile.png)

[Video hành trình liền mạch từ Đại Sảnh vào bảo tàng và quay ra](walkthrough.mp4)

Có thể chạy `npm run build`, `npm test` và `npx playwright test tests/e2e/barcelona.spec.ts`. Đặt `FFC_BARCA_ARTIFACTS` để lưu ảnh và `FFC_BARCA_VIDEO=1` để ghi hành trình.

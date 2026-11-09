# Hang Man City và Phòng Truyền Thống

## Mặt bằng và di chuyển

- Cổng Manchester City ở khoảng `(30, 7, -28.2)` trong hệ tọa độ Three.js, với Y hướng lên. Cửa đôi dùng collider kinematic của Rapier. Máy chủ mở cửa khi có người đến gần 3,9 m và hẹn đóng khi vùng cửa trống. Hai vách loe phía trong dẫn người chơi từ mép hầm về giữa cửa.
- Đường hầm đá xanh đi theo trục X = 30 xuống sàn Y = −51. Cao độ này đưa toàn bộ mái Man City xuống dưới hang Manchester United. Đi ngược đường hầm sẽ trở lại Đại Sảnh.
- Tính từ cửa hầm vào sảnh, Sảnh Trú Ẩn rộng 30 m và sâu 28 m. Góc Tâm Sự ở phía tây. Cầu thang giữa sảnh có chín bậc 3D và một collider dốc, đưa avatar lên 1,35 m tới bảng tỷ số và phù điêu con tàu.
- Vòm phía đông mở vào hành lang dài 5 m rồi tới Phòng Truyền Thống rộng 28 m, sâu 22 m. Tượng Pep và áo đấu ở bên trái. Sáu tủ cúp và bốn chân dung chính ở cuối phòng. Bảng lịch sử ở bên phải. Các khung huyền thoại và trận đấu nằm sát tường.
- Sảnh, sofa và bảo tàng cùng thuộc vùng `city`. Đi giữa các khu vực giữ nguyên controller, avatar, camera và phiên Socket.IO. Minimap lấy hình học từ cùng dữ liệu mặt bằng và cập nhật mũi tên theo vị trí, hướng nhân vật.

## Tương tác và nội dung

- Tới sofa rồi nhấn **E** hoặc chạm lời nhắc để ngồi. Nhấn lại hoặc di chuyển để đứng dậy. Máy chủ kiểm tra đường tiếp cận và người đang ngồi. Người chơi khác nhận được trạng thái ngồi qua Socket.IO.
- Tới bảng tin hoặc hiện vật và dùng lời nhắc tương tác. Có thể chọn khung chân dung, tủ cúp, tượng và mốc lịch sử trong cảnh. Menu Man City mở các mục tổng quan, danh hiệu, HLV, huyền thoại, trận đấu, lịch sử, ảnh và kỷ lục. Nội dung Man City có tiếng Việt và tiếng Anh.
- Bảng tỷ số hiển thị **Chưa cập nhật**. Bảng tin mở lịch, kết quả và tin chính thức của CLB. Mục 93:20 dẫn đến video do CLB phát hành. [Lịch thi đấu](https://www.mancity.com/fixtures/mens), [Kết quả](https://www.mancity.com/results/mens), [Video 93:20](https://www.mancity.com/citytv/mens/manchester-city-qpr-classic-highlights-63819552)
- Số cúp lấy từ số mùa hoặc năm trong danh sách CLB công bố. Hồ sơ Pep ghi nhiệm kỳ 2016–2026. [Danh hiệu](https://www.mancity.com/club/honours/team), [Lịch sử CLB](https://www.mancity.com/club/manchester-city-history), [Thông báo về Guardiola](https://www.mancity.com/news/mens/pep-guardiola-official-announcement-63915039)

## Asset và thành phần

| Khu vực | Thành phần và file |
| --- | --- |
| Sảnh, sofa, lối nối | `CityCaveScene`, `CityMainHall`, `CityLounge`, `CityStair`, `CityHeritagePassage`, `CityIvy`, `CityStoneLion` trong `apps/web/src/game/three/city/CityCaveScene.tsx` |
| Kiến trúc 3D | `CityVault`, `CityWall`, `CityFloor`, `CityArch`, `CityBanner`, `CityCrest`, `CityCrystal`, `CityLantern`, `CityShip` trong `apps/web/src/game/three/city/CityArchitecture.tsx` |
| Bảo tàng | `CityHeritageHall`, `CityTimeline`, `CityShirt`, `CityFrame`, `CityCup`, `CityTrophyCase`, `CityCoachStatue` trong `apps/web/src/game/three/city/CityHeritageHall.tsx` và `CityExhibits.tsx` |
| HUD và nội dung | `CityHUD`, `CityCollection`, `CityMatchBoard`, `CityMinimap` trong `apps/web/src/ui/CityHUD.tsx`, `CityMinimap.tsx` và `city.css` |
| Dữ liệu dùng chung | `packages/shared/city/layout.ts`, `content.ts`. Tích hợp vào `caveConnections.ts`, `caveGates.ts` và `world.ts` |
| Tích hợp game | `apps/web/src/game/three/Environments.tsx`, `ConnectedCaves.tsx`, `CaveGate.tsx`, `World3D.tsx`, `worldLayout.ts`, `apps/web/src/App.tsx` và `apps/server/src/index.ts` |
| Kiểm thử | `tests/city.test.ts`, `tests/e2e/city.spec.ts`, `tests/helpers/world3d.ts`, `tests/real-madrid.test.ts` (dung sai số thực khi đổi tọa độ) |

Sư tử dùng lại mesh GLB hiện có với vật liệu đá xanh xám. Huy hiệu dùng SVG trên HUD và WebP trên mesh. Ảnh HLV, cầu thủ, Etihad và ảnh tư liệu đã tối ưu cho trình duyệt, có ghi tác giả và giấy phép. [Nguồn ảnh](../../../apps/web/public/art/city/credits.html)

Tượng Pep là mô hình người cách điệu bằng đồng. Sáu cúp có hình dáng phân biệt, áo đấu là mesh minh họa. Ba nhóm asset này có thể thay bằng GLB chi tiết hơn. Nội thất Man City tải khi người chơi đến gần chân dốc, dùng đèn cục bộ, collider đơn giản và instancing cho lá dây leo.

## Ảnh và video trong game

1. [Sảnh Trú Ẩn nhìn từ cửa vào](01-san-tru-an.png)
2. [Góc Tâm Sự Fan](02-goc-tam-su.png)
3. [Phòng Truyền Thống nhìn từ lối vào](03-phong-truyen-thong.png)
4. [Dãy cúp và tượng Pep Guardiola](04-cup-va-tuong-pep.png)
5. [Chat và điều khiển cảm ứng](05-mobile-multiplayer.png)

[Video hành trình hai chiều](walkthrough.webm). Đặt `FFC_CITY_ARTIFACTS` đến thư mục đầu ra khi chạy `npx playwright test tests/e2e/city.spec.ts` để ghi lại ảnh và video.

## Kiểm thử

- `npm run build` qua TypeScript của web và server và build production trên bản sao của workspace. `npm test` qua 57 bài. Vite báo cảnh báo kích thước chunk vật lý dùng chung.
- Playwright desktop đi từ Đại Sảnh qua cửa tự động, xuống hầm, ngồi và đứng dậy, mở bảng tin, lên cầu thang, nhảy, mở bảng tỷ số, đi vào bảo tàng, ngước camera và xem tượng, cúp, HLV, lịch sử rồi đi ngược về Đại Sảnh. Lượt về đi sát mép hầm trước khi qua cửa. Kiểm tra ID phiên, controller và hướng camera qua hai lượt qua cổng.
- Playwright với hai phiên Chromium, một phiên giả lập cảm ứng 690 × 393, kiểm tra cửa giữ mở khi có người ở ngưỡng và đóng sau khi cả hai đã đi qua. Kiểm tra minimap, nút nhảy, joystick, trạng thái ngồi ở máy còn lại và chat Hang Man City.
- [Số đo khung hình, draw calls và tam giác tại lúc chụp](metrics.json) ghi lại kết quả trên máy kiểm thử. Mẫu mobile chạy đồng thời hai phiên Chromium.
- Đã chạy kiểm tra đường đi hai chiều cho tám tuyến còn lại. Bayern, PSG, Real Madrid, Arsenal, Liverpool và Manchester United qua trên bản nền có thay đổi Man City. Chelsea và Barcelona qua khi chạy lại trên bản tích hợp cuối.

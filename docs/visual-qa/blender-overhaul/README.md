# Blender vertical slice · Đại Sảnh Chung

Tuyến mẫu bắt đầu ở điểm xuất hiện, đi vòng quanh tượng bóng vàng, qua cầu thang chính và vào Hang Quỷ Đỏ. Cầu đá phía Tây được kiểm tra thêm ở cả chiều lên và xuống. Nhân vật va vào bệ tượng và chân cột MU, sau đó vào hang qua đúng tâm vùng kích hoạt. Cảnh mới chạy trong React Three Fiber, với các bề mặt đi lại và vùng tương tác dùng chung từ game.

[Phân tích năm ảnh tham chiếu và thứ tự dựng](../../../.stitch/DESIGN.md) · [Manifest nguồn](../../../assets/blender-manifest.json) · [Số liệu trước](before-metrics.json) · [Số liệu sau](after-metrics.json) · [Số liệu từng GLB](../../asset-previews/blender-overhaul/manifest-report.json)

## Ảnh game thật

Các ảnh lấy bằng Playwright trên Chromium. Desktop 1440 × 900. Mobile mô phỏng viewport 390 × 844 với cảm ứng. Dùng cùng điểm xuất hiện, hướng camera và trình tự WASD. Góc bên xoay khoảng 66°, góc trên cao và 180° dùng nút camera có sẵn. Cao độ camera tại spawn sau nâng cấp đã ổn định vì mặt sàn phẳng dùng collider hộp. Các vị trí tiếp cận có sai số vài phần mười mét do điều khiển theo khung hình.

| Góc                            | Trước                           | Sau                            |
| ------------------------------ | ------------------------------- | ------------------------------ |
| Desktop tại spawn · Medium     | [Ảnh](before-desktop.png)       | [Ảnh](after-desktop.png)       |
| Tiếp cận cầu thang từ lối vòng | [Ảnh](before-approach.png)      | [Ảnh](after-approach.png)      |
| Đứng sau tượng                 | [Ảnh](before-behind-statue.png) | [Ảnh](after-behind-statue.png) |
| Trước cổng MU                  | [Ảnh](before-portal.png)        | [Ảnh](after-portal.png)        |
| Xoay ngang ở tầng MU           | [Ảnh](before-side.png)          | [Ảnh](after-side.png)          |
| Từ trên cao                    | [Ảnh](before-overhead.png)      | [Ảnh](after-overhead.png)      |
| Xoay 180° về cổng chính        | [Ảnh](before-reverse.png)       | [Ảnh](after-reverse.png)       |
| Mobile · Low                   | [Ảnh](before-mobile.png)        | [Ảnh](after-mobile.png)        |
| Desktop · High                 |                                 | [Ảnh](after-desktop-high.png)  |
| Cầu đá Tây                     |                                 | [Ảnh](after-stone-bridge.png)  |

## Đối chiếu hình ảnh

| Hạng mục           | Đã thay trên tuyến mẫu                                                                                                       | Khác biệt còn thấy so với concept                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Núi và địa hình    | Các lớp đá nổi, khe, gờ rêu và chóp Blender dọc tuyến trung tâm. Albedo và normal map hiện trong WebGL                       | Vách hậu và rìa vẫn sắc cạnh, các tầng còn thẳng. Cần địa hình uốn quanh hồ, mảng cỏ liên tục và cây bám trên các tầng cao                                         |
| Cổng MU            | Thay vòng xoáy phẳng bằng vòm có lòng sâu, cột ốp, trán tên, cờ, phù hiệu đinh ba và luồng sáng nằm sau vòm                  | Mặt đứng vẫn đều và đơn giản hơn concept. Cần thêm phù điêu, đá đẽo vát mềm hơn và chi tiết nối vòm vào vách                                                       |
| Tượng và đường lát | Bóng 32 múi, bệ nhiều lớp và bồn hoa. Đường lát riêng có viên đá, viền và hoa thị. Dời bảng demo ra ngoài trục nhìn          | Phần quảng trường ngoài hành lang vẫn rộng. Viền đường và bố cục bồn hoa còn thẳng, chất liệu concept có nhiều biến thiên ẩm và độ bóng hơn                        |
| Cây và nước        | Hai cây anh đào có cành phân nhánh, bồn đỗ quyên và hai thác có bậc đá, bể, bọt cùng shader chuyển động                      | Tán cây vẫn góc cạnh, mật độ hoa thấp hơn ảnh. Mặt kênh và mép hồ còn đơn giản. Concept có mạng thác phủ rộng các tầng                                             |
| Đèn và ánh sáng    | Đèn kính hổ phách, nắng ấm, ánh lấp lạnh, môi trường phản xạ, sương và ánh cục bộ ở tượng/cổng. High dùng bloom hiện có      | Cảnh WebGL sáng và phẳng hơn concept ở vùng nền rộng. Concept có bóng cục bộ, phản xạ ướt và ánh vàng đậm hơn                                                      |
| Camera và nhân vật | Giữ camera third-person và orbit. Camera co lại trước bệ tượng nhờ ray target riêng. Dùng collider phẳng đúng cao độ ở spawn | Góc mặc định lùi 12 m, xa hơn khung hero trong concept. Nhân vật hiện vẫn dùng rig và model chibi cũ                                                               |
| Bố cục             | MU nằm ở trung tâm, cầu và thang nối được các cao độ hiện tại                                                                | Hiện trạng vẫn xếp Real Madrid/Barcelona cùng dãy giữa và đặt Bayern trái, PSG phải. Đợt mở rộng cần bố cục tầng thấp riêng và hoán đổi hai cổng đỉnh theo concept |

Tuyến mẫu đủ để review trực tiếp trong game. Giai đoạn mở rộng gồm tám cổng còn lại, cổng vào chính, cầu gỗ phía Đông, thác và vách ngoài tuyến, kiến trúc quảng trường, nhân vật chibi rigged chất lượng cao và hai cặp nội thất MU/Chelsea. Bộ rig hiện tại tiếp tục chạy Idle, Walk, Run và các emote hiện có. Cần một đợt tạo hình, skinning và kiểm thử bộ animation đầy đủ cho nhân vật thay thế. Các panel, HUD và số liệu vẫn lấy từ ứng dụng và dữ liệu đã kết nối.

## Đo hiệu năng

Chromium headless dùng ANGLE Metal trên Apple M4. Mỗi hàng lấy 12 mẫu FPS từ trạng thái runtime tại spawn, cách nhau 250 ms. Draw calls và tam giác là số của Three.js tại khung hình lấy mẫu, có cả các lượt vẽ phụ. Hàng mobile là mô phỏng trên máy Mac.

| Chế độ         | FPS trung vị trước → sau | Khoảng FPS sau | Draw calls trước → sau |  Tam giác trước → sau |
| -------------- | -----------------------: | -------------: | ---------------------: | --------------------: |
| Desktop Medium |                  60 → 60 |          58–62 |          1.390 → 1.232 | 2.407.308 → 2.446.819 |
| Desktop High   |                   — → 60 |          46–60 |              — → 1.309 |         — → 2.759.305 |
| Mobile Low     |                  60 → 60 |          35–60 |              264 → 216 |     331.714 → 439.141 |

Low dùng cây và đèn nhẹ, tắt bóng nắng và hoạt ảnh nước trên hai thác mới. Medium dùng LOD theo khoảng cách với vùng đệm chuyển mức, bóng 1024 và nước động. High giữ cây chi tiết và bóng 2048, thêm bloom. Meshopt nén hình học. Tổng 15 GLB khoảng 6,81 MiB trên đĩa. Các texture nhúng kích thước 256 × 256 dùng PNG và có tổng bộ nhớ ước tính khoảng 14 MiB nếu toàn bộ texture mới cùng tồn tại dưới dạng RGBA8 với mipmap. Số này tách riêng khỏi bộ nhớ của thế giới cũ. Cần đo trên điện thoại thật để xác nhận mục tiêu mobile. High có lúc giảm xuống 46 FPS trong phép đo này.

## Kết quả kiểm thử

- Validate 15 GLB. Chromium tải đủ 15 tệp và thực hiện hết tuyến mẫu. Lần chạy lại factory ghi nhận cả 15 asset khớp hash.
- Unit test 28/28. Build web và server thành công. Vite báo chunk Rapier khoảng 2,26 MB sau minify.
- Offline 3/3 sau khi giữ màn hình chờ đến lúc điều khiển được bật.
- Bộ hồi quy có 9/10 kịch bản qua cùng một lượt. Ca cầu Đông, sút bóng và tải ảnh qua khi chạy lại riêng sau khi dời bảng demo ra khỏi hành lang. Các kịch bản qua gồm Chelsea online/mobile/realtime, luồng MU online/mobile, login, ví và chat.
- Lần hồi quy đầu chạy theo đường dẫn mặc định của test Chelsea đã làm mới ảnh và số liệu QA trong `docs/visual-qa/chelsea/`. Các lượt tiếp theo chạy trong bản sao tạm.

## Tái tạo và kiểm tra

Blender cục bộ tại `/Applications/Blender.app/Contents/MacOS/Blender`, phiên bản 5.2.3 LTS. Đã chạy Python ở background, export GLB Meshopt, render Cycles và đọc lại asset qua Three.js trong trình duyệt.

```sh
npm run blender:assets
npm run blender:assets -- --validate
npm run blender:verify
BLENDER_BIN=/path/to/blender npm run blender:assets
```

Lệnh assets đọc manifest, dựng mesh theo mét và pivot đặt sàn, tạo UV, đóng gói PBR albedo/normal và xuất GLB. Manifest áp ngân sách từng model. Factory tạo các đầu ra trong thư mục tạm trước khi công bố, rồi ghi hash cho GLB, ảnh và nguồn. Lần chạy kế tiếp bỏ qua asset khớp hash. Tài nguyên mẫu nằm riêng trong `models/blender/`. Khi gặp đầu ra bị sửa thủ công, factory dừng với lỗi. Sao lưu hoặc ghi nhận phiên bản trước khi chủ động chạy `npm run blender:assets -- --force`.

Lệnh verify chạy unit tests, build web/server rồi chạy Chromium với Vite cục bộ. Để chụp lại trên server đang chạy, dùng `node scripts/blender-visual-qa.mjs after`. Đặt `FFC_QA_URL` để đổi URL và `FFC_QA_SHOTS` để xuất vào thư mục khác. Tham số `before` dùng để chụp bản code gốc. Hai lần chụp dùng cùng route game và tắt kết nối realtime trong phiên đo.

| Nhóm     | File                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factory  | [build_assets.py](../../../tools/blender/build_assets.py), [geometry.py](../../../tools/blender/geometry.py), [materials.py](../../../tools/blender/materials.py), [architecture.py](../../../tools/blender/architecture.py), [landscape.py](../../../tools/blender/landscape.py), [plaza.py](../../../tools/blender/plaza.py)                                                  |
| Vận hành | [package.json](../../../package.json), [blender-overhaul.mjs](../../../scripts/blender-overhaul.mjs), [blender-visual-qa.mjs](../../../scripts/blender-visual-qa.mjs)                                                                                                                                                                                                           |
| Runtime  | [App.tsx](../../../apps/web/src/App.tsx), [BlenderAsset.tsx](../../../apps/web/src/game/three/BlenderAsset.tsx), [GrandHallSlice.tsx](../../../apps/web/src/game/three/GrandHallSlice.tsx), [GrandHall.tsx](../../../apps/web/src/game/three/GrandHall.tsx), [World3D.tsx](../../../apps/web/src/game/three/World3D.tsx), [grandHall.ts](../../../packages/shared/grandHall.ts) |
| Kiểm thử | [world3d.test.ts](../../../tests/world3d.test.ts), [blender-visual.spec.ts](../../../tests/e2e/blender-visual.spec.ts), [playwright.blender.config.ts](../../../playwright.blender.config.ts)                                                                                                                                                                                   |
| Đầu ra   | [GLB](../../../apps/web/public/models/blender), [Blender previews](../../asset-previews/blender-overhaul), [ảnh và số liệu Chromium](.)                                                                                                                                                                                                                                         |

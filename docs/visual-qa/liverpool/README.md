# Hang Liverpool và Phòng Truyền Thống

Ảnh được chụp trực tiếp trong game bằng Chromium và Playwright. Các hành trình dùng WASD, Shift, phím E hoặc joystick và nút tương tác chạm. Không gian, vật trưng bày và avatar được dựng trong WebGL.

## Ảnh game

| Hang Liverpool | Phòng Truyền Thống |
| --- | --- |
| [Sảnh Trú Ẩn](01-sanh-tru-an.png) | [Toàn cảnh bảo tàng](06-bao-tang.png) |
| [Góc Tâm Sự](02-goc-tam-su.png) | [Tượng Bill Shankly](07-bill-shankly.png) |
| [Lounge](03-lounge.png) · [Ngồi sofa](03b-ngoi-sofa.png) | [Dãy cúp](08-day-cup.png) |
| [Lối vào hành lang](04a-loi-vao-hanh-lang.png) · [Bên trong hành lang](04-hanh-lang.png) | [Khu HLV](09-huan-luyen-vien.png) |
| [Cổng Ra Hang](05-cong-ra-hang.png) | [Đêm Istanbul](10-istanbul.png) · [Timeline](11-timeline.png) |
| [Hang trên viewport mobile](12-mobile-hang.png) | [Bảo tàng trên viewport mobile](13-mobile-bao-tang.png) |

Hai ảnh tham chiếu định hướng bố cục, vật liệu và ánh sáng. Sảnh có nền đá đỏ tím, hai khu sofa, phù điêu chim, pha lê, đuốc và lối đi qua chuỗi vòm. Bảo tàng dùng đá bóng, trần vòm, đèn chùm, thảm đỏ và tủ kính. Bố cục để lại khoảng trống đi lại giữa các dãy. Mức chi tiết của vật liệu, tượng và chân dung vẫn mang phong cách stylized so với bản thiết kế. Số FPS trong [metrics.json](metrics.json) là quan sát của lần chụp trên máy chạy Chromium. Viewport 390 × 844 dùng giả lập, nên kết quả chưa đo được hiệu năng trên điện thoại thật.

## Chạy lại

```sh
npm run build
npm test
FFC_LIVERPOOL_SHOTS=docs/visual-qa/liverpool npx playwright test tests/e2e/liverpool.spec.ts
```

Các kịch bản kiểm tra hành trình từ Đại Sảnh đến Liverpool rồi quay về đúng cổng, di chuyển qua hai khu sofa, ngồi và đứng dậy, bậc thang, bảng trận đấu DEMO, hành lang, tượng, danh hiệu, HLV, Istanbul và timeline. Bộ test còn kiểm tra joystick và thao tác chạm, chat và biểu cảm từ hai phiên trình duyệt, cùng việc tách người chơi theo phòng khi qua cổng.

## Asset và nội dung

- [Manifest hai ảnh tham chiếu](../../../assets/source/liverpool-asset-manifest.json) lưu kích thước, vùng ảnh, nhóm asset và trạng thái xuất. Tạo lại bằng `node scripts/liverpool-asset-manifest.mjs <hang.png> <bao-tang.png>`.
- [File Blender nguồn](../../../assets/source/liverpool.blend) và [script dựng](../../../tools/blender/liverpool.py) tái tạo GLB bằng `blender -b -t 2 -P tools/blender/liverpool.py`. Scene và các đạo cụ dùng GLB nén Meshopt. Trong Blender, bật collection `museum` hoặc các collection đạo cụ cần xem.
- Nhóm đã xuất gồm kiến trúc, vách hang, sàn, hành lang, cổng, pha lê, đèn, Liver Bird cách điệu, sofa, tượng Shankly, 10 chân dung đồng cách điệu, kỷ vật áo đấu và 8 mẫu cúp. Màn hình Istanbul dùng minh họa sân vận động vẽ riêng trong game.
- TRELLIS.2 trả schema khi kiểm tra. Phiên này dùng Blender để dựng các đối tượng, gồm cả những mẫu đề xuất cho Image-to-3D. Chưa có phiên bản ảnh hiện thực của tượng hoặc chân dung qua TRELLIS.2.
- Bảng trận đấu để DEMO với tỷ số trống vì dự án chưa có nguồn dữ liệu trận đấu đã xác minh. 52 danh hiệu lớn của đội nam và 16 Charity/Community Shields được lưu riêng. Các panel dùng nguồn Liverpool FC. [Danh hiệu](https://www.liverpoolfc.com/info/honours/) · [HLV qua các thời kỳ](https://www.liverpoolfc.com/info/past-managers) · [Bổ nhiệm Andoni Iraola](https://www.liverpoolfc.com/news/liverpool-fc-appoint-andoni-iraola-new-head-coach)
- Chơi với avatar GLB #7 và các clip sẵn có, gồm ngồi, đứng dậy, chạy, nhảy và biểu cảm. Chưa có clip tương tác hai người như vỗ vai. Trước khi phát hành công khai, rà soát quyền dùng tên và biểu tượng CLB, hình dáng cúp và hình tượng nhân vật. Trong bản game này, hình minh họa và mesh trưng bày được dựng riêng, không nhúng ảnh chân dung, video trận đấu hoặc huy hiệu chính thức từ các trang nguồn.

# Hang Quỷ Đỏ 3D

Cảnh `united` dùng vòm đá, vách, nhũ đá, sàn, bệ trung tâm và đạo cụ dạng mesh GLB. Sảnh Trú Ẩn nằm ở giữa. Góc Tâm Sự và Khu Trò Chuyện Fan nằm bên trái. Cửa Hoài Niệm dẫn vào hành lang có nhiều lớp vòm và khung nội dung. Cổng Ra Hang nằm phía trước, nối với Đại Sảnh Chung qua cơ chế chuyển phòng hiện có.

Cả 10 GLB của hang và GLB chibi số 7 nằm trong [thư mục red-devils](../../../public/assets/3d/red-devils).

## Từ một ảnh đến bộ asset

- [Ảnh gốc](../../../assets/source/red-devils-reference.png)
- [Danh mục asset](../../../assets/source/asset-manifest.json)
- [Bảng vùng ảnh và ảnh tách](../../../assets/source/processed/preview.png)

Đã nhận diện 16 vùng hoặc loại đối tượng bằng cách đọc ảnh và chú thích tọa độ theo pixel. Script dùng các đường bao dành cho ảnh này để tạo mask có khử răng cưa. Nếu thay bằng ảnh bố cục khác, cần cập nhật tệp chú thích. HUD chỉ xuất hiện trong ảnh tham chiếu và bảng preview. Game nạp các mesh và giữ HUD React hiện có.

Có 5 PNG trong suốt. Đèn và đinh ba được duyệt để gửi TRELLIS.2. Pha lê, biển và cờ dùng làm tham chiếu tạo hình. Crop hình bàn, sofa và cây bị lẫn vật che nên được giữ ở dạng ô tham chiếu trong preview. Blender tái dựng phần khuất từ hình dạng quan sát được.

| Đầu ra | Kết quả |
| --- | --- |
| TRELLIS.2 | Đèn đi qua Generate. Extract GLB trả lỗi hạn mức ZeroGPU. Hàng đợi dừng trước đinh ba. Không có GLB TRELLIS mới cho hang trong lượt này. |
| Blender | 10 GLB gồm vòm, sàn, vách và mái, pha lê, sofa, bàn, cây, bệ sảnh, đèn và đinh ba. Khronos Validator báo 0 lỗi, với cảnh báo thiếu tangent xuất sẵn trên một số vật liệu có normal map. |
| React Three Fiber | Nạp cả 10 GLB từ máy chủ game. Vách và sàn là mesh. Pha lê, cây và đèn dùng instancing. Camera và vật lý dùng footprint và collider của bản đồ hiện có. |

Bậc quanh bệ trung tâm là hình học trang trí. Sàn đi bộ trong hang giữ cao độ đã đồng bộ với server. Các điểm đã đi thử không cần chỉnh tọa độ để mở lối. Phần còn có thể tinh chỉnh bằng tay là độ sắc của chữ và chi tiết vân đá khi nhìn gần, cùng silhouette của đèn và đinh ba nếu sau này đổi sang GLB từ TRELLIS.2.

## Chạy lại

```sh
node scripts/build-red-devils-assets.mjs
BLENDER_BIN=/Applications/Blender.app/Contents/MacOS/Blender \
  node scripts/build-red-devils-assets.mjs --blender
```

Khi biến môi trường `HF_TOKEN` có hạn mức, chạy `node scripts/build-red-devils-assets.mjs --trellis --limit=1`. Pipeline kiểm tra GLB có sẵn để tái sử dụng, chỉ gửi ảnh đã duyệt, và dừng ở lỗi đầu tiên. Xem [hướng dẫn TRELLIS.2](../../trellis-2.md). Cấu hình dùng schema live và queue chính thức của [Space Microsoft TRELLIS.2](https://huggingface.co/spaces/microsoft/TRELLIS.2/agents.md).

## Ảnh chụp và kiểm thử

1. [Tổng thể sảnh](01-tong-the.png)
2. [Nhân vật ở trung tâm](02-nhan-vat-trung-tam.png)
3. [Góc Tâm Sự Fan](03-goc-tam-su.png)
4. [Khu Trò Chuyện Fan và lounge](04-lounge.png)
5. [Hành lang Hoài Niệm](05-hanh-lang-hoai-niem.png)
6. [Cổng Ra Hang](06-cong-ra-hang.png)

- Build web và server đạt. `npm test` đạt 31/31.
- Chromium đi bằng WASD từ Đại Sảnh Chung vào hang, qua sảnh và hai góc phía trái, đi qua hành lang tới Hoài Niệm, quay lại và ra Đại Sảnh Chung. Cả 10 GLB được phục vụ thành công. [Số đo từng góc](metrics.json)
- Hai client Chromium đăng nhập qua fixture cục bộ, đi vào cùng phòng `united`, thấy nhau và nhận chat qua Socket.IO. Mẫu đo khoảng 43–60 FPS trên hai client ở 1440 × 900. Đây là số đo hai người trên máy kiểm thử. [Số đo multiplayer](multiplayer-metrics.json)

Để chụp lại sáu góc, chạy web ở chế độ offline rồi chạy QA từ thư mục gốc.

```sh
FFC_TEST=offline VITE_SUPABASE_URL='' VITE_SUPABASE_PUBLISHABLE_KEY='' \
  VITE_SUPABASE_ANON_KEY='' VITE_SERVER_URL='' VITE_WEBSOCKET_URL='' \
  npm run dev -w apps/web -- --port 5198 --strictPort
```

```sh
node scripts/red-devils-qa.mjs
```

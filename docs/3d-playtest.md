# Chuyển đổi engine 3D — 04/11/2026

## Phạm vi và kết quả kiểm tra repository

Thế giới trước đây được khởi tạo bằng `Phaser.Game` trong `GameCanvas.tsx`, dựng sprite/raster trong `WorldScene`, `MapLoader` và các scene con. React HUD gọi game qua `game/bridge.ts`; Socket.IO và server đã dùng tọa độ chân nhân vật trên mặt phẳng. AuthGateway, Supabase client, profile, ví và migrations nằm ngoài renderer.

Đã thay điểm khởi tạo này bằng Three.js + React Three Fiber 9 (React 19) + Rapier 3D. Mã Phaser cũ và tài nguyên cũ được giữ để tham chiếu; đường chạy mới không import các scene này. Không thay server, shared world data, Supabase, auth, wallet hay migrations.

## Chơi thử

```bash
npm ci
npm run dev
```

Mở **http://localhost:5173/playtest**. Đây là bản demo renderer với hồ sơ khách tạm thời, không mở ví hoặc cấp phiên Supabase. URL `/` tiếp tục đi qua AuthGateway hiện có; khi đăng nhập thành công cũng dùng renderer 3D mới. Cấu hình Supabase như trước để thử tài khoản/ví. Máy trong phiên triển khai này không có `.env.local` Supabase, nên chưa kiểm thử lại OAuth, ví và giao dịch thật.

- WASD / phím mũi tên: di chuyển theo hướng camera.
- Giữ chuột trái/phải và kéo: xoay ngang không giới hạn, ngẩng/cúi có giới hạn.
- Cuộn chuột: thay khoảng cách camera. R: đưa camera về phía sau hướng nhân vật đang nhìn.
- Mobile: kéo joystick bên trái, vuốt trực tiếp trên cảnh để xoay. Hai pointer độc lập nên có thể di chuyển và xoay đồng thời.
- Đi vòng qua bệ cúp, tới cổng **Hang Quỷ Đỏ**. Đi qua giữa cửa để vào phòng; E hoặc nút Tương tác cũng sử dụng được.
- Trong hang: đi khám phá cột đá, tượng và quầy. Cổng ở phía sau vị trí xuất hiện đưa về Đại Sảnh Chung.
- Mở modal/chat sẽ chặn điều khiển; mất focus hoặc hủy pointer sẽ dừng input.

## Môi trường và collision

Mặt đất, từng viên lát sàn (instancing), vách núi, lâu đài, cây, quầy, cầu dốc, cổng vòm, cột/trần/tường nội thất, tượng cúp và các bộ phận nhân vật đều là geometry 3D độc lập với material, ánh sáng và chiều sâu. Biển chữ/tên dùng CanvasTexture nhỏ; không tải ảnh panorama, valley hoặc sprite để dựng thế giới. Mô hình hiện là bộ mesh procedural low-poly, chưa phải bộ nhân vật GLTF có rig mỹ thuật hoàn chỉnh.

Nhân vật có capsule Rapier, gravity, kiểm tra tiếp đất, trượt dọc vật cản và bước lên dốc/bậc thấp. Collider cố định dùng cho đất, mép thế giới, vật thể, cổng, cột, cầu và phòng. Camera raycast về vị trí mong muốn để rút khoảng cách khi gặp vật cản.

`worldLayout.ts` quy đổi tọa độ phòng cũ sang mét và ngược lại; các footprint của vật cản cũ được giữ trùng với server. Chỉ hai scene được mở trong playtest. Cổng đội khác và bảo tàng cũ không được quảng bá như nội dung 3D đã hoàn thành.

## Tích hợp và giới hạn

Event bridge giữ `start`, `travel`, `movement`, `correct`, `remotes`, `block`, `joystick`, `bubble`, `quality`, `screenshot`, `effect` và `state`. Nhân vật từ snapshot Socket.IO được dựng thành mô hình 3D và nội suy. Chat/HUD và chuyển phòng vẫn dùng các handler hiện có. Hiệu ứng xem thử hiện dùng bong bóng phản hồi 3D đơn giản; chưa chuyển toàn bộ particle effect Phaser.

Server hiện có vẫn kiểm tra vị trí/tốc độ và đường đi trên mặt phẳng; gravity/collision theo chiều cao chạy phía client. Không tuyên bố đã có server physics 3D hoặc đồng bộ động lực học đầy đủ. Nhân vật remote hiện hiển thị ở cao độ sàn chung. Chưa benchmark thiết bị mobile thật, tải đông người hoặc các trình duyệt GPU yếu.

## Kiểm chứng

```bash
npm run dev
# Terminal thứ hai
npm test
npm run test:e2e
npm run build
```

Bộ `world3d.spec.ts` kiểm tra WebGL thực, di chuyển bằng phím, capsule bị chặn ở tượng, xoay camera hơn 2π bằng kéo chuột, đi bộ tới cổng, vào nội thất qua server, khám phá và quay về đúng tọa độ, cao độ trên cầu, joystick, camera ở viewport mobile, chặn input trong modal và chơi offline. Ảnh trong `docs/3d-*.png` được chụp từ trình duyệt khi chạy test.

Các E2E Phaser cũ (`game.spec`, `red-cave.spec`, `museum.spec`) dùng `window.__game` và nội dung nhiều scene cũ. Chúng được giữ làm hồ sơ và có lệnh `npm run test:e2e:legacy`; chúng không phải tiêu chí chấp nhận engine mới và chưa được chuyển sang nội dung 3D. `npm run test:e2e` chủ động chạy bộ kiểm tra 3D mới.

Nguồn API: https://r3f.docs.pmnd.rs/getting-started/installation và https://pmndrs.github.io/react-three-rapier/ .

### Kết quả chạy trong phiên triển khai

- `npm test`: **15/15** (gồm kiểm tra hồi quy server và tương thích tọa độ).
- `npm run test:e2e`: **3/3** Chromium/WebGL; ảnh sảnh, góc quay, nội thất, cầu và mobile đã được xem lại.
- `npm run build`: thành công cho frontend và server. Vite còn cảnh báo kích thước chunk physics (khoảng 2,26 MB trước gzip); chưa tối ưu tải lần đầu cho mobile.
- Kiểm tra trực tiếp trong in-app browser: góc camera thay đổi từ 0 đến 7,2 rad khi vị trí đứng yên; capsule dừng trước bệ tượng; room chuyển `plaza → cave:red-devils → plaza`; joystick ở 390×844 thay đổi tọa độ và thao tác kéo thay đổi yaw.
- Đã mở lại `/` và xác nhận giao diện đăng nhập hiện có vẫn hiển thị. Không đăng nhập hoặc thực hiện giao dịch thật.

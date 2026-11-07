# Avatar chibi TRELLIS.2

## Nguồn và bản chạy trong game

- Nguồn dùng để tích hợp là `public/assets/3d/characters/sample_2026-11-07T080842.918.glb`. Tên `chibi-fan-07.glb` trong yêu cầu được dùng cho bản web ở `apps/web/public/assets/3d/characters/chibi-fan-07.glb`.
- GLB nguồn phiên bản 2, một mesh, một primitive tam giác, một vật liệu PBR metallic-roughness. Hai texture WebP nhúng 2048 × 2048 gồm base color và metallic-roughness. Không có skin, skeleton, bone hoặc clip. Đã kiểm tra mặt hướng +Z bằng ảnh chính diện và mặt sau trong game.
- Bounds nguồn theo XYZ là min `(-0.21747, -0.49699, -0.15338)` và max `(0.21723, 0.50056, 0.15634)`. Chiều cao nguồn 0,99755 đơn vị. Runtime căn giữa theo XZ và đưa điểm thấp nhất về y=0, sau đó đặt chiều cao hiển thị 1,90 m.
- Blender Decimate và Meshopt giảm từ 290.106 xuống 63.823 tam giác, từ 10.724.928 xuống 2.285.372 byte. Hai ảnh vẫn 2048 × 2048 với cùng payload WebP. Bản web có một primitive và một material, tương ứng một draw call cho mỗi avatar trong lượt vẽ màu. Lượt vẽ bóng và lượt render phụ có thể tăng số đó.
- Ngân sách ước tính riêng cho hai texture là khoảng 42,7 MiB ở RGBA8 với mipmaps. Đây là ước tính, không phải số đo VRAM. Loader cache asset và các instance chia sẻ mesh, material và texture. Chi phí tam giác và lượt vẽ vẫn tăng theo số người thấy trên màn hình. Chưa đo tải đông người hoặc trên điện thoại thật.

## Runtime và animation

`PlayerAvatar3D.tsx` được gọi từ `Character` cho local và remote. Character giữ nội suy góc quay, remote giữ nội suy vị trí và nickname. Màu đội hiện qua tên người chơi. Áo số 7 giữ màu trong texture nguồn. Controller Rapier, capsule, di chuyển, camera và kết nối realtime dùng luồng hiện tại. NPC và avatar fallback tiếp tục dùng asset cũ.

Avatar mới hiển thị **pose tĩnh** khi đứng, đi, chạy hoặc nhảy. Đi, chạy, nhảy và quay là chuyển động của controller. Các clip xương Idle, Walk, Run, Jump, Sad, Cheer, Wave và Sit chưa có cho mesh mới.

Quy trình rigging tiếp theo trong Blender gồm kiểm tra các vùng dính giữa tay, áo, chân và giày, chỉnh topology khi cần, đặt armature humanoid, weight paint và kiểm tra biến dạng ở vai, khuỷu, hông, gối. Export clip in-place dưới đúng tên rồi kiểm tra animation mixer trên rig mới trong game. Tránh chạy Decimate tĩnh lên bản đã rig mà chưa kiểm tra lại skin weights và pose.

```sh
blender -b --python-exit-code 1 --python tools/blender/optimize_player_avatar.py -- \
  public/assets/3d/characters/sample_2026-11-07T080842.918.glb \
  apps/web/public/assets/3d/characters/chibi-fan-07.glb
```

## Ảnh game thật

- [Chính diện](front.png) · [Góc 3/4](three-quarter.png) · [Mặt bên](side.png) · [Mặt sau](back.png)
- [Đại Sảnh](grand-hall.png) · [Hang MU](hang-mu.png) · [Viewport mobile](mobile.png)

Chromium xác nhận request GLB thành công, avatar xuất hiện tại Đại Sảnh, orbit đủ vòng, đi bằng WASD, chạy bằng Shift, nhảy Space và chạm sàn, vào MU rồi quay lại Đại Sảnh. Kiểm tra build web/server thành công và unit test 31/31.

Hai ca E2E hiện có cũng qua, gồm joystick mobile, orbit và kiểm tra tràn giao diện, cùng với snapshot hai người chơi, chat, đăng nhập và ví bằng fixture. Chưa kiểm tra tải nhiều avatar cùng lúc.

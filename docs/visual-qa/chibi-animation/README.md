# Chibi số 7 · Rig, animation và QA

## Công cụ và nguồn

- Blender 5.2.3 LTS chạy background, Python 3.14.3, pip 26.0 và FFmpeg 8.1.1 có sẵn. Máy dùng Apple M4 10 GPU cores với bộ nhớ hợp nhất. UniRig upstream hướng dẫn cài PyTorch, spconv CUDA và flash-attn nên lượt này không chạy checkpoint trên Mac.
- Space [UniRig](https://huggingface.co/spaces/jasongzy/UniRig) báo RUNNING trên CPU basic. [Schema Gradio](https://jasongzy-unirig.hf.space/gradio_api/info) có `/process_pipeline(input_path, output_format)`, trả File. Đã upload bản web, gửi job với `glb` và chờ phản hồi. Stream timeout sau 100 giây. Lần đọc lại báo lỗi 404. Không có file kết quả UniRig để xác minh. Mixamo chưa được sử dụng.
- Blender dùng chính mesh TRELLIS số 7 đã tối ưu ở `apps/web/public/assets/3d/characters/chibi-fan-07.glb`. Giữ file tĩnh và file xuất nguồn. Pipeline thêm xương và weights theo vùng giải phẫu có chuyển tiếp ở khớp. UV và hai ảnh texture 2048² tiếp tục đi theo mesh.

## Đầu ra và kiểm tra

- [GLB chạy game](../../../apps/web/public/assets/3d/characters/chibi-fan-07-rigged.glb) và [Blender source](../../../assets/source/chibi-fan-07-rigged.blend). GLB khoảng 4,08 MB, một primitive 63.823 tam giác, 18 joints, inverse bind matrices, JOINTS_0, WEIGHTS_0, hai texture nhúng, 15 clip và 6 morph target. Mỗi bản sao avatar có skeleton riêng. Dữ liệu hình học và texture dùng chung.
- Đã import GLB trở lại Blender để kiểm tra armature, weight sum mỗi vertex, morph displacement và đánh giá biến dạng qua các clip. Ở mẫu Walk và Run, điểm thấp nhất của chân sát mặt đất trong sai số khoảng 0,0002 đơn vị nguồn. Đây là đo ở khung lấy mẫu. Kết quả không phải cam kết foot locking cho mọi khung hình.
- Idle 2,50 s, Walk 1,00 s, Run 0,67 s, Jump 0,73 s. SitDown 0,57 s, SitIdle 2,00 s, StandUp 0,53 s. Wave, Cheer, Sad, Cry, Laugh, Taunt, Angry và Celebrate mỗi clip 1,80 s. Mỗi clip có 54 kênh xương do Blender bake, trong đó có kênh giữ pose.
- Blink, Smile, Sad, Angry, Surprised, Cry là morph thực của bề mặt. Mắt và môi cùng nằm trên mesh có texture bake. Blink thu hẹp mắt nhưng mí chưa khép kín, miệng và biểu cảm còn nhẹ. Rig phù hợp chuyển động cơ bản của mẫu chibi này. Gait chạy tại chỗ có thể trượt chân tương đối với tốc độ Rapier, còn điểm tiếp xúc đệm phụ thuộc hình dạng ghế trong từng hang.

## Game và multiplayer

- AnimationMixer phát clip theo trạng thái, crossfade 0,15 s và chuyển SitDown → SitIdle → StandUp theo tương tác. Bone Root giữ tại chỗ. Controller và capsule tiếp tục làm chủ vị trí. Emote khuôn mặt đồng bộ với pose tương ứng.
- Socket.IO dùng snapshot hiện có với trạng thái Run/Jump và một độ lệch nhảy hiển thị giới hạn 0–1,5 m. Walk suy ra từ `moving`, Sit suy ra từ `seated`, emote đến qua sự kiện emoji của phòng. Không truyền bone transforms. Cao độ nhảy hiển thị không thay đổi kiểm tra vị trí máy chủ.
- Build web và server qua trong lượt kiểm tra avatar ban đầu, 31/31 unit tests. Lượt build lại workspace bị chặn bởi các import đang làm dở trong `Environments.tsx` tới `liverpool/LiverpoolCaveScene` và `liverpool/LiverpoolMuseumScene`. Hai module chưa có trong workspace khi kiểm tra. E2E joystick mobile và multiplayer/auth/chat/ví qua. E2E avatar hai trình duyệt kiểm tra cả hai tải GLB rigged, bên quan sát nhận Walk, Run, Jump và độ cao hiển thị, cùng Wave, Laugh và Sad. Đã nhấn E để ngồi ở sofa Hang MU rồi dùng phím di chuyển để đứng lên. Chưa kiểm tra ngồi từ góc nhìn người chơi thứ hai, tải nhiều avatar hoặc điện thoại vật lý.
- Một mẫu Chromium/ANGLE Metal trên Mac ở Đại Sảnh sau khi nhảy ghi 58 FPS, 1.076 draw calls và 2.332.619 tam giác toàn cảnh. Không dùng một mẫu để kết luận tác động FPS của rig.

## Ảnh đã chụp

| Kiểm tra              | Ảnh                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Đại Sảnh              | [Walk](game-walk.png), [Run](game-run.png), [Jump](game-jump.png)                                                                        |
| Animation Test        | [Walk](lab-walk.png), [Run](lab-run.png), [Jump](lab-jump.png), [SitIdle](lab-sitidle.png), [Wave](lab-wave.png), [Cheer](lab-cheer.png) |
| Mặt cận cảnh          | [Neutral](face-neutral.png), [Blink](face-blink.png), [Smile](face-smile.png), [Angry](face-angry.png)                                   |
| Hai trình duyệt       | [Remote Run](remote-run.png), [Remote Wave](remote-wave.png)                                                                             |
| Ghế tương tác Hang MU | [Ngồi sau khi nhấn E](game-sit-mu.png)                                                                                                   |
| Mobile mô phỏng       | [Mobile](game-mobile.png)                                                                                                                |

## Tái tạo

Dùng Blender 5.2.3 hoặc bản có trình xuất Meshopt. Chạy từ thư mục gốc repo. Trên Mac có thể thay `blender` bằng `/Applications/Blender.app/Contents/MacOS/Blender`.

```sh
PYTHONDONTWRITEBYTECODE=1 blender -b --python-exit-code 1 --python scripts/character/auto_rig.py -- \
  apps/web/public/assets/3d/characters/chibi-fan-07.glb \
  apps/web/public/assets/3d/characters/chibi-fan-07-rigged.glb \
  --blend assets/source/chibi-fan-07-rigged.blend

blender -b --python-exit-code 1 --python scripts/character/validate_animated_glb.py -- \
  apps/web/public/assets/3d/characters/chibi-fan-07-rigged.glb
```

Chạy Vite dev rồi mở `/animation-test` để phát từng clip hoặc thử morph. `FFC_QA_URL=http://localhost:5173 node scripts/character/capture_animation.mjs` chụp lại ảnh kiểm tra với Chromium.

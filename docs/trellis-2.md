# Tạo asset 3D bằng TRELLIS.2

Chạy các lệnh từ thư mục gốc `football-fan-cave`. Script dùng Python 3.9+ và thư viện chuẩn. Hãy tạo token có quyền đọc trên trang [Hugging Face Access Tokens](https://huggingface.co/settings/tokens) và dùng tài khoản có hạn mức ZeroGPU. Space quyết định hạn mức và thời gian GPU cho từng tác vụ. Script gọi Space công khai của Microsoft.

Trong zsh, nhập token ẩn qua dấu nhắc, rồi chạy mẫu chibi áo đỏ số 7. Ảnh mẫu nằm ở `images/download.png`. Nếu thiếu ảnh, đặt bản PNG vào đúng đường dẫn đó.

```zsh
read -rs 'HF_TOKEN?Hugging Face token: '
export HF_TOKEN
python3 scripts/generate-3d-asset.py images/download.png characters/chibi-red-7 \
  --resolution 512 --texture-size 1024 --decimation-target 100000
unset HF_TOKEN
```

Kết quả mẫu được lưu tại `public/assets/3d/characters/chibi-red-7.glb`. Với cổng hang, tượng hoặc đồ trang trí, thay đường dẫn ảnh và dùng tên như `props/cave-gate`, `statues/club-legend` hoặc `props/scarf-display`. Script nhận PNG, JPG và JPEG, tạo thư mục con theo tên asset và từ chối ghi đè file có sẵn.

## Cấu hình và kiểm tra

| Tùy chọn | Giá trị trong cấu hình Space đã kiểm tra | Mặc định |
| --- | --- | --- |
| `--resolution` | 512, 1024, 1536 | 1024 |
| `--texture-size` | 1024, 2048, 3072, 4096 | 2048 |
| `--decimation-target` | 100000 đến 500000, bước 10000 | 300000 |
| `--seed` | 0 đến 2147483647 | 0 |
| `--timeout` | Số giây chờ mỗi bước queue hoặc request | 600 |

Script đọc schema và cấu hình trực tiếp ở mỗi lần chạy để xác nhận thứ tự tham số, ID của các hàm và giới hạn UI. Nó khởi tạo session, tải ảnh lên, tiền xử lý ảnh, gọi Generate rồi Extract GLB. Generate lưu State trên Space. Extract lấy State đó từ cùng `session_hash`. Mỗi lệnh tạo asset gửi tối đa một yêu cầu Generate và một yêu cầu Extract. Nếu có lỗi hoặc hết thời gian chờ, kiểm tra Space và hạn mức trước khi chạy lại vì tác vụ đã gửi có thể vẫn chạy hoặc đã dùng quota. Tham khảo [hướng dẫn API của Space](https://huggingface.co/spaces/microsoft/TRELLIS.2/agents.md).

```sh
# Đọc schema và config mà không chạy GPU
python3 scripts/generate-3d-asset.py --check-api

# Kiểm tra GLB sau khi tạo hoặc dùng một file có sẵn
python3 scripts/generate-3d-asset.py --inspect public/assets/3d/characters/chibi-red-7.glb
```

Script kiểm tra container GLB 2.0, phạm vi buffer và accessor, mesh tam giác, UV và ảnh texture PBR nhúng. Kết quả in số mesh, tam giác, material, texture, skin và animation. Kiểm tra hình dáng, màu sắc và độ đúng của ảnh tham chiếu bằng cách mở mô hình trong trình xem 3D.

## Dùng trong game

Game nạp `public/assets/3d/characters/chibi-red-7.glb` bằng `GLTFLoader` tại tủ trưng bày Cristiano Ronaldo trong Phòng Hoài Niệm. Vite đưa file được import với hậu tố `?url` vào bản build. Component căn model theo đáy bounding box, giới hạn kích thước theo tủ và dùng bust cũ khi model đang tải hoặc gặp lỗi. Để dùng một GLB mới cho tủ này, cập nhật đường dẫn import trong `apps/web/src/game/three/RedDevilsMuseum.tsx`.

Mẫu có 0 skin và 0 animation. Game dùng nó như mô hình trưng bày tĩnh. Khi chuẩn bị asset cho avatar, kiểm tra skin, joints và các clip chuyển động trong trình dựng 3D trước khi thay model người chơi. Với cổng hoặc vật trang trí, đặt GLB ở lớp hiển thị và dùng collider Rapier đơn giản riêng khi vật thể cần cản đường. Tủ mẫu dùng collision sẵn có của bản đồ.

Texture WebP nhúng qua `EXT_texture_webp` được hỗ trợ bởi phiên bản `GLTFLoader` trong dự án. Chọn kích thước texture và số mặt thấp hơn khi cần giảm dung lượng cho thiết bị di động.

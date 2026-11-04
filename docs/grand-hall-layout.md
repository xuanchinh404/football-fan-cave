# Quy hoạch Đại Sảnh Chung 3D

Nguồn chuẩn cho tọa độ, cao độ, đường đi và footprint là `packages/shared/grandHall.ts`.

- Tầng 1: 0 m, spawn (0, 27), cổng chính phía Nam. Tượng ở (0, 3); sân minigame phía Đông Nam; đấu trường phía Tây; đền phía Đông; các quầy và góc ảnh quanh quảng trường.
- Tầng 2: 7 m, đại lộ ở z = -22 đến -37. Từ Tây sang Đông: Real Madrid, Arsenal, Liverpool, MU, Chelsea, Man City, Barcelona.
- Tầng 3: 15 m, Bayern (-33, -53), PSG (33, -53). Cầu thang ở x = ±37,5 nối từ tầng 2. Hai sân núi có mặt đỡ và đường tiếp cận liên tục.
- Cầu thang chính (x = 0) và hai cầu dốc (x = ±41) nối quảng trường lên đại lộ.

| Hang | Tầng | Nội thất |
|---|---|---|
| Bayern Munich | 3 | Sắp ra mắt |
| PSG | 3 | Sắp ra mắt |
| Real Madrid | 2 | Sắp ra mắt |
| Arsenal / Pháo Thủ | 2 | Sắp ra mắt |
| Liverpool / The Kop | 2 | Sắp ra mắt |
| Manchester United / Quỷ Đỏ | 2 | Vào được phòng 3D hiện có và quay lại |
| Chelsea / The Blues | 2 | Sắp ra mắt |
| Manchester City / Citizens | 2 | Sắp ra mắt |
| Barcelona | 2 | Sắp ra mắt |

Không có cổng Hang Chung hoặc cổng Phòng Truyền Thống ở đại sảnh. Giá trị `common` trong hồ sơ cũ vẫn được đọc như fan trung lập, không bị xóa khỏi dữ liệu tài khoản. Bảo tàng cũ nằm trong dữ liệu nội thất MU và không được quảng bá là cảnh 3D hoàn thiện mới.

## Client/server

Giao thức tiếp tục dùng `x,y` cho tọa độ mặt đất; trường `height` bổ sung là mét theo trục đứng. Server suy ra cao độ từ layout, từ chối cao độ giả, đường xuyên khe trống/nhảy qua vách và vị trí xuyên footprint. Snapshot có height để nhân vật remote không đứng dưới tầng trên. Client cũ thiếu height vẫn được server suy ra từ vị trí.

Rapier dùng capsule và collider từ cùng surface/footprint. Tốc độ chạy có giới hạn riêng 330 đơn vị/s, đi bộ 220; ngân sách server dùng tốc độ tối đa và giới hạn kích thước burst như trước. Không tin height, giá vật phẩm hoặc số dư do frontend tự gửi.

Token, hồ sơ, API mua hàng, ví, ledger và database dùng cơ chế có sẵn. Test multiplayer dùng Auth/PostgREST fixture cục bộ; không thêm chế độ bỏ qua token vào ứng dụng production.

Lưu ý đối chiếu: ảnh tổng hợp mới có một số vị trí khác phần mô tả chữ. Bản triển khai ưu tiên yêu cầu lặp lại tại mục 5/21/22 của master prompt: Bayern và PSG cao nhất, Real và Barcelona ở đại lộ tầng giữa. Đây là lựa chọn quy hoạch có chủ ý, không tuyên bố trùng mọi chi tiết vị trí trong từng khung ảnh.

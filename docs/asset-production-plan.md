# Kế hoạch sản xuất asset — Đại Sảnh Chung

Ảnh tham chiếu chính thức: [grand-hall-final.png](references/grand-hall-final.png), chỉ dùng quy hoạch và art direction, không được tải làm nền thế giới.

## Bộ model đã tích hợp

Tất cả file dưới `apps/web/public/models/` được tạo nguyên bản bằng script `scripts/models/build_assets.py`, xuất GLB bằng Blender 4.3.2. Blender được lấy từ download.blender.org; không cần Blender để chạy game. Không sử dụng logo hoặc mesh thương hiệu từ ảnh. Các chữ cái và ký hiệu trong game là nhận diện riêng.

| Asset | File | Trạng thái và phương pháp | Quyền nguồn | Ảnh hưởng chất lượng |
|---|---|---|---|---|
| Cổng đá | portal-grand.glb | Đá ghép có bevel, vault rỗng có chiều dày, cột, khung bảng, viền vàng và lồng đèn; tint theo 9 hang | Tạo mới trong repo | Cao; mới dùng chung một bộ kit, chưa có silhouette riêng hoàn toàn cho từng hang |
| Vách núi | cliff-sculpted.glb | Mesh điêu khắc/displacement có UV, texture bề mặt tạo bằng thuật toán | Tạo mới trong repo | Cao; chưa đạt địa chất/vegetation như concept |
| Cầu đá | bridge-stone.glb | Từng mặt cầu, cột và tay vịn dốc, cấu kiện 3D | Tạo mới trong repo | Trung bình; còn cần nhịp cầu đá có chân vòm hữu cơ |
| Cầu gỗ | bridge-wood.glb | Từng ván gỗ bevel, cột và dây tay vịn, dốc liên tục | Tạo mới trong repo | Trung bình; cần art pass cho dây võng/giá đỡ |
| Quầy | market-stall.glb | Mái vải cong sọc, tua mái, cột, kệ, chai/lọ, bóng và đèn | Tạo mới trong repo | Cao; còn cần thêm phong phú hàng hóa riêng từng quầy |
| Đình/đền | pavilion.glb | Mái cong, nan mái, cột và vật liệu riêng | Tạo mới trong repo | Cao; đấu trường và đền đang dùng chung kit với tỷ lệ khác nhau |
| Cây hoa | cherry-tree.glb | Thân/cành cong, khối lá, cụm cánh hoa 3D | Tạo mới trong repo | Cao; cần thêm tán cây dày và các loại cây/hoa chuyên biệt |
| Đèn lồng | lantern.glb | Vỏ kim loại bao kính phát sáng | Tạo mới trong repo | Trung bình |
| Tượng bóng vàng | golden-football.glb | Quả bóng nhiều panel riêng kiểu truncated icosahedron, bệ tiện và laurel | Tạo mới trong repo | Cao; chưa có phản xạ screen-space hoặc bake GI |
| Nhân vật | fan-chibi.glb | SkinnedMesh + armature, tóc/đầu/mắt/trang phục/giày tạo hình riêng | Tạo mới trong repo | Rất cao; là model procedural stylized, còn cách model nhân vật được sculpt/retopology thủ công trong ảnh |
| Bàn ghế | fan-table.glb | Bàn tròn, ghế, chân và vật liệu gỗ/kim loại | Tạo mới trong repo | Trung bình |

Nhân vật có Idle, Walk, Run, Turn, Wave, Cheer, Laugh, Sad, Celebrate và Sit. Loader dùng GLTFLoader, clone skeleton độc lập và AnimationMixer, có chuyển clip mượt. Không đưa model hộp cũ làm nhân vật chính cuối cùng.

## Tài nguyên 3D ở runtime

- Địa hình, sàn có texture lát nhiều biến thể, collider theo bề mặt dùng chung với server.
- Cầu thang được dựng theo cao độ bậc; collider là mặt dốc liên tục để tránh kẹt capsule.
- Waterfall shader có dòng chảy, hồ ở hẻm, vfx portal; các mặt VFX không thay thế công trình 3D.
- Sân minigame, khung thành, lưới và bóng physics là geometry 3D.
- Bảng hiệu, tên, dữ liệu minh họa dùng texture chữ riêng; không ghép ảnh concept thành texture kiến trúc.
- Các collider được giữ đơn giản hơn mesh trang trí để gameplay không phụ thuộc mật độ polygon.

## Asset cần sản xuất tiếp

1. **Chưa có chín kit hang riêng:** cần sculpt/UV/bake texture có silhouette đặc trưng và nguồn quyền rõ ràng cho từng hang. Hiện màu, ký hiệu và vị trí khác nhau; kiến trúc còn lặp.
2. **Nhân vật cần art pass chuyên nghiệp:** tóc nhiều tầng, tay ngón/khuỷu/gối, skin weighting mềm, facial blendshapes và animation mocap/keyframe hoàn thiện. Rig hiện đáp ứng loader/clip và gameplay, chưa đạt vẻ đẹp cinematic của khung 13.
3. **Terrain art pass:** vách núi có strata, moss/roughness/normal maps được bake; đá chuyển tiếp, ground cover, cảnh quan xa và ngã rẽ hữu cơ.
4. **Vegetation kit:** cây anh đào tán dày, cây xanh nhiều loại, lá/hoa có LOD và gió, bờ hồ/hoa trồng theo cụm tự nhiên.
5. **Nước:** waterfall foam/mist nhiều lớp, mặt nước phản xạ chọn lọc và âm thanh có license. Chưa có hạ tầng audio nên không tự phát nhạc lấy từ mạng.
6. **Kiến trúc:** đấu trường/đền/phố hàng/góc chụp cần kit riêng, nội thất trưng bày phong phú, dải đèn và pennant có cloth animation.
7. **Đài phun nước:** tượng/bệ bóng hiện đã có; model fountain phun tia hoàn chỉnh chưa có.
8. **Nội thất tám hang:** chưa phát triển, cổng ghi rõ sắp ra mắt; MU giữ nội thất thử nghiệm hiện có, cần art pass cùng phong cách đại sảnh.
9. **Tối ưu:** LOD cho mesh/cây/NPC, texture atlas/KTX2, meshopt/Draco, batch đèn/lan can, culling không gian; cần đo trên điện thoại thật.

## Kết luận art direction

Bản này thực hiện quy hoạch, mô hình 3D có UV/vật liệu, shader, rig và gameplay, nhưng **không được xem là bản tái tạo cinematic chính xác hoặc đã đạt toàn bộ độ chi tiết của ảnh**. Ảnh chụp QA và danh sách còn thiếu phải đi kèm báo cáo. Không có cam kết quyền khai thác logo đội bóng chính thức; bộ asset hiện tránh các logo đó.

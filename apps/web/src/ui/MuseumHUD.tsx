import { HALL } from '../../../../packages/shared/museum';
import type { Point } from '../../../../packages/shared/world';
export function MuseumHUD({
  position,
  openMap,
  quiz,
  photo,
}: {
  position: Point;
  openMap: () => void;
  quiz: () => void;
  photo: () => void;
}) {
  const zone = HALL.zones.reduce((a, b) =>
    Math.hypot(a.x - position.x, a.y - position.y) < Math.hypot(b.x - position.x, b.y - position.y)
      ? a
      : b,
  );
  return (
    <>
      <div className="museum-breadcrumb">
        ⌂ Hang Quỷ Đỏ <span>›</span> Phòng Truyền Thống
      </div>
      <div className="museum-location">
        <span>HALL OF LEGENDS</span>
        <strong>
          {zone.id} · {zone.label}
        </strong>
        <small>WASD / ↑↓←→ · E khám phá</small>
      </div>
      <aside className="museum-actions" aria-label="Hướng dẫn bảo tàng">
        <button onClick={openMap}>⌖ Bản đồ 7 khu vực</button>
        <button onClick={quiz}>♜ Đố vui lịch sử</button>
        <button onClick={photo}>▣ Chụp ảnh kỷ niệm</button>
        <p>Lối về sảnh ở phía nam ↓</p>
      </aside>
    </>
  );
}

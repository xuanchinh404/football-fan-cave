import { MuseumExhibitPanel } from './MuseumExhibitPanel';
import type { WorldState } from '../game/bridge';
import { BLUES_CAVE, BLUES_MUSEUM, bluesMetres } from '../../../../packages/shared/chelsea/layout';
import {
  CHELSEA_VERIFIED_AT,
  type BluesExhibit,
} from '../../../../packages/shared/chelsea/content';
export function ChelseaHUD({
  world,
  openMap,
  notice,
}: {
  world: WorldState;
  openMap: () => void;
  notice: (s: string) => void;
}) {
  const museum = world.map === 'chelsea-museum',
    p = bluesMetres(world.position);
  const zones = museum ? BLUES_MUSEUM.zones : BLUES_CAVE.zones;
  const zone = zones.reduce((a, b) =>
    Math.hypot(a.x - world.position.x, a.y - world.position.y) <
    Math.hypot(b.x - world.position.x, b.y - world.position.y)
      ? a
      : b,
  );
  return (
    <>
      {museum && (
        <div className="museum-breadcrumb">
          ⌂ Hang The Blues <span>›</span> Phòng Truyền Thống
        </div>
      )}
      <div className="cave-wayfinding" aria-label="Chỉ dẫn Chelsea">
        <span>{museum ? 'THE BLUES HERITAGE HALL' : 'HANG THE BLUES · CÓ ANH EM Ở ĐÂY'}</span>
        <strong>
          {museum
            ? zone.label
            : p.x < -6
              ? 'Góc Tâm Sự Fan · Trà nóng, tim nguội.'
              : p.z < -8
                ? 'Hành lang Phòng Truyền Thống · Đi tiếp theo thảm xanh'
                : 'Thua một trận. Còn cả hội ở đây.'}
        </strong>
        <small>
          {museum
            ? '← Huyền thoại · ↑ HLV · → Lịch sử · ↓ Lối về hang'
            : '← Góc tâm sự · ↗ Phòng Truyền Thống · ↓ Đại Sảnh'}
        </small>
      </div>
      {museum && (
        <details className="blues-guide">
          <summary>♜ Khám phá bảo tàng</summary>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                openMap();
                notice(
                  `${z.label}: ${z.id === 'managers' ? 'tường phía bắc' : z.id === 'legends' ? 'hành lang phía tây' : z.id === 'history' ? 'hành lang phía đông' : z.id === 'matches' ? 'khu phía đông nam' : 'các tủ kính giữa sảnh'}. Đi bộ tới hiện vật, nhấn E để đọc.`,
                );
              }}
            >
              {z.label}
            </button>
          ))}
          <button
            onClick={() => notice('Thư viện ở góc đông nam; chưa có ảnh hoặc video được cấp phép.')}
          >
            Thư viện ảnh
          </button>
          <button onClick={() => notice('Đi về cổng phía nam để quay lại Hang The Blues.')}>
            ↓ Quay lại Hang Chelsea
          </button>
        </details>
      )}
    </>
  );
}
export function ChelseaExhibitPanel({ exhibit }: { exhibit: BluesExhibit }) {
  return (
    <MuseumExhibitPanel
      exhibit={exhibit}
      hall="THE BLUES HERITAGE HALL"
      club="Chelsea"
      verifiedAt={CHELSEA_VERIFIED_AT}
    />
  );
}

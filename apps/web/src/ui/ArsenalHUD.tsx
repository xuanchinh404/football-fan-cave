import type { WorldState } from '../game/bridge';
import { ARSENAL_MUSEUM } from '../../../../packages/shared/arsenal/layout';

const hints: Record<string, string> = {
  trophies: 'Các tủ kính ở giữa sảnh. Đi đến gần tủ và nhấn E.',
  managers: 'Dãy hồ sơ HLV ở tường phía bắc.',
  legends: 'Đi dọc dãy áo phía tây.',
  matches: 'Các kiosk trận đấu nằm gần lối vào.',
  history: 'Đi dọc dãy dấu ấn phía đông.',
  archive: 'Kiosk phía tây nam dẫn đến tư liệu chính thức.',
  records: 'Kiosk phía đông nam kể về mùa Invincibles.',
  exit: 'Đi qua cổng phía nam để trở về hang.',
};
export function ArsenalHUD({
  world,
  openMap,
  notice,
}: {
  world: WorldState;
  openMap: () => void;
  notice: (text: string) => void;
}) {
  const museum = world.map === 'arsenal-museum';
  return (
    <>
      {museum && (
        <div className="museum-breadcrumb">
          ⌂ Hang Arsenal <span>›</span> Phòng Truyền Thống
        </div>
      )}
      <div className="cave-wayfinding" aria-label="Chỉ dẫn Arsenal">
        <span>{museum ? 'THE GUNNERS HERITAGE HALL' : 'HANG ARSENAL'}</span>
        <strong>{museum ? 'Đi bộ tới hiện vật · E để khám phá' : 'Pháo Thủ Trú Ẩn'}</strong>
        <small>
          {museum
            ? '← Huyền thoại · ↑ HLV · → Lịch sử · ↓ Về hang'
            : '← Góc tâm sự · ↗ Phòng Truyền Thống · ↓ Đại Sảnh'}
        </small>
      </div>
      <details className="blues-guide gunners-guide">
        <summary>{museum ? '♜ Menu bảo tàng' : '⌖ Chỉ đường'}</summary>
        {museum ? (
          <>
            <button onClick={openMap}>Tổng quan</button>
            {ARSENAL_MUSEUM.zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  openMap();
                  notice(hints[zone.id]);
                }}
              >
                {zone.label}
              </button>
            ))}
          </>
        ) : (
          <button
            onClick={() => {
              openMap();
              notice('Đi qua cổng phía nam để quay về Đại Sảnh Chung.');
            }}
          >
            ↓ Quay về Đại Sảnh
          </button>
        )}
      </details>
    </>
  );
}

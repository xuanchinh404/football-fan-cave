import type { WorldState } from '../game/bridge';
import { KOP_CAVE, KOP_MUSEUM } from '../../../../packages/shared/liverpool/layout';

export function LiverpoolHUD({ world, openMap }: { world: WorldState; openMap: () => void }) {
  const museum = world.map === 'liverpool-museum';
  const zones = museum ? KOP_MUSEUM.zones : KOP_CAVE.zones;
  const distance = (p: { x: number; y: number }) =>
    Math.hypot(p.x - world.position.x, p.y - world.position.y);
  const zone = zones.reduce((closest, candidate) =>
    distance(candidate) < distance(closest) ? candidate : closest,
  );
  return (
    <>
      {museum && (
        <div className="museum-breadcrumb">
          ⌂ Hang Liverpool <span>›</span> Phòng Truyền Thống
        </div>
      )}
      <div className="cave-wayfinding" aria-label="Chỉ dẫn Liverpool">
        <span>{museum ? 'PHÒNG TRUYỀN THỐNG LIVERPOOL FC' : 'HANG LIVERPOOL'}</span>
        <strong>{zone.label}</strong>
        <small>
          {museum
            ? 'Đi tới hiện vật · E để khám phá'
            : '← Góc tâm sự & Lounge · ↗ Phòng Truyền Thống · ↘ Ra Hang'}
        </small>
      </div>
      <details className="blues-guide gunners-guide">
        <summary>{museum ? '♜ Menu bảo tàng' : '⌖ Chỉ đường'}</summary>
        <button onClick={openMap}>Tổng quan</button>
        {zones.map(({ id, label }) => (
          <button key={id} onClick={openMap}>
            {label}
          </button>
        ))}
      </details>
    </>
  );
}

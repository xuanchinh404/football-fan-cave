import { useState } from 'react';
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
  const [season, setSeason] = useState(exhibit.seasons?.[0] || '');
  const [coach, setCoach] = useState(
    () => exhibit.coaches?.find((c) => c.current) ?? exhibit.coaches?.[0],
  );
  const verifiedDate = CHELSEA_VERIFIED_AT.split('-').reverse().join('/');
  return (
    <>
      <div className="eyebrow">THE BLUES HERITAGE HALL · {exhibit.type.toUpperCase()}</div>
      <div className="museum-exhibit-mark">{exhibit.type === 'trophy' ? '♜' : '✦'}</div>
      <h2>{exhibit.heading}</h2>
      <p className="museum-exhibit">{exhibit.detail}</p>
      {exhibit.coaches && (
        <div className="blues-seasons" aria-label="Chọn huấn luyện viên">
          {exhibit.coaches.map((c) => (
            <button key={c.id} aria-pressed={coach?.id === c.id} onClick={() => setCoach(c)}>
              {c.name} · {c.tenure}
            </button>
          ))}
        </div>
      )}
      {coach && (
        <p className="info-box">
          <strong>{coach.name}</strong> · {coach.tenure}
          <br />
          {coach.story}
        </p>
      )}
      {exhibit.seasons && (
        <div className="blues-seasons" aria-label="Chọn mùa giải">
          {exhibit.seasons.map((s) => (
            <button key={s} aria-pressed={season === s} onClick={() => setSeason(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      {season && (
        <p className="info-box">
          {exhibit.stories?.[season] ||
            `Mùa ${season} · ${exhibit.heading}. Xem hồ sơ Chelsea FC để đọc tư liệu của danh hiệu này.`}
        </p>
      )}
      <a
        className="museum-source"
        href={coach?.source ?? exhibit.source}
        target="_blank"
        rel="noreferrer"
      >
        Nguồn dữ liệu · Chelsea / hồ sơ lịch sử ↗
      </a>
      <small className="blues-verified">
        Đối chiếu {verifiedDate} · Tư liệu minh họa bằng mô hình gốc.
      </small>
    </>
  );
}

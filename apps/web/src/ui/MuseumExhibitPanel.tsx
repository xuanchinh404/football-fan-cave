import { useState } from 'react';
type ExhibitInfo = {
  type: string;
  heading: string;
  detail: string;
  source: string;
  seasons?: string[];
  stories?: Record<string, string>;
  seasonSources?: Record<string, string>;
  coaches?: {
    id: string;
    name: string;
    tenure: string;
    story: string;
    current: boolean;
    source: string;
  }[];
};
export function MuseumExhibitPanel({
  exhibit,
  hall,
  club,
  verifiedAt,
}: {
  exhibit: ExhibitInfo;
  hall: string;
  club: string;
  verifiedAt: string;
}) {
  const [season, setSeason] = useState(exhibit.seasons?.[0] || '');
  const [coach, setCoach] = useState(
    () => exhibit.coaches?.find((c) => c.current) ?? exhibit.coaches?.[0],
  );
  const verifiedDate = verifiedAt.split('-').reverse().join('/');
  return (
    <>
      <div className="eyebrow">
        {hall} · {exhibit.type.toUpperCase()}
      </div>
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
            `Mùa ${season} · ${exhibit.heading}. Xem hồ sơ ${club} để đọc tư liệu của danh hiệu này.`}
        </p>
      )}
      <a
        className="museum-source"
        href={coach?.source ?? exhibit.seasonSources?.[season] ?? exhibit.source}
        target="_blank"
        rel="noreferrer"
      >
        Nguồn dữ liệu · {club} / hồ sơ lịch sử ↗
      </a>
      {exhibit.type === 'manager' && !exhibit.coaches && (
        <a
          className="museum-source"
          href="/art/manager-portrait-credits.md"
          target="_blank"
          rel="noreferrer"
        >
          Nguồn chân dung ↗
        </a>
      )}
      <small className="blues-verified">
        Đối chiếu {verifiedDate}
        {exhibit.type === 'manager' ? '.' : ' · Tư liệu minh họa bằng mô hình gốc.'}
      </small>
    </>
  );
}

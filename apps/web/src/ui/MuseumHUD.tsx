import { HALL } from '../../../../packages/shared/museum';
import { hallText, type HallLanguage } from '../../../../packages/shared/museum/hall';
import type { Point } from '../../../../packages/shared/world';

const actions = {
  vi: {
    menu: 'Hướng dẫn bảo tàng',
    map: 'Bản đồ khu vực',
    quiz: 'Đố vui lịch sử',
    photo: 'Chụp ảnh kỷ niệm',
    explore: 'F khám phá',
  },
  en: {
    menu: 'Museum guide',
    map: 'Museum map',
    quiz: 'History quiz',
    photo: 'Take a photo',
    explore: 'F to explore',
  },
};

export function MuseumHUD({
  position,
  lang,
  openMap,
  quiz,
  photo,
}: {
  position: Point;
  lang: HallLanguage;
  openMap: () => void;
  quiz: () => void;
  photo: () => void;
}) {
  const zone = HALL.zones.reduce((a, b) =>
    Math.hypot(a.x - position.x, a.y - position.y) < Math.hypot(b.x - position.x, b.y - position.y)
      ? a
      : b,
  );
  const labels = hallText[lang];
  const text = actions[lang];
  return (
    <>
      <div className="museum-breadcrumb">
        ⌂ {labels.cave} <span>›</span> {labels.title}
      </div>
      <div className="museum-location">
        <span>MANCHESTER UNITED</span>
        <strong>{lang === 'en' ? zone.en : zone.label}</strong>
        <small>WASD / ↑↓←→ · {text.explore}</small>
      </div>
      <aside className="museum-actions" aria-label={text.menu}>
        <button onClick={openMap}>⌖ {text.map}</button>
        <button onClick={quiz}>♜ {text.quiz}</button>
        <button onClick={photo}>▣ {text.photo}</button>
        <p>{labels.exitHint} ↓</p>
      </aside>
    </>
  );
}

import { useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, ChevronDown, CircleUserRound, Film, Images, Landmark, Trophy } from 'lucide-react';
import {
  CITY_CARDS, CITY_COPY, CITY_SECTIONS, cityPhoto, cityText,
  type CityCard, type CityLanguage, type CitySection,
} from '../../../../packages/shared/city/content';
import type { cityArea } from '../../../../packages/shared/city/layout';
import './city.css';

const sectionIcons = { overview: Landmark, honours: Trophy, managers: CircleUserRound, legends: CircleUserRound,
  matches: Film, timeline: CalendarDays, gallery: Images, records: BarChart3 };

export function CityHUD({ lang, area, open }: {
  lang: CityLanguage; area: ReturnType<typeof cityArea>; open: (section: CitySection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <aside className="city-hud" aria-label={cityText(lang, CITY_COPY.hall)}>
    <button className="city-hud-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <img src="/art/city/crest.svg" alt="" />
      <span>{cityText(lang, area === 'museum' ? CITY_COPY.museum : CITY_COPY.hall)}</span>
      <ChevronDown size={15} />
    </button>
    <nav hidden={!expanded}>
      {(Object.keys(CITY_SECTIONS) as CitySection[]).map((key) => {
        const Icon = sectionIcons[key];
        return <button key={key} onClick={() => { open(key); setExpanded(false); }}>
          <Icon size={16} />{cityText(lang, CITY_SECTIONS[key])}
        </button>;
      })}
    </nav>
  </aside>;
}

function CityCardDetail({ entry, lang }: { entry: CityCard; lang: CityLanguage }) {
  const title = cityText(lang, entry.title);
  return <article className="city-card">
    {entry.image && <img src={cityPhoto(entry.image)} alt={entry.imageCaption ? cityText(lang, entry.imageCaption) : title} />}
    <div>
      {entry.period && <p className="city-period">{entry.period}</p>}
      <h3>{title}</h3>
      <p>{cityText(lang, entry.detail)}</p>
      {entry.seasons && <>
        <p className="city-period">{entry.seasons.length} {lang === 'en' ? 'titles' : 'lần vô địch'}</p>
        <ul className="city-seasons">{entry.seasons.map((season) => <li key={season}>{season}</li>)}</ul>
      </>}
      <a href={entry.source} target="_blank" rel="noreferrer">{cityText(lang, CITY_COPY.source)}</a>
    </div>
  </article>;
}

export function CityCollection({ section, id, lang }: {
  section: CitySection; id?: string; lang: CityLanguage;
}) {
  const initial = id ? Object.values(CITY_CARDS).flat().find((entry) => 'city-' + entry.id === id) : undefined;
  const [selected, setSelected] = useState(initial);
  const [collection, setCollection] = useState(section);
  const entries = collection !== 'overview' ? CITY_CARDS[collection] : [];
  return <div className="city-collection">
    <div className="eyebrow">MANCHESTER CITY · HERITAGE HALL</div>
    <h2>{cityText(lang, CITY_SECTIONS[collection])}</h2>
    {collection === 'overview' && !selected && <>
      <p>{lang === 'en'
        ? 'Follow the blue carpet to the ship relief, turn left for the lounge, or take the right arch into the Heritage Hall. The entrance tunnel also leads back to the Grand Hall.'
        : 'Theo thảm xanh đến phù điêu con tàu, rẽ trái vào Góc Tâm Sự hoặc qua vòm bên phải để đến Phòng Truyền Thống. Đường hầm ở cửa vào cũng dẫn về Đại Sảnh.'}</p>
      <div className="city-collection-grid">
        {(Object.keys(CITY_CARDS) as (keyof typeof CITY_CARDS)[]).map((key) =>
          <button key={key} onClick={() => setCollection(key)}>
            <BookOpen size={16} />{cityText(lang, CITY_SECTIONS[key])}
          </button>)}
      </div>
    </>}
    {entries.length > 0 && <div className="city-collection-grid" aria-label={cityText(lang, CITY_SECTIONS[collection])}>
      {entries.map((entry) => <button key={entry.id} aria-pressed={selected?.id === entry.id}
        onClick={() => setSelected(entry)}>{cityText(lang, entry.title)}</button>)}
    </div>}
    {(selected ?? entries[0]) && <CityCardDetail entry={selected ?? entries[0]} lang={lang} />}
    <a className="city-credits" href="/art/city/credits.html" target="_blank" rel="noreferrer">
      {lang === 'en' ? 'Image credits' : 'Nguồn ảnh và giấy phép'}
    </a>
  </div>;
}

export function CityMatchBoard({ lang, news, chat }: { lang: CityLanguage; news: boolean; chat: () => void }) {
  return <div className="city-collection">
    <div className="eyebrow">MANCHESTER CITY · BLUE MOON</div>
    <h2>{cityText(lang, news ? CITY_COPY.news : CITY_COPY.score)}</h2>
    {!news && <p className="city-period">{cityText(lang, CITY_COPY.pending)}</p>}
    <div className="city-collection-grid">
      <a href="https://www.mancity.com/fixtures/mens" target="_blank" rel="noreferrer">
        {lang === 'en' ? 'Official fixtures' : 'Lịch thi đấu chính thức'}
      </a>
      <a href="https://www.mancity.com/results/mens" target="_blank" rel="noreferrer">
        {lang === 'en' ? 'Official results' : 'Kết quả chính thức'}
      </a>
      <a href="https://www.mancity.com/news/mens" target="_blank" rel="noreferrer">
        {lang === 'en' ? 'Club news' : 'Tin từ CLB'}
      </a>
      <button onClick={chat}>{lang === 'en' ? 'Open City chat' : 'Mở chat Hang Man City'}</button>
    </div>
  </div>;
}

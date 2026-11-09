import { useState } from 'react';
import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Image,
  Landmark,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import {
  realChecked,
  realCoaches,
  realCoachSource,
  realCoachSourceEn,
  realCoachTerms,
  realCopy,
  realDisplayCups,
  realEras,
  realGallery,
  realHistory,
  realHonours,
  realLegends,
  realMatches,
  realPhoto,
  realPhotoCredits,
  realSections,
  realTermLabel,
  realTermsInEra,
  realText,
  realTimeline,
  type RealCopy,
  type RealLang,
  type RealSection,
} from '../../../../packages/shared/real/content';
import { realArea, realMetres, REAL_ROOMS } from '../../../../packages/shared/real/layout';
import { CAVE_CONNECTIONS } from '../../../../packages/shared/caveConnections';
import type { Point } from '../../../../packages/shared/world';
import './real-madrid.css';

const icons = [Landmark, Trophy, Users, Shield, Film, Image, Clock, ChartNoAxesColumn];
const historyMatches =
  'https://www.uefa.com/uefachampionsleague/news/028d-1aeb332cb9f3-a3b8aa15dac5-1000--champions-league-final-facts-borussia-dortmund-vs-real-m/';
const clasicoSource =
  'https://www.realmadrid.com/es-ES/futbol/partidos/copa-del-rey/barcelona-real-madrid/05-04-2023';
const words = {
  menu: ['Sổ tay Real Madrid', 'Real Madrid guide'],
  source: ['Nguồn', 'Source'],
  back: ['Quay lại danh sách', 'Back to list'],
  current: ['HLV hiện tại', 'Current coach'],
  firstTeam: ['HLV đội một', 'First-team coach'],
  archive: ['Chân dung tư liệu', 'Archival portrait'],
  noPortrait: ['Chưa có ảnh được cấp phép', 'Licensed portrait unavailable'],
  pendingHonours: [
    'Chưa có chi tiết thành tích được đối chiếu trong hồ sơ này.',
    'This profile is awaiting a verified honours summary.',
  ],
  seasons: ['Các mùa vô địch', 'Winning seasons'],
  checked: ['Đã kiểm tra', 'Verified'],
  chapters: ['Các thời kỳ', 'Eras'],
  seat: ['Ngồi sofa', 'Sit on the sofa'],
  stand: ['Đứng dậy', 'Stand up'],
  browse: ['Mở bộ sưu tập', 'Browse the collection'],
} as const;
const nationalityNames: Record<string, RealCopy> = {
  espanola: ['Tây Ban Nha', 'Spanish'],
  hungaro: ['Hungary', 'Hungarian'],
  inglesa: ['Anh', 'English'],
  uruguaya: ['Uruguay', 'Uruguayan'],
  argentina: ['Argentina', 'Argentine'],
  paraguaya: ['Paraguay', 'Paraguayan'],
  yugoslava: ['Nam Tư', 'Yugoslav'],
  serbio: ['Serbia', 'Serbian'],
  serbia: ['Serbia', 'Serbian'],
  holandesa: ['Hà Lan', 'Dutch'],
  galesa: ['Xứ Wales', 'Welsh'],
  'hispano-argentino': ['Tây Ban Nha và Argentina', 'Spanish and Argentine'],
  italiana: ['Ý', 'Italian'],
  alemana: ['Đức', 'German'],
  portuguesa: ['Bồ Đào Nha', 'Portuguese'],
  brasilena: ['Brazil', 'Brazilian'],
  chilena: ['Chile', 'Chilean'],
  francesa: ['Pháp', 'French'],
};
const realNationality = (lang: RealLang, value: string) => {
  const key = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return nationalityNames[key] ? realText(lang, nationalityNames[key]) : value;
};

const museumIds: Record<string, RealSection> = {
  'real-coaches': 'coaches',
  'real-legends': 'legends',
  'real-matches': 'matches',
  'real-timeline': 'timeline',
  'real-gallery': 'gallery',
};

export function realPrompt(id: string, label: string, lang: RealLang, seated: boolean) {
  if (id.startsWith('real-seat-')) return realText(lang, seated ? words.stand : words.seat);
  if (id.startsWith('real-cup-')) {
    const cup = realHonours.find((h) => h.id === realDisplayCups[Number(id.split('-').at(-1))]);
    return cup ? realText(lang, cup.title) : label;
  }
  if (id === 'real-score' || id === 'real-lounge-score') return realText(lang, realCopy.score);
  return museumIds[id] ? realText(lang, realCopy[museumIds[id]]) : label;
}

export function RealMap({
  lang,
  position,
  expanded = false,
}: {
  lang: RealLang;
  position: Point;
  expanded?: boolean;
}) {
  const { x, z } = realMetres(position);
  const { offset } = CAVE_CONNECTIONS.real;
  const tunnelEnd = CAVE_CONNECTIONS.real.rampStart - offset[2] + 3;
  const region = realArea(position);
  return (
    <figure
      className={'real-minimap' + (expanded ? ' expanded' : '')}
      aria-label={realText(lang, realCopy[region])}
    >
      <figcaption>
        <span>♛</span> {realText(lang, realCopy[region])}
      </figcaption>
      <svg
        viewBox={region === 'tunnel' ? `-21 -33 72 ${tunnelEnd + 38}` : '-21 -33 72 47'}
        role="img"
        aria-label={realText(lang, ['Vị trí của bạn trong hang', 'Your location in the cave'])}
      >
        <rect
          x="-3.2"
          y="4"
          width="6.4"
          height={tunnelEnd - 4}
          fill="#27294c"
          stroke="#a57e4b"
          strokeWidth=".45"
        />
        {Object.entries(REAL_ROOMS).map(([id, r]) => (
          <rect
            key={id}
            x={r.left}
            y={r.back}
            width={r.right - r.left}
            height={r.front - r.back}
            rx="1.1"
            fill={region === id ? '#415eac' : '#252d61'}
            stroke="#d3a85f"
            strokeWidth=".45"
          />
        ))}
        <rect
          x="-15.6"
          y="-11.6"
          width="10"
          height="12.1"
          rx=".8"
          fill={region === 'lounge' ? '#6845ad' : '#433574'}
          stroke="#9b78cf"
          strokeWidth=".34"
        />
        <g fill="#ffdfa3" fontSize="4" textAnchor="middle">
          <text x="-10.6" y="-3">
            ♟
          </text>
          <text x="0" y="-12">
            ♛
          </text>
          <text x="34" y="-12">
            ▥
          </text>
          <text x="0" y={region === 'tunnel' ? tunnelEnd - 2 : 11}>
            ↑
          </text>
        </g>
        <circle
          cx={x}
          cy={Math.min(z, tunnelEnd)}
          r="1.1"
          fill="#fff"
          stroke="#edbd66"
          strokeWidth=".52"
        />
      </svg>
    </figure>
  );
}

export function RealHUD({
  lang,
  position,
  open,
  openMap,
}: {
  lang: RealLang;
  position: Point;
  open: (section: RealSection) => void;
  openMap: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button className="real-nav-toggle" aria-expanded={show} onClick={() => setShow(!show)}>
        <BookOpen size={16} /> {realText(lang, words.menu)}
      </button>
      <nav className={'real-nav' + (show ? ' show' : '')} aria-label={realText(lang, words.menu)}>
        <div>
          <span>♛</span> REAL MADRID
        </div>
        {realSections.map((id, index) => {
          const Icon = icons[index];
          return (
            <button
              key={id}
              onClick={() => {
                setShow(false);
                open(id);
              }}
            >
              <Icon size={17} />
              {realText(lang, realCopy[id])}
            </button>
          );
        })}
      </nav>
      <button className="real-map-toggle" onClick={openMap}>
        <RealMap lang={lang} position={position} />
      </button>
    </>
  );
}

function Source({ lang, urls }: { lang: RealLang; urls: readonly string[] }) {
  return (
    <footer className="real-source">
      <span>
        {realText(lang, words.checked)} · <time dateTime={realChecked}>{realChecked}</time>
      </span>
      <a href={realPhotoCredits} target="_blank" rel="noreferrer">
        {realText(lang, ['Tác giả & giấy phép ảnh', 'Photo credits & licences'])} ↗
      </a>
      {urls.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          {realText(lang, words.source)} {i + 1} ↗
        </a>
      ))}
    </footer>
  );
}

function Portrait({ src, name, lang }: { src?: string; name: string; lang: RealLang }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      className="real-portrait"
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  ) : (
    <div
      className="real-portrait fallback"
      role="img"
      aria-label={realText(lang, words.noPortrait)}
    >
      <span aria-hidden="true">
        {name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')}
      </span>
      <small>{realText(lang, words.noPortrait)}</small>
    </div>
  );
}

function CoachArchive({ lang, initial }: { lang: RealLang; initial?: string }) {
  const [era, setEra] = useState(4);
  const [selected, setSelected] = useState(initial);
  const person = selected ? realCoaches[selected] : undefined;
  const terms = realTermsInEra(era);
  return (
    <>
      <div hidden={Boolean(person)}>
        <div className="real-filters" aria-label={realText(lang, words.chapters)}>
          {realEras.map((item, index) => (
            <button key={item.from} aria-pressed={index === era} onClick={() => setEra(index)}>
              {realText(lang, item.label)}
            </button>
          ))}
        </div>
        <div className="real-scroll">
          {terms.map((term) => {
            const coach = realCoaches[term.personId];
            return (
              <button
                className="real-coach-card"
                key={term.id}
                onClick={() => setSelected(term.personId)}
              >
                <Portrait src={coach.portrait} name={coach.name} lang={lang} />
                <strong>{coach.name}</strong>
                <small>{realTermLabel(term, lang)}</small>
                {term.current && (
                  <span className="real-current">{realText(lang, words.current)}</span>
                )}
              </button>
            );
          })}
        </div>
        <Source lang={lang} urls={[realCoachSource, realCoachSourceEn]} />
      </div>
      {person && (
        <>
          <button className="real-back" onClick={() => setSelected(undefined)}>
            <ChevronLeft size={16} /> {realText(lang, words.back)}
          </button>
          <div className="real-profile">
            <Portrait key={person.id} src={person.portrait} name={person.name} lang={lang} />
            <div>
              <h3>{person.name}</h3>
              <p>
                {person.bio
                  ? realText(lang, person.bio)
                  : realText(lang, words.firstTeam) + ' · Real Madrid'}
              </p>
              {person.nationality && (
                <p className="real-nationality">{realNationality(lang, person.nationality)}</p>
              )}
              <ul>
                {realCoachTerms
                  .filter((term) => term.personId === person.id)
                  .map((term) => (
                    <li key={term.id}>
                      <b>{realTermLabel(term, lang)}</b>
                      {term.startDate && (
                        <span>
                          {' '}
                          · {term.startDate}
                          {term.endDate ? ' → ' + term.endDate : ''}
                        </span>
                      )}
                      {term.current && (
                        <span className="real-current">{realText(lang, words.current)}</span>
                      )}
                    </li>
                  ))}
              </ul>
              <p>{realText(lang, person.honours ?? words.pendingHonours)}</p>
            </div>
          </div>
          <Source lang={lang} urls={person.sources} />
        </>
      )}
    </>
  );
}

function HonourArchive({ lang, initial }: { lang: RealLang; initial?: string }) {
  const [id, setId] = useState(initial);
  const selected = realHonours.find((item) => item.id === id);
  if (selected)
    return (
      <>
        <button className="real-back" onClick={() => setId(undefined)}>
          <ChevronLeft size={16} />
          {realText(lang, words.back)}
        </button>
        <h3>
          {realText(lang, selected.title)} <b>×{selected.seasons.length}</b>
        </h3>
        {selected.id === 'FIFA Club World Cups' && (
          <p>
            {realText(lang, [
              'Phân loại của CLB gồm Cúp Liên lục địa, FIFA Club World Cup và FIFA Intercontinental Cup.',
              'The club’s category includes the Intercontinental Cup, FIFA Club World Cup and FIFA Intercontinental Cup.',
            ])}
          </p>
        )}
        <p>{realText(lang, words.seasons)}</p>
        <div className="real-filters">
          {selected.seasons.map((season) => (
            <span key={season}>{season}</span>
          ))}
        </div>
        {selected.id === 'Champions Leagues' && (
          <>
            <img
              className="real-archive-photo"
              src={realPhoto('european-cups')}
              alt={realText(lang, realGallery[2].label)}
            />
            <p>La Décima · Atlético de Madrid · 4–1 · 2014</p>
          </>
        )}
        <Source lang={lang} urls={[selected.source]} />
      </>
    );
  return (
    <div className="real-list">
      {realHonours.map((item) => (
        <button key={item.id} onClick={() => setId(item.id)}>
          <Trophy size={17} /> {realText(lang, item.title)} <b>{item.seasons.length}</b>
        </button>
      ))}
    </div>
  );
}

function LegendArchive({ lang }: { lang: RealLang }) {
  return (
    <div className="real-list">
      {realLegends.map(([name, years, slug]) => (
        <details key={slug}>
          <summary>
            {name} <b>{years}</b>
          </summary>
          <p>Real Madrid · {years}</p>
          <Source
            lang={lang}
            urls={['https://www.realmadrid.com/en-US/the-club/history/football-legends/' + slug]}
          />
        </details>
      ))}
    </div>
  );
}

function MatchArchive({ lang }: { lang: RealLang }) {
  return (
    <div className="real-list">
      {realMatches.map((item) => (
        <details key={item.date}>
          <summary>
            {item.date} · {item.opponent} <b>{item.score}</b>
          </summary>
          <p>
            {('cup' in item && item.cup) ||
              (item.date < '1992' ? 'European Cup' : 'UEFA Champions League')}{' '}
            · {item.venue}
          </p>
          <p>{realText(lang, item.note)}</p>
          {item.date === '2014-05-24' && (
            <img
              className="real-archive-photo"
              src={realPhoto('decima')}
              alt={realText(lang, realGallery[1].label)}
            />
          )}
          <Source
            lang={lang}
            urls={[
              item.date === '2023-04-05'
                ? clasicoSource
                : item.date === '2024-06-01'
                  ? realHistory
                  : historyMatches,
            ]}
          />
        </details>
      ))}
    </div>
  );
}

export function RealCollection({
  lang,
  section,
  id,
  open,
}: {
  lang: RealLang;
  section: RealSection;
  id?: string;
  open: (section: RealSection) => void;
}) {
  const isCarlo = id === 'real-ancelotti';
  const cup = id?.startsWith('real-cup-')
    ? realDisplayCups[Number(id.split('-').at(-1))]
    : undefined;
  const active = isCarlo ? 'coaches' : cup ? 'honours' : (id && museumIds[id]) || section;
  const eyebrow: RealCopy = ['PHÒNG TRUYỀN THỐNG · REAL MADRID', 'HERITAGE HALL · REAL MADRID'];
  return (
    <article className="real-collection">
      <div className="eyebrow">{realText(lang, eyebrow)}</div>
      <h2>{realText(lang, realCopy[active])}</h2>
      {active === 'overview' && (
        <>
          <p>
            {realText(lang, [
              'Từ Sảnh Trú Ẩn, đi qua cửa vòm bên phải để đến bảo tàng. Góc Tâm Sự Fan nằm ở phía trái.',
              'From the Refuge Hall, follow the arch on the right into the museum. The Madridistas Lounge is on the left.',
            ])}
          </p>
          <div className="real-list">
            {realSections.slice(1).map((section) => (
              <button key={section} onClick={() => open(section)}>
                {realText(lang, realCopy[section])}
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </>
      )}
      {active === 'coaches' && (
        <CoachArchive lang={lang} initial={isCarlo ? 'carlo-ancelotti' : undefined} />
      )}
      {active === 'honours' && <HonourArchive lang={lang} initial={cup} />}
      {active === 'legends' && <LegendArchive lang={lang} />}
      {active === 'matches' && <MatchArchive lang={lang} />}
      {active === 'timeline' && (
        <>
          <div className="real-list">
            {realTimeline.map((item) => (
              <details key={item.year}>
                <summary>
                  {item.year} · {realText(lang, item.title)}
                </summary>
                <p>{realText(lang, item.detail)}</p>
              </details>
            ))}
          </div>
          <Source lang={lang} urls={[realHistory]} />
        </>
      )}
      {active === 'gallery' && (
        <>
          <div className="real-gallery">
            {realGallery.map((photo) => (
              <figure key={photo.id}>
                <a href={realPhoto(photo.id)} target="_blank" rel="noreferrer">
                  <img
                    className="real-archive-photo"
                    src={realPhoto(photo.id)}
                    alt={realText(lang, photo.label)}
                    loading="lazy"
                  />
                </a>
                <figcaption>{realText(lang, photo.label)}</figcaption>
              </figure>
            ))}
          </div>
          <Source lang={lang} urls={[realHistory]} />
        </>
      )}
      {active === 'stats' && (
        <>
          <div className="real-list">
            {realHonours
              .filter((h) => realDisplayCups.some((id) => id === h.id))
              .map((h) => (
                <p key={h.id}>
                  {realText(lang, h.title)} <b>{h.seasons.length}</b>
                </p>
              ))}
          </div>
          <Source lang={lang} urls={[realHonours[0].source]} />
        </>
      )}
    </article>
  );
}

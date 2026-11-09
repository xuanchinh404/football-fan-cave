import { useState } from 'react';
import { ChevronDown, Coins, Gem, Search } from 'lucide-react';
import {
  BARCA_CHECKED,
  BARCA_COLLECTIONS,
  BARCA_COPY,
  BARCA_ERAS,
  BARCA_SECTIONS,
  COACH_SOURCE,
  FIXTURES_SOURCE,
  FLICK_CONTRACT,
  NEWS_SOURCE,
  RESULTS_SOURCE,
  barcaTerms,
  barcaKickoff,
  barcaMatchStatus,
  bt,
  findBarcaTerms,
  termYears,
  type BarcaCard,
  type BarcaLanguage,
  type BarcaSection,
  type BarcaTerm,
} from '../../../../packages/shared/barcelona/content';
import type { Interaction } from '../../../../packages/shared/world';
import type { barcaArea } from '../../../../packages/shared/barcelona/layout';
import { barcaPhotoUrl } from '../game/three/barcelona/barcaPhoto';
import { setBarcaLanguage } from '../game/three/barcelona/useBarcaLanguage';
import { useBarcaMatch } from '../game/three/barcelona/useBarcaMatch';
import './barcelona.css';

const cards = Object.values(BARCA_COLLECTIONS).flat();
const sections = Object.keys(BARCA_SECTIONS) as BarcaSection[];
export const barcaMapAreas = ['hall', 'lounge', 'museum', 'tunnel'] as const;

export function barcaInteractionLabel(item: Interaction, lang: BarcaLanguage, seated?: boolean) {
  if (item.kind === 'seat') return bt(lang, seated ? BARCA_COPY.stand : BARCA_COPY.sit);
  if (item.id === 'barca-score' || item.id === 'barca-news')
    return bt(lang, BARCA_COPY[item.id === 'barca-score' ? 'score' : 'news']);
  if (item.id === 'coaches') return bt(lang, BARCA_COPY.coaches);
  if (item.id in BARCA_SECTIONS) return bt(lang, BARCA_SECTIONS[item.id as BarcaSection]);
  const card = cards.find((entry) => entry.id === item.id);
  return card ? bt(lang, card.title) : item.label;
}

export function BarcelonaHUD({
  lang,
  area,
  open,
  wallet,
  openWallet,
}: {
  lang: BarcaLanguage;
  area: ReturnType<typeof barcaArea>;
  open: (section: BarcaSection) => void;
  wallet?: { xu: string; kc: string };
  openWallet: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <aside className="barca-hud" aria-label={bt(lang, BARCA_COPY.cave)}>
      <button
        className="barca-hud-toggle"
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <img src="/art/barcelona/crest.svg" alt="" />
        <span>
          <strong>{bt(lang, BARCA_COPY.cave)}</strong>
          <small>{bt(lang, BARCA_COPY[area])}</small>
        </span>
        <ChevronDown size={15} />
      </button>
      {expanded && (
        <nav aria-label={bt(lang, BARCA_COPY.museum)}>
          <button
            className="barca-wallet"
            type="button"
            onClick={openWallet}
            aria-label={lang === 'vi' ? 'Mở ví Xu và Kim Cương' : 'Open coin and gem wallet'}
          >
            <Coins size={14} />{' '}
            {wallet ? BigInt(wallet.xu).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB') : '—'}
            <Gem size={14} />{' '}
            {wallet ? BigInt(wallet.kc).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB') : '—'}
          </button>
          {sections.map((section) => (
            <button
              type="button"
              key={section}
              onClick={() => {
                setExpanded(false);
                open(section);
              }}
            >
              {bt(lang, BARCA_SECTIONS[section])}
            </button>
          ))}
          <div
            className="barca-language"
            role="group"
            aria-label={lang === 'vi' ? 'Ngôn ngữ' : 'Language'}
          >
            <button
              type="button"
              aria-pressed={lang === 'vi'}
              onClick={() => setBarcaLanguage('vi')}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              aria-pressed={lang === 'en'}
              onClick={() => setBarcaLanguage('en')}
            >
              English
            </button>
          </div>
        </nav>
      )}
    </aside>
  );
}

function Source({ url, lang }: { url: string; lang: BarcaLanguage }) {
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {bt(lang, BARCA_COPY.source)} ↗
    </a>
  );
}

function Photo({ id, alt }: { id: string; alt: string }) {
  return (
    <img
      src={barcaPhotoUrl(id)}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
  );
}

function CoachProfile({
  term,
  lang,
  select,
}: {
  term: BarcaTerm;
  lang: BarcaLanguage;
  select: (id: string) => void;
}) {
  const related = barcaTerms.filter(
    (entry) => entry.coach.id === term.coach.id && entry.id !== term.id,
  );
  return (
    <article className="barca-profile">
      {term.coach.image && <Photo key={term.coach.id} id={term.coach.id} alt={term.coach.name} />}
      <div>
        <h3>{term.coach.name}</h3>
        <p className="barca-kicker">
          {termYears(term, lang)}
          {term.current
            ? ' · ' + bt(lang, BARCA_COPY.current)
            : term.caretaker
              ? ' · ' + bt(lang, BARCA_COPY.caretaker)
              : ''}
        </p>
        {term.note?.country && <p>{bt(lang, term.note.country)}</p>}
        {term.note?.detail && <p>{bt(lang, term.note.detail)}</p>}
        {term.note?.achievements && <p>{bt(lang, term.note.achievements)}</p>}
        {related.length > 0 && (
          <div className="barca-terms">
            <strong>{lang === 'vi' ? 'Các nhiệm kỳ khác' : 'Other spells'}</strong>
            {related.map((entry) => (
              <button key={entry.id} type="button" onClick={() => select(entry.id)}>
                {termYears(entry, lang)}
              </button>
            ))}
          </div>
        )}
        <Source url={term.coach.source} lang={lang} />
        {term.current && term.coach.name === 'Hansi Flick' && (
          <p>
            <a href={FLICK_CONTRACT} target="_blank" rel="noreferrer">
              {lang === 'vi' ? 'Thông báo gia hạn hợp đồng' : 'Contract extension announcement'} ↗
            </a>
          </p>
        )}
      </div>
    </article>
  );
}

function Coaches({ lang, id }: { lang: BarcaLanguage; id?: string }) {
  const [era, setEra] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [oldest, setOldest] = useState(false);
  const [selected, setSelected] = useState(id);
  const term = barcaTerms.find((entry) => entry.id === selected);
  const results = findBarcaTerms(era, search, oldest);
  return (
    <>
      {term && <CoachProfile term={term} lang={lang} select={setSelected} />}
      <div
        className="barca-toolbar"
        aria-label={lang === 'vi' ? 'Giai đoạn lịch sử' : 'Historical eras'}
      >
        <button type="button" aria-pressed={era === null} onClick={() => setEra(null)}>
          {lang === 'vi' ? 'Tất cả' : 'All'}
        </button>
        {BARCA_ERAS.map(({ label }, i) => (
          <button type="button" aria-pressed={i === era} key={label} onClick={() => setEra(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className="barca-search">
        <label>
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={lang === 'vi' ? 'Tìm theo tên HLV' : 'Search by coach name'}
            placeholder={lang === 'vi' ? 'Tìm theo tên HLV' : 'Search by coach name'}
          />
        </label>
        <select
          value={oldest ? 'oldest' : 'newest'}
          onChange={(event) => setOldest(event.target.value === 'oldest')}
          aria-label={lang === 'vi' ? 'Sắp xếp theo thời gian' : 'Chronological order'}
        >
          <option value="newest">{lang === 'vi' ? 'Mới nhất trước' : 'Newest first'}</option>
          <option value="oldest">{lang === 'vi' ? 'Cũ nhất trước' : 'Oldest first'}</option>
        </select>
      </div>
      <p className="barca-kicker" aria-live="polite">
        {results.length} {lang === 'vi' ? 'nhiệm kỳ' : 'spells'}
      </p>
      <div className="barca-list">
        {results.map((entry) => (
          <button
            type="button"
            key={entry.id}
            aria-pressed={entry.id === selected}
            onClick={() => setSelected(entry.id)}
          >
            <strong>{entry.coach.name}</strong>
            <span>
              {termYears(entry, lang)}
              {entry.current
                ? ' · ' + bt(lang, BARCA_COPY.current)
                : entry.caretaker
                  ? ' · ' + bt(lang, BARCA_COPY.caretaker)
                  : ''}
            </span>
          </button>
        ))}
      </div>
      <Source url={COACH_SOURCE} lang={lang} />
    </>
  );
}

function CardProfile({ card, lang }: { card: BarcaCard; lang: BarcaLanguage }) {
  return (
    <article className="barca-profile">
      {card.image && <Photo key={card.id} id={card.id} alt={bt(lang, card.title)} />}
      <div>
        <h3>{bt(lang, card.title)}</h3>
        {card.period && <p className="barca-kicker">{card.period}</p>}
        {card.detail && <p>{bt(lang, card.detail)}</p>}
        {card.seasons && (
          <>
            <p className="barca-kicker">
              {card.seasons.length} {lang === 'vi' ? 'lần vô địch' : 'titles'}
            </p>
            <ul className="barca-seasons">
              {card.seasons.map((season) => (
                <li key={season}>{season}</li>
              ))}
            </ul>
            <p>
              {lang === 'vi' ? 'Đối chiếu ngày' : 'Checked on'} {BARCA_CHECKED}
            </p>
          </>
        )}
        <Source url={card.source} lang={lang} />
        {card.videoSource && (
          <p>
            <a href={card.videoSource} target="_blank" rel="noreferrer">
              {lang === 'vi' ? 'Xem video trên trang CLB' : 'Watch on the club website'} ↗
            </a>
          </p>
        )}
      </div>
    </article>
  );
}

export function BarcelonaCollection({
  section,
  lang,
  id,
}: {
  section: BarcaSection;
  lang: BarcaLanguage;
  id?: string;
}) {
  const initial = barcaTerms.some((term) => term.id === id)
    ? 'coaches'
    : id && id in BARCA_SECTIONS
      ? (id as BarcaSection)
      : id
        ? (sections.find(
            (key) =>
              key !== 'overview' &&
              key !== 'coaches' &&
              BARCA_COLLECTIONS[key].some((entry) => entry.id === id),
          ) ?? section)
        : section;
  const [active, setActive] = useState(initial);
  const [selected, setSelected] = useState(id);
  const entries = active === 'overview' || active === 'coaches' ? [] : BARCA_COLLECTIONS[active];
  const card = entries.find((entry) => entry.id === selected);
  return (
    <section className="barca-collection">
      <div className="eyebrow">FC BARCELONA HERITAGE HALL</div>
      <h2>{bt(lang, BARCA_SECTIONS[active])}</h2>
      {active === 'overview' && (
        <p>
          {bt(lang, BARCA_COPY.subtitle)}.{' '}
          {lang === 'vi'
            ? 'Đi qua cổng vòm bên phải để đến phòng trưng bày. Góc Tâm Sự nằm bên trái sảnh.'
            : 'Walk through the arch on the right to visit the gallery. The fan lounge is on the left.'}
        </p>
      )}
      <div className="barca-toolbar">
        {sections.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === active}
            onClick={() => {
              setActive(key);
              setSelected(undefined);
            }}
          >
            {bt(lang, BARCA_SECTIONS[key])}
          </button>
        ))}
      </div>
      {active === 'coaches' ? (
        <Coaches lang={lang} id={selected} />
      ) : (
        <>
          {card && <CardProfile card={card} lang={lang} />}
          <div className="barca-list">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === selected}
                onClick={() => setSelected(entry.id)}
              >
                <strong>{bt(lang, entry.title)}</strong>
                {(entry.period || entry.seasons) && (
                  <span>{entry.period || entry.seasons?.length}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function BarcelonaMatchBoard({
  lang,
  news,
  chat,
}: {
  lang: BarcaLanguage;
  news: boolean;
  chat: () => void;
}) {
  const match = useBarcaMatch();
  return (
    <section className="barca-collection">
      <h2>{bt(lang, news ? BARCA_COPY.news : BARCA_COPY.score)}</h2>
      {!news &&
        (match ? (
          <>
            <h3>
              {match.home} {match.homeScore}–{match.awayScore} {match.away}
            </h3>
            <p className="barca-kicker">{barcaMatchStatus(match, lang)}</p>
            <p>
              {match.competition} · {barcaKickoff(match, lang)}
            </p>
            <Source url={match.source} lang={lang} />
          </>
        ) : (
          <p>{bt(lang, BARCA_COPY.pending)}</p>
        ))}
      <div className="barca-toolbar">
        <a href={FIXTURES_SOURCE} target="_blank" rel="noreferrer">
          {lang === 'vi' ? 'Lịch thi đấu' : 'Fixtures'} ↗
        </a>
        <a href={RESULTS_SOURCE} target="_blank" rel="noreferrer">
          {lang === 'vi' ? 'Kết quả' : 'Results'} ↗
        </a>
        <a href={NEWS_SOURCE} target="_blank" rel="noreferrer">
          {lang === 'vi' ? 'Tin đội một' : 'First-team news'} ↗
        </a>
        <button type="button" onClick={chat}>
          {lang === 'vi' ? 'Trò chuyện' : 'Open chat'}
        </button>
      </div>
    </section>
  );
}

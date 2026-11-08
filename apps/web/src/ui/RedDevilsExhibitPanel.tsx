import { useState } from 'react';
import { exhibits, managers, trophies } from '../../../../packages/shared/museum';
import {
  hallArchive,
  hallHistory,
  hallText,
  hallTrophies,
  type HallLanguage,
} from '../../../../packages/shared/museum/hall';

const managerStories: Record<string, string> = {
  'manager-2': 'Led United to their first two league championships and first FA Cup.',
  'manager-3':
    'Succeeded Ernest Mangnall as secretary-manager before becoming full-time secretary.',
  'manager-5':
    'Succeeded John Robson as secretary-manager and returned United to the top flight in 1925.',
  'manager-11': 'Built the Busby Babes, rebuilt after Munich and won the European Cup in 1968.',
  'manager-16':
    'Led United back to the top flight in 1975 and beat Liverpool in the 1977 FA Cup final.',
  'manager-17': 'Shared the 1977 Charity Shield with Liverpool and reached the 1979 FA Cup final.',
  'manager-18': 'Won the FA Cup in 1982/83 and 1984/85.',
  'manager-19':
    'Won 13 Premier League titles and two Champions Leagues. Completed the league, FA Cup and European Treble in 1999.',
  'manager-20':
    'Succeeded Sir Alex Ferguson and won the 2013 Community Shield against Wigan Athletic.',
  'manager-22': 'Beat Crystal Palace to win the 2016 FA Cup final.',
  'manager-23': 'Won the Community Shield, League Cup and Europa League in his first season.',
  'manager-24':
    'Appointed caretaker in December 2018 and permanent manager in March 2019. Finished second in the league and reached the Europa League final in 2020/21.',
  'manager-26':
    'Appointed interim manager in late 2021 and led the team through the end of 2021/22.',
  'manager-27': 'Won the League Cup in 2023 and the FA Cup in 2024.',
  'manager-29': 'Led United to the 2025 Europa League final in Bilbao.',
  'manager-31':
    'Took charge on 13 January 2026. United finished third in the 2025/26 Premier League and qualified for the Champions League. He signed through 2028.',
};
const archiveTranslations: Record<string, { heading?: string; detail: string }> = {
  'history-0': {
    heading: '1878–1902 · Newton Heath origins',
    detail: 'Founded in 1878 and renamed Manchester United in 1902.',
  },
  'history-1': {
    heading: '1902–1931 · The first honours',
    detail: 'Won the league in 1908 and 1911. Old Trafford opened in 1910.',
  },
  'history-2': {
    heading: '1932–1945 · The difficult years',
    detail: 'Won the Second Division in 1936. The war interrupted league football.',
  },
  'history-3': {
    heading: '1945–1969 · The Busby era',
    detail: 'Rebuilt after Munich in 1958 and won the European Cup in 1968.',
  },
  'history-4': {
    heading: '1970–1986 · A changing of the guard',
    detail: 'Returned to the top flight in 1975 and won the FA Cup in 1977, 1983 and 1985.',
  },
  'history-5': {
    heading: '1986–2013 · The Ferguson era',
    detail: 'Won 13 Premier League titles and completed the Treble in 1999.',
  },
  'history-6': {
    heading: '2013–2026 · The next chapters',
    detail: 'FA Cups in 2016 and 2024, Europa League in 2017 and League Cups in 2017 and 2023.',
  },
  'history-7': { heading: '2026 onward · Michael Carrick', detail: managerStories['manager-31'] },
  'match-1968': {
    detail: 'Manchester United 4–1 Benfica after extra time. United won their first European Cup.',
  },
  'match-1999': {
    detail: 'Manchester United 2–1 Bayern Munich. Two stoppage-time goals completed the Treble.',
  },
  'match-2008': { detail: 'Manchester United 1–1 Chelsea. United won 6–5 on penalties.' },
  'legend-0': {
    detail:
      '1992–1997 · No. 7. A creative leader of the early Premier League era who won four league titles with United.',
  },
  'legend-1': {
    detail: '1991–2014 · No. 11. Made 963 United appearances and won 13 Premier League titles.',
  },
  'legend-2': {
    detail:
      '1994–2013 · No. 18. Class of ’92 midfielder and a member of the 1999 Treble-winning side.',
  },
  'legend-3': { detail: '2004–2017 · No. 10. United’s all-time leading scorer with 253 goals.' },
  'legend-4': {
    detail:
      '2003–2009 and 2021–2022 · No. 7. Won the 2008 Ballon d’Or and the Champions League in Moscow.',
  },
  'legend-5': {
    detail:
      '1956–1973 · No. 9. Survived Munich and won the 1968 European Cup under Sir Matt Busby.',
  },
  'legend-6': {
    detail: '1963–1974 · No. 7. Winger, 1968 Ballon d’Or winner and member of the United Trinity.',
  },
  'legend-7': {
    detail: '1993–2005 · No. 16. Captained the Treble-winning side and set the tempo in midfield.',
  },
  'legend-8': {
    detail: '2006–2014 · No. 15. Won five Premier League titles and the 2008 Champions League.',
  },
  'legend-9': {
    detail:
      '2002–2014 · No. 5. Won six Premier League titles and formed a defensive partnership with Nemanja Vidić.',
  },
  'legend-10': {
    detail: '2005–2011 · No. 1. Saved the decisive penalty in the 2008 Champions League final.',
  },
  'photo-library': {
    heading: 'Photo archive · European milestones',
    detail:
      '1968 · First European Cup at Wembley.\n1999 · Two stoppage-time goals in Barcelona.\n2008 · The Moscow penalty shootout. Photographs of 1999 and 2008 are on the history wall.',
  },
};

const intercontinental = trophies.find((trophy) => trophy.group === 'intercontinental');
const archiveEntries = exhibits.filter(
  (entry) =>
    ['history', 'match', 'legend', 'library'].includes(entry.type) ||
    entry.id === intercontinental?.id,
);
const copy = {
  vi: {
    seasons: 'Chọn mùa giải',
    manager: 'Huấn luyện viên',
    shared: 'Đồng vô địch',
    managers: 'Hồ sơ huấn luyện viên',
    archive: 'Kho tư liệu câu lạc bộ',
    archiveEntry: 'Chọn hồ sơ',
    current: 'Đương nhiệm',
    portrait: 'Chân dung minh họa',
    placeholder: 'Tượng đồng cách điệu · mô hình nháp',
    permanent: 'Chính thức',
    caretaker: 'Tạm quyền',
    interim: 'Tạm thời',
    related: 'Tư liệu liên quan',
  },
  en: {
    seasons: 'Choose a season',
    manager: 'Manager',
    shared: 'Shared title',
    managers: 'Manager directory',
    archive: 'Club archive',
    archiveEntry: 'Choose a record',
    current: 'Current head coach',
    portrait: 'Illustrated portrait',
    placeholder: 'Stylised bronze statue · prototype model',
    permanent: 'Permanent',
    caretaker: 'Caretaker',
    interim: 'Interim',
    related: 'Related material',
  },
};

export function RedDevilsExhibitPanel({
  id,
  lang,
  close,
}: {
  id: string;
  lang: HallLanguage;
  close: () => void;
}) {
  const [selection, setSelection] = useState('');
  const trophy = hallTrophies.find((item) => item.id === id);
  const season = trophy?.seasons.find((item) => item.id === selection) ?? trophy?.seasons[0];
  const milestone = hallHistory.find((item) => item.id === id);
  const statue = id === 'ferguson-statue';
  const directory = id === hallArchive[0].id;
  const archive = id === hallArchive[1].id;
  const manager = managers.find(
    (item) => item.id === (directory ? selection || managers[0].id : statue ? 'manager-19' : id),
  );
  const record = archive
    ? (archiveEntries.find((item) => item.id === selection) ?? archiveEntries[0])
    : undefined;
  const recordEnglish = record && archiveTranslations[record.id];
  const related =
    milestone &&
    exhibits.find(
      (item) => item.id === (milestone.year === '1958' ? 'match-1968' : `match-${milestone.year}`),
    );
  const labels = hallText[lang];
  const text = copy[lang];
  const heading =
    trophy?.title[lang] ??
    milestone?.title[lang] ??
    (directory ? text.managers : archive ? text.archive : manager?.name);
  const source = season?.source ?? milestone?.source ?? manager?.source ?? record?.source;
  if (!heading) return null;
  return (
    <>
      <div className="eyebrow">{labels.area}</div>
      <h2>{milestone ? `${milestone.year} · ${heading}` : heading}</h2>
      {trophy && (
        <>
          <p className="museum-exhibit">× {trophy.seasons.length}</p>
          <div className="blues-seasons" aria-label={text.seasons}>
            {trophy.seasons.map((item) => (
              <button
                key={item.id}
                aria-pressed={season?.id === item.id}
                onClick={() => setSelection(item.id)}
              >
                {item.season}
              </button>
            ))}
          </div>
          {season && (
            <p className="museum-exhibit">
              <strong>
                {season.title} · {season.season}
              </strong>
              <br />
              {lang === 'vi' && (
                <>
                  {season.description}
                  <br />
                </>
              )}
              {text.manager} · {season.manager}
              {season.shared && (
                <>
                  <br />
                  {text.shared}
                </>
              )}
            </p>
          )}
        </>
      )}
      {milestone && (
        <>
          <p className="museum-exhibit">{milestone.detail[lang]}</p>
          <figure className="mu-history-photo">
            <img src={milestone.image} alt={milestone.caption[lang]} />
            <figcaption>
              {milestone.caption[lang]} ·{' '}
              <a href={milestone.photoSource} target="_blank" rel="noreferrer">
                {milestone.credit}
              </a>
            </figcaption>
          </figure>
          <p>
            {text.related} ·{' '}
            <a href={related?.source ?? milestone.source} target="_blank" rel="noreferrer">
              {related?.heading ?? 'Newton Heath LYR · 1878–1902'}
            </a>
          </p>
        </>
      )}
      {directory && (
        <select
          aria-label={text.managers}
          value={manager?.id}
          onChange={(event) => setSelection(event.target.value)}
        >
          {managers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.start}
            </option>
          ))}
        </select>
      )}
      {manager && (
        <div className="museum-exhibit">
          {directory && <h3>{manager.name}</h3>}
          <p>
            {manager.start} — {manager.end ?? labels.present} ·{' '}
            {manager.current
              ? text.current
              : text[manager.role as 'permanent' | 'caretaker' | 'interim']}
          </p>
          <p>
            {lang === 'vi'
              ? manager.description
              : (managerStories[manager.id] ??
                'A chapter in Manchester United’s coaching history.')}
          </p>
          {manager.honours.length > 0 && <p>{manager.honours.join(' · ')}</p>}
          {statue ? (
            <small>{text.placeholder}</small>
          ) : (
            manager.portrait !== undefined && (
              <small>
                <a href="/art/manager-portrait-credits.md" target="_blank" rel="noreferrer">
                  {text.portrait}
                </a>
              </small>
            )
          )}
        </div>
      )}
      {record && (
        <>
          <select
            aria-label={text.archiveEntry}
            value={record.id}
            onChange={(event) => setSelection(event.target.value)}
          >
            {archiveEntries.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === 'en'
                  ? (archiveTranslations[item.id]?.heading ?? item.heading)
                  : item.heading}
              </option>
            ))}
          </select>
          <p className="museum-exhibit">
            {lang === 'vi'
              ? record.detail
              : (recordEnglish?.detail ??
                (intercontinental &&
                  `${intercontinental.title} · ${intercontinental.season} · ${intercontinental.manager}`))}
          </p>
        </>
      )}
      {source && (
        <a className="museum-source" href={source} target="_blank" rel="noreferrer">
          {labels.source} ↗
        </a>
      )}
      <button className="primary" onClick={close}>
        {labels.close}
      </button>
    </>
  );
}

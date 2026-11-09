import type { BarcaMatch } from './match';
import { coachNotes } from './coachNotes';
import coaches from './officialCoaches.json';
import honours from './officialHonours.json';
import legends from './officialLegends.json';
import {
  BARCA_CUP_WALL,
  BARCA_CUP_X,
  BARCA_SEATS,
  BARCA_STATUE,
  barcaWire,
  museumPoint,
} from './layout';
import type { Interaction } from '../world';

export type BarcaLanguage = 'vi' | 'en';
export type Copy = readonly [string, string];
export const barcaLanguage = (lang: string): BarcaLanguage => (lang.startsWith('en') ? 'en' : 'vi');
export const bt = (lang: BarcaLanguage, copy: Copy) => copy[lang === 'en' ? 1 : 0];
export const BARCA_CHECKED = '2026-11-09';
export const COACH_SOURCE = 'https://www.fcbarcelona.com/en/club/history/coaches';
export const HONOUR_SOURCE = 'https://www.fcbarcelona.com/en/football/primer-equipo/palmares';
export const HISTORY_SOURCE = 'https://www.fcbarcelona.com/en/club/history/decade-by-decade';
export { BARCA_RESULTS_URL as RESULTS_SOURCE } from './match';
export const FIXTURES_SOURCE = 'https://www.fcbarcelona.com/en/football/first-team/schedule';
export const NEWS_SOURCE = 'https://www.fcbarcelona.com/en/football/first-team/news';
export const FLICK_CONTRACT =
  'https://www.fcbarcelona.com/en/football/first-team/news/4505340/hansi-flick-extends-contract-until-2028';
export const BARCA_COPY = {
  hall: ['Sảnh Trú Ẩn', 'Refuge Hall'],
  cave: ['HANG BARCA', 'BARÇA CAVE'],
  subtitle: ['Nơi fan Barça hội tụ', 'Where Barça fans gather'],
  lounge: ['Góc Tâm Sự Fan', 'Fan Lounge'],
  museum: ['Phòng Truyền Thống', 'Heritage Hall'],
  tunnel: ['Đường ra hang', 'Cave exit'],
  passage: ['Hành lang', 'Passage'],
  score: ['Kết quả trận gần nhất', 'Latest match result'],
  news: ['Bảng tin & lịch thi đấu', 'News & fixtures'],
  pending: ['Chưa cập nhật kết quả', 'Result unavailable'],
  coaches: ['Bức tường lịch sử huấn luyện viên', 'Coaching history wall'],
  all: ['Xem toàn bộ HLV', 'Browse all coaches'],
  current: ['HLV đương nhiệm', 'Current head coach'],
  caretaker: ['Tạm quyền', 'Caretaker'],
  source: ['Nguồn FC Barcelona', 'FC Barcelona source'],
  sit: ['Ngồi sofa', 'Sit on the sofa'],
  stand: ['Đứng dậy', 'Stand up'],
} as const satisfies Record<string, Copy>;

export function barcaMatchStatus(match: BarcaMatch, lang: BarcaLanguage) {
  const difference = (match.homeScore - match.awayScore) * (match.home === 'FC Barcelona' ? 1 : -1);
  const outcome: Copy =
    difference > 0 ? ['Thắng', 'Win'] : difference < 0 ? ['Thua', 'Loss'] : ['Hòa', 'Draw'];
  return `${bt(lang, outcome)} · ${lang === 'vi' ? 'Hết trận' : 'Full time'}`;
}
export function barcaKickoff(match: BarcaMatch, lang: BarcaLanguage) {
  return new Date(match.kickoff).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export const BARCA_SECTIONS = {
  overview: ['Tổng quan', 'Overview'],
  honours: ['Danh hiệu & Cúp', 'Honours & Trophies'],
  coaches: ['Các đời HLV', 'Coaches'],
  legends: ['Huyền thoại CLB', 'Club Legends'],
  matches: ['Những trận đấu để đời', 'Memorable Matches'],
  gallery: ['Thư viện ảnh', 'Photo Gallery'],
  timeline: ['Dòng thời gian lịch sử', 'History Timeline'],
  records: ['Kỷ lục & Thống kê', 'Records & Statistics'],
} as const satisfies Record<string, Copy>;
export type BarcaSection = keyof typeof BARCA_SECTIONS;

export const BARCA_ERAS = [
  { label: '1912–1949', from: 1912, to: 1949 },
  { label: '1950–1979', from: 1950, to: 1979 },
  { label: '1980–1999', from: 1980, to: 1999 },
  { label: '2000–2019', from: 2000, to: 2019 },
  { label: '2020–…', from: 2020, to: Infinity },
] as const;
export const COACH_PAGE_SIZE = 7;
type Coach = {
  id: string;
  name: string;
  source: string;
  image?: string;
  terms: readonly (readonly (number | null)[])[];
};
const documentedCover: Coach[] = [
  {
    id: 'roura',
    name: 'Jordi Roura',
    source:
      'https://www.fcbarcelona.com/en/news/1146944/roura-to-lead-barca-in-tito-vilanovas-absence',
    terms: [[2012, 2013]],
  },
  {
    id: 'barjuan',
    name: 'Sergi Barjuan',
    source:
      'https://www.fcbarcelona.com/en/football/first-team/noticies/2312224/sergi-barjuan-nou-entrenador-interi-del-fc-barcelona',
    terms: [[2021, 2021]],
  },
];
export const barcaCoaches: Coach[] = [...coaches, ...documentedCover];
const briefAssignments: Record<string, number[]> = {
  'Jesús Antonio de la Cruz': [2003],
  'Carles Rexach': [1988, 1991, 1996],
  'José Luis Romero': [1983],
  'Josep Seguer': [1969],
  'Enric Rabassa': [1960],
  'Ramon Llorens': [1950],
  'Jordi Roura': [2012],
  'Sergi Barjuan': [2021],
};
export const barcaTerms = barcaCoaches
  .flatMap((coach) =>
    coach.terms.map(([start, end]) => ({
      id: `${coach.id}-${start}-${end ?? 'present'}`,
      coach,
      start: start!,
      end,
      current: end === null,
      caretaker: briefAssignments[coach.name]?.includes(start!) ?? false,
      note: coachNotes[coach.name],
    })),
  )
  .sort((a, b) => b.start - a.start || (b.end ?? Infinity) - (a.end ?? Infinity));
export type BarcaTerm = (typeof barcaTerms)[number];
export const termYears = ({ start, end }: BarcaTerm, lang: BarcaLanguage) =>
  end === start ? String(start) : `${start}–${end ?? (lang === 'vi' ? 'nay' : 'present')}`;
const searchKey = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export function findBarcaTerms(era: number | null, search = '', oldest = false) {
  const range = era === null ? undefined : BARCA_ERAS[era];
  const query = searchKey(search.trim());
  const entries = barcaTerms.filter(
    (term) =>
      (!range || (term.start <= range.to && (term.end ?? Infinity) >= range.from)) &&
      searchKey(
        term.coach.name +
          (term.coach.name === 'Josep Guardiola'
            ? ' Pep'
            : term.coach.name === 'Marinus Michels'
              ? ' Rinus'
              : ''),
      ).includes(query),
  );
  return oldest ? entries.reverse() : entries;
}

export type BarcaCard = {
  id: string;
  title: Copy;
  detail?: Copy;
  period?: string;
  source: string;
  image?: string;
  seasons?: string[];
  videoSource?: string;
};
const cupNames = [
  ['Spanish League Championship', 'La Liga', 'La Liga'],
  ['Copa del Rey', 'Copa del Rey', 'Copa del Rey'],
  ['Champions League', 'UEFA Champions League', 'UEFA Champions League'],
  ['European Super Cup', 'Siêu cúp UEFA', 'UEFA Super Cup'],
  ['FIFA Club World Cup', 'FIFA Club World Cup', 'FIFA Club World Cup'],
  ['Spanish Super Cup', 'Siêu cúp Tây Ban Nha', 'Spanish Super Cup'],
  ["European Cup Winners' Cup", 'Cúp C2 châu Âu', 'European Cup Winners’ Cup'],
] as const;
const cupMilestones: Copy[] = [
  [
    'Vô địch mùa La Liga đầu tiên năm 1928–29 và bảo vệ ngôi vô địch năm 2025–26.',
    'Won the inaugural La Liga season in 1928–29 and retained the title in 2025–26.',
  ],
  [
    'Các chức vô địch 2008–09 và 2014–15 đều là một phần của cú ăn ba.',
    'The 2008–09 and 2014–15 wins were both part of a treble.',
  ],
  ['Chiếc cúp đầu tiên đến ở Wembley năm 1992.', 'The first European Cup came at Wembley in 1992.'],
  [
    'Danh hiệu mùa 2009–10 là một trong sáu chiếc cúp của năm 2009.',
    'The 2009–10 title was one of the club’s six trophies in 2009.',
  ],
  [
    'Lần đầu vô địch vào năm 2009, sau khi đánh bại Estudiantes ở chung kết.',
    'First won in 2009 after defeating Estudiantes in the final.',
  ],
  [
    'Các chức vô địch 2024–25 và 2025–26 đến dưới thời Hansi Flick.',
    'Hansi Flick led Barça to wins in 2024–25 and 2025–26.',
  ],
  [
    'Lần vô địch gần nhất là mùa 1996–97 dưới thời Bobby Robson.',
    'The last title came in 1996–97 under Bobby Robson.',
  ],
];
export const barcaHonours: BarcaCard[] = cupNames.map(([name, vi, en], i) => {
  const row = honours.find((entry) => entry.name === name)!;
  return {
    id: 'cup-' + i,
    title: [vi, en],
    detail: cupMilestones[i],
    source: HONOUR_SOURCE,
    image: row.image,
    seasons: row.seasons,
  };
});
const legendNotes: Record<string, Copy> = {
  'Sergio Busquets': [
    'Tiền vệ trụ trưởng thành từ Barça B, giữ nhịp cho đội hình giành cú ăn sáu năm 2009.',
    'A holding midfielder promoted from Barça B who helped control games during the 2009 sextuple.',
  ],
  'Leo Messi': [
    'Chân sút kỷ lục của Barça với 672 bàn trong 778 trận chính thức.',
    'Barça’s record goalscorer with 672 goals in 778 official appearances.',
  ],
  'Andrés Iniesta': [
    'Tiền vệ La Masia ghi bàn bù giờ tại Stamford Bridge để đưa Barça vào chung kết Champions League 2009.',
    'The La Masia midfielder’s stoppage-time goal at Stamford Bridge sent Barça to the 2009 Champions League final.',
  ],
  'Xavi Hernández': [
    'Tiền vệ trung tâm trưởng thành từ La Masia, có mặt trong đội hình của bốn chiến dịch vô địch Champions League.',
    'The La Masia midfielder was part of four Champions League-winning campaigns.',
  ],
  'Carles Puyol': [
    'Đội trưởng của Barça trong thời kỳ vô địch châu Âu dưới thời Rijkaard và Guardiola.',
    'Captained Barça during the European title runs under Rijkaard and Guardiola.',
  ],
  "Samuel Eto'o": [
    'Ghi bàn trong các trận chung kết Champions League năm 2006 và 2009.',
    'Scored in the 2006 and 2009 Champions League finals.',
  ],
  'Ronaldo de Assís Moreira ‘Ronaldinho’': [
    'Nhạc trưởng của đội bóng vô địch Champions League 2005–06 dưới thời Frank Rijkaard.',
    'The creative centre of Frank Rijkaard’s 2005–06 Champions League winners.',
  ],
  'Romario da Souza': [
    'Tiền đạo người Brazil gia nhập từ PSV năm 1993 và tỏa sáng trong Dream Team.',
    'The Brazilian striker joined from PSV in 1993 and starred in the Dream Team.',
  ],
  'Hristo Stoichkov': [
    'Chân sút người Bulgaria là thành viên Dream Team giành European Cup năm 1992.',
    'The Bulgarian forward was part of the Dream Team that won the 1992 European Cup.',
  ],
  'Ronald Koeman': [
    'Hậu vệ người Hà Lan ghi bàn quyết định từ đá phạt ở Wembley năm 1992.',
    'The Dutch defender scored the decisive free kick at Wembley in 1992.',
  ],
  'Diego Armando Maradona': [
    'Tiền đạo người Argentina khoác áo Barça từ 1982 đến 1984.',
    'The Argentine forward played for Barça from 1982 to 1984.',
  ],
  'Johan Neeskens': [
    'Tiền vệ Hà Lan rời Ajax để tái ngộ Cruyff tại Barcelona năm 1974.',
    'The Dutch midfielder left Ajax to reunite with Cruyff at Barcelona in 1974.',
  ],
  'Johan Cruyff': [
    'Giúp Barça vô địch La Liga 1973–74 với tư cách cầu thủ rồi dẫn dắt Dream Team trên ghế HLV.',
    'Helped Barça win the 1973–74 league as a player, then coached the Dream Team.',
  ],
  'Ladislao Kubala': [
    'Ngôi sao tấn công của thế hệ Barça giành nhiều danh hiệu trong thập niên 1950.',
    'An attacking star of the Barça side that collected trophies throughout the 1950s.',
  ],
  'César Rodríguez': [
    'Tiền đạo chủ lực của Barça trong thập niên 1940 và đầu thập niên 1950.',
    'A leading Barça striker through the 1940s and early 1950s.',
  ],
};
export const barcaLegends: BarcaCard[] = legends.map(({ name, image, source }, i) => ({
  id: 'legend-' + i,
  title: [name, name],
  detail: legendNotes[name],
  image,
  source: source ?? HISTORY_SOURCE,
}));
const europeanFinals =
  'https://www.fcbarcelona.com/en/news/1673565/stat-of-the-day-8-european-cup-finals';
const clasicoVideo =
  'https://www.fcbarcelona.com/en/news/1663569/11-years-to-the-day-since-the-6-2-away-win-against-real-madrid/amp';
const parisVideo = 'https://www.fcbarcelona.com/en/news/2142175';
const photoRoot = 'https://www.fcbarcelona.com/photo-resources/';
const archivePhoto = (path: string) => `${photoRoot}${path}?width=360&height=225`;
const matchPhotos = {
  wembley92: archivePhoto(
    '2020/04/25/3d1d34f6-0a79-4cba-93df-f0df3b610db6/7-Final-Champions-1992-min.jpg',
  ),
  paris: archivePhoto(
    '2020/04/18/0e2f610d-831e-4e31-b669-57d186fc0805/6-Final-Champions-2006-min.jpg',
  ),
  berlin: archivePhoto('2019/03/12/8e3f3aa5-bbe8-4e03-9ed1-526c5da82b3c/hkqmVmEK.jpg'),
  clasico: archivePhoto(
    'fcbarcelona/photo/2019/01/03/ccdde8de-e3ed-4e27-864a-5dbe30656f5f/44-Puyol-FCB-Reial-Madrid-2-a-6-Optimized.jpg',
  ),
};
const matchRows: [string, string, string, Copy, string?, string?, string?][] = [
  [
    '1992-05-20',
    'Sampdoria',
    '1–0',
    [
      'European Cup · Wembley. Ronald Koeman ghi bàn từ cú đá phạt ở hiệp phụ.',
      'European Cup · Wembley. Ronald Koeman scored from a free kick in extra time.',
    ],
    'https://www.fcbarcelona.com/en/football/first-team/news/1670167/28-years-since-the-first-european-cup',
    matchPhotos.wembley92,
  ],
  [
    '2006-05-17',
    'Arsenal',
    '2–1',
    [
      'Champions League · Paris. Samuel Eto’o và Juliano Belletti lật ngược thế trận.',
      'Champions League · Paris. Samuel Eto’o and Juliano Belletti turned the match around.',
    ],
    parisVideo,
    matchPhotos.paris,
    parisVideo,
  ],
  [
    '2009-05-27',
    'Manchester United',
    '2–0',
    [
      'Champions League · Rome. Samuel Eto’o và Lionel Messi ghi bàn.',
      'Champions League · Rome. Samuel Eto’o and Lionel Messi scored.',
    ],
  ],
  [
    '2011-05-28',
    'Manchester United',
    '3–1',
    [
      'Champions League · Wembley. Pedro, Lionel Messi và David Villa ghi bàn.',
      'Champions League · Wembley. Pedro, Lionel Messi and David Villa scored.',
    ],
    'https://www.fcbarcelona.com/en/football/first-team/news/869475',
  ],
  [
    '2015-06-06',
    'Juventus',
    '3–1',
    [
      'Champions League · Berlin. Ivan Rakitić, Luis Suárez và Neymar ghi bàn.',
      'Champions League · Berlin. Ivan Rakitić, Luis Suárez and Neymar scored.',
    ],
    'https://www.fcbarcelona.com/en/news/1097766/fc-barcelona-win-fifth-champions-league',
    matchPhotos.berlin,
  ],
  [
    '2009-05-02',
    'Real Madrid',
    '6–2',
    [
      'La Liga · Santiago Bernabéu. Thierry Henry và Lionel Messi lập cú đúp, Carles Puyol và Gerard Piqué ghi hai bàn còn lại.',
      'La Liga · Santiago Bernabéu. Thierry Henry and Lionel Messi scored twice each, with Carles Puyol and Gerard Piqué adding the other goals.',
    ],
    'https://www.fcbarcelona.com/en/football/first-team/news/1205417/ten-years-since-6-2-win-at-bernabeu',
    matchPhotos.clasico,
    clasicoVideo,
  ],
];
export const barcaMatches: BarcaCard[] = matchRows.map(
  ([period, team, score, detail, source, image, videoSource], i) => ({
    id: 'match-' + i,
    title: [`Barça ${score} ${team}`, `Barça ${score} ${team}`],
    period,
    detail,
    source: source ?? europeanFinals,
    image,
    videoSource,
  }),
);
const timelineRows: [string, Copy, Copy, string?][] = [
  [
    '1899',
    ['Thành lập FC Barcelona', 'FC Barcelona founded'],
    [
      'Joan Gamper cùng những người sáng lập lập ra CLB vào ngày 29 tháng 11.',
      'Joan Gamper and his fellow founders established the club on 29 November.',
    ],
  ],
  [
    '1973–1974',
    ['Cruyff đến Barça', 'Cruyff arrives'],
    [
      'Johan Cruyff giúp Barça giành chức vô địch quốc gia mùa 1973–74.',
      'Johan Cruyff helped Barça win the 1973–74 league title.',
    ],
  ],
  [
    '1992',
    ['Cúp châu Âu đầu tiên', 'First European Cup'],
    ['Dream Team thắng Sampdoria tại Wembley.', 'The Dream Team beat Sampdoria at Wembley.'],
    barcaMatches[0].source,
  ],
  [
    '2008–2012',
    ['Kỷ nguyên Guardiola', 'The Guardiola era'],
    [
      'Đội bóng của Guardiola giành 14 danh hiệu trong bốn mùa.',
      'Guardiola’s team won 14 trophies in four seasons.',
    ],
    barcaCoaches.find((coach) => coach.name === 'Josep Guardiola')?.source,
  ],
  [
    '2009',
    ['Cú ăn sáu', 'The sextuple'],
    [
      'Barça giành sáu danh hiệu trong một năm dương lịch.',
      'Barça won six trophies in one calendar year.',
    ],
  ],
  [
    '2015',
    ['Cú ăn ba thứ hai', 'The second treble'],
    [
      'La Liga, Copa del Rey và Champions League trong cùng mùa giải.',
      'La Liga, the Copa del Rey and Champions League in the same season.',
    ],
    barcaMatches[4].source,
  ],
  [
    '2023',
    ['Trở lại ngôi vô địch La Liga', 'Back on top of La Liga'],
    ['Barça vô địch La Liga mùa 2022–23.', 'Barça won the 2022–23 La Liga title.'],
    HONOUR_SOURCE,
  ],
  [
    '2026',
    ['Chức vô địch La Liga thứ 29', '29th league title'],
    [
      'Barça bảo vệ chức vô địch La Liga mùa 2025–26.',
      'Barça retained the league title in 2025–26.',
    ],
    HONOUR_SOURCE,
  ],
];
const timelinePhotos: Record<string, string | undefined> = {
  '1973–1974': barcaLegends.find((legend) => legend.title[0] === 'Johan Cruyff')?.image,
  '1992': matchPhotos.wembley92,
  '2008–2012': barcaCoaches.find((coach) => coach.name === 'Josep Guardiola')?.image,
  '2015': matchPhotos.berlin,
};
export const barcaTimeline: BarcaCard[] = timelineRows.map(
  ([period, title, detail, source], i) => ({
    id: 'history-' + i,
    period,
    title,
    detail,
    source: source ?? HISTORY_SOURCE,
    image: timelinePhotos[period],
  }),
);
export const barcaRecords: BarcaCard[] = [
  {
    id: 'record-messi',
    title: ['Lionel Messi · 672 bàn, 778 trận', 'Lionel Messi · 672 goals, 778 appearances'],
    source: 'https://www.fcbarcelona.com/en/news/2070529',
  },
  {
    id: 'record-points',
    title: ['La Liga · 100 điểm mùa 2012–13', 'La Liga · 100 points in 2012–13'],
    source: 'https://www.fcbarcelona.com/en/news/1139075/all-fc-barcelonas-201213-league-records',
  },
];
export const barcaGallery = [...barcaLegends, ...barcaHonours, ...barcaMatches].filter(
  (entry) => entry.image,
);
export const BARCA_COLLECTIONS = {
  honours: barcaHonours,
  legends: barcaLegends,
  matches: barcaMatches,
  gallery: barcaGallery,
  timeline: barcaTimeline,
  records: barcaRecords,
};
export const PEP_TERM = barcaTerms.find((term) => term.coach.name === 'Josep Guardiola')!;
const exhibit = (
  point: { x: number; y: number },
  id: string,
  label: string,
  inspectRadius = 100,
): Interaction => ({ ...point, id, label, kind: 'exhibit', inspectRadius });
export const barcaInteractions: Interaction[] = [
  { ...barcaWire(0, -24.6), id: 'barca-score', label: BARCA_COPY.score[0], kind: 'score' },
  { ...barcaWire(-6.85, -24.6), id: 'barca-news', label: BARCA_COPY.news[0], kind: 'score' },
  ...BARCA_SEATS.map(
    (point, i): Interaction => ({
      ...point,
      id: 'barca-seat-' + i,
      label: BARCA_COPY.sit[0],
      kind: 'seat',
      inspectRadius: 63,
    }),
  ),
  exhibit(museumPoint(BARCA_STATUE.x, BARCA_STATUE.z + 1.9), PEP_TERM.id, PEP_TERM.coach.name),
  exhibit(museumPoint(0, -19.65), 'coaches', BARCA_COPY.coaches[0], 120),
  ...BARCA_CUP_X.map((x, i) =>
    exhibit(
      museumPoint(x, BARCA_CUP_WALL + 1.72),
      barcaHonours[i].id,
      barcaHonours[i].title[0],
      90,
    ),
  ),
  exhibit(museumPoint(-12.8, -7), 'legends', BARCA_SECTIONS.legends[0]),
  exhibit(museumPoint(12.8, -7), 'matches', BARCA_SECTIONS.matches[0]),
  exhibit(museumPoint(12.8, -15.6), 'timeline', BARCA_SECTIONS.timeline[0]),
];

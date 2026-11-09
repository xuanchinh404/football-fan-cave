import { officialCoachRows } from './coach-source';
import { officialHonourRows } from './honour-source';

export const realChecked = '2026-11-09';
export const realHistory = 'https://www.realmadrid.com/en-US/the-club/history/football/first-team';
export const realCoachSource =
  'https://www.realmadrid.com/es-ES/el-club/historia/futbol/primer-equipo-masculino/entrenadores';
export const realCoachSourceEn = realHistory + '/coaches';
export const realHonourSource = 'https://www.realmadrid.com/en-US/the-club/track-record/football';
export const realAncelottiSource =
  'https://www.realmadrid.com/en-US/news/football/first-team/latest-news/comunicado-oficial-ancelotti-23-05-2025';
const announcements = 'https://www.realmadrid.com/en-US/news/club/announcements/';
const mourinho =
  'https://www.realmadrid.com/en-US/news/club/latest-news/comunicado-oficial-mourinho-11-06-2026';
const xabiExit =
  'https://www.realmadrid.com/es-ES/noticias/club/comunicados/comunicado-oficial-xabi-alonso-12-01-2026';

export type RealCopy = readonly [string, string];
export type RealLang = 'vi' | 'en';
export const realLanguage = (lang: string): RealLang =>
  lang.toLowerCase().startsWith('en') ? 'en' : 'vi';
export const realText = (lang: RealLang, copy: RealCopy) => copy[lang === 'vi' ? 0 : 1];
export const realCopy = {
  title: ['Hang Real Madrid', 'Real Madrid Cave'],
  motto: ['Nơi fan Real Madrid hội tụ', 'Where Madridistas come together'],
  tunnel: ['Đường hầm', 'Gate Tunnel'],
  refuge: ['Sảnh Trú Ẩn', 'Refuge Hall'],
  lounge: ['Góc Tâm Sự Fan', 'Madridistas Lounge'],
  passage: ['Hành lang bảo tàng', 'Museum Passage'],
  museum: ['Phòng Truyền Thống', 'Heritage Hall'],
  exit: ['Lối về Đại Sảnh', 'Return to Grand Hall'],
  score: ['Kết quả trận gần nhất', 'Latest Match Result'],
  waiting: ['Đang chờ dữ liệu trận đấu', 'Awaiting match data'],
  overview: ['Tổng quan', 'Overview'],
  honours: ['Danh hiệu & Cúp', 'Honours & Trophies'],
  coaches: ['Các đời HLV', 'Coaching History'],
  legends: ['Huyền thoại CLB', 'Club Legends'],
  matches: ['Những trận đấu để đời', 'Historic Matches'],
  gallery: ['Thư viện ảnh', 'Photo Gallery'],
  timeline: ['Dòng thời gian lịch sử', 'Historical Timeline'],
  stats: ['Kỷ lục & Thống kê', 'Records & Statistics'],
} as const;
export const realSections = [
  'overview',
  'honours',
  'coaches',
  'legends',
  'matches',
  'gallery',
  'timeline',
  'stats',
] as const;
export type RealSection = (typeof realSections)[number];

export type CoachTerm = {
  id: string;
  personId: string;
  start: number;
  end: number | null;
  startDate?: string;
  endDate?: string;
  current: boolean;
  sources: string[];
};
type CoachPerson = {
  id: string;
  name: string;
  nationality: string;
  portrait?: string;
  bio?: RealCopy;
  honours?: RealCopy;
  sources: string[];
};
const termDetails: Record<string, Pick<CoachTerm, 'startDate' | 'endDate' | 'sources'>> = {
  'jose-mourinho-2026': {
    startDate: '2026-07-13',
    sources: [
      mourinho,
      'https://www.realmadrid.com/en-US/football/first-team/players/jose-mourinho',
    ],
  },
  'alvaro-arbeloa-2026': {
    startDate: '2026-01-12',
    endDate: '2026-06-09',
    sources: [
      announcements + 'comunicado-oficial-alvaro-arbeloa-12-01-2026',
      announcements + 'comunicado-oficial-arbeloa-09-06-2026',
    ],
  },
  'xabi-alonso-2025': {
    startDate: '2025-06-01',
    endDate: '2026-01-12',
    sources: [announcements + 'comunicado-oficial-xabi-alonso-25-05-2025', xabiExit],
  },
  'carlo-ancelotti-2021': { endDate: '2025-05-24', sources: [realAncelottiSource] },
};
const highlights: Record<string, Pick<CoachPerson, 'bio' | 'honours' | 'portrait'>> = {
  'carlo-ancelotti': {
    bio: [
      'HLV người Ý đã dẫn dắt Real Madrid tới La Décima năm 2014 và trở lại năm 2021.',
      'The Italian coach led Madrid to La Décima in 2014 and returned in 2021.',
    ],
    honours: [
      '15 danh hiệu cùng Madrid, gồm 3 Cúp châu Âu, 3 cúp thế giới, 3 Siêu cúp UEFA, 2 La Liga, 2 Copa del Rey và 2 Siêu cúp Tây Ban Nha.',
      '15 Madrid trophies, including 3 European Cups, 3 world titles, 3 UEFA Super Cups, 2 La Liga titles, 2 Copa del Rey titles and 2 Spanish Super Cups.',
    ],
  },
  'jose-mourinho': {
    bio: [
      'HLV người Bồ Đào Nha trở lại Madrid vào mùa hè 2026.',
      'The Portuguese coach returned to Madrid in summer 2026.',
    ],
    honours: [
      'Ở nhiệm kỳ đầu, ông giành La Liga, Copa del Rey và Siêu cúp Tây Ban Nha.',
      'In his first tenure he won La Liga, the Copa del Rey and the Spanish Super Cup.',
    ],
  },
  'zinedine-zidane': {
    bio: [
      'Sau sự nghiệp cầu thủ tại Madrid, Zidane dẫn dắt đội một qua hai nhiệm kỳ.',
      'After playing for Madrid, Zidane led the first team across two spells.',
    ],
    honours: [
      'Ba Champions League liên tiếp từ 2016 đến 2018.',
      'Three consecutive Champions League titles from 2016 to 2018.',
    ],
  },
};
const licensedPortraits = new Set([
  'carlo-ancelotti',
  'zinedine-zidane',
  'jose-mourinho',
  'xabi-alonso',
  'alvaro-arbeloa',
  'miguel-munoz',
]);
export const realPhoto = (id: string) => '/art/real/' + id + '.webp';
export const realPhotoCredits = '/art/real/credits.html';
export const realGallery = [
  { id: 'madrid-1950s', label: ['Real Madrid thập niên 1950', 'Real Madrid in the 1950s'] },
  { id: 'decima', label: ['Lễ mừng La Décima', 'La Décima celebrations'] },
  { id: 'european-cups', label: ['Tủ Cúp châu Âu', 'European Cup display'] },
  { id: 'bernabeu', label: ['Khán đài Santiago Bernabéu', 'Inside the Santiago Bernabéu'] },
] as const;
const rows: readonly (readonly [string, string, number, number | null, string])[] =
  officialCoachRows;
const people = new Map<string, CoachPerson>();
export const realCoachTerms: CoachTerm[] = rows.map(([personId, name, start, end, nationality]) => {
  const id = personId + '-' + start;
  const details = termDetails[id];
  const sources = [realCoachSource, ...(details?.sources ?? [])];
  const person = people.get(personId);
  if (person) person.sources = [...new Set([...person.sources, ...sources])];
  else
    people.set(personId, {
      id: personId,
      name,
      nationality,
      sources,
      ...highlights[personId],
      portrait: licensedPortraits.has(personId) ? realPhoto(personId) : undefined,
    });
  return { ...details, id, personId, start, end, current: end === null, sources };
});
export const realCoaches = Object.fromEntries(people);
export const realEras = [
  { label: ['Trước 1950', 'Before 1950'], from: 0, until: 1949 },
  { label: ['1950–1979', '1950–1979'], from: 1950, until: 1979 },
  { label: ['1980–1999', '1980–1999'], from: 1980, until: 1999 },
  { label: ['2000–2019', '2000–2019'], from: 2000, until: 2019 },
  { label: ['2020–nay', '2020–present'], from: 2020, until: Infinity },
] as const;
export function realTermsInEra(index: number) {
  const era = realEras[index];
  return realCoachTerms.filter(
    (term) => term.start <= era.until && (term.end ?? Infinity) >= era.from,
  );
}
export const realTermLabel = (term: CoachTerm, lang: RealLang) =>
  term.end === term.start
    ? String(term.start)
    : term.start + '–' + (term.end ?? (lang === 'vi' ? 'nay' : 'present'));

const honourNames: Record<(typeof officialHonourRows)[number][0], RealCopy> = {
  'The Best Club of the 20th Century FIFA Trophy': [
    'CLB xuất sắc nhất thế kỷ XX',
    'FIFA Club of the 20th Century',
  ],
  'Champions Leagues': ['Cúp C1 / UEFA Champions League', 'European Cup / UEFA Champions League'],
  'FIFA Club World Cups': ['Các danh hiệu thế giới', 'World club titles'],
  'European Super Cups': ['Siêu cúp UEFA', 'UEFA Super Cup'],
  'UEFA Cups': ['Cúp UEFA', 'UEFA Cup'],
  Leagues: ['La Liga', 'La Liga'],
  'Spanish Cups': ['Copa del Rey', 'Copa del Rey'],
  'Spanish Super Cups': ['Siêu cúp Tây Ban Nha', 'Supercopa de España'],
  'League Cup': ['Cúp Liên đoàn', 'Spanish League Cup'],
  'Mini World Cups': ['Cúp Thế giới Nhỏ', 'Small Club World Cup'],
  'Latin Cups': ['Cúp Latin', 'Latin Cup'],
  'Ibero-American Cup': ['Cúp Ibero-Mỹ', 'Ibero-American Cup'],
  'Regional Championships': ['Giải vô địch vùng', 'Regional Championships'],
  'Mancomunados Trophies': ['Cúp Mancomunados', 'Mancomunados Trophies'],
};
export const realHonours = officialHonourRows.map(([id, seasons]) => ({
  id,
  title: honourNames[id],
  seasons,
  source: realHonourSource,
}));
export const realDisplayCups = [
  'Leagues',
  'Spanish Cups',
  'Champions Leagues',
  'European Super Cups',
  'FIFA Club World Cups',
  'Spanish Super Cups',
  'UEFA Cups',
] as const;

export const realTimeline: { year: string; title: RealCopy; detail: RealCopy }[] = [
  {
    year: '1902',
    title: ['Thành lập CLB', 'The club is founded'],
    detail: [
      'Madrid Football Club được chính thức thành lập ngày 6 tháng 3.',
      'Madrid Football Club was formally founded on 6 March.',
    ],
  },
  {
    year: '1956',
    title: ['Cúp châu Âu đầu tiên', 'First European Cup'],
    detail: [
      'Real Madrid thắng Stade de Reims 4–3 tại Paris.',
      'Real Madrid beat Stade de Reims 4–3 in Paris.',
    ],
  },
  {
    year: '1956–1960',
    title: ['Năm Cúp châu Âu liên tiếp', 'Five consecutive European Cups'],
    detail: [
      'Madrid vô địch cả năm mùa đầu tiên của giải.',
      'Madrid won each of the competition’s first five editions.',
    ],
  },
  {
    year: '2000',
    title: ['Kỷ nguyên Galácticos', 'The Galácticos era'],
    detail: [
      'Florentino Pérez đắc cử chủ tịch và Luís Figo đến Madrid.',
      'Florentino Pérez became president and Luís Figo arrived in Madrid.',
    ],
  },
  {
    year: '2014',
    title: ['La Décima', 'La Décima'],
    detail: [
      'Madrid giành Cúp châu Âu thứ mười tại Lisbon.',
      'Madrid won its tenth European Cup in Lisbon.',
    ],
  },
  {
    year: '2016–2018',
    title: ['Ba lần liên tiếp', 'Three in a row'],
    detail: [
      'Zidane dẫn dắt đội tới ba chức vô địch Champions League liên tiếp.',
      'Zidane led the club to three consecutive Champions League titles.',
    ],
  },
  {
    year: '2022',
    title: ['La Decimocuarta', 'La Decimocuarta'],
    detail: [
      'Madrid hạ Liverpool tại Paris để giành danh hiệu thứ 14.',
      'Madrid beat Liverpool in Paris for its 14th European Cup.',
    ],
  },
  {
    year: '2024',
    title: ['La Decimoquinta', 'La Decimoquinta'],
    detail: [
      'Madrid thắng Borussia Dortmund tại Wembley để giành danh hiệu thứ 15.',
      'Madrid beat Borussia Dortmund at Wembley for its 15th European Cup.',
    ],
  },
];

export const realMatches = [
  {
    date: '1956-06-13',
    opponent: 'Stade de Reims',
    score: '4–3',
    venue: 'Parc des Princes, Paris',
    note: [
      'Madrid lội ngược dòng để vô địch Cúp C1 đầu tiên.',
      'Madrid came from behind to win the inaugural European Cup.',
    ],
  },
  {
    date: '1960-05-18',
    opponent: 'Eintracht Frankfurt',
    score: '7–3',
    venue: 'Hampden Park, Glasgow',
    note: [
      'Puskás ghi bốn bàn, Di Stéfano ghi ba bàn.',
      'Puskás scored four and Di Stéfano scored three.',
    ],
  },
  {
    date: '2014-05-24',
    opponent: 'Atlético de Madrid',
    score: '4–1',
    venue: 'Estádio da Luz, Lisbon',
    note: [
      'Ramos gỡ hòa ở phút bù giờ trước khi Madrid ghi ba bàn trong hiệp phụ.',
      'Ramos equalised in stoppage time before Madrid scored three in extra time.',
    ],
  },
  {
    date: '2016-05-28',
    opponent: 'Atlético de Madrid',
    score: '1–1 (5–3 pen.)',
    venue: 'San Siro, Milan',
    note: [
      'Madrid thắng luân lưu, mở đầu chuỗi ba chức vô địch.',
      'Madrid won on penalties to begin its run of three consecutive titles.',
    ],
  },
  {
    date: '2017-06-03',
    opponent: 'Juventus',
    score: '4–1',
    venue: 'National Stadium of Wales, Cardiff',
    note: ['Ronaldo lập cú đúp trong trận chung kết.', 'Ronaldo scored twice in the final.'],
  },
  {
    date: '2018-05-26',
    opponent: 'Liverpool',
    score: '3–1',
    venue: 'NSC Olimpiyskiy, Kyiv',
    note: [
      'Gareth Bale ghi hai bàn, trong đó có cú móc bóng.',
      'Gareth Bale scored twice, including an overhead kick.',
    ],
  },
  {
    date: '2022-05-28',
    opponent: 'Liverpool',
    score: '1–0',
    venue: 'Stade de France, Saint-Denis',
    note: ['Vinícius Júnior ghi bàn duy nhất.', 'Vinícius Júnior scored the only goal.'],
  },
  {
    date: '2023-04-05',
    opponent: 'FC Barcelona',
    score: '4–0',
    venue: 'Camp Nou, Barcelona',
    cup: 'Copa del Rey',
    note: [
      'Benzema lập hat-trick ở bán kết lượt về.',
      'Benzema scored a hat-trick in the semi-final second leg.',
    ],
  },
  {
    date: '2024-06-01',
    opponent: 'Borussia Dortmund',
    score: '2–0',
    venue: 'Wembley, London',
    note: [
      'Carvajal và Vinícius Júnior ghi bàn trong hiệp hai.',
      'Carvajal and Vinícius Júnior scored in the second half.',
    ],
  },
] satisfies {
  date: string;
  opponent: string;
  score: string;
  venue: string;
  cup?: string;
  note: RealCopy;
}[];

export const realLegends = [
  ['Alfredo Di Stéfano', '1953–1964', 'alfredo-di-stefano-laulhe'],
  ['Ferenc Puskás', '1958–1967', 'ferenc-puskas-biro'],
  ['Paco Gento', '1953–1971', 'francisco-gento-lopez'],
  ['Pirri', '1964–1980', 'jose-martinez-sanchez'],
  ['Emilio Butragueño', '1984–1995', 'emilio-butragueno-santos'],
  ['Raúl González', '1994–2010', 'raul-gonzalez-blanco'],
  ['Iker Casillas', '1999–2015', 'iker-casillas-fernandez'],
  ['Zinedine Zidane', '2001–2006', 'zinedine-zidane'],
  ['Sergio Ramos', '2005–2021', 'sergio-ramos-garcia'],
  ['Cristiano Ronaldo', '2009–2018', 'cristiano-ronaldo-dos-santos-aveiro'],
  ['Karim Benzema', '2009–2023', 'karim-benzema'],
  ['Luka Modrić', '2012–2025', 'luka-modric'],
] as const;

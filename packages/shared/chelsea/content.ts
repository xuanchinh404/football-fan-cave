import { TROPHY_SPOTS, LEGEND_SPOTS, HISTORY_SPOTS } from './layout';
export const CHELSEA_VERIFIED_AT = '2026-11-05';
const cabinet = 'https://www.chelseafc.com/en/mens-trophy-cabinet-asia';
const founders = 'https://www.chelseafc.com/en/news/article/founders-day-the-birth-of-the-blues';
const historySource = 'https://www.chelseafc.com/en/the-story-of-chelsea';
export type BluesExhibit = {
  id: string;
  type: string;
  heading: string;
  detail: string;
  source: string;
  x: number;
  z: number;
  seasons?: string[];
  stories?: Record<string, string>;
  coaches?: (typeof chelseaManagers)[number][];
};
export const chelseaTrophies = [
  ['league', 'Vô địch Anh', '1954/55,2004/05,2005/06,2009/10,2014/15,2016/17', 'league'],
  ['champions', 'UEFA Champions League', '2011/12,2020/21', 'europe'],
  ['fa', 'FA Cup', '1969/70,1996/97,1999/00,2006/07,2008/09,2009/10,2011/12,2017/18', 'cup'],
  ['league-cup', 'League Cup', '1964/65,1997/98,2004/05,2006/07,2014/15', 'cup'],
  ['europa', 'UEFA Europa League', '2012/13,2018/19', 'spire'],
  ['winners', 'UEFA Cup Winners’ Cup', '1970/71,1997/98', 'cup'],
  ['conference', 'UEFA Conference League', '2024/25', 'spire'],
  ['super', 'UEFA Super Cup', '1998,2021', 'spire'],
  ['shield', 'Charity / Community Shield', '1955,2000,2005,2009', 'shield'],
  ['world', 'FIFA Club World Cup', '2025', 'world'],
  ['intercontinental', 'FIFA Intercontinental Cup', '2021', 'globe'],
  ['members', 'Full Members’ Cup', '1985/86,1989/90', 'cup'],
].map(([id, title, years, asset], i) => ({
  id: `blues-trophy-${id}`,
  title,
  seasons: years.split(','),
  asset,
  ...TROPHY_SPOTS[i],
  source: cabinet,
}));
export const trophyStories: Record<string, string> = {
  '2011/12':
    'Munich · 19/05/2012. Bayern 1–1 Chelsea sau hiệp phụ; Chelsea thắng luân lưu 4–3. HLV Roberto Di Matteo. Drogba gỡ hòa và thực hiện lượt sút quyết định; Petr Čech cản phá phạt đền.',
  '2020/21':
    'Porto · 29/05/2021. Manchester City 0–1 Chelsea. HLV Thomas Tuchel; Kai Havertz ghi bàn, N’Golo Kanté nổi bật ở tuyến giữa.',
  '2024/25':
    'Wrocław · 28/05/2025. Chelsea 4–1 Real Betis; HLV Enzo Maresca. Danh hiệu Conference League đầu tiên.',
  '2025':
    '13/07/2025 · Chelsea 3–0 Paris Saint-Germain. HLV Enzo Maresca; Cole Palmer lập cú đúp, João Pedro ghi bàn còn lại.',
};
/** Year-level tenure precision. Includes caretakers and repeat spells, not just selected names. */
const managerRows = [
  ['John Tait Robertson', '1905–1906'],
  ['William Lewis', '1906–1907', 'Tạm quyền'],
  ['David Calderhead', '1907–1933'],
  ['Leslie Knighton', '1933–1939'],
  ['Billy Birrell', '1939–1952'],
  ['Ted Drake', '1952–1961', 'Vô địch Anh 1955'],
  ['Tommy Docherty', '1961–1967', 'League Cup 1965'],
  ['Ron Suart', '1967', 'Tạm quyền'],
  ['Dave Sexton', '1967–1974', 'FA Cup 1970 · Cup Winners’ Cup 1971'],
  ['Ron Suart', '1974–1975', 'Tạm quyền'],
  ['Eddie McCreadie', '1975–1977'],
  ['Ken Shellito', '1977–1978'],
  ['Danny Blanchflower', '1978–1979'],
  ['Geoff Hurst', '1979–1981'],
  ['Bobby Gould', '1981', 'Tạm quyền'],
  ['John Neal', '1981–1985'],
  ['John Hollins', '1985–1988'],
  ['Bobby Campbell', '1988–1991'],
  ['Ian Porterfield', '1991–1993'],
  ['David Webb', '1993', 'Tạm quyền'],
  ['Glenn Hoddle', '1993–1996'],
  ['Ruud Gullit', '1996–1998', 'FA Cup 1997'],
  ['Gianluca Vialli', '1998–2000', 'Cup Winners’ Cup 1998 · FA Cup 2000'],
  ['Graham Rix', '2000', 'Tạm quyền'],
  ['Claudio Ranieri', '2000–2004'],
  ['José Mourinho', '2004–2007', 'Vô địch Anh 2005, 2006'],
  ['Avram Grant', '2007–2008', 'Chung kết Champions League 2008'],
  ['Luiz Felipe Scolari', '2008–2009'],
  ['Ray Wilkins', '2009', 'Tạm quyền'],
  ['Guus Hiddink', '2009', 'Tạm quyền · FA Cup 2009'],
  ['Carlo Ancelotti', '2009–2011', 'Cú đúp quốc nội 2010'],
  ['André Villas-Boas', '2011–2012'],
  ['Roberto Di Matteo', '2012', 'Champions League và FA Cup 2012'],
  ['Rafael Benítez', '2012–2013', 'Tạm quyền · Europa League 2013'],
  ['José Mourinho', '2013–2015', 'Vô địch Anh 2015'],
  ['Steve Holland', '2015', 'Tạm quyền'],
  ['Guus Hiddink', '2015–2016', 'Tạm quyền'],
  ['Antonio Conte', '2016–2018', 'Vô địch Anh 2017 · FA Cup 2018'],
  ['Maurizio Sarri', '2018–2019', 'Europa League 2019'],
  ['Frank Lampard', '2019–2021'],
  ['Thomas Tuchel', '2021–2022', 'Champions League 2021'],
  ['Graham Potter', '2022–2023'],
  ['Bruno Saltor', '2023', 'Tạm quyền'],
  ['Frank Lampard', '2023', 'Tạm quyền'],
  ['Mauricio Pochettino', '2023–2024'],
  ['Enzo Maresca', '07/2024–01/2026', 'Conference League và Club World Cup 2025'],
  ['Calum McFarlane', '2026 (tháng 1)', 'Tạm quyền'],
  ['Liam Rosenior', '06/01/2026–22/04/2026'],
  ['Calum McFarlane', '2026 (tháng 4–6)', 'Tạm quyền'],
  [
    'Xabi Alonso',
    '01/07/2026–nay',
    'HLV hiện tại. Từng đưa Bayer Leverkusen tới chức vô địch Bundesliga đầu tiên của CLB.',
  ],
];
const recentManagerSources = [
  'club-statement-enzo-maresca',
  'confirmed-chelsea-line-up-vs-man-city-040126',
  'club-statement-liam-rosenior',
  'club-statement-liam-rosenior',
  'xabi-alonso-appointed-chelsea-manager',
];
export const chelseaManagers = managerRows.map(([name, tenure, story = ''], i) => ({
  id: `blues-manager-${i}`,
  name,
  tenure,
  story,
  current: i === managerRows.length - 1,
  source:
    i >= 45
      ? `https://www.chelseafc.com/en/news/article/${recentManagerSources[i - 45]}`
      : i < 24
        ? 'https://www.bounder.friardale.co.uk/Managers.htm'
        : 'https://en.wikipedia.org/wiki/List_of_Chelsea_F.C._managers',
}));
export const managerGroups = Array.from({ length: 10 }, (_, i) => ({
  id: `blues-managers-${i}`,
  heading:
    i === 9 ? 'HLV hiện tại · Xabi Alonso' : `Các đời HLV · ${managerRows[i * 5][1].slice(0, 4)}`,
  type: 'manager',
  x: -15.3 + i * 3.4,
  z: -23.7,
  detail: 'Chọn một nhiệm kỳ để xem hồ sơ.',
  coaches: chelseaManagers.slice(i * 5, i * 5 + 5),
  source:
    i === 9
      ? 'https://www.chelseafc.com/en/news/article/xabi-alonso-appointed-chelsea-manager'
      : chelseaManagers[i * 5].source,
}));
const legendRows = [
  ['Frank Lampard', '2001–2014', '648 trận · 211 bàn. Kỷ lục ghi bàn của CLB.'],
  ['John Terry', '1998–2017', '717 trận · 67 bàn. Đội trưởng của năm chức vô địch Premier League.'],
  ['Didier Drogba', '2004–2012 · 2014–2015', '381 trận · 164 bàn. Người hùng Munich 2012.'],
  ['Petr Čech', '2004–2015', '494 trận · 228 trận giữ sạch lưới.'],
  ['Eden Hazard', '2012–2019', '352 trận · 110 bàn. Hai chức vô địch Premier League.'],
  [
    'Gianfranco Zola',
    '1996–2003',
    '312 trận · 80 bàn. Ghi bàn quyết định chung kết Cup Winners’ Cup 1998.',
  ],
  [
    'Ashley Cole',
    '2006–2014',
    '338 trận theo hồ sơ Chelsea FC năm 2024. Vô địch châu Âu năm 2012.',
  ],
  ['Claude Makélélé', '2003–2008', '217 trận · 2 bàn. Trụ cột tuyến giữa giai đoạn 2004–2006.'],
  [
    'N’Golo Kanté',
    '2016–2023',
    '269 trận · 13 bàn. Cầu thủ xuất sắc nhất chung kết Champions League 2021.',
  ],
];
export const chelseaLegends = legendRows.map(([name, years, bio], i) => ({
  id: `blues-legend-${i}`,
  type: 'legend',
  heading: name,
  detail: `${years}\n${bio}`,
  source: `https://www.chelseafc.com/en/${['news/article/chelsea-s-team-of-120-midfielder-frank-lampard', 'news/article/chelseas-team-of-120-centre-back-john-terry', 'didier-drogba', 'news/article/chelseas-team-of-120-goalkeeper-petr-cech', 'eden-hazard', 'news/article/chelseas-team-of-120-forward-gianfranco-zola', 'news/article/ashley-cole-a-true-blue-legend', 'news/article/claude-makelele-returns-to-chelsea-in-a-new-coaching-role', 'ngolo-kante'][i]}`,
  ...LEGEND_SPOTS[i],
}));
const historyRows = [
  ['1905', 'Thành lập', 'Chelsea ra đời ngày 10/03/1905 tại Fulham Road.'],
  ['1955', 'Lần đầu vô địch Anh', 'Ted Drake đưa Chelsea tới ngôi vô địch First Division 1954/55.'],
  ['1970', 'FA Cup đầu tiên', 'Đánh bại Leeds 2–1 trong trận đá lại tại Old Trafford.'],
  ['2005', 'Sắc xanh trở lại đỉnh cao', 'Vô địch Premier League 2004/05 dưới thời José Mourinho.'],
  ['2012', 'Đêm Munich', 'Chelsea lần đầu vô địch Champions League.'],
  ['2015', 'Lần thứ năm vô địch Anh', 'Gồm First Division 1955 và bốn Premier League tới 2015.'],
  ['2021', 'Porto rực xanh', 'Danh hiệu Champions League thứ hai, thắng Manchester City 1–0.'],
  ['2025', 'Một chương quốc tế', 'Vô địch Conference League và FIFA Club World Cup.'],
  ['2026', 'Kỷ nguyên Xabi Alonso', 'Bắt đầu nhiệm kỳ từ 01/07/2026.'],
];
export const chelseaHistory = historyRows.map(([year, title, detail], i) => ({
  id: `blues-history-${year}`,
  type: 'history',
  heading: `${year} · ${title}`,
  detail,
  source: i === 8 ? chelseaManagers.at(-1)!.source : i === 0 ? founders : cabinet,
  ...HISTORY_SPOTS[i],
  year,
}));
export const chelseaMatches: BluesExhibit[] = [
  {
    id: 'blues-match-2012',
    type: 'match',
    heading: 'Munich 2012 · Niềm tin đến cùng',
    detail: trophyStories['2011/12'],
    source: 'https://www.chelseafc.com/en/2012-champions-league',
    x: 6,
    z: 12,
  },
  {
    id: 'blues-match-2021',
    type: 'match',
    heading: 'Porto 2021 · Châu Âu lại xanh',
    detail: trophyStories['2020/21'],
    source: 'https://www.chelseafc.com/en/2021-champions-league',
    x: 12,
    z: 12,
  },
  {
    id: 'blues-library',
    type: 'library',
    heading: 'Thư viện tư liệu Chelsea',
    detail:
      'Chưa tích hợp ảnh hoặc video được cấp phép. Bạn có thể đọc hồ sơ chính thức của Chelsea qua liên kết bên dưới.',
    source: historySource,
    x: 19,
    z: 19,
  },
];
export const chelseaExhibits: BluesExhibit[] = [
  ...chelseaTrophies.map((t) => ({
    ...t,
    type: 'trophy',
    heading: t.title,
    detail: `${t.seasons.length} lần vô địch\n${t.id === 'blues-trophy-league' ? '1 First Division + 5 Premier League.\n' : t.id === 'blues-trophy-intercontinental' ? 'Phân loại Chelsea FC hiện hành: FIFA Intercontinental Cup (formerly FIFA Club World Cup). Giải năm 2021 thi đấu vào tháng 2/2022.\n' : ''}${t.seasons.join(' · ')}`,
    stories: ['blues-trophy-champions', 'blues-trophy-conference', 'blues-trophy-world'].includes(
      t.id,
    )
      ? trophyStories
      : undefined,
  })),
  ...managerGroups,
  ...chelseaLegends,
  ...chelseaHistory,
  ...chelseaMatches,
  {
    id: 'blues-drogba-statue',
    type: 'legend',
    heading: 'Didier Drogba · Huyền thoại The Blues',
    detail: chelseaLegends[2].detail + '\nTượng minh họa cách điệu, thiết kế gốc cho game.',
    source: chelseaLegends[2].source,
    x: -11,
    z: -19,
  },
];
export type CaveMood = 'peaceful' | 'prematch' | 'sheltering' | 'celebrating';
/** Explicit demo, never an official result feed. Replace at the content boundary when an API exists. */
export const chelseaMatchState = {
  demo: true,
  mood: 'sheltering' as CaveMood,
  home: 'Chelsea',
  away: 'Arsenal',
  score: '0 – 3',
  time: 'FT · Trận giả định',
  caption: 'The Blues lại vào hang!',
  label: 'DEMO · KHÔNG PHẢI KẾT QUẢ THẬT',
};

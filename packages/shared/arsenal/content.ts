import {
  ARSENAL_CUP_SPOTS,
  ARSENAL_COACH_SPOTS,
  ARSENAL_LEGEND_SPOTS,
  ARSENAL_HISTORY_SPOTS,
  ARSENAL_MATCH_SPOTS,
  ARSENAL_STATUE,
  ARSENAL_RECORDS,
  ARSENAL_ARCHIVE,
} from './layout';

export const ARSENAL_VERIFIED_AT = '2026-11-07';
export const arsenalSources = {
  history: 'https://www.arsenal.com/history',
  titles: 'https://www.premierleague.com/en/news/4662306',
  shield: 'https://www.thefa.com/news/2026/aug/16/fa-community-shield-2026-report-16082026',
  arteta:
    'https://www.premierleague.com/en/news/4729992/mikel-arteta-signs-new-contract-with-arsenal',
  wenger: 'https://www.arsenal.com/feature/the-wenger-years-a05Ex7F5N6vd',
  fa: 'https://www.arsenal.com/feature/when-did-arsenal-win-the-fa-cup-anXj08y0v46j',
  leagueCup: 'https://www.efl.com/competitions/carabao-cup/previous-finals/',
  onThisDay: 'https://www.arsenal.com/feature/on-this-day-in...-affGL5G50ETV',
  invincibles:
    'https://www.arsenal.com/feature/relive-six-classic-home-wins-against-leicester-a6te76S9s3AW',
  anfield:
    'https://www.arsenal.com/feature/when-arsenal-became-world-champions-in-the-usa-agpDM7u53P6S',
};
export type ArsenalExhibit = {
  id: string;
  heading: string;
  detail: string;
  type: string;
  x: number;
  z: number;
  source: string;
  seasons?: string[];
  stories?: Record<string, string>;
  seasonSources?: Record<string, string>;
  approach?: { x: number; z: number };
};
const S = arsenalSources;
const groups: (Pick<ArsenalExhibit, 'source' | 'detail' | 'stories' | 'seasonSources'> & {
  slug: string;
  title: string;
  seasons: string;
})[] = [
  {
    slug: 'league',
    title: 'Vô địch Anh',
    seasons:
      '1930/31 1932/33 1933/34 1934/35 1937/38 1947/48 1951/52 1956/57 1988/89 1990/91 1997/98 2001/02 2003/04 2025/26',
    source: S.history,
    detail:
      '10 First Division và 4 Premier League. Danh hiệu 2025/26 được Premier League xác nhận.',
    stories: {
      '1988/89':
        'George Graham. Arsenal thắng Liverpool 2–0 tại Anfield ở trận cuối mùa, với bàn quyết định của Michael Thomas.',
      '2003/04': 'Arsène Wenger. Arsenal bất bại qua 38 trận Premier League, thắng 26 và hòa 12.',
      '2025/26':
        'Mikel Arteta. Danh hiệu thứ tư trong kỷ nguyên Premier League, sau 22 năm chờ đợi.',
    },
    seasonSources: { '2025/26': S.titles, '1988/89': S.anfield, '2003/04': S.wenger },
  },
  {
    slug: 'fa',
    title: 'FA Cup',
    seasons:
      '1929/30 1935/36 1949/50 1970/71 1978/79 1992/93 1997/98 2001/02 2002/03 2004/05 2013/14 2014/15 2016/17 2019/20',
    source: S.fa,
    detail: 'Các mùa thắng chung kết FA Cup của đội một nam.',
    stories: {
      '1929/30':
        'Herbert Chapman. Arsenal 2–0 Huddersfield Town tại Wembley. Alex James và Jack Lambert ghi bàn.',
      '2013/14':
        'Arsène Wenger. Arsenal lội ngược dòng trước Hull City và thắng 3–2 sau hiệp phụ, với bàn quyết định của Aaron Ramsey.',
      '2016/17': 'Arsène Wenger. Arsenal thắng Chelsea 2–1. Aaron Ramsey ghi bàn quyết định.',
      '2019/20':
        'Mikel Arteta. Arsenal thắng Chelsea 2–1. Pierre-Emerick Aubameyang ghi cả hai bàn.',
    },
  },
  {
    slug: 'league-cup',
    title: 'League Cup',
    seasons: '1986/87 1992/93',
    source: S.leagueCup,
    detail: 'Cúp Liên đoàn Anh.',
    stories: {
      '1986/87': 'George Graham. Arsenal 2–1 Liverpool, Charlie Nicholas lập cú đúp.',
      '1992/93': 'George Graham. Arsenal 2–1 Sheffield Wednesday, Steve Morrow ghi bàn quyết định.',
    },
  },
  {
    slug: 'winners',
    title: 'European Cup Winners’ Cup',
    seasons: '1993/94',
    source: S.onThisDay,
    detail: 'Cúp C2 châu Âu.',
    stories: {
      '1993/94':
        '04/05/1994 · Copenhagen. Arsenal thắng Parma 1–0 với bàn của Alan Smith. HLV George Graham.',
    },
  },
  {
    slug: 'fairs',
    title: 'Inter-Cities Fairs Cup',
    seasons: '1969/70',
    source: S.onThisDay,
    detail: 'Danh hiệu Inter-Cities Fairs Cup, trưng bày riêng với các giải UEFA.',
    stories: {
      '1969/70':
        'Bertie Mee. Thua 1–3 trên sân Anderlecht, Arsenal thắng 3–0 ở Highbury và đoạt cúp với tổng tỷ số 4–3.',
    },
  },
  {
    slug: 'shield',
    title: 'Charity / Community Shield',
    seasons:
      '1930 1931 1933 1934 1938 1948 1953 1991 1998 1999 2002 2004 2014 2015 2017 2020 2023 2026',
    source: S.history,
    detail: '17 lần vô địch riêng và 1 lần chia sẻ với Tottenham (1991). Tính đến kỳ 2026.',
    stories: {
      '1991': 'Arsenal hòa Tottenham 0–0 và chia sẻ danh hiệu.',
      '2026':
        '16/08/2026 · Cardiff. Arsenal thắng Manchester City 3–0. Calafiori, Havertz và Ødegaard ghi bàn.',
    },
    seasonSources: { '2026': S.shield },
  },
];
export const arsenalTrophies = groups.map((g, i) => ({
  ...g,
  ...ARSENAL_CUP_SPOTS[i],
  id: 'arsenal-cup-' + g.slug,
  heading: g.title,
  type: 'trophy',
  seasons: g.seasons.split(' '),
}));
const coaches = [
  [
    'Herbert Chapman',
    '1925–1934',
    'FA Cup 1930 và hai chức vô địch Anh. Dấu ấn chiến thuật WM.',
    'https://www.arsenal.com/feature/arsenal-statues-akU5V2J6WNyM',
  ],
  ['George Allison', '1934–1947', 'Hai chức vô địch Anh và FA Cup 1936.', S.fa],
  ['Tom Whittaker', '1947–1956', 'Hai chức vô địch Anh sau chiến tranh và FA Cup 1950.', S.fa],
  ['Bertie Mee', '1966–1976', 'Fairs Cup 1970 và cú đúp quốc nội 1971.', S.onThisDay],
  ['George Graham', '1986–1995', 'Hai chức vô địch Anh và Cup Winners’ Cup 1994.', S.onThisDay],
  [
    'Arsène Wenger',
    '1996–2018',
    'Ba Premier League và bảy FA Cup. Dẫn dắt mùa Invincibles 2003/04.',
    S.wenger,
  ],
  [
    'Unai Emery',
    '2018–2019',
    'Đưa Arsenal vào chung kết UEFA Europa League 2018/19.',
    'https://www.uefa.com/uefaeuropaleague/history/seasons/2019/',
  ],
  [
    'Mikel Arteta',
    '12/2019–nay',
    'FA Cup 2020 và Premier League 2025/26. Gia hạn với Arsenal vào tháng 10/2026.',
    S.arteta,
  ],
] as const;
export const currentArsenalCoach = {
  name: 'Mikel Arteta',
  verifiedAt: ARSENAL_VERIFIED_AT,
  source: S.arteta,
};
export const arsenalManagers = coaches.map(([name, tenure, detail, source], i) => ({
  ...ARSENAL_COACH_SPOTS[i],
  id: 'arsenal-coach-' + i,
  type: 'manager',
  heading: name,
  tenure,
  detail: tenure + ' · ' + detail,
  source,
  current: name === currentArsenalCoach.name,
}));
const legendRows = [
  [
    'Thierry Henry',
    14,
    'Kỷ lục ghi bàn Arsenal. Vua phá lưới Premier League mùa 2003/04 với 30 bàn.',
  ],
  [
    'Dennis Bergkamp',
    10,
    'Đường chuyền cho Patrick Vieira ấn định chiến thắng khép lại mùa Invincibles.',
  ],
  [
    'Patrick Vieira',
    4,
    'Đội trưởng mùa Invincibles. Ghi bàn quyết định trước Leicester ở vòng cuối.',
  ],
  ['Robert Pirès', 7, 'Ghi bàn ở White Hart Lane khi Arsenal chốt ngôi vô địch mùa 2003/04.'],
  ['Tony Adams', 6, 'Đội trưởng Arsenal trong cú đúp 1997/98.'],
  ['Ian Wright', 8, 'Ghi bàn trong trận đá lại chung kết FA Cup 1993.'],
  ['Freddie Ljungberg', 8, 'Ghi bàn trong trận thắng Chelsea ở chung kết FA Cup 2002.'],
  [
    'David Seaman',
    1,
    'Thủ môn bắt chính trong chiến thắng trước Parma ở chung kết Cup Winners’ Cup 1994.',
  ],
  [
    'Sol Campbell',
    23,
    'Trung vệ của đội hình Invincibles và người ghi bàn cho Arsenal ở chung kết Champions League 2006.',
  ],
] as const;
export const arsenalLegends = legendRows.map(([heading, number, detail], i) => ({
  ...ARSENAL_LEGEND_SPOTS[i],
  id: 'arsenal-legend-' + i,
  type: 'legend',
  heading,
  number,
  detail,
  source: [
    S.titles,
    S.invincibles,
    S.invincibles,
    S.onThisDay,
    S.wenger,
    S.fa,
    S.fa,
    S.onThisDay,
    S.wenger,
  ][i],
}));
const historyRows = [
  [
    '1886',
    'Thành lập CLB',
    'Các công nhân xưởng quân giới ở Woolwich lập đội bóng, tiền thân của Arsenal.',
    S.history,
  ],
  [
    '1930',
    'FA Cup đầu tiên',
    'Arsenal thắng Huddersfield Town 2–0 tại Wembley dưới thời Herbert Chapman.',
    S.fa,
  ],
  [
    '1971',
    'Cú đúp đầu tiên',
    'Thắng Tottenham để chốt ngôi vô địch Anh, rồi vượt qua Liverpool trong chung kết FA Cup.',
    S.onThisDay,
  ],
  [
    '1989',
    'Đêm Anfield',
    'Alan Smith và Michael Thomas ghi bàn trong trận thắng 2–0 trước Liverpool, định đoạt chức vô địch.',
    S.anfield,
  ],
  [
    '1998',
    'Cú đúp thời Wenger',
    'Arsenal vô địch Premier League và thắng Newcastle ở chung kết FA Cup.',
    S.wenger,
  ],
  ['2003/04', 'The Invincibles', '38 trận Premier League bất bại trong một mùa.', S.wenger],
  ['2014', 'Trở lại Wembley', 'Arsenal thắng Hull City 3–2 sau hiệp phụ ở chung kết FA Cup.', S.fa],
  ['2017', 'FA Cup thứ 13', 'Arsenal thắng Chelsea 2–1 tại Wembley.', S.fa],
  ['2020', 'FA Cup thứ 14', 'Cú đúp của Aubameyang mang về chiến thắng trước Chelsea.', S.fa],
  ['2026', 'Trở lại đỉnh nước Anh', 'Vô địch Premier League mùa 2025/26 sau 22 năm.', S.titles],
] as const;
export const arsenalHistory = historyRows.map(([year, title, detail, source], i) => ({
  ...ARSENAL_HISTORY_SPOTS[i],
  id: 'arsenal-history-' + i,
  type: 'history',
  heading: year + ' · ' + title,
  year,
  title,
  detail,
  source,
}));
const matchRows = [
  [
    'Anfield 1989',
    '26/05/1989 · Liverpool 0–2 Arsenal',
    'Michael Thomas ghi bàn quyết định trong thời gian bù giờ. Arsenal đoạt chức vô địch Anh.',
    S.onThisDay,
  ],
  [
    'White Hart Lane 2004',
    '25/04/2004 · Tottenham 2–2 Arsenal',
    'Vieira và Pirès ghi bàn. Trận hòa giúp Arsenal đoạt chức vô địch ngay trên sân kình địch Bắc London.',
    S.onThisDay,
  ],
  [
    'Wembley 2014',
    '17/05/2014 · Arsenal 3–2 Hull City (hiệp phụ)',
    'Arsenal bị dẫn hai bàn. Cazorla, Koscielny và Ramsey ghi bàn để mang về FA Cup.',
    S.fa,
  ],
] as const;
export const arsenalMatches = matchRows.map(([heading, score, detail, source], i) => ({
  ...ARSENAL_MATCH_SPOTS[i],
  id: 'arsenal-match-' + i,
  type: 'match',
  heading,
  score,
  detail: score + '\n' + detail,
  source,
}));
export const arsenalTribute: ArsenalExhibit = {
  ...ARSENAL_STATUE,
  id: 'arsenal-wenger',
  type: 'legend',
  heading: 'Arsène Wenger · 1996–2018',
  detail:
    'Không gian tưởng niệm HLV dẫn dắt mùa Invincibles. Mẫu áo và huy hiệu pháo là hiện vật minh họa. Tượng chân dung đang chờ model phù hợp.',
  source: S.wenger,
  approach: { x: ARSENAL_STATUE.x, z: ARSENAL_STATUE.z + 2.25 },
};
export const arsenalArchive: ArsenalExhibit = {
  ...ARSENAL_ARCHIVE,
  id: 'arsenal-archive',
  type: 'archive',
  heading: 'Thư viện ảnh Arsenal',
  detail:
    'Kiosk dẫn tới tư liệu chính thức của CLB. Bộ ảnh và phim trận đấu trong game đang chờ quyền sử dụng.',
  source: S.history,
};
export const arsenalRecords: ArsenalExhibit = {
  ...ARSENAL_RECORDS,
  id: 'arsenal-records',
  type: 'records',
  heading: 'Kỷ lục & Thống kê',
  detail:
    'Mùa Invincibles 2003/04: 26 thắng, 12 hòa, 0 thua. Chuỗi bất bại kéo dài 49 trận qua nhiều mùa.',
  source: S.wenger,
};
export const arsenalExhibits: ArsenalExhibit[] = [
  ...arsenalTrophies,
  ...arsenalManagers,
  ...arsenalLegends,
  ...arsenalHistory,
  ...arsenalMatches,
  arsenalTribute,
  arsenalArchive,
  arsenalRecords,
];
export const arsenalDemo = {
  home: 'Arsenal',
  away: 'Tottenham',
  score: '1 – 2',
  time: 'FT · TRẬN GIẢ ĐỊNH',
  label: 'DEMO · KHÔNG PHẢI KẾT QUẢ THẬT',
  caption: 'The Gunners lại vào hang!',
};

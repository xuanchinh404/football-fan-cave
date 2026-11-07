import {
  KOP_COACHES,
  KOP_CUPS,
  KOP_ISTANBUL,
  KOP_LEGENDS,
  KOP_SHANKLY,
  KOP_SHIELD,
  KOP_TIMELINE,
} from './layout';

export const LIVERPOOL_VERIFIED_AT = '2026-11-07';
const club = 'https://www.liverpoolfc.com';
const honours = club + '/info/honours/';
const history = club + '/info/liverpool-fc-history';
const coaches = club + '/info/past-managers';
const iraola = club + '/news/liverpool-fc-appoint-andoni-iraola-new-head-coach';
const istanbul = club + '/news/no5-won-inexplicable-night-istanbul';
const shankly = club + '/news/lfc-remembers-bill-shankly-anniversary-his-passing';

export const liverpoolDemo = {
  label: 'DEMO · KHÔNG PHẢI KẾT QUẢ THẬT',
  home: 'Liverpool',
  away: 'Đối thủ',
  score: '—',
  time: 'Ngày và giải đấu chưa xác minh',
  caption: 'Chưa có dữ liệu trận đấu trực tiếp',
  status: 'Chưa xác minh',
  message: 'Cửa hang vẫn mở. The Kop vẫn hát!',
};

type Exhibit = {
  id: string;
  type: string;
  heading: string;
  detail: string;
  source: string;
  x: number;
  z: number;
  approach: { x: number; z: number };
  seasons?: string[];
  stories?: Record<string, string>;
};
function display(
  id: string,
  type: string,
  heading: string,
  detail: string,
  source: string,
  spot: { x: number; z: number },
  dx = 0,
  dz = 1.65,
): Exhibit {
  return {
    id: 'kop-' + id,
    type,
    heading,
    detail,
    source,
    ...spot,
    approach: { x: spot.x + dx, z: spot.z + dz },
  };
}

const cups = [
  [
    'league',
    'Vô địch quốc gia Anh',
    '1900/01 1905/06 1921/22 1922/23 1946/47 1963/64 1965/66 1972/73 1975/76 1976/77 1978/79 1979/80 1981/82 1982/83 1983/84 1985/86 1987/88 1989/90 2019/20 2024/25',
    'Liverpool giành chức vô địch quốc gia thứ 20 dưới thời Arne Slot mùa 2024/25.',
  ],
  [
    'europe',
    'European Cup / Champions League',
    '1976/77 1977/78 1980/81 1983/84 2004/05 2018/19',
    'Từ chức vô địch đầu tiên ở Rome dưới thời Bob Paisley đến lần thứ sáu ở Madrid dưới thời Jürgen Klopp.',
  ],
  [
    'fa',
    'FA Cup',
    '1964/65 1973/74 1985/86 1988/89 1991/92 2000/01 2005/06 2021/22',
    'Bill Shankly đưa Liverpool tới FA Cup đầu tiên năm 1965 với chiến thắng 2–1 trước Leeds United tại Wembley.',
  ],
  [
    'league-cup',
    'League Cup',
    '1980/81 1981/82 1982/83 1983/84 1994/95 2000/01 2002/03 2011/12 2021/22 2023/24',
    'Virgil van Dijk ghi bàn quyết định trong hiệp phụ trước Chelsea ở chung kết 2024.',
  ],
  [
    'uefa',
    'UEFA Cup',
    '1972/73 1975/76 2000/01',
    'Liverpool thắng Alavés 5–4 ở chung kết năm 2001 dưới thời Gérard Houllier.',
  ],
  [
    'super',
    'UEFA Super Cup',
    '1977 2001 2005 2019',
    'Liverpool thắng Chelsea trên chấm luân lưu để giành Siêu cúp châu Âu năm 2019.',
  ],
  [
    'world',
    'FIFA Club World Cup',
    '2019',
    'Liverpool đánh bại Flamengo ở Doha để lần đầu vô địch thế giới cấp CLB.',
  ],
];
export const liverpoolCups = cups.map(([id, heading, years, story], i) => {
  const seasons = years.split(' ');
  return {
    ...display(id, 'trophy', heading, seasons.length + ' lần · ' + story, honours, KOP_CUPS[i]),
    seasons,
    stories: { [seasons[seasons.length - 1]]: story },
  };
});
export const LIVERPOOL_MAJOR_TOTAL = liverpoolCups.reduce((sum, c) => sum + c.seasons.length, 0);
export const liverpoolShield = {
  ...display(
    'shield',
    'trophy',
    'Charity / Community Shield',
    '16 lần, gồm cả danh hiệu đồng sở hữu. Trưng bày riêng ngoài tổng 52 danh hiệu lớn của đội nam.',
    honours,
    KOP_SHIELD,
  ),
  seasons:
    '1964* 1965* 1966 1974 1976 1977* 1979 1980 1982 1986* 1988 1989 1990* 2001 2006 2022'.split(
      ' ',
    ),
};

export const liverpoolCoaches = [
  ['shankly', 'Bill Shankly', '1959–1974', 'Ba chức vô địch Anh, hai FA Cup và UEFA Cup 1973.'],
  ['paisley', 'Bob Paisley', '1974–1983', 'Sáu chức vô địch Anh và ba European Cup.'],
  [
    'fagan',
    'Joe Fagan',
    '1983–1985',
    'Cú ăn ba mùa 1983/84 với chức vô địch Anh, League Cup và European Cup.',
  ],
  [
    'dalglish',
    'Kenny Dalglish',
    '1985–1991 · 2011–2012',
    'Ba chức vô địch Anh và hai FA Cup trong nhiệm kỳ đầu, thêm League Cup 2012 khi trở lại.',
  ],
  [
    'houllier',
    'Gérard Houllier',
    '1998–2004',
    'Giành League Cup, FA Cup và UEFA Cup trong mùa 2000/01.',
  ],
  ['benitez', 'Rafael Benítez', '2004–2010', 'Champions League 2005 và FA Cup 2006.'],
  ['rodgers', 'Brendan Rodgers', '2012–2015', 'Đưa đội về nhì Premier League mùa 2013/14.'],
  [
    'klopp',
    'Jürgen Klopp',
    '2015–2024',
    'Champions League 2019, Club World Cup 2019 và Premier League 2019/20.',
  ],
  ['slot', 'Arne Slot', '2024–2026', 'Vô địch Premier League 2024/25 ngay trong mùa đầu tiên.'],
  [
    'iraola',
    'Andoni Iraola',
    '2026–nay',
    'HLV trưởng từ trước mùa 2026/27. Trước khi đến Anfield, ông đưa Bournemouth lần đầu giành quyền dự cúp châu Âu.',
  ],
].map(([id, name, tenure, story], i) => ({
  ...display(
    'coach-' + id,
    'manager',
    name,
    tenure + ' · ' + story,
    id === 'iraola' ? iraola : coaches,
    KOP_COACHES[i],
    0,
    1.4,
  ),
  tenure,
  current: id === 'iraola',
}));

export const liverpoolLegends = [
  [
    'dalglish',
    'Kenny Dalglish',
    '7',
    'Ghi bàn quyết định ở chung kết European Cup 1978 trước Club Brugge.',
  ],
  [
    'gerrard',
    'Steven Gerrard',
    '8',
    'Đội trưởng mở màn cuộc lội ngược dòng tại Istanbul bằng bàn đánh đầu.',
  ],
  [
    'salah',
    'Mohamed Salah',
    '11',
    'Ghi bàn mở tỷ số ở chung kết Champions League 2019 tại Madrid.',
  ],
  [
    'torres',
    'Fernando Torres',
    '9',
    'Tiền đạo người Tây Ban Nha đến Anfield năm 2007 dưới thời Rafael Benítez.',
  ],
  ['suarez', 'Luis Suárez', '7', 'Ghi 31 bàn ở Premier League mùa 2013/14.'],
  ['rush', 'Ian Rush', '9', 'Chân sút ghi nhiều bàn nhất trong lịch sử Liverpool.'],
].map(([id, heading, shirt, detail], i) => ({
  ...display(
    'legend-' + id,
    'legend',
    heading,
    detail,
    club + '/info/past-players',
    KOP_LEGENDS[i],
    1.65,
    0,
  ),
  shirt,
}));

export const liverpoolTimeline = [
  [
    '1892',
    'Thành lập Liverpool FC',
    'Liverpool FC ra đời vào năm 1892 và chọn Anfield làm sân nhà.',
    history,
  ],
  [
    '1964',
    'Vô địch Anh thời Shankly',
    'Liverpool vô địch hạng đấu cao nhất mùa 1963/64, hai năm sau khi thăng hạng.',
    honours,
  ],
  [
    '1977',
    'European Cup đầu tiên',
    'Liverpool thắng Borussia Mönchengladbach 3–1 tại Rome.',
    honours,
  ],
  [
    '1985',
    'Tưởng niệm Heysel',
    'Ngày 29/05/1985, 39 người thiệt mạng tại sân Heysel ở Brussels trước trận chung kết European Cup giữa Liverpool và Juventus.',
    club + '/news/liverpool-fc-marks-41st-anniversary-heysel-stadium-disaster',
  ],
  [
    '1989',
    'Tưởng niệm Hillsborough',
    'Tưởng niệm 97 người thiệt mạng do thảm họa tại trận bán kết FA Cup với Nottingham Forest ngày 15/04/1989.',
    club + '/hillsborough',
  ],
  ['2005', 'Đêm Istanbul', 'Liverpool gỡ hòa 3–3 trước AC Milan rồi thắng luân lưu 3–2.', istanbul],
  ['2019', 'Champions League thứ sáu', 'Liverpool thắng Tottenham 2–0 tại Madrid.', honours],
  [
    '2020',
    'Chức vô địch Premier League',
    'Liverpool vô địch giải đấu mùa 2019/20 dưới thời Jürgen Klopp.',
    honours,
  ],
  [
    '2024–25',
    'Ngôi vô địch Anh thứ 20',
    'Liverpool vô địch Premier League trong mùa đầu Arne Slot dẫn dắt.',
    honours,
  ],
  [
    '2026',
    'Andoni Iraola',
    'Liverpool bổ nhiệm Andoni Iraola làm HLV trưởng trước mùa 2026/27.',
    iraola,
  ],
].map(([year, title, detail, source], i) => ({
  ...display(
    'year-' + year,
    'timeline',
    year + ' · ' + title,
    detail,
    source,
    KOP_TIMELINE[i],
    0,
    1.5,
  ),
  year,
  title,
  memorial: year === '1985' || year === '1989',
}));

export const liverpoolStatue = display(
  'statue',
  'statue',
  'Bill Shankly · 1913–1981',
  'HLV Liverpool từ 1959 đến 1974. Ông đưa đội trở lại hạng Nhất, giành ba chức vô địch Anh, hai FA Cup và danh hiệu châu Âu đầu tiên của CLB.',
  shankly,
  KOP_SHANKLY,
  0,
  2.2,
);
export const liverpoolIstanbul = display(
  'istanbul',
  'match',
  'Đêm Istanbul 2005',
  '25/05/2005 · Chung kết UEFA Champions League. AC Milan dẫn 3–0 sau hiệp một. Gerrard, Šmicer và Alonso gỡ hòa 3–3. Sau hiệp phụ, Liverpool thắng loạt luân lưu 3–2.',
  istanbul,
  KOP_ISTANBUL,
  0,
  2.05,
);
export const liverpoolExhibits = [
  ...liverpoolCups,
  liverpoolShield,
  ...liverpoolCoaches,
  ...liverpoolLegends,
  ...liverpoolTimeline,
  liverpoolStatue,
  liverpoolIstanbul,
];

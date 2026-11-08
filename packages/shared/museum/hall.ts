import { managerPortraits, trophies } from './index';

export const MU_MUSEUM_SCALE = 0.0125;
export const MU_MUSEUM_ORIGIN = { x: 1800, y: 2300 };

export function museumPoint(x: number, z: number) {
  return {
    x: x / MU_MUSEUM_SCALE + MU_MUSEUM_ORIGIN.x,
    y: z / MU_MUSEUM_SCALE + MU_MUSEUM_ORIGIN.y,
  };
}

const caseWidth = 2.06;
export const trophyCabinet = { z: -11.15, width: caseWidth, depth: 1.7, height: 3.4 };
const trophyTypes = [
  ['league', 'Vô địch quốc gia Anh', 'English league titles'],
  ['fa', 'FA Cup', 'FA Cup'],
  ['league-cup', 'League Cup', 'League Cup'],
  ['europe', 'European Cup / C1', 'European Cup / Champions League'],
  ['europa', 'UEFA Europa League', 'UEFA Europa League'],
  ['winners', 'UEFA Cup Winners’ Cup', 'UEFA Cup Winners’ Cup'],
  ['super', 'UEFA Super Cup', 'UEFA Super Cup'],
  ['world', 'FIFA Club World Cup', 'FIFA Club World Cup'],
  ['community', 'Community Shield', 'Community Shield'],
] as const;

export const hallTrophies = trophyTypes.map(([group, vi, en], index) => {
  const x = (index - 4) * 2.1;
  return {
    id: `mu-trophy-${group}`,
    group,
    title: { vi, en },
    x,
    approach: museumPoint(x, -9.35),
    seasons: trophies.filter((trophy) => trophy.group === group),
  };
});

// Optional individual portraits should be cropped to 64:76.
const portraitOverrides: Partial<Record<string, string>> = {};
const featuredCoaches = new Set([
  'manager-11',
  'manager-19',
  'manager-22',
  'manager-23',
  'manager-24',
  'manager-27',
  'manager-29',
  'manager-31',
]);
export const hallCoaches = managerPortraits
  .filter((coach) => featuredCoaches.has(coach.id))
  .map((coach, index) => {
    const x = (index - 3.5) * 2.35;
    return {
      ...coach,
      portraitUrl: portraitOverrides[coach.id],
      x,
      tenure: `${coach.start.slice(0, 4)}–${coach.end?.slice(0, 4) ?? 'nay'}`,
      approach: museumPoint(x, -7.05),
    };
  });

export const hallStatue = {
  id: 'ferguson-statue',
  x: -11.35,
  z: -8.4,
  width: 3.2,
  depth: 2.6,
  approach: museumPoint(-11.35, -6.15),
};

export const historyWallX = 13.68;
const photos = 'https://commons.wikimedia.org/wiki/File:';
export const hallHistory = [
  {
    year: '1878',
    z: -8.35,
    title: { vi: 'Khởi nguồn Newton Heath', en: 'Newton Heath origins' },
    detail: {
      vi: 'Công nhân đường sắt Lancashire và Yorkshire thành lập Newton Heath LYR năm 1878. CLB đổi tên thành Manchester United năm 1902.',
      en: 'Workers from the Lancashire and Yorkshire Railway formed Newton Heath LYR in 1878. The club took the name Manchester United in 1902.',
    },
    caption: { vi: 'Đội Newton Heath mùa 1892/93', en: 'Newton Heath, 1892/93 season' },
    credit: 'The Graphic · Public domain',
    photoSource: photos + 'Newton_Heath_1892-93.jpg',
    source: 'https://www.manutd.com/en/club/history/history-by-decade/1878-1909',
  },
  {
    year: '1958',
    z: -5.75,
    title: { vi: 'Thảm họa hàng không Munich', en: 'Munich air disaster' },
    detail: {
      vi: 'Ngày 6/2/1958, tai nạn máy bay tại Munich cướp đi sinh mạng 23 người, trong đó có tám cầu thủ United. CLB tái thiết và giành Cúp châu Âu năm 1968.',
      en: 'On 6 February 1958, the crash in Munich killed 23 people, including eight United players. The club rebuilt and won the European Cup in 1968.',
    },
    caption: { vi: 'Bia tưởng niệm tại Old Trafford', en: 'Memorial plaque at Old Trafford' },
    credit: 'HonorTheKing · CC BY-SA 4.0',
    photoSource: photos + 'Munich_air_disaster_plaque.jpg',
    source: 'https://www.manutd.com/en/club/history/munich-remembered',
  },
  {
    year: '1999',
    z: -3.15,
    title: { vi: 'Cú ăn ba lịch sử', en: 'The Treble' },
    detail: {
      vi: 'United vô địch Premier League, FA Cup và Champions League mùa 1998/99. Hai bàn thắng bù giờ trước Bayern Munich ở Barcelona hoàn tất cú ăn ba.',
      en: 'United won the Premier League, FA Cup and Champions League in 1998/99. Two stoppage-time goals against Bayern Munich in Barcelona completed the Treble.',
    },
    caption: {
      vi: 'Lễ diễu hành mừng cú ăn ba tại Manchester',
      en: 'The Treble parade in Manchester',
    },
    credit: 'Seán Murray · CC BY-SA 2.0',
    photoSource: photos + 'Manchester_United_Treble_celebration.jpg',
    source: 'https://www.manutd.com/en/club/history/history-by-decade/1990-1999',
  },
  {
    year: '2008',
    z: -0.55,
    title: { vi: 'Vô địch châu Âu tại Moscow', en: 'European champions in Moscow' },
    detail: {
      vi: 'United hòa Chelsea 1–1 trong trận chung kết tại Moscow rồi thắng luân lưu 6–5 để giành Cúp châu Âu lần thứ ba.',
      en: 'United drew 1–1 with Chelsea in the Moscow final and won 6–5 on penalties to claim their third European Cup.',
    },
    caption: {
      vi: 'Lễ khai mạc chung kết Champions League tại Moscow',
      en: 'Champions League final opening ceremony in Moscow',
    },
    credit: 'Mark Freeman · CC BY 2.0',
    photoSource: photos + 'Man_utd_(1)_v_CHELSEA_(1)_-_C_L_Final_Moscow.jpg',
    source: 'https://www.manutd.com/en/club/history/trophy-room/european-cup-champions-league',
  },
].map((milestone) => ({
  ...milestone,
  id: `mu-history-${milestone.year}`,
  image: `/art/mu-history/${milestone.year}.webp`,
  approach: museumPoint(12.2, milestone.z),
}));

export const hallArchive = [
  {
    id: 'mu-manager-directory',
    x: -5,
    z: 11.7,
    title: { vi: 'Hồ sơ huấn luyện viên', en: 'Manager directory' },
  },
  {
    id: 'mu-club-archive',
    x: 5,
    z: 11.7,
    title: { vi: 'Kho tư liệu câu lạc bộ', en: 'Club archive' },
  },
].map((entry) => ({ ...entry, approach: museumPoint(entry.x, 10.35) }));

export const hallExit = { id: 'hall-exit', ...museumPoint(0, 11.25) };

function footprint(x: number, z: number, width: number, depth: number, height: number) {
  return {
    ...museumPoint(x - width / 2, z - depth / 2),
    w: width / MU_MUSEUM_SCALE,
    h: depth / MU_MUSEUM_SCALE,
    height,
  };
}

export const hallObstacles = [
  footprint(
    0,
    trophyCabinet.z,
    hallTrophies.length * 2.1,
    trophyCabinet.depth,
    trophyCabinet.height,
  ),
  footprint(hallStatue.x, hallStatue.z, hallStatue.width, hallStatue.depth, 4.5),
];

export const hallStations = [
  ...hallTrophies.map((trophy) => ({ ...trophy.approach, id: trophy.id, title: trophy.title })),
  ...hallCoaches.map((coach) => ({
    ...coach.approach,
    id: coach.id,
    title: { vi: coach.name, en: coach.name },
    inspectRadius: 300,
  })),
  {
    ...hallStatue.approach,
    id: hallStatue.id,
    title: { vi: 'Tượng Sir Alex Ferguson', en: 'Sir Alex Ferguson statue' },
  },
  ...hallHistory.map((event) => ({
    ...event.approach,
    id: event.id,
    title: { vi: `${event.year} · ${event.title.vi}`, en: `${event.year} · ${event.title.en}` },
  })),
  ...hallArchive.map((entry) => ({ ...entry.approach, id: entry.id, title: entry.title })),
];

export const hallText = {
  vi: {
    title: 'Phòng Truyền Thống',
    area: 'Phòng Truyền Thống Manchester United',
    trophies: 'Bộ sưu tập danh hiệu',
    history: 'Lịch sử câu lạc bộ',
    exit: 'Quay về Hang Quỷ Đỏ',
    cave: 'Hang Quỷ Đỏ',
    exitHint: 'Lối ra ở phía nam',
    inspect: 'Khám phá',
    close: 'Tiếp tục tham quan',
    source: 'Nguồn lịch sử',
    present: 'nay',
  },
  en: {
    title: 'Heritage Hall',
    area: 'Manchester United Heritage Hall',
    trophies: 'Trophy Collection',
    history: 'Club History',
    exit: 'Return to the Red Devils Cave',
    cave: 'Red Devils Cave',
    exitHint: 'Exit to the south',
    inspect: 'Explore',
    close: 'Continue exploring',
    source: 'Historical source',
    present: 'present',
  },
};

export type HallLanguage = keyof typeof hallText;
export function hallLanguage(lang: string): HallLanguage {
  return lang.toLowerCase().startsWith('en') ? 'en' : 'vi';
}

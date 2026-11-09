import type { Interaction } from '../world';
import { CITY_NEWS, CITY_SCORE, CITY_SEATS, cityWire, museumPoint } from './layout';

export type CityLanguage = 'vi' | 'en';
export type CityTranslation = readonly [vi: string, en: string];
export const cityLanguage = (lang: string): CityLanguage => lang.toLowerCase().startsWith('en') ? 'en' : 'vi';
export const cityText = (lang: CityLanguage, pair: CityTranslation) => pair[lang === 'en' ? 1 : 0];
export const CITY_COPY = {
  hall: ['Hang Man City', 'Man City Cave'],
  subtitle: ['Nơi fan Man City hội tụ', 'Where City fans come together'],
  museum: ['Phòng Truyền Thống', 'Heritage Hall'],
  lounge: ['Góc Tâm Sự Fan', 'Fan Lounge'],
  tunnel: ['Đường Hầm Blue Moon', 'Blue Moon Tunnel'],
  link: ['Hành Lang Truyền Thống', 'Heritage Passage'],
  exit: ['Cổng Ra Hang', 'Grand Hall Exit'],
  score: ['Kết quả trận gần nhất', 'Latest match result'],
  news: ['Bảng tin & lịch thi đấu', 'News & fixtures'],
  pending: ['Chưa cập nhật', 'Awaiting results'],
  seat: ['Ngồi sofa', 'Sit on the sofa'],
  stand: ['Đứng dậy', 'Stand up'],
  timeline: ['Dấu ấn lịch sử', 'Club timeline'],
  inspect: ['Xem chi tiết', 'View details'],
  source: ['Nguồn chính thức', 'Official source'],
} satisfies Record<string, CityTranslation>;

export const CITY_SECTIONS = {
  overview: ['Tổng quan', 'Overview'],
  honours: ['Danh hiệu & Cúp', 'Honours & Trophies'],
  managers: ['Các đời HLV', 'Managers'],
  legends: ['Huyền thoại CLB', 'Club Legends'],
  matches: ['Những trận đấu để đời', 'Memorable Matches'],
  timeline: CITY_COPY.timeline,
  gallery: ['Thư viện ảnh', 'Photo Gallery'],
  records: ['Kỷ lục & Thống kê', 'Records & Statistics'],
} satisfies Record<string, CityTranslation>;
export type CitySection = keyof typeof CITY_SECTIONS;
export type CityCard = {
  id: string;
  title: CityTranslation;
  detail: CityTranslation;
  period?: string;
  image?: string;
  seasons?: string[];
  source: string;
  imageCaption?: CityTranslation;
};
const official = 'https://www.mancity.com';
const history = official + '/club/manchester-city-history';
const honours = official + '/club/honours/team';
const decade = official + '/features/decadeofchange/';
const pep = official + '/news/mens/pep-guardiola-official-announcement-63915039';
const qpr = official + '/citytv/mens/manchester-city-qpr-classic-highlights-63819552';
const legends = official + '/news/mens/khaldoon-al-mubarak-sergio-aguero-legacy-63758252';
const card = (id: string, title: string | CityTranslation, detail: CityTranslation, source: string,
  period?: string, image?: string): CityCard => ({
  id, title: typeof title === 'string' ? [title, title] : title, detail, source, period, image,
});

export const cityManagers = [
  card('hughes', 'Mark Hughes', ['Dẫn dắt City trong giai đoạn đổi chủ năm 2008.', 'Led City through the 2008 takeover.'], decade, '2008–2009', 'hughes'),
  card('mancini', 'Roberto Mancini', ['Giành FA Cup 2011 và Premier League 2011/12.', 'Won the 2011 FA Cup and the 2011/12 Premier League.'], decade, '2009–2013', 'mancini'),
  card('pellegrini', 'Manuel Pellegrini', ['Đưa City vô địch Premier League 2013/14 và giành hai League Cup.', 'Won the 2013/14 Premier League and two League Cups.'], decade, '2013–2016', 'pellegrini'),
  card('guardiola', 'Pep Guardiola', ['Dẫn dắt City giành cú ăn ba 2022/23. Kết thúc nhiệm kỳ năm 2026 với 20 danh hiệu theo thống kê của CLB.', 'Led City to the 2022/23 Treble. His tenure ended in 2026 with 20 trophies by the club’s count.'], pep, '2016–2026', 'guardiola'),
  card('mercer', 'Joe Mercer', ['Dẫn dắt đội vô địch Anh mùa 1967/68 và giành Cúp C2 mùa 1969/70.', 'Led City to the 1967/68 league title and the 1969/70 Cup Winners’ Cup.'], history, '1965–1971'),
  card('maresca', 'Enzo Maresca', ['Được CLB bổ nhiệm làm HLV trưởng năm 2026.', 'Appointed City manager in 2026.'], official + '/news/mens/enzo-maresca-manchester-city-manager-63918331', '2026', 'maresca'),
];

const cup = (id: string, title: CityTranslation, detail: CityTranslation, seasons: string): CityCard =>
  ({ ...card(id, title, detail, honours), seasons: seasons.split(', ') });

export const cityHonours = [
  cup('league', ['Vô địch Anh', 'English League'], ['Các chức vô địch hạng cao nhất của bóng đá Anh.', 'English top-flight league titles.'], '1936/37, 1967/68, 2011/12, 2013/14, 2017/18, 2018/19, 2020/21, 2021/22, 2022/23, 2023/24'),
  cup('fa', ['Cúp FA', 'FA Cup'], ['Danh hiệu đầu tiên của City đến vào năm 1904.', 'City first won the competition in 1904.'], '1903/04, 1933/34, 1955/56, 1968/69, 2010/11, 2018/19, 2022/23, 2025/26'),
  cup('efl', ['Cúp Liên đoàn', 'League Cup'], ['Chiếc cúp quốc nội đầu tiên của mùa 1969/70.', 'City first won the League Cup in 1969/70.'], '1969/70, 1975/76, 2013/14, 2015/16, 2017/18, 2018/19, 2019/20, 2020/21, 2025/26'),
  cup('ucl', ['Champions League', 'Champions League'], ['City thắng Inter 1–0 trong trận chung kết 2023.', 'City beat Inter 1–0 in the 2023 final.'], '2022/23'),
  cup('super', ['Siêu cúp UEFA', 'UEFA Super Cup'], ['City giành Siêu cúp châu Âu năm 2023.', 'City won the European Super Cup in 2023.'], '2023'),
  cup('world', ['Club World Cup', 'Club World Cup'], ['City vô địch FIFA Club World Cup 2023.', 'City won the 2023 FIFA Club World Cup.'], '2023'),
];

export const cityTimeline: CityCard[] = [
  card('1880', ['Gốc rễ St Mark’s', 'St Mark’s roots'], ['Đội bóng của nhà thờ St Mark’s là tiền thân của CLB.', 'A team formed by St Mark’s Church became the club’s forerunner.'], history, '1880'),
  card('1894', ['Tên gọi Manchester City', 'The Manchester City name'], ['Ardwick AFC tái lập với tên Manchester City Football Club.', 'Ardwick AFC reformed as Manchester City Football Club.'], history, '1894', 'team-1894'),
  card('1968', ['Vô địch quốc gia', 'League champions'], ['City giành chức vô địch quốc gia mùa 1967/68.', 'City won the English top-flight title in 1967/68.'], history, '1968'),
  { ...card('2012', ['Khoảnh khắc 93:20', 'The 93:20 moment'], ['Bàn thắng cuối trận của Agüero trước QPR đem về chức vô địch Premier League đầu tiên.', 'Agüero’s late winner against QPR clinched City’s first Premier League title.'], qpr, '2012', 'parade'), imageCaption: ['Vincent Kompany tại lễ diễu hành vô địch năm 2012', 'Vincent Kompany at City’s 2012 title parade'] },
  card('2018', ['Mùa giải 100 điểm', 'The 100-point season'], ['City đạt 100 điểm ở Premier League mùa 2017/18.', 'City reached 100 points in the 2017/18 Premier League.'], history, '2018'),
  card('2023', ['Cú ăn ba', 'The Treble'], ['City vô địch Premier League, FA Cup và Champions League trong cùng mùa giải.', 'City won the Premier League, FA Cup and Champions League in the same season.'], history, '2023'),
];

export const cityLegends = [
  card('aguero', 'Sergio Agüero', ['Ghi bàn ấn định chiến thắng ở phút 93:20 trước QPR năm 2012.', 'Scored the 93:20 winner against QPR in 2012.'], official + '/mancitylegends/aguero-sergio', undefined, 'aguero'),
  card('kompany', 'Vincent Kompany', ['Đội trưởng của City trong mùa vô địch Premier League 2011/12.', 'Captained City in their title-winning 2011/12 Premier League season.'], decade, undefined, 'kompany'),
  card('silva', 'David Silva', ['Tiền vệ Tây Ban Nha được CLB vinh danh bằng tượng tại Etihad.', 'The Spanish midfielder is honoured with a statue at the Etihad.'], legends, undefined, 'silva'),
  card('toure', 'Yaya Touré', ['Ghi bàn quyết định trước Stoke trong chung kết FA Cup 2011.', 'Scored the winner against Stoke in the 2011 FA Cup final.'], decade, undefined, 'toure'),
  card('debruyne', 'Kevin De Bruyne', ['Tiền vệ thuộc đội hình City giành cú ăn ba mùa 2022/23.', 'A midfielder in City’s 2022/23 Treble-winning squad.'], official + '/meta/media/szcpcxhn/2023-mancity-annual-report.pdf', undefined, 'debruyne'),
];

export const cityMatches = [
  card('qpr', 'Manchester City 3–2 QPR', ['Agüero ghi bàn quyết định ở phút 93:20. Video trận đấu có trên trang chính thức của CLB.', 'Agüero scored the winner at 93:20. Highlights are available on the club’s official site.'], qpr, '2012'),
  card('inter', 'Manchester City 1–0 Inter', ['City giành chức vô địch Champions League đầu tiên tại Istanbul.', 'City won their first Champions League title in Istanbul.'], history, '2023'),
  card('derby', 'Manchester City 6–1 Manchester United', ['City thắng derby tại Old Trafford trong mùa vô địch 2011/12.', 'City won the derby at Old Trafford during their 2011/12 title campaign.'], decade, '2011'),
];

export const cityRecords = [
  card('centurions', ['100 điểm', '100 points'], ['Điểm số của City tại Premier League mùa 2017/18.', 'City’s Premier League points tally in 2017/18.'], history, '2017/18'),
  card('treble', ['Cú ăn ba đầu tiên', 'First Treble'], ['Premier League, FA Cup và UEFA Champions League.', 'Premier League, FA Cup and UEFA Champions League.'], history, '2022/23'),
];

export const cityGallery = [
  card('etihad', 'Etihad Stadium', ['Sân nhà của Manchester City.', 'Manchester City’s home ground.'], history, undefined, 'etihad'),
  ...cityManagers.filter((entry) => entry.image), ...cityLegends,
];
export const cityPhoto = (image: string) => `/art/city/${image}.webp`;
export const CITY_CARDS = {
  honours: cityHonours, managers: cityManagers, legends: cityLegends, matches: cityMatches,
  timeline: cityTimeline, gallery: cityGallery, records: cityRecords,
};

const exhibit = (entry: CityCard, point: ReturnType<typeof cityWire>, radius = 85): Interaction =>
  ({ ...point, id: 'city-' + entry.id, label: entry.title[0], kind: 'exhibit', inspectRadius: radius });

export const cityInteractions: Interaction[] = [
  { ...CITY_SCORE, id: 'city-score', label: CITY_COPY.score[0], kind: 'score', inspectRadius: 100 },
  { ...CITY_NEWS, id: 'city-news', label: CITY_COPY.news[0], kind: 'score', inspectRadius: 108 },
  ...CITY_SEATS.map((p, i): Interaction => ({
    ...p, id: 'city-seat-' + i, label: CITY_COPY.seat[0], kind: 'seat', inspectRadius: 65,
  })),
  exhibit(cityManagers[3], museumPoint(-9.7, -15.5), 95),
  ...cityHonours.map((entry, i) => exhibit(entry, museumPoint((i - 2.5) * 2.65, -18.9))),
  ...cityTimeline.map((entry, i) => exhibit(entry, museumPoint(12.7, -17.5 + i * 2.55))),
  ...cityLegends.map((entry, i) => exhibit(entry, museumPoint(-12.7, -3.9 - i * 2.28))),
  ...cityMatches.map((entry, i) => exhibit(entry, museumPoint(6.8 + i * 2.5, -1.5))),
  exhibit(cityGallery[0], museumPoint(-8.5, -1.5)),
];

export function cityInteractionLabel(id: string, lang: CityLanguage, seated?: boolean) {
  if (id.startsWith('city-seat-')) return cityText(lang, seated ? CITY_COPY.stand : CITY_COPY.seat);
  if (id === 'city-score') return cityText(lang, CITY_COPY.score);
  if (id === 'city-news') return cityText(lang, CITY_COPY.news);
  const entry = Object.values(CITY_CARDS).flat().find((item) => 'city-' + item.id === id);
  return entry ? cityText(lang, entry.title) : '';
}

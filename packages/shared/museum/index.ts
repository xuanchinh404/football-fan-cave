import leagueData from './leagueTitles.json' with { type: 'json' };
import otherData from './otherTrophies.json' with { type: 'json' };
import managerData from './managers.json' with { type: 'json' };
import historyData from './historyTimeline.json' with { type: 'json' };
import layout from './museumLayout.json' with { type: 'json' };
export type Trophy = (typeof leagueData)[number];
export type Manager = (typeof managerData)[number];
export const leagueTitles = leagueData;
export const otherTrophies = otherData;
export const trophies = [...leagueTitles, ...otherTrophies];
export const managers = managerData;
export const historyTimeline = historyData;
export const HALL = layout;
export const matches = [
  {
    id: 'match-1968',
    x: 2200,
    y: 3180,
    title: 'Wembley · 1968',
    description: 'Manchester United 4–1 Benfica (sau hiệp phụ). Chiếc cúp châu Âu đầu tiên.',
    source: 'https://www.manutd.com/en/club/history/trophy-room/european-cup-champions-league',
  },
  {
    id: 'match-1999',
    x: 2500,
    y: 3180,
    title: 'Barcelona · 1999',
    description: 'Manchester United 2–1 Bayern Munich. Hai bàn thắng cuối trận hoàn tất cú ăn ba.',
    source: 'https://www.manutd.com/en/club/history/trophy-room/european-cup-champions-league',
  },
  {
    id: 'match-2008',
    x: 2800,
    y: 3180,
    title: 'Moscow · 2008',
    description: 'Manchester United 1–1 Chelsea; thắng luân lưu 6–5.',
    source: 'https://www.manutd.com/en/club/history/trophy-room/european-cup-champions-league',
  },
];
export const exhibits = [
  ...trophies.map((t) => ({
    ...t,
    heading: `${t.title} · ${t.season}`,
    detail: `${t.description}\nHLV: ${t.manager}${t.shared ? '\nĐồng vô địch' : ''}`,
    type: 'trophy',
  })),
  ...managers.map((m) => ({
    ...m,
    heading: m.name,
    detail: `${m.start} — ${m.end || 'hiện tại'} · ${m.role}\n${m.description}\n${m.honours.join(' · ') || 'Chưa ghi nhận danh hiệu trong bộ sưu tập này.'}`,
    type: 'manager',
  })),
  ...historyTimeline.map((h) => ({
    ...h,
    heading: `${h.period} · ${h.title}`,
    detail: h.description,
    type: 'history',
  })),
  ...matches.map((m) => ({ ...m, heading: m.title, detail: m.description, type: 'match' })),
  {
    id: 'ferguson-statue',
    x: 650,
    y: 1040,
    heading: 'Sir Alex Ferguson · 1986–2013',
    detail:
      '13 Premier League · 2 Champions League · 5 FA Cup · 4 League Cup. Tượng biểu trưng gốc; không phải bản sao tượng tại Old Trafford.',
    source: layout.sources.managers,
    type: 'statue',
  },
];
export const hallObstacles = [
  ...trophies.map((t) => ({ x: t.x - 49, y: t.y - 42, w: 98, h: 42 })),
  ...managers.map((m) => ({ x: m.x - 54, y: m.y - 85, w: 108, h: 85 })),
  ...historyTimeline.map((h) => ({ x: h.x - 115, y: h.y - 100, w: 230, h: 100 })),
  ...matches.map((m) => ({ x: m.x - 110, y: m.y - 100, w: 220, h: 100 })),
  { x: 450, y: 900, w: 400, h: 110 },
];
const expected: Record<string, number> = {
  league: 20,
  europe: 3,
  fa: 13,
  'league-cup': 6,
  community: 21,
  europa: 1,
  super: 1,
  world: 1,
  intercontinental: 1,
  winners: 1,
};
export function validateMuseum() {
  const errors: string[] = [];
  if (new Set(exhibits.map((e) => e.id)).size !== exhibits.length)
    errors.push('Duplicate exhibit ID');
  for (const [group, count] of Object.entries(expected))
    if (trophies.filter((t) => t.group === group).length !== count)
      errors.push(`Invalid count: ${group}`);
  if (leagueTitles.filter((t) => t.title === 'First Division').length !== 7)
    errors.push('First Division count');
  if (leagueTitles.filter((t) => t.title === 'Premier League').length !== 13)
    errors.push('Premier League count');
  for (const e of exhibits) {
    if (
      !e.source.startsWith('https://') ||
      !Number.isFinite(e.x) ||
      !Number.isFinite(e.y) ||
      e.x < 260 ||
      e.x > 3400 ||
      e.y < 400 ||
      e.y > 3820
    )
      errors.push(`Invalid exhibit: ${e.id}`);
    if ('season' in e && (!e.season || !('manager' in e) || !e.manager))
      errors.push(`Missing trophy metadata: ${e.id}`);
  }
  if (
    managers.filter((m) => m.current).length !== 1 ||
    !managers.find((m) => m.current && m.name === 'Michael Carrick' && m.contractUntil === '2028')
  )
    errors.push('Current manager');
  const assetKeys = new Set(['league', 'europe', 'cup', 'shield', 'spire', 'globe']);
  for (const t of trophies) {
    if (
      !assetKeys.has(t.asset) ||
      !Number.isInteger(t.year) ||
      !/^\d{4}(\/\d{2})?$/.test(t.season) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(t.lastVerifiedAt)
    )
      errors.push(`Invalid trophy schema: ${t.id}`);
    if (t.season.includes('/') && t.season !== `${t.year - 1}/${String(t.year).slice(2)}`)
      errors.push(`Season/year mismatch: ${t.id}`);
  }
  for (const m of managers) {
    if (
      !m.name ||
      !['permanent', 'caretaker', 'interim'].includes(m.role) ||
      !m.lastVerifiedAt ||
      (m.end && m.end < m.start)
    )
      errors.push(`Invalid manager schema: ${m.id}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return {
    trophies: trophies.length,
    league: leagueTitles.length,
    managers: managers.length,
    exhibits: exhibits.length,
  };
}
validateMuseum();

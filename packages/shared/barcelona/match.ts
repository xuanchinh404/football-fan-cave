export const BARCA_RESULTS_URL = 'https://www.fcbarcelona.com/en/football/first-team/results';
export type BarcaMatch = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  kickoff: number;
  competition: string;
  source: string;
};

const unescapeName = (value: string) =>
  value
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');

export function parseBarcaResult(html: string, now: number): BarcaMatch | null {
  let latest: BarcaMatch | null = null;
  const rows = html.matchAll(/<li class="fixture-result-list__fixture">([\s\S]*?)<\/li>/g);
  for (const [, row] of rows) {
    const link = row.match(/href="(\/en\/matches\/\d+\/[a-z0-9-]+)"/)?.[1];
    const kickoff = Number(row.match(/data-fixture-date="(\d+)"/)?.[1]);
    const home = row.match(/class="fixture-info__name fixture-info__name--home">([^<]+)/)?.[1];
    const away = row.match(/class="fixture-info__name fixture-info__name--away">([^<]+)/)?.[1];
    const competition = row.match(/class="fixture-result-list__name visually-hidden">([^<]+)/)?.[1];
    const score = row.match(/class="fixture-info__score">\s*<span>\s*(\d+)\s*-\s*(\d+)\s*<\/span>/);
    if (
      !link ||
      !Number.isFinite(kickoff) ||
      kickoff > now ||
      kickoff <= (latest?.kickoff ?? 0) ||
      !home ||
      !away ||
      !competition ||
      !score ||
      ![home.trim(), away.trim()].includes('FC Barcelona')
    )
      continue;
    latest = {
      home: unescapeName(home),
      away: unescapeName(away),
      competition: unescapeName(competition),
      homeScore: Number(score[1]),
      awayScore: Number(score[2]),
      kickoff,
      source: new URL(link, BARCA_RESULTS_URL).href,
    };
  }
  return latest;
}

import {
  BARCA_RESULTS_URL,
  parseBarcaResult,
  type BarcaMatch,
} from '../../../packages/shared/barcelona/match';

let result: BarcaMatch | null = null;
let nextRefresh = 0;
let refresh: Promise<BarcaMatch | null> | undefined;

async function loadResult() {
  const signal = AbortSignal.timeout(6500);
  const sources = [BARCA_RESULTS_URL, 'https://www.fcbarcelona.com/en/futbol/primer-equip/resultats'];
  for (const url of sources) {
    const response = await fetch(url, { signal }).catch(() => undefined);
    if (!response) continue;
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      continue;
    }
    const match = parseBarcaResult(await response.text(), Date.now());
    if (match) return match;
  }
  return null;
}

export function latestBarcaMatch() {
  if (refresh) return refresh;
  if (Date.now() < nextRefresh) return Promise.resolve(result);
  refresh = loadResult()
    .catch(() => null)
    .then((match) => {
      result = match;
      nextRefresh = Date.now() + (result ? 10 : 2) * 60_000;
      return result;
    })
    .finally(() => {
      refresh = undefined;
    });
  return refresh;
}

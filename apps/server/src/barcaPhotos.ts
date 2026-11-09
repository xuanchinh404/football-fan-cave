import { barcaCoaches, BARCA_COLLECTIONS } from '../../../packages/shared/barcelona/content';

const photos = new Map(
  [...barcaCoaches, ...Object.values(BARCA_COLLECTIONS).flat()].flatMap(({ id, image }) =>
    image ? [[id, image] as const] : [],
  ),
);

type ArchiveImage = { body: Buffer; type: string };
const cache = new Map<string, { expires: number; image: Promise<ArchiveImage | undefined> }>();

async function fetchPhoto(url: string, signal: AbortSignal): Promise<ArchiveImage | undefined> {
  for (let attempt = 0; attempt < 2 && !signal.aborted; attempt++) {
    const response = await fetch(url, { signal, redirect: 'error' }).catch(() => undefined);
    if (!response) continue;
    const type = response.headers.get('content-type');
    if (!response.ok || !type || !/^image\/(jpeg|png|webp)$/.test(type)) {
      await response.body?.cancel().catch(() => undefined);
      if (response.status === 404) return;
      continue;
    }
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length <= 400_000) return { body, type };
  }
}

/** The licensed deployment or internal review explicitly enables the official photo archive. */
export function barcaPhoto(id: string, signal: AbortSignal) {
  if (process.env.BARCA_ARCHIVE_PHOTOS !== '1') return Promise.resolve(undefined);
  const url = photos.get(id);
  if (!url?.startsWith('https://www.fcbarcelona.com/photo-resources/'))
    return Promise.resolve(undefined);
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.image;
  const entry = {
    expires: Date.now() + 30_000,
    image: fetchPhoto(url, signal)
      .catch(() => undefined)
      .then((image) => {
        if (image) entry.expires = Date.now() + 86_400_000;
        return image;
      }),
  };
  cache.set(url, entry);
  return entry.image;
}

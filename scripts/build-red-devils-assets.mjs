import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const source = 'assets/source/red-devils-reference.png';
const folder = 'assets/source/processed';
const regions = JSON.parse(readFileSync('assets/source/red-devils-regions.json', 'utf8'));
const manifestPath = 'assets/source/asset-manifest.json';
const previous = existsSync(manifestPath)
  ? new Map(JSON.parse(readFileSync(manifestPath, 'utf8')).assets.map((asset) => [asset.id, asset]))
  : new Map();
const args = process.argv.slice(2);
const generate = args.includes('--trellis');
const runBlender = args.includes('--blender');
const limit = Number(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? 1);
if (
  !Number.isInteger(limit) ||
  limit < 1 ||
  args.some((arg) => !/^(--trellis|--blender|--limit=\d+)$/.test(arg))
) {
  throw new Error(
    'Usage: node scripts/build-red-devils-assets.mjs [--blender] [--trellis] [--limit=1]',
  );
}

const { width, height } = await sharp(source).metadata();
if (width !== 2048 || height !== 1152)
  throw new Error('Region annotations require the supplied 2048 × 1152 image.');
await mkdir(folder, { recursive: true });
const xml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const svg = (width, height, body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
  );

const assets = [];
const tiles = [];
const marks = [];
for (const [i, region] of regions.entries()) {
  const { id, name, group, box, priority, method, occluded, mask } = region;
  const approved = method === 'trellis' && Boolean(mask) && !occluded;
  if (method === 'trellis' && !approved) throw new Error(`Unapproved TRELLIS image: ${id}`);
  const [left, top, right, bottom] = box;
  const w = right - left,
    h = bottom - top;
  const crop = sharp(source).extract({ left, top, width: w, height: h });
  let image = null;
  if (mask) {
    image = `${folder}/${id}.png`;
    const matte = svg(
      w,
      h,
      `<polygon points="${mask.map((point) => point.join(',')).join(' ')}" fill="white"/>`,
    );
    // Antialiased polygon matte excludes neighboring pixels and preserves thin stems.
    const isolated = await crop
      .clone()
      .ensureAlpha()
      .composite([{ input: matte, blend: 'dest-in' }])
      .png()
      .toBuffer();
    await sharp(isolated).resize({ width: 512, height: 512, fit: 'inside' }).png().toFile(image);
  }
  const glb =
    method === 'trellis'
      ? `public/assets/3d/united/${id}.glb`
      : method === 'blender'
        ? `apps/web/public/models/red-devils/${id}.glb`
        : null;
  assets.push({
    id,
    name,
    group,
    boundingBox: box,
    priority,
    needsSeparateGlb: method !== 'scene',
    blenderProcedural: method !== 'scene',
    occluded,
    reconstructHidden: occluded && group !== 'zone',
    image,
    imageStatus: approved ? 'trellis_candidate' : image ? 'reference_only' : 'not_isolated',
    glb,
    method,
    fallbackGlb: method === 'trellis' ? `apps/web/public/models/red-devils/${id}.glb` : null,
    lastTrellisStatus:
      previous.get(id)?.lastTrellisStatus ??
      (previous.get(id)?.status === 'trellis_failed' ? 'trellis_failed' : null),
    status: 'pending',
  });
  const x = (i % 4) * 270,
    y = Math.floor(i / 4) * 190;
  const thumb = image ? sharp(image) : crop;
  tiles.push({
    input: await thumb
      .resize(256, 155, { fit: 'contain', background: '#29202d' })
      .flatten({ background: '#29202d' })
      .png()
      .toBuffer(),
    left: x + 7,
    top: y + 27,
  });
  tiles.push({
    input: svg(
      270,
      26,
      `<text x="7" y="19" font-size="14" fill="white">${i + 1}. ${xml(name)} · ${image ? (approved ? 'PNG' : 'REF') : 'BOX'}</text>`,
    ),
    left: x,
    top: y,
  });
  marks.push(
    `<rect x="${left}" y="${top}" width="${w}" height="${h}" fill="none" stroke="#65fff2" stroke-width="2"/><text x="${left + 4}" y="${top + 23}" fill="#fff" stroke="#150c19" stroke-width="1" font-size="23" font-weight="bold">${i + 1}</text>`,
  );
}
const panel = await sharp(source)
  .composite([{ input: svg(width, height, marks.join('')) }])
  .png()
  .toBuffer();
const overview = await sharp(panel).resize(1080, 608).png().toBuffer();
await sharp({
  create: {
    width: 1080,
    height: 608 + Math.ceil(assets.length / 4) * 190,
    channels: 3,
    background: '#17101c',
  },
})
  .composite([
    { input: overview, left: 0, top: 0 },
    ...tiles.map((tile) => ({ ...tile, top: tile.top + 608 })),
  ])
  .png()
  .toFile(`${folder}/preview.png`);

let failed = false;
if (runBlender) {
  const result = spawnSync(
    process.env.BLENDER_BIN || 'blender',
    [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python',
      'tools/blender/red_devils.py',
    ],
    { stdio: 'inherit' },
  );
  failed ||= result.status !== 0;
}
let sent = 0;
for (const asset of assets) {
  if (asset.method === 'scene') asset.status = 'assembled_in_scene';
  else if (asset.method === 'blender')
    asset.status = existsSync(asset.glb) ? 'blender_exported' : 'awaiting_blender';
  else if (existsSync(asset.glb)) {
    const check = spawnSync('python3', ['scripts/generate-3d-asset.py', '--inspect', asset.glb], {
      stdio: 'inherit',
    });
    asset.status = check.status === 0 ? 'trellis_validated' : 'invalid_existing_glb';
    failed ||= check.status !== 0;
  } else if (!generate || sent >= limit || failed) asset.status = 'awaiting_trellis';
  else if (!process.env.HF_TOKEN?.trim()) {
    asset.status = 'missing_hf_token';
    failed = true;
  } else {
    sent++;
    const result = spawnSync(
      'python3',
      [
        'scripts/generate-3d-asset.py',
        asset.image,
        `united/${asset.id}`,
        '--resolution',
        '512',
        '--texture-size',
        '1024',
        '--decimation-target',
        '100000',
      ],
      { stdio: 'inherit' },
    );
    asset.status = result.status === 0 ? 'trellis_validated' : 'trellis_failed';
    asset.lastTrellisStatus = asset.status;
    failed ||= result.status !== 0;
  }
  if (asset.fallbackGlb && existsSync(asset.fallbackGlb) && asset.status !== 'trellis_validated') {
    asset.status = 'using_blender_fallback';
  }
}
await writeFile(
  manifestPath,
  JSON.stringify(
    {
      source,
      width,
      height,
      boundingBoxFormat: '[left, top, right, bottom] in source pixels',
      segmentation: 'Reference-specific visual detection and antialiased polygon mattes',
      supplementalGlbs: ['apps/web/public/models/red-devils/plinth.glb'],
      assets,
    },
    null,
    2,
  ) + '\n',
);
if (failed) process.exitCode = 1;

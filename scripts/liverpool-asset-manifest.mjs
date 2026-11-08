import { existsSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [caveImage, museumImage] = process.argv.slice(2);
if (!caveImage || !museumImage) {
  throw new Error('Usage: node scripts/liverpool-asset-manifest.mjs <cave.png> <museum.png>');
}
const referenceData = await Promise.all(
  [caveImage, museumImage].map((image) => sharp(image).metadata()),
);
const models = 'apps/web/public/models/liverpool/';
const asset = (ref, id, region, files, group, note) => {
  const { width, height } = referenceData[ref];
  const paths = files.map((file) => models + file + '.glb');
  return {
    id,
    reference: ref ? 'museum' : 'cave',
    bounds: region.map((value, index) => Math.round(value * (index % 2 ? height : width))),
    group,
    paths,
    status: group === 'C' ? 'react' : paths.every(existsSync) ? 'blender-exported' : 'missing',
    ...(note ? { note } : {}),
  };
};
const assets = [
  asset(0, 'refuge-paving-and-stairs', [0.28, 0.55, 0.72, 0.92], ['cave'], 'A'),
  asset(0, 'volcanic-wall-and-vault', [0.17, 0.06, 0.83, 0.3], ['cave'], 'A'),
  asset(0, 'fan-nook-arch', [0.17, 0.28, 0.36, 0.58], ['cave'], 'A'),
  asset(0, 'heritage-corridor', [0.66, 0.28, 0.86, 0.56], ['cave'], 'A'),
  asset(0, 'exit-and-vegetation', [0.78, 0.52, 0.99, 0.85], ['cave'], 'A'),
  asset(1, 'museum-masonry-and-carpet', [0.15, 0.07, 0.85, 0.89], ['museum'], 'A'),
  asset(1, 'plinths-and-istanbul-screen', [0.14, 0.51, 0.99, 0.75], ['museum'], 'A'),
  asset(
    0,
    'liver-bird-and-pennants',
    [0.44, 0.47, 0.55, 0.61],
    ['bird', 'banner'],
    'B',
    'Original heraldic sculpt and cloth.',
  ),
  asset(
    0,
    'ruby-crystals-and-lanterns',
    [0.68, 0.12, 0.81, 0.36],
    ['cave'],
    'B',
    'Batched with cave architecture.',
  ),
  asset(
    0,
    'upholstery-and-tea-table',
    [0.1, 0.72, 0.33, 0.91],
    ['sofa', 'sofa-plum', 'table'],
    'B',
  ),
  asset(
    1,
    'shankly-sculpture',
    [0.14, 0.24, 0.28, 0.67],
    ['shankly'],
    'B',
    'Stylized bronze likeness.',
  ),
  asset(
    1,
    'trophy-silhouettes',
    [0.29, 0.4, 0.79, 0.62],
    [
      'cup-league',
      'cup-europe',
      'cup-fa',
      'cup-league-cup',
      'cup-uefa',
      'cup-super',
      'cup-world',
      'cup-shield',
    ],
    'B',
    'Original interpretive models.',
  ),
  asset(
    1,
    'coach-portraits',
    [0.24, 0.24, 0.82, 0.4],
    Array.from({ length: 10 }, (_, i) => 'coach-' + i),
    'B',
    'Stylized sculpted portraits.',
  ),
  asset(1, 'legend-shirts', [0.64, 0.66, 0.8, 0.77], ['shirt'], 'B'),
  asset(
    0,
    'match-board',
    [0.4, 0.31, 0.6, 0.48],
    [],
    'C',
    'DEMO state without an unverified score.',
  ),
  asset(0, 'player-profile-chat', [0, 0.06, 0.174, 0.61], [], 'C'),
  asset(0, 'minimap', [0.83, 0.05, 0.996, 0.35], [], 'C'),
  asset(0, 'controls', [0.02, 0.74, 0.98, 0.99], [], 'C'),
  asset(
    1,
    'exhibit-menu-cases-and-timeline',
    [0, 0.23, 0.98, 0.99],
    [],
    'C',
    'Interactive physical exhibits with React detail panels.',
  ),
];
const manifest = {
  references: referenceData.map(({ width, height }, i) => ({
    id: i ? 'museum' : 'cave',
    width,
    height,
  })),
  coordinates: '[left, top, right, bottom] in reference-image pixels',
  groups: {
    A: 'Blender architecture',
    B: 'Image-to-3D candidates built in Blender',
    C: 'React or Three.js UI',
  },
  blenderSource: 'assets/source/liverpool.blend',
  generator: 'tools/blender/liverpool.py',
  trellis: {
    endpoint: 'https://huggingface.co/spaces/microsoft/TRELLIS.2',
    schema: 'checked',
    gpuJob: 'not submitted',
  },
  assets,
};
writeFileSync(
  'assets/source/liverpool-asset-manifest.json',
  JSON.stringify(manifest, null, 2) + '\n',
);

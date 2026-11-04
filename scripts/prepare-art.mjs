// Production asset preparation: slice sprite atlases, retain alpha and encode WebP.
import sharp from 'sharp';
import fs from 'node:fs/promises';
const out = new URL('../apps/web/public/art/', import.meta.url);
const source = new URL('../assets/source/', import.meta.url);
await fs.mkdir(out, { recursive: true });
async function atlas(name, cols, rows, names) {
  const data = await sharp(new URL(name + '.png', source).pathname)
    .resize(cols * 512, rows * 512)
    .png()
    .toBuffer();
  for (let i = 0; i < names.length; i++) {
    const cell = await sharp(data)
      .extract({ left: (i % cols) * 512, top: Math.floor(i / cols) * 512, width: 512, height: 512 })
      .png()
      .toBuffer();
    let image = sharp(cell).trim({ threshold: 8 });
    if (name === 'characters')
      image = image.resize(256, 384, { fit: 'contain', background: '#00000000' });
    await image
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(new URL(names[i] + '.webp', out).pathname);
  }
}
await atlas('portals', 3, 2, [
  'portal-united',
  'portal-arsenal',
  'portal-liverpool',
  'portal-chelsea',
  'portal-city',
  'portal-common',
]);
await atlas('props', 3, 2, ['cherry', 'tree', 'lantern', 'market', 'fountain', 'bridge']);
await atlas(
  'characters',
  4,
  2,
  Array.from({ length: 8 }, (_, i) => 'fan-' + i),
);
await sharp(new URL('valley.png', source).pathname)
  .resize(2400)
  .webp({ quality: 88 })
  .toFile(new URL('valley.webp', out).pathname);
await sharp(new URL('stone.png', source).pathname)
  .resize(768, 768)
  .webp({ quality: 88 })
  .toFile(new URL('stone.webp', out).pathname);
console.log('Prepared 22 optimized original game assets.');

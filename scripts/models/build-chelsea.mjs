/** Original procedural Chelsea kit; no photographs, logos, reference pixels or external meshes. */
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((v) => {
      this.result = v;
      this.onloadend?.();
    });
  }
};
const out = new URL('../../apps/web/public/models/', import.meta.url);
const mats = {
  gold: new T.MeshStandardMaterial({
    name: 'BluesGold',
    color: '#dcad50',
    metalness: 0.8,
    roughness: 0.24,
  }),
  silver: new T.MeshStandardMaterial({ color: '#cedeea', metalness: 0.94, roughness: 0.19 }),
  blue: new T.MeshStandardMaterial({
    name: 'Faction',
    color: '#114eb8',
    metalness: 0.12,
    roughness: 0.42,
  }),
  dark: new T.MeshStandardMaterial({ color: '#101e38', metalness: 0.1, roughness: 0.5 }),
  bronze: new T.MeshStandardMaterial({ color: '#b48743', metalness: 0.83, roughness: 0.36 }),
  glow: new T.MeshStandardMaterial({
    color: '#73d7ff',
    emissive: '#126fff',
    emissiveIntensity: 1.8,
    metalness: 0.4,
    roughness: 0.2,
  }),
  stone: new T.MeshStandardMaterial({ color: '#263f66', roughness: 0.88 }),
  wood: new T.MeshStandardMaterial({ color: '#563320', roughness: 0.58 }),
};
let parts = [];
const mesh = (g, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) => {
  const o = new T.Mesh(g, mats[m]);
  o.position.set(...p);
  o.scale.set(...s);
  o.rotation.set(...r);
  o.updateMatrix();
  g.applyMatrix4(o.matrix);
  parts.push({ g, m });
  return o;
};
const box = (p, s, m = 'gold', radius = 0.06) =>
  mesh(new RoundedBoxGeometry(...s, 2, radius), m, p);
const ball = (p, s, m = 'gold') => mesh(new T.SphereGeometry(1, 20, 14), m, p, s);
const cyl = (p, rt, rb, h, m = 'gold') => mesh(new T.CylinderGeometry(rt, rb, h, 32), m, p);
const torus = (p, r, t, m = 'gold', rot = [Math.PI / 2, 0, 0]) =>
  mesh(new T.TorusGeometry(r, t, 8, 40), m, p, [1, 1, 1], rot);
const tube = (pts, r, m = 'gold') =>
  mesh(
    new T.TubeGeometry(
      new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))),
      24,
      r,
      8,
      false,
    ),
    m,
  );
async function save(name) {
  const root = new T.Group();
  for (const m of Object.keys(mats)) {
    const gs = parts.filter((p) => p.m === m).map((p) => p.g);
    if (!gs.length) continue;
    const g = mergeGeometries(
      gs.map((g) => (g.index ? g.toNonIndexed() : g)),
      false,
    );
    root.add(new T.Mesh(g, mats[m]));
  }
  const bytes = await new GLTFExporter().parseAsync(root, { binary: true });
  await fs.writeFile(new URL(name + '.glb', out), Buffer.from(bytes));
  console.log(name, bytes.byteLength);
  parts = [];
}
// Deep seats, rolled arms, individual cushions, diamond button tufting, piping and brass legs.
box([0, 0.32, 0], [6.4, 0.5, 1.6], 'dark');
box([0, 0.98, -0.63], [6.4, 1.4, 0.38], 'blue', 0.16);
for (let i = 0; i < 4; i++) {
  const x = -2.22 + i * 1.48;
  box([x, 0.68, 0.05], [1.44, 0.32, 1.25], 'blue', 0.12);
  for (let j = 0; j < 2; j++) ball([x, 0.97 + j * 0.35, -0.4], [0.055, 0.055, 0.022], 'gold');
}
for (const x of [-3, 3]) {
  box([x, 0.86, 0], [0.45, 0.84, 1.7], 'blue', 0.16);
  for (const z of [-0.5, 0.5]) cyl([x, 0.12, z], 0.09, 0.13, 0.24);
}
tube(
  [
    [-3.1, 1.6, -0.6],
    [0, 1.68, -0.7],
    [3.1, 1.6, -0.6],
  ],
  0.035,
);
await save('blues-sofa');
// Fluted stone shaft and ornate capitals.
box([0, 0.12, 0], [1.6, 0.24, 1.6], 'stone');
box([0, 0.32, 0], [1.4, 0.16, 1.4]);
cyl([0, 4.35, 0], 0.44, 0.57, 7.8, 'stone');
for (let i = 0; i < 16; i++) {
  const a = (i * Math.PI) / 8;
  cyl([Math.cos(a) * 0.5, 4.35, Math.sin(a) * 0.5], 0.035, 0.045, 7.5, 'gold');
}
for (const y of [0.55, 1, 7.9, 8.25]) {
  cyl([0, y, 0], 0.67, 0.67, 0.18);
  torus([0, y + 0.12, 0], 0.59, 0.04);
}
box([0, 8.5, 0], [1.6, 0.38, 1.6]);
await save('blues-column');
// Original decorative guardian lion, sculpted from smooth 3D volumes.
box([0, 0.18, 0], [1.9, 0.36, 2.8], 'stone');
box([0, 0.4, 0], [1.8, 0.12, 2.6]);
ball([0, 1.3, -0.2], [0.61, 0.91, 0.75]);
ball([0, 1.3, 0.65], [0.6, 0.63, 0.62]);
for (const s of [-1, 1]) {
  ball([s * 0.4, 0.9, 0.66], [0.22, 0.65, 0.25]);
  ball([s * 0.4, 0.55, 0.95], [0.27, 0.2, 0.45]);
  ball([s * 0.6, 1.7, 0.53], [0.24, 0.35, 0.3]);
}
ball([0, 2.22, 0.65], [0.73, 0.78, 0.61], 'bronze');
for (let i = 0; i < 16; i++) {
  const a = (i * Math.PI) / 8;
  ball([Math.cos(a) * 0.62, 2.25 + Math.sin(a) * 0.65, 0.73], [0.19, 0.24, 0.25]);
}
ball([0, 2.3, 1], [0.47, 0.47, 0.37]);
ball([0, 2.04, 1.27], [0.35, 0.21, 0.22]);
for (const s of [-1, 1]) {
  ball([s * 0.22, 2.45, 1.28], [0.07, 0.08, 0.04], 'dark');
  ball([s * 0.42, 2.85, 0.85], [0.18, 0.21, 0.13]);
}
ball([0, 2.2, 1.42], [0.12, 0.09, 0.06], 'dark');
tube(
  [
    [0.5, 0.7, -0.5],
    [1.05, 1, -0.9],
    [0.9, 1.8, -1],
  ],
  0.1,
);
await save('blues-lion');
// Sculptural footballer tribute: generic original illustration, no copied likeness.
box([0, 0.18, 0], [2.4, 0.36, 1.6], 'stone');
for (const s of [-1, 1]) {
  ball([s * 0.3, 0.6, 0.1], [0.2, 0.15, 0.4], 'bronze');
  ball([s * 0.29, 1.15, 0], [0.19, 0.6, 0.2], 'bronze');
  ball([s * 0.25, 1.8, 0], [0.24, 0.46, 0.25], 'bronze');
}
ball([0, 2.3, 0], [0.6, 0.73, 0.32], 'bronze');
ball([0, 3.1, 0], [0.15, 0.2, 0.17], 'bronze');
ball([0, 3.48, 0], [0.32, 0.4, 0.31], 'bronze');
for (const s of [-1, 1]) {
  tube(
    [
      [s * 0.5, 2.65, 0],
      [s * 0.88, 2.9, 0.05],
      [s * 1.25, 3.4, 0.1],
    ],
    0.16,
    'bronze',
  );
  ball([s * 1.3, 3.55, 0.1], [0.16, 0.23, 0.14], 'bronze');
}
for (let i = 0; i < 9; i++)
  tube(
    [
      [(i - 4) * 0.06, 3.75, -0.1],
      [(i - 4) * 0.075, 3.4, -0.3],
      [(i - 4) * 0.08, 2.9, -0.25],
    ],
    0.038,
    'bronze',
  );
await save('blues-footballer');
// Distinct trophy silhouettes, turned profiles and curved handles, an original stylization.
for (const kind of ['cup', 'europe', 'league', 'spire', 'shield', 'world', 'globe']) {
  const m = ['world', 'league'].includes(kind) ? 'gold' : 'silver';
  cyl([0, 0.12, 0], 0.48, 0.53, 0.24, 'dark');
  torus([0, 0.24, 0], 0.43, 0.045, m);
  if (kind === 'shield') {
    mesh(
      new T.CylinderGeometry(0.86, 0.86, 0.14, 48),
      m,
      [0, 1.2, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    torus([0, 1.2, 0.1], 0.69, 0.055, 'gold', [0, 0, 0]);
    ball([0, 1.2, 0.12], [0.4, 0.4, 0.04], m);
  } else if (kind === 'world' || kind === 'globe') {
    tube(
      [
        [-0.32, 0.3, 0],
        [-0.34, 0.9, 0],
        [0.15, 1.55, 0],
        [0.32, 1.8, 0],
      ],
      0.12,
      m,
    );
    tube(
      [
        [0.32, 0.3, 0],
        [0.34, 0.9, 0],
        [-0.15, 1.55, 0],
        [-0.32, 1.8, 0],
      ],
      0.12,
      m,
    );
    ball([0, 1.98, 0], [0.47, 0.47, 0.47], m);
    torus([0, 1.98, 0], 0.48, 0.025, 'gold', [0, 0, 0]);
  } else if (kind === 'spire') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      tube(
        [
          [Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3],
          [Math.cos(a) * 0.16, 1, Math.sin(a) * 0.16],
          [Math.cos(a) * 0.43, 2, Math.sin(a) * 0.43],
        ],
        0.055,
        m,
      );
    }
    torus([0, 2.03, 0], 0.43, 0.045, m);
  } else {
    const big = kind === 'europe';
    const pts = [
      [0.2, 0.25],
      [0.14, 0.5],
      [0.14, 0.65],
      [0.35, 0.75],
      [0.42, 1.1],
      [0.55, 1.55],
      [0.57, 1.75],
      [0.52, 1.77],
      [0.49, 1.55],
      [0.36, 1.1],
      [0.26, 0.85],
      [0.18, 0.8],
    ].map(([x, y]) => new T.Vector2(x, y));
    mesh(new T.LatheGeometry(pts, 40), m, [0, 0, 0], [big ? 1.25 : 1, big ? 1.3 : 1, 1]);
    for (const s of [-1, 1])
      tube(
        [
          [s * 0.48, 1.6, 0],
          [s * (big ? 0.95 : 0.8), big ? 2.3 : 1.8, 0],
          [s * (big ? 1 : 0.85), 0.95, 0],
          [s * 0.4, 0.85, 0],
        ],
        0.075,
        m,
      );
    if (kind === 'league') {
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        ball([Math.cos(a) * 0.5, 1.95, Math.sin(a) * 0.5], [0.065, 0.18, 0.065], 'gold');
      }
      torus([0, 1.8, 0], 0.53, 0.05, 'gold');
    }
    if (!big)
      for (const s of [-1, 1]) box([s * 0.65, 1.17, 0.05], [0.09, 0.9, 0.025], 'blue', 0.01);
  }
  await save('blues-trophy-' + kind);
}

// Original stone surfaces used by the cave vault and museum paving.
const { default: sharp } = await import('sharp');
const materialsDir = new URL('../../apps/web/public/materials/', import.meta.url);
await fs.mkdir(materialsDir, { recursive: true });
const resolution = 256;
const baseColor = Buffer.alloc(resolution ** 2 * 3);
const normal = Buffer.alloc(baseColor.length);
function surface(x, y) {
  return (
    Math.sin(x * 0.17 + y * 0.03) * 3 +
    Math.sin(x * 0.06 - y * 0.09) * 5 +
    Math.sin(x * 0.57 + y * 0.73) * 2
  );
}
for (let y = 0; y < resolution; y++) {
  for (let x = 0; x < resolution; x++) {
    const offset = (y * resolution + x) * 3;
    const vein = Math.abs(Math.sin(x * 0.045 + y * 0.019 + Math.sin(y * 0.034))) < 0.035 ? 18 : 0;
    const tone = surface(x, y) - vein;
    baseColor[offset] = 87 + tone;
    baseColor[offset + 1] = 109 + tone;
    baseColor[offset + 2] = 139 + tone;
    normal[offset] = 128 + (surface(x - 1, y) - surface(x + 1, y)) * 3;
    normal[offset + 1] = 128 + (surface(x, y - 1) - surface(x, y + 1)) * 3;
    normal[offset + 2] = 250;
  }
}
for (const [name, pixels] of [
  ['blues-stone.png', baseColor],
  ['blues-stone-normal.png', normal],
]) {
  const png = await sharp(pixels, { raw: { width: resolution, height: resolution, channels: 3 } })
    .png()
    .toBuffer();
  await fs.writeFile(new URL(name, materialsDir), png);
}

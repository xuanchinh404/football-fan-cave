import { caveAssets } from './cave/CaveAssets';
import type Phaser from 'phaser';
import { TEAMS } from '../../../../packages/shared/world';
export function preloadAssets(scene: Phaser.Scene) {
  scene.load.image('museum-ferguson-bust', '/art/museum-ferguson-bust.png');
  for (const [key, value] of Object.entries(caveAssets))
    scene.load.svg(
      key,
      `data:image/svg+xml;base64,${btoa(Array.from(new TextEncoder().encode(value.replace(/[^\x00-\x7F]/g, (c) => `&#${c.charCodeAt(0)};`)), (c) => String.fromCharCode(c)).join(''))}`,
    );

  for (const key of [
    'valley',
    'stone',
    'cherry',
    'tree',
    'lantern',
    'market',
    'fountain',
    'bridge',
  ])
    scene.load.image(key, `/art/${key}.webp`);
  for (const team of TEAMS) scene.load.image(`portal-${team.id}`, `/art/portal-${team.id}.webp`);
  for (let i = 0; i < 8; i++) scene.load.image(`fan-${i}`, `/art/fan-${i}.webp`);
}
/** Small native detail textures supplement the original raster kit. */
export function createDetailTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('grass')) return;
  // Keep the extended cave's logical asset keys compatible with the new raster art kit.
  for (const [key, source, width, height] of [
    ['ball', 'fountain', 230, 250],
    ['pinkTree', 'cherry', 220, 280],
    ['player-united-1', 'fan-1', 76, 100],
  ] as const) {
    if (!scene.textures.exists(key)) {
      const t = scene.textures.createCanvas(key, width, height)!;
      t.context.drawImage(
        scene.textures.get(source).getSourceImage() as CanvasImageSource,
        0,
        0,
        width,
        height,
      );
      t.refresh();
    }
  }
  if (!scene.textures.exists('board')) {
    const t = scene.textures.createCanvas('board', 230, 180)!,
      c = t.context;
    const gr = c.createLinearGradient(0, 0, 0, 180);
    gr.addColorStop(0, '#995526');
    gr.addColorStop(1, '#452a21');
    c.fillStyle = gr;
    c.beginPath();
    c.roundRect(10, 20, 210, 130, 8);
    c.fill();
    c.strokeStyle = '#e4b66b';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = '#fff0cf';
    c.textAlign = 'center';
    c.font = 'bold 17px Arial';
    c.fillText('BẢNG HOẠT ĐỘNG', 115, 53);
    c.font = '12px Arial';
    c.fillStyle = '#e0c49b';
    c.fillText('Cùng hội khám phá hang', 115, 85);
    c.fillText('Giao lưu · Chụp ảnh · Cà khịa', 115, 112);
    c.fillStyle = '#754827';
    c.fillRect(27, 150, 12, 25);
    c.fillRect(191, 150, 12, 25);
    t.refresh();
  }

  let seed = 193;
  const r = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const grass = scene.textures.createCanvas('grass', 256, 256)!;
  const c = grass.context;
  c.fillStyle = '#448435';
  c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = ['#548e39', '#74a34b', '#387532', '#65953c', '#286637'][Math.floor(r() * 5)];
    c.globalAlpha = 0.15 + r() * 0.25;
    c.fillRect(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 3);
  }
  c.globalAlpha = 1;
  grass.refresh();
  const rock = scene.textures.createCanvas('rock', 160, 120)!;
  const rc = rock.context;
  const gradient = rc.createLinearGradient(0, 0, 140, 120);
  gradient.addColorStop(0, '#bfc1ae');
  gradient.addColorStop(0.35, '#899c92');
  gradient.addColorStop(1, '#334e50');
  rc.fillStyle = gradient;
  rc.beginPath();
  rc.moveTo(10, 89);
  rc.lineTo(23, 40);
  rc.lineTo(70, 9);
  rc.lineTo(119, 22);
  rc.lineTo(153, 73);
  rc.lineTo(135, 110);
  rc.lineTo(55, 117);
  rc.closePath();
  rc.fill();
  rc.strokeStyle = '#d6d2b7';
  rc.lineWidth = 2;
  rc.beginPath();
  rc.moveTo(24, 42);
  rc.lineTo(69, 18);
  rc.lineTo(117, 29);
  rc.stroke();
  for (let i = 0; i < 320; i++) {
    rc.fillStyle = i % 2 ? '#f4ecc3' : '#293e42';
    rc.globalAlpha = 0.08;
    rc.fillRect(r() * 150, r() * 110, r() * 5, r() * 2);
  }
  rc.globalAlpha = 1;
  rock.refresh();
}

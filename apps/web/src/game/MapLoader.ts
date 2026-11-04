import { HallOfLegendsScene } from './museum/HallOfLegendsScene';
import { RedDevilsCaveScene } from './cave/RedDevilsCaveScene';
import Phaser from 'phaser';
import { PORTALS, TEAMS, type MapId } from '../../../../packages/shared/world';
import { createDetailTextures } from './assets';
import { renderPortal } from './PortalRenderer';
import { halo, motes } from './LightFX';
const color = (s: string) => Phaser.Display.Color.HexStringToColor(s).color;
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export class MapLoader {
  constructor(
    private scene: Phaser.Scene,
    private reduced = false,
  ) {}
  image(x: number, y: number, key: string, height: number, width?: number) {
    const image = this.scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    image.setDisplaySize(width ?? (height * image.width) / image.height, height);
    return image;
  }
  woodSign(x: number, y: number, title: string, subtitle = '', width = 235) {
    const s = this.scene,
      g = s.add.graphics().setDepth(y + 1);
    g.fillStyle(0x271411, 0.4);
    g.fillRoundedRect(x - width / 2 + 5, y - 25, width, 57, 8);
    g.fillStyle(0x6d351c);
    g.fillRoundedRect(x - width / 2, y - 30, width, 54, 8);
    g.lineStyle(3, 0xd29b50);
    g.strokeRoundedRect(x - width / 2, y - 30, width, 54, 8);
    g.lineStyle(1, 0xffdda0, 0.45);
    g.lineBetween(x - width / 2 + 10, y - 25, x + width / 2 - 10, y - 25);
    for (let i = 0; i < 5; i++) {
      g.lineStyle(1, 0x3b1e11, 0.3);
      g.lineBetween(x - width / 2 + 9, y - 19 + i * 8, x + width / 2 - 8, y - 16 + i * 8);
    }
    s.add
      .text(x, y - 9, title, {
        fontFamily: 'Be Vietnam Pro, Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#fff0d2',
        stroke: '#54280f',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(y + 2);
    if (subtitle)
      s.add
        .text(x, y + 11, subtitle, {
          fontFamily: 'Arial',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#ebcba0',
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(y + 2);
  }
  lantern(x: number, y: number, height = 135) {
    this.image(x, y, 'lantern', height);
    halo(this.scene, x, y - height * 0.7, 0xffb73f, 210, 190, y + 1, 0.35);
  }
  build(map: MapId) {
    if (map === 'hall-of-legends') {
      new HallOfLegendsScene(this.scene, this.reduced).build();
      return;
    }
    createDetailTextures(this.scene);
    if (map === 'united') {
      new RedDevilsCaveScene(this.scene, this.reduced).build();
      return;
    }
    if (map === 'plaza') this.plaza();
    else this.interior(map);
  }
  paving(mask: Phaser.GameObjects.Graphics, inside = false) {
    const s = this.scene;
    const floor = s.add
      .tileSprite(1200, 1000, 2400, 2000, 'stone')
      .setTileScale(0.72, 0.58)
      .setDepth(-900);
    if (inside) floor.setTint(0xb9a4af);
    floor.setMask(mask.createGeometryMask());
    mask.setVisible(false);
  }
  plaza() {
    const s = this.scene,
      r = random(910);
    s.add.tileSprite(1200, 900, 2600, 2000, 'grass').setDepth(-1300);
    // Atmospheric scenery is only the distant layer. Every portal, path, prop and actor is independent.
    s.add.image(1200, 510, 'valley').setDisplaySize(2520, 1000).setDepth(-1200);
    const ground = s.add.graphics();
    ground.fillStyle(0xffffff);
    ground.fillEllipse(1200, 1140, 2030, 1110);
    ground.fillPoints(
      [
        { x: 870, y: 950 },
        { x: 1500, y: 950 },
        { x: 1820, y: 1800 },
        { x: 420, y: 1800 },
      ],
      true,
    );
    for (const p of PORTALS) {
      ground.fillPoints(
        [
          { x: p.x - 105, y: p.y - 10 },
          { x: p.x + 105, y: p.y - 10 },
          { x: p.x + 135, y: 780 },
          { x: p.x - 135, y: 780 },
        ],
        true,
      );
    }
    this.paving(ground);
    // Perspective stairways on the raised cave terraces.
    const stairs = s.add.graphics().setDepth(-850);
    for (const p of PORTALS) {
      for (let i = 0; i < 5; i++) {
        const y = p.y + 15 + i * 18,
          w = 122 + i * 11;
        stairs.lineStyle(4, 0x674e3e, 0.45);
        stairs.lineBetween(p.x - w / 2, y + 5, p.x + w / 2, y + 5);
        stairs.lineStyle(2, 0xffedc9, 0.75);
        stairs.lineBetween(p.x - w / 2 + 2, y, p.x + w / 2 - 2, y);
      }
    }
    this.stream();
    for (const p of PORTALS) renderPortal(s, p, this.reduced);
    // Original sculpted trees frame the scene instead of a uniform carpet of paving.
    for (const [x, y, h, key] of [
      [290, 900, 430, 'cherry'],
      [2100, 940, 390, 'tree'],
      [370, 1320, 430, 'tree'],
      [2200, 1370, 480, 'cherry'],
      [630, 1640, 430, 'cherry'],
      [1970, 1700, 440, 'tree'],
      [210, 1650, 530, 'tree'],
      [2260, 730, 390, 'cherry'],
      [400, 540, 260, 'tree'],
      [1740, 410, 270, 'tree'],
    ] as const)
      this.image(x, y, key, h);
    // A gold inlay and fountain anchor the visual centre.
    const dais = s.add.graphics().setDepth(790);
    dais.fillStyle(0x5a4d4b, 0.35);
    dais.fillEllipse(1200, 951, 380, 135);
    dais.fillStyle(0xb6a07d);
    dais.fillEllipse(1200, 940, 367, 126);
    dais.lineStyle(4, 0xffe3a4, 0.85);
    dais.strokeEllipse(1200, 937, 360, 123);
    dais.lineStyle(2, 0xd4b168, 0.8);
    dais.strokeEllipse(1200, 937, 320, 102);
    halo(s, 1200, 880, 0xffc43c, 480, 300, 795, 0.9);
    this.image(1200, 965, 'fountain', 270, 270);
    motes(s, 1200, 805, 0xffe49b, 14, 190, 970);
    this.scoreboard(830, 1005);
    this.image(1830, 1045, 'market', 315, 345);
    this.woodSign(1830, 980, 'QUẦY CÀ KHỊA', 'TRÊU NHAU CÓ DUYÊN', 235);
    this.image(1930, 1315, 'market', 230, 250);
    this.woodSign(1930, 1266, 'GÓC ỦNG HỘ', 'CÙNG THẮP SÁNG THẾ GIỚI', 190);
    for (const [x, y] of [
      [560, 935],
      [880, 770],
      [1450, 780],
      [1650, 990],
      [1020, 1195],
      [1390, 1195],
      [710, 1450],
      [1790, 1310],
    ])
      this.lantern(x, y);
    this.image(1730, 1600, 'bridge', 270, 310);
    this.woodSign(1530, 1410, 'KHÁN ĐÀI TỰ DO', 'KHÁC MÀU ÁO · CHUNG ĐAM MÊ', 255);
    this.woodSign(620, 1500, 'GÓC ĐỒNG HÀNH', 'VỊ TRÍ TÀI TRỢ · CHƯA CÓ TÀI TRỢ', 260);
    // Small garden islands, foliage, flowers and stones break up the plaza.
    for (const [x, y] of [
      [1020, 1000],
      [1390, 1000],
      [650, 900],
      [1700, 1140],
      [920, 1370],
      [1530, 1250],
      [480, 1100],
      [2040, 1130],
    ])
      this.garden(x, y, r);
    const flags = s.add.graphics().setDepth(700);
    flags.lineStyle(2, 0x513f2c, 0.75);
    flags.beginPath();
    flags.moveTo(600, 700);
    for (let j = 0; j <= 28; j++)
      flags.lineTo(600 + j * 42, 700 + Math.sin((j / 28) * Math.PI) * 50);
    flags.strokePath();
    for (let j = 0; j < 28; j++) {
      const x = 607 + j * 42,
        y = 700 + Math.sin((j / 28) * Math.PI) * 50;
      flags.fillStyle([0xec4946, 0xffce63, 0x4b9ef4, 0xe49bdc][j % 4]);
      flags.fillTriangle(x, y, x + 18, y + 2, x + 8, y + 25);
    }
    this.atmosphere(r);
  }
  garden(x: number, y: number, r: () => number) {
    const s = this.scene,
      g = s.add.graphics().setDepth(y);
    g.fillStyle(0x354e2e, 0.7);
    g.fillEllipse(x, y, 120, 38);
    g.fillStyle(0x79aa37);
    g.fillEllipse(x, y - 3, 110, 33);
    for (let i = 0; i < 30; i++) {
      const xx = x + (r() - 0.5) * 105,
        yy = y + (r() - 0.5) * 25;
      g.fillStyle([0xff78bc, 0xffc04d, 0xf2eac7, 0xe3579a][i % 4]);
      for (let j = 0; j < 4; j++)
        g.fillCircle(
          xx + Math.cos((j * Math.PI) / 2) * 3,
          yy + Math.sin((j * Math.PI) / 2) * 2.7,
          2.6,
        );
      g.fillStyle(0xffec7e);
      g.fillCircle(xx, yy, 1.6);
    }
    for (let i = 0; i < 4; i++) this.image(x - 55 + i * 35, y + 12, 'rock', 20 + r() * 12, 35);
  }
  stream() {
    const s = this.scene,
      g = s.add.graphics().setDepth(-880);
    g.fillStyle(0x476641);
    g.fillPoints(
      [
        { x: 1970, y: 970 },
        { x: 2390, y: 970 },
        { x: 2390, y: 1800 },
        { x: 1660, y: 1800 },
        { x: 1590, y: 1570 },
        { x: 1870, y: 1440 },
        { x: 1840, y: 1210 },
      ],
      true,
    );
    g.fillStyle(0x0c9cb9);
    g.fillPoints(
      [
        { x: 2020, y: 990 },
        { x: 2400, y: 990 },
        { x: 2400, y: 1800 },
        { x: 1720, y: 1800 },
        { x: 1650, y: 1590 },
        { x: 1920, y: 1460 },
        { x: 1890, y: 1240 },
      ],
      true,
    );
    g.lineStyle(3, 0x80ebef, 0.5);
    for (let i = 0; i < 40; i++) {
      const x = 1940 + ((i * 59) % 420),
        y = 1030 + ((i * 73) % 740);
      g.lineBetween(x, y, x + 20 + (i % 3) * 14, y - 3);
    }
    for (let i = 0; i < 7; i++) {
      const fish = s.add
        .ellipse(
          2000 + ((i * 47) % 300),
          1200 + ((i * 63) % 420),
          18,
          6,
          i % 2 ? 0xffc39d : 0xe9f9ef,
          0.85,
        )
        .setDepth(-870);
      s.tweens.add({
        targets: fish,
        x: fish.x + 55,
        y: fish.y - 25,
        duration: 3500 + i * 300,
        yoyo: true,
        repeat: -1,
      });
    }
    for (let i = 0; i < 11; i++) this.image(1900 + Math.sin(i) * 45, 1130 + i * 56, 'rock', 42, 65);
  }
  scoreboard(x: number, y: number) {
    const s = this.scene,
      g = s.add.graphics().setDepth(y);
    g.fillStyle(0x58371d);
    g.fillRoundedRect(x - 146, y - 157, 292, 144, 10);
    g.lineStyle(6, 0xbf8b45);
    g.strokeRoundedRect(x - 146, y - 157, 292, 144, 10);
    g.fillStyle(0x171c2a);
    g.fillRoundedRect(x - 134, y - 111, 268, 85, 5);
    g.fillStyle(0x6b4829);
    g.fillRect(x - 125, y - 16, 12, 30);
    g.fillRect(x + 113, y - 16, 12, 30);
    s.add
      .text(x, y - 134, '⚽  TRẬN GẦN NHẤT', {
        fontFamily: 'Arial',
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#fff0d2',
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(y + 1);
    s.add
      .text(x, y - 76, '0 : 3', {
        fontFamily: 'Arial',
        fontSize: '45px',
        fontStyle: 'bold',
        color: '#fff9e8',
        stroke: '#1b1b26',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(y + 1);
    for (const [dx, t, c] of [
      [-90, 'ĐỎ', '#ff6f63'],
      [90, 'XANH', '#65d7fc'],
    ] as const)
      s.add
        .text(x + dx, y - 74, t, { fontSize: '13px', fontStyle: 'bold', color: c })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(y + 1);
    s.add
      .text(x, y - 38, 'TỈ SỐ MINH HỌA · KHÔNG PHẢI TRẬN THẬT', {
        fontFamily: 'Arial',
        fontSize: '8px',
        color: '#c8c2b8',
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(y + 1);
  }
  atmosphere(r: () => number) {
    const s = this.scene;
    for (let i = 0; i < 16; i++) {
      const p = s.add
        .ellipse(300 + r() * 1800, 450 + r() * 1050, 4 + r() * 4, 2 + r() * 3, 0xffc4da, 0.6)
        .setDepth(2200);
      s.tweens.add({
        targets: p,
        x: p.x + 70,
        y: p.y + 100,
        angle: 100,
        alpha: 0,
        duration: 5000 + r() * 4000,
        delay: r() * 3000,
        repeat: -1,
      });
    }
  }
  interior(map: MapId) {
    const s = this.scene,
      t = TEAMS.find((t) => t.id === map)!,
      c = color(t.color);
    s.add.tileSprite(1200, 900, 2600, 2000, 'grass').setTint(0x313949).setDepth(-1300);
    const floor = s.add.graphics();
    floor.fillStyle(0xffffff);
    floor.fillRoundedRect(560, 380, 1280, 1230, 100);
    this.paving(floor, true);
    const rim = s.add.graphics().setDepth(-800);
    rim.lineStyle(10, 0x594b68);
    rim.strokeRoundedRect(560, 380, 1280, 1230, 100);
    rim.lineStyle(3, c, 0.8);
    rim.strokeRoundedRect(630, 435, 1140, 1110, 70);
    for (let i = 0; i < 16; i++) {
      this.image(525, 475 + i * 70, 'rock', 95, 130);
      this.image(1875, 475 + i * 70, 'rock', 95, 130);
    }
    for (let i = 0; i < 15; i++) this.image(570 + i * 90, 405, 'rock', 110, 130);
    this.image(1200, 590, 'fountain', 280, 280);
    halo(s, 1200, 530, c, 500, 350, 595, 0.6);
    this.woodSign(1200, 370, t.name.toUpperCase(), t.tagline, 430);
    this.scoreboard(780, 840);
    this.image(1630, 850, 'market', 270, 300);
    this.woodSign(1630, 800, 'QUẦY CÀ KHỊA', 'KHÁCH ĐẾN CHƠI NHÀ', 210);
    for (const x of [660, 1740]) for (let i = 0; i < 4; i++) this.lantern(x, 660 + i * 230, 145);
    for (const [x, y] of [
      [780, 1090],
      [1650, 1090],
    ])
      this.woodSign(x, y, 'GÓC GIAO LƯU', 'CÀ KHỊA VUI · TÔN TRỌNG NHAU', 210);
    this.woodSign(1200, 1540, '↑ QUẢNG TRƯỜNG', 'ĐẾN GẦN VÀ NHẤN E', 300);
    motes(s, 1200, 520, c, 12, 180, 600);
  }
}

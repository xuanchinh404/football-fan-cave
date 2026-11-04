import Phaser from 'phaser';
import {
  HALL,
  trophies,
  managers,
  historyTimeline,
  matches,
  type Trophy,
} from '../../../../../packages/shared/museum';

/** Original procedural art; every exhibit is a separate, named world entity. */
export class HallOfLegendsScene {
  constructor(
    private s: Phaser.Scene,
    private reduced = false,
  ) {}
  text(
    x: number,
    y: number,
    value: string,
    size = 20,
    color = '#ffdc96',
    depth = 400,
    width?: number,
  ) {
    return this.s.add
      .text(x, y, value, {
        fontFamily: 'Georgia, serif',
        fontSize: `${size}px`,
        color,
        align: 'center',
        fontStyle: 'bold',
        stroke: '#250e12',
        strokeThickness: 3,
        wordWrap: width ? { width } : undefined,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(depth);
  }
  glow(x: number, y: number, w: number, color = 0xff8b26, alpha = 0.8) {
    this.s.add
      .image(x, y, 'glow')
      .setDisplaySize(w, w * 0.75)
      .setTint(color)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-30);
  }
  plaque(x: number, y: number, w: number, title: string, sub = '', size = 24) {
    const g = this.s.add.graphics().setDepth(y);
    g.fillStyle(0x260e17, 0.97);
    g.fillRoundedRect(x - w / 2, y - 36, w, 72, 16);
    g.lineStyle(4, 0xd88c36);
    g.strokeRoundedRect(x - w / 2, y - 36, w, 72, 16);
    g.lineStyle(1, 0xffe7a3);
    g.strokeRoundedRect(x - w / 2 + 7, y - 30, w - 14, 60, 12);
    this.text(x, y - (sub ? 10 : 0), title, size, '#ffe0a0', y + 2);
    if (sub) this.text(x, y + 19, sub, 12, '#cf9b6b', y + 2);
  }
  textures() {
    const s = this.s;
    for (const type of ['league', 'europe', 'cup', 'shield', 'spire', 'globe']) {
      const key = `museum-${type}`;
      if (s.textures.exists(key)) continue;
      const tex = s.textures.createCanvas(key, 160, 200)!;
      const c = tex.context;
      const metal = c.createLinearGradient(25, 0, 135, 0);
      metal.addColorStop(0, '#795021');
      metal.addColorStop(0.2, '#ffe4a0');
      metal.addColorStop(0.4, '#bd833d');
      metal.addColorStop(0.53, '#fff9d6');
      metal.addColorStop(0.72, '#e4b15d');
      metal.addColorStop(1, '#795021');
      c.shadowColor = '#ffae36';
      c.shadowBlur = 10;
      c.fillStyle = metal;
      c.strokeStyle = metal;
      c.lineWidth = 6;
      if (type === 'shield') {
        c.beginPath();
        c.arc(80, 83, 58, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#fff1b9';
        c.lineWidth = 2;
        for (const r of [49, 42, 26]) {
          c.beginPath();
          c.arc(80, 83, r, 0, Math.PI * 2);
          c.stroke();
        }
        c.fillStyle = '#9e6834';
        c.fillRect(65, 144, 30, 18);
      } else {
        if (type === 'globe') {
          c.beginPath();
          c.arc(80, 62, 35, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = '#765026';
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(80, 62, 15, 34, 0, 0, 7);
          c.stroke();
          c.beginPath();
          c.ellipse(80, 62, 34, 12, 0, 0, 7);
          c.stroke();
        } else if (type === 'spire') {
          c.beginPath();
          c.moveTo(56, 33);
          c.lineTo(104, 33);
          c.lineTo(87, 143);
          c.lineTo(73, 143);
          c.closePath();
          c.fill();
        } else {
          c.beginPath();
          c.moveTo(43, 43);
          c.bezierCurveTo(43, 115, 63, 128, 80, 130);
          c.bezierCurveTo(104, 128, 117, 100, 117, 43);
          c.closePath();
          c.fill();
          for (const side of [-1, 1]) {
            c.strokeStyle = metal;
            c.lineWidth = type === 'europe' ? 9 : 5;
            c.beginPath();
            c.moveTo(80 + side * 35, 51);
            c.bezierCurveTo(80 + side * 85, 10, 80 + side * 75, 112, 80 + side * 20, 111);
            c.stroke();
          }
          if (type === 'league') {
            c.fillRect(48, 30, 64, 12);
            for (let i = 0; i < 5; i++) {
              c.beginPath();
              c.moveTo(49 + i * 13, 32);
              c.lineTo(46 + i * 13, 14);
              c.lineTo(57 + i * 13, 29);
              c.fill();
            }
            c.strokeStyle = '#b71f36';
            c.lineWidth = 8;
            for (const side of [-1, 1]) {
              c.beginPath();
              c.moveTo(80 + side * 38, 45);
              c.bezierCurveTo(80 + side * 55, 100, 80 + side * 32, 120, 80 + side * 45, 151);
              c.stroke();
            }
          }
        }
        c.fillStyle = metal;
        c.fillRect(73, 120, 14, 35);
        c.beginPath();
        c.moveTo(73, 148);
        c.lineTo(55, 165);
        c.lineTo(105, 165);
        c.lineTo(87, 148);
        c.fill();
      }
      c.shadowBlur = 0;
      c.fillStyle = '#241a25';
      c.fillRect(48, 165, 64, 17);
      c.fillStyle = metal;
      c.fillRect(43, 180, 74, 7);
      tex.refresh();
    }
  }
  trophy(t: Trophy) {
    const s = this.s;
    const { x, y } = t;
    const large = t.group === 'europe';
    const h = large ? 180 : 140;
    this.glow(x, y - 80, large ? 300 : 180, 0xffb53e, 0.65);
    const g = s.add.graphics().setDepth(y);
    // Glass, brass foot, independent engraved plate and reflected silhouette.
    g.fillStyle(0x86d2ef, 0.065);
    g.fillRoundedRect(x - 57, y - h - 20, 114, h + 28, 12);
    g.lineStyle(2, 0xffbf66, 0.65);
    g.strokeRoundedRect(x - 57, y - h - 20, 114, h + 28, 12);
    g.lineStyle(4, 0xffdc83, 0.95);
    g.strokeEllipse(x, y - h - 12, 114, 20);
    g.strokeEllipse(x, y - 4, 114, 20);
    g.lineStyle(2, 0xd9f2ff, 0.35);
    g.lineBetween(x - 44, y - h + 6, x - 44, y - 25);
    g.lineBetween(x + 43, y - h + 5, x + 43, y - 35);
    g.fillStyle(0x5c2430);
    g.fillRect(x - 62, y + 5, 124, 28);
    g.lineStyle(2, 0xf2ab51);
    g.strokeRect(x - 62, y + 5, 124, 28);
    const entity = s.add
      .container(x, y)
      .setName(t.id)
      .setData('exhibitId', t.id)
      .setData('group', t.group)
      .setDepth(y + 1);
    const image = s.add.image(0, -h / 2 + 1, `museum-${t.asset}`).setDisplaySize(h * 0.8, h);
    entity.add(image);
    s.add
      .image(x, y + 47, `museum-${t.asset}`)
      .setDisplaySize(90, 55)
      .setFlipY(true)
      .setAlpha(0.12)
      .setDepth(-10);
    this.text(x, y + 19, t.season, 16, '#ffe3a3', y + 2);
    if (t.shared) this.text(x, y + 48, 'ĐỒNG VÔ ĐỊCH', 10, '#e1b37a', y + 2);
  }
  portrait(m: (typeof managers)[number]) {
    const { x, y } = m;
    const g = this.s.add.graphics().setDepth(y);
    g.fillStyle(0x351a21);
    g.fillRect(x - 57, y - 177, 114, 177);
    g.lineStyle(m.current ? 5 : 3, m.current ? 0xffed96 : 0xc28d4b);
    g.strokeRect(x - 57, y - 177, 114, 177);
    g.lineStyle(1, 0xf5d293);
    g.strokeRect(x - 51, y - 171, 102, 165);
    g.fillStyle(0x9b7052);
    g.fillEllipse(x, y - 120, 44, 54);
    g.fillStyle(0x201924);
    g.fillEllipse(x, y - 53, 86, 86);
    g.fillStyle(0xe0b881);
    g.fillTriangle(x - 12, y - 92, x + 12, y - 92, x, y - 55);
    g.fillStyle(0x8e2033);
    g.fillTriangle(x - 4, y - 80, x + 4, y - 80, x, y - 50);
    // Intentionally non-likeness portrait medallions.
    this.text(
      x,
      y - 120,
      m.name
        .split(' ')
        .map((v) => v[0])
        .slice(-2)
        .join(''),
      18,
      '#ffe5b4',
      y + 1,
    );
    this.text(
      x,
      y - 29,
      m.name.replace('Sir ', '').replace('Gunnar ', '\n'),
      12,
      '#ffdc9f',
      y + 1,
      105,
    );
    this.text(
      x,
      y - 9,
      `${m.start.slice(0, 4)}–${m.end?.slice(0, 4) || 'nay'}`,
      11,
      '#d7b089',
      y + 1,
    );
    if (m.current) this.text(x, y - 195, '✦ ĐƯƠNG NHIỆM', 12, '#fff0ad', y + 1);
    this.s.add.zone(x, y, 114, 177).setName(m.id).setData('exhibitId', m.id);
    this.glow(x, y - 175, 145, 0xffa840, 0.35);
  }
  build() {
    const s = this.s;
    this.textures();
    s.add.rectangle(1800, 2000, HALL.width, HALL.height, 0x160e1b).setDepth(-1000);
    // Repeating polished stone, deterministic mineral veins and red carpet inlay.
    const g = s.add.graphics().setDepth(-800);
    for (let row = 0; row < 40; row++)
      for (let col = 0; col < 24; col++) {
        const x = col * 160 + (row % 2) * 80,
          y = row * 104;
        g.fillStyle([0x3d2633, 0x4b3039, 0x322537, 0x49303d][(row * 3 + col) % 4]);
        g.fillRect(x + 2, y + 2, 156, 100);
        g.lineStyle(1, 0xc99a7d, 0.12);
        g.strokeRect(x + 3, y + 3, 154, 98);
        g.lineBetween(x + 12, y + 24, x + 123, y + 78);
        g.lineStyle(2, 0xffc48b, 0.06);
        g.lineBetween(x + 30, y + 8, x + 110, y + 8);
      }
    for (const [x, w] of [
      [1800, 540],
      [2990, 140],
    ]) {
      g.fillStyle(0x701729);
      g.fillRect(x - w / 2, 500, w, 3250);
      g.lineStyle(3, 0xe7a146, 0.7);
      g.strokeRect(x - w / 2 + 8, 500, w - 16, 3250);
      for (let y = 550; y < 3750; y += 150) {
        g.lineStyle(1, 0xeea552, 0.25);
        g.strokeEllipse(x, y, w - 40, 80);
      }
    }
    for (const x of [180, 3470])
      for (let y = 100; y < 4100; y += 170) {
        s.add.image(x, y, 'red-rock').setDisplaySize(300, 270).setDepth(y);
        this.glow(x, y - 70, 260, 0xf52d39, 0.5);
      }
    for (let i = 0; i < 22; i++)
      s.add
        .image(i * 175, 350 + Math.sin(i * 2) * 25, 'red-rock')
        .setDisplaySize(260, 410)
        .setDepth(-500);
    // Brass cornice and scarlet gathered curtains.
    g.fillStyle(0x5e1226);
    g.fillRect(720, 160, 2160, 220);
    g.lineStyle(6, 0xe6a13e);
    g.lineBetween(720, 370, 2880, 370);
    for (let i = 0; i < 36; i++) {
      g.lineStyle(8, 0xc2343d, 0.5);
      g.lineBetween(735 + i * 60, 160, 750 + i * 60, 340 + Math.sin(i * 0.4) * 40);
    }
    for (const x of [790, 2810]) {
      s.add.image(x, 580, 'red-banner').setDisplaySize(150, 290).setDepth(500);
      s.add.image(x, 900, 'cave-lantern').setDisplaySize(110, 180).setDepth(900);
      this.glow(x, 770, 500);
    }
    this.plaque(1800, 230, 1050, 'PHÒNG TRUYỀN THỐNG', 'H A L L   O F   L E G E N D S', 47);
    this.text(1800, 125, '♆', 86, '#ffd46d', 600);
    this.text(1800, 322, '✦   MỘT CÂU LẠC BỘ. NGÀN THẾ HỆ.   ✦', 18, '#f4bb72', 600);
    this.plaque(1800, 307, 1870, 'CÁC THẾ HỆ HUẤN LUYỆN VIÊN', 'ĐẾN GẦN CHÂN DUNG · NHẤN E', 22);
    for (const m of managers) this.portrait(m);
    this.plaque(
      1800,
      835,
      1590,
      '20 CHỨC VÔ ĐỊCH QUỐC GIA ANH',
      '7 FIRST DIVISION  ·  13 PREMIER LEAGUE',
      25,
    );
    for (const t of trophies) this.trophy(t);
    this.plaque(
      1800,
      1368,
      1640,
      'DI SẢN CỦA NHỮNG NHÀ VÔ ĐỊCH',
      '1908 — 2013  ·  MỖI DANH HIỆU, MỘT CÂU CHUYỆN',
      24,
    );
    // Original generated sculpture, independent alpha sprite with shared solid plinth.
    s.add
      .image(650, 1010, 'museum-ferguson-bust')
      .setOrigin(0.5, 1)
      .setDisplaySize(566, 620)
      .setDepth(940)
      .setName('ferguson-tribute-art');
    this.plaque(650, 955, 270, 'SIR ALEX', '1986 — 2013', 25);
    this.glow(650, 790, 500);
    // Floor medallion behind the hero, matching the main reference composition.
    const med = s.add.graphics().setDepth(-600);
    for (let i = 0; i < 4; i++) {
      med.lineStyle(i === 0 ? 6 : 2, 0xe7aa55, 0.8 - i * 0.15);
      med.strokeEllipse(1800, 1550, 850 - i * 70, 280 - i * 30);
    }
    this.text(1800, 1520, '♆', 130, '#ba783e', -590);
    this.plaque(
      1700,
      1635,
      2700,
      'BỘ SƯU TẬP DANH HIỆU',
      'ĐI DỌC CÁC DÃY TỦ · MỖI HIỆN VẬT CÓ THỂ KHÁM PHÁ',
      28,
    );
    // Group names next to each individual trophy, avoiding a misleading aggregate trophy.
    for (const t of trophies.filter((t) => t.group !== 'league' && t.group !== 'europe'))
      this.text(
        t.x,
        t.y - 186,
        t.title.replace('Community Shield', 'C. SHIELD').replace('UEFA ', '').toUpperCase(),
        12,
        '#deb77c',
        t.y + 2,
        200,
      );
    this.plaque(
      1100,
      2850,
      1550,
      'HÀNH LANG CÁC THẾ HỆ HLV',
      'KHỞI NGUỒN & NHỮNG NHIỆM KỲ TẠM QUYỀN',
      27,
    );
    this.plaque(2500, 2970, 920, 'NHỮNG ĐÊM CHÂU ÂU', 'KHU F · TRẬN ĐẤU HUYỀN THOẠI', 26);
    for (const m of matches) {
      this.plaque(m.x, m.y - 50, 260, m.title, 'E · XEM KẾT QUẢ', 18);
      s.add.zone(m.x, m.y, 220, 100).setName(m.id);
    }
    this.plaque(3200, 420, 340, 'DÒNG THỜI GIAN', 'KHU E · 1878 → NAY', 22);
    for (const h of historyTimeline) {
      const gg = s.add.graphics().setDepth(h.y);
      gg.fillStyle(0x321523, 0.95);
      gg.fillRect(h.x - 130, h.y - 115, 260, 115);
      gg.lineStyle(2, 0xc38d46);
      gg.strokeRect(h.x - 130, h.y - 115, 260, 115);
      gg.fillStyle(0xffb848);
      gg.fillCircle(h.x - 144, h.y - 60, 6);
      gg.lineStyle(2, 0xca8b41);
      gg.lineBetween(h.x - 144, h.y - 120, h.x - 144, h.y + 185);
      this.text(h.x, h.y - 88, h.period, 22, '#ffcf7c', h.y + 1);
      this.text(h.x, h.y - 44, h.title, 17, '#f4d8b4', h.y + 1, 230);
      s.add.zone(h.x, h.y, 260, 115).setName(h.id);
    }
    this.plaque(2450, 3520, 750, 'GÓC CHỤP ẢNH KỶ NIỆM', 'KHU G · ĐỨNG TRÊN HUY HIỆU · NHẤN E', 25);
    med.lineStyle(5, 0xf3bd6b);
    med.strokeEllipse(2450, 3630, 430, 140);
    this.plaque(1800, 3830, 620, '↗ QUAY VỀ HANG QUỶ ĐỎ', 'ĐẾN GẦN · NHẤN E', 25);
    for (const x of [350, 2970])
      for (let y = 1550; y < 3700; y += 520) {
        s.add.image(x, y, 'cave-lantern').setDisplaySize(95, 155).setDepth(y);
        this.glow(x, y - 90, 350);
      }
    if (!this.reduced)
      for (let i = 0; i < 45; i++) {
        const x = 400 + ((i * 197) % 2800),
          y = 600 + ((i * 283) % 2900);
        const p = s.add.circle(x, y, 1.5, 0xffcf82, 0.7).setDepth(y + 100);
        s.tweens.add({
          targets: p,
          y: y - 65,
          alpha: 0,
          duration: 2800 + i * 43,
          repeat: -1,
          yoyo: true,
        });
      }
  }
}

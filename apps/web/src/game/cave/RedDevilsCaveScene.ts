import Phaser from 'phaser';
import { RED_CAVE } from '../../../../../packages/shared/cave';

/** Environment builder attached to the existing World scene, preserving input/network lifecycle. */
export class RedDevilsCaveScene {
  private seed = 714;
  constructor(
    private s: Phaser.Scene,
    private reduced = false,
  ) {}
  random() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  prop(x: number, y: number, key: string, scale = 1, depth = y) {
    return this.s.add.image(x, y, key).setOrigin(0.5, 1).setScale(scale).setDepth(depth);
  }
  glow(x: number, y: number, color: number, size: number, pulse = true) {
    const p = this.s.add
      .image(x, y, 'glow')
      .setTint(color)
      .setDisplaySize(size, size * 0.75)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-50)
      .setAlpha(0.8);
    if (pulse && !this.reduced)
      this.s.tweens.add({
        targets: p,
        alpha: 0.35,
        duration: 1800 + this.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    return p;
  }
  plaque(x: number, y: number, title: string, subtitle: string, color = '#ffd18a', width = 310) {
    const plate = this.s.add.container(x, y).setDepth(y + 10);
    plate.add(
      this.s.add
        .rectangle(0, 0, width, 66, 0x301d27, 0.96)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.8),
    );
    plate.add(
      this.s.add
        .text(0, -9, title, { fontFamily: 'Arial', fontSize: '23px', fontStyle: 'bold', color })
        .setOrigin(0.5)
        .setResolution(2),
    );
    plate.add(
      this.s.add
        .text(0, 18, subtitle, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: '#dcc3b5',
          letterSpacing: 1,
        })
        .setOrigin(0.5)
        .setResolution(2),
    );
    return plate;
  }
  flowers(x: number, y: number, scale = 1) {
    const g = this.s.add.graphics().setPosition(x, y).setScale(scale).setDepth(y);
    g.fillStyle(0x3b292a);
    g.fillEllipse(0, 0, 155, 56);
    g.lineStyle(4, 0xa3634a);
    g.strokeEllipse(0, 0, 155, 56);
    for (let i = 0; i < 27; i++) {
      const xx = this.random() * 135 - 67,
        yy = this.random() * 35 - 30;
      g.fillStyle(0x49784c);
      g.fillEllipse(xx, yy + 10, 18, 7);
      g.fillStyle([0xffb07d, 0xf4b5e9, 0xffe0a1, 0xe95873][i % 4]);
      for (let j = 0; j < 5; j++)
        g.fillCircle(xx + Math.cos(j * 1.256) * 4, yy + Math.sin(j * 1.256) * 4, 3.6);
      g.fillStyle(0xffe6b1);
      g.fillCircle(xx, yy, 2);
    }
  }
  build() {
    const s = this.s;
    s.add.rectangle(2048, 1536, 4096, 3072, 0x191423).setDepth(-1000);
    // Reusable texture, rather than thousands of live vector tiles. TileSprite is camera-culled by Phaser.
    if (!s.textures.exists('red-floor')) {
      const tex = s.textures.createCanvas('red-floor', 384, 256)!;
      const c = tex.context;
      c.fillStyle = '#3b303a';
      c.fillRect(0, 0, 384, 256);
      for (let row = 0; row < 4; row++)
        for (let col = -1; col < 4; col++) {
          const x = col * 128 + (row % 2) * 64,
            y = row * 64;
          const gr = c.createLinearGradient(x, y, x + 90, y + 60);
          gr.addColorStop(0, ['#735255', '#775b5b', '#69505a', '#61505b'][(row + col + 4) % 4]);
          gr.addColorStop(1, '#443541');
          c.fillStyle = gr;
          c.beginPath();
          c.moveTo(x + 3, y + 5);
          c.lineTo(x + 115, y + 2);
          c.lineTo(x + 125, y + 50);
          c.lineTo(x + 91, y + 61);
          c.lineTo(x + 4, y + 57);
          c.closePath();
          c.fill();
          c.strokeStyle = '#ba887266';
          c.lineWidth = 1;
          c.stroke();
          c.fillStyle = '#e4c2a011';
          c.fillRect(x + 13, y + 11, 80, 2);
        }
      tex.refresh();
    }
    s.add.tileSprite(2048, 1590, 3220, 2680, 'red-floor').setDepth(-800);
    const g = s.add.graphics().setDepth(-700);
    // Branching promenade, balconies and a wide flight of stairs behind the hall.
    g.lineStyle(105, 0xd5a286, 0.12);
    for (const [x, y] of [
      [920, 1550],
      [3190, 1810],
      [1040, 720],
      [3100, 710],
      [2048, 2750],
    ])
      g.lineBetween(2048, 1980, x, y);
    for (let i = 0; i < 15; i++) {
      const y = 1120 + i * 24,
        w = 430 + i * 17;
      g.fillStyle(i % 2 ? 0x79535a : 0x60414d);
      g.fillRect(2048 - w / 2, y, w, 21);
      g.lineStyle(2, 0xefbc90, 0.5);
      g.lineBetween(2048 - w / 2, y, 2048 + w / 2, y);
    }
    // Rear terrace and side alcoves remain walkable; room entrances are actual interaction zones.
    for (const [x, y] of [
      [840, 500],
      [3260, 500],
    ]) {
      g.fillStyle(0x432d4b);
      g.fillRoundedRect(x - 310, y - 140, 620, 400, 60);
      g.lineStyle(3, x < 2000 ? 0xb17ae9 : 0x68b9e1, 0.6);
      g.strokeRoundedRect(x - 310, y - 140, 620, 400, 60);
    }
    // Gold and scarlet floor inlay visible below the moving player.
    for (const [w, h, alpha] of [
      [810, 310, 0.7],
      [740, 260, 0.4],
      [540, 200, 0.4],
    ]) {
      g.lineStyle(4, 0xffaa60, alpha);
      g.strokeEllipse(2048, 2150, w, h);
    }
    g.lineStyle(9, 0xf27559, 0.75);
    g.lineBetween(2048, 2050, 2048, 2250);
    g.lineBetween(1980, 2070, 1980, 2140);
    g.lineBetween(2116, 2070, 2116, 2140);
    g.lineBetween(1980, 2140, 2116, 2140);
    for (const x of [1980, 2048, 2116]) {
      g.fillStyle(0xffad74, 0.8);
      g.fillTriangle(x - 11, 2080, x + 11, 2080, x, 2045);
    }
    // Faceted perimeter objects form a layered cave wall. The feet bounds match shared collision data.
    for (let i = 0; i < 23; i++)
      this.prop(370 + i * 153, 360 + Math.sin(i * 1.6) * 55, 'red-rock', 1.25, 360);
    for (let i = 0; i < 18; i++) {
      const y = 530 + i * 143;
      this.prop(340 + Math.sin(i) * 55, y, 'red-rock', 1.18);
      this.prop(3780 + Math.cos(i) * 45, y, 'red-rock', 1.3);
    }
    for (const o of RED_CAVE.obstacles) {
      if (o.x === 1868 || o.x === 2920 || o.x === 590 || o.x === 1450 || o.y === 310) continue;
      for (let x = o.x + 55; x < o.x + o.w; x += 130) this.prop(x, o.y + o.h, 'red-rock', 1.05);
    }
    this.prop(2048, 1430, 'red-arch', 1.42, 1100);
    this.glow(2048, 1190, 0xff482c, 850);
    this.prop(2048, 1280, 'cave-sign', 1.06, 1450);
    this.plaque(2048, 1010, 'PHÒNG TRUYỀN THỐNG', 'ĐẾN GẦN · NHẤN E ĐỂ VÀO', '#ffd18a', 500);
    for (const x of [1560, 2520]) this.prop(x, 1370, 'red-banner', 1.06, 1390);
    // Main golden football monument; the solid base is shared with server collision.
    this.glow(2048, 1640, 0xffb12d, 650);
    this.prop(2048, 1735, 'ball', 0.86, 1735).setTint(0xffdb8b);
    this.plaque(2048, 1780, 'SẢNH TRÚ ẨN', 'CHUNG MÀU ÁO · CHUNG NHỊP ĐẬP', '#ffcb77', 370);
    this.prop(1560, 1920, 'board', 1.15);
    this.plaque(1560, 1730, 'BẢNG HOẠT ĐỘNG', 'ĐẾN GẦN VÀ NHẤN E', '#ffce8c', 310);
    // Football Lounge: independently rendered screen, tiered terrace and six usable seats.
    this.prop(920, 1270, 'football-screen', 0.95, 1270);
    for (let row = 0; row < 2; row++) {
      g.fillStyle(0x302430);
      g.fillRect(570, 1430 + row * 180, 570, 90);
      g.fillStyle(0x9c6351);
      g.fillRect(570, 1506 + row * 180, 570, 10);
    }
    RED_CAVE.seats.forEach((p) => this.prop(p.x, p.y, 'cave-seat', 0.95));
    this.plaque(850, 1810, 'KHÁN ĐÀI ĐỎ', '6 CHỖ NGỒI · NHẤN E', '#ffb385', 340);
    // Troll Shop: counter and NPC use their own display objects.
    this.glow(3190, 1550, 0xffa53d, 650);
    this.prop(3190, 1720, 'troll-shop', 1.03);
    this.prop(3200, 1590, 'fan-1', 0.14, 1710);
    this.plaque(3190, 1865, 'QUẦY CÀ KHỊA', 'XEM THỬ MIỄN PHÍ · KHÔNG THANH TOÁN', '#ffc477', 440);
    this.plaque(3510, 1950, 'CÀ KHỊA VUI', 'VĂN MINH · TÔN TRỌNG', '#ffc477', 250);
    // Portal alcoves have two-way travel without reloading or leaving the cave room.
    this.prop(1040, 770, 'fun-arch', 0.82, 770);
    this.glow(1040, 660, 0xb958ff, 500);
    this.plaque(1040, 365, '✧  KHU GIẢI TRÍ', 'BIỂU CẢM · GÓC CHỤP ẢNH', '#d997ff', 360);
    this.prop(3100, 760, 'event-arch', 0.82, 760);
    this.glow(3100, 650, 0x3dbaff, 500);
    this.plaque(3100, 355, '★  KHU SỰ KIỆN', 'GẶP HỘI · CHIA SẺ ĐAM MÊ', '#80d9ff', 360);
    this.plaque(700, 440, 'GÓC CHỤP ẢNH', 'E · TẠO DÁNG', '#d997ff', 230);
    this.plaque(3450, 440, 'LỊCH HOẠT ĐỘNG', 'E · XEM THÔNG TIN', '#80d9ff', 250);
    this.plaque(2048, 2790, '↗  QUẢNG TRƯỜNG', 'ĐẾN GẦN · NHẤN E ĐỂ TRỞ VỀ', '#ffcf9c', 440);
    this.glow(2048, 2740, 0xffc179, 440);
    g.lineStyle(5, 0xf7c18e, 0.7);
    g.strokeEllipse(2048, 2750, 280, 90);
    // Waterfall ribbons and reflections at the two outer banks.
    for (const x of [520, 3570]) {
      g.fillStyle(0x254457);
      g.fillEllipse(x, 2400, 210, 460);
      for (let j = 0; j < 6; j++) {
        const water = s.add.rectangle(x - 48 + j * 19, 2290, 7, 190, 0x72cde0, 0.3).setDepth(-650);
        if (!this.reduced)
          s.tweens.add({
            targets: water,
            alpha: 0.09,
            y: water.y + 20,
            duration: 900 + j * 150,
            yoyo: true,
            repeat: -1,
          });
      }
    }
    for (const [x, y, k] of [
      [1280, 1940, 1],
      [2780, 1960, 1.2],
      [1770, 1790, 0.8],
      [2320, 1790, 0.8],
      [1340, 1190, 0.8],
      [2780, 1100, 0.9],
      [840, 2310, 1.4],
      [3300, 2460, 1.4],
    ])
      this.flowers(x, y, k);
    for (const [x, y, scale] of [
      [510, 1100, 1],
      [3520, 1190, 1.1],
      [1250, 2250, 0.85],
      [2860, 2230, 0.9],
      [610, 2650, 1.3],
      [3530, 2780, 1.5],
      [1430, 1000, 0.8],
      [2630, 1010, 0.9],
      [520, 670, 0.8],
    ]) {
      this.prop(x, y, 'red-crystal', scale);
      this.glow(x, y - 80, 0xff433c, 270 * scale);
    }
    for (const [x, y] of [
      [1450, 1390],
      [2650, 1390],
      [1730, 1970],
      [2390, 1970],
      [1170, 1480],
      [2750, 1580],
      [1200, 2550],
      [2910, 2530],
      [700, 920],
      [3420, 930],
    ]) {
      const lamp = this.prop(x, y, 'cave-lantern', 0.86);
      this.glow(x, y - 110, 0xffb33d, 300);
      if (!this.reduced)
        s.tweens.add({
          targets: lamp,
          angle: 2,
          duration: 1700 + this.random() * 600,
          yoyo: true,
          repeat: -1,
        });
    }
    for (const [x, y] of [
      [480, 1950],
      [3600, 2020],
      [620, 2790],
      [3420, 2880],
    ])
      this.prop(x, y, 'pinkTree', 1.15);
    // Floating motes are local and deliberately sparse; the low-effects option removes their work.
    if (!this.reduced)
      for (let i = 0; i < 48; i++) {
        const x = 550 + this.random() * 3000,
          y = 500 + this.random() * 2300;
        const p = s.add.circle(x, y, 1 + this.random() * 2, 0xffc47e, 0.65).setDepth(y + 100);
        s.tweens.add({
          targets: p,
          y: y - 80,
          alpha: 0,
          duration: 2800 + this.random() * 3000,
          delay: this.random() * 2500,
          repeat: -1,
          yoyo: true,
        });
      }
  }
}

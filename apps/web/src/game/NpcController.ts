import { RED_CAVE } from '../../../../packages/shared/cave';
import type Phaser from 'phaser';
import { TEAMS, walkable, type MapId } from '../../../../packages/shared/world';
import { PlayerController } from './PlayerController';
export class NpcController {
  actors: { player: PlayerController; tx: number; ty: number; wait: number }[] = [];
  constructor(scene: Phaser.Scene, map: MapId, ambient = false) {
    const points =
      map === 'hall-of-legends'
        ? [
            [900, 1460],
            [1300, 1420],
            [1650, 1500],
            [2090, 1510],
            [2640, 1450],
            [2900, 1620],
            [1050, 1710],
            [2900, 2700],
            [1100, 2870],
            [2100, 2900],
            [2300, 3460],
            [2900, 3550],
          ]
        : map === 'united'
          ? RED_CAVE.npcs.map((p) => [p[0], p[1]])
          : map === 'plaza'
            ? [
                [1000, 1060],
                [1420, 1020],
                [950, 1280],
                [1360, 1280],
                [1530, 710],
                [630, 790],
                [1660, 1150],
                [1140, 660],
                [740, 1220],
                [1450, 1510],
                [1000, 820],
                [1720, 680],
              ]
            : [
                [1000, 930],
                [1430, 950],
                [1150, 1130],
                [1390, 1280],
                [950, 650],
                [1480, 630],
              ];
    const names = [
      'Bắp Rang',
      'Kop Mộng Mơ',
      'Gooner Nhí',
      'Blue Monday',
      'Chú Tư',
      'Mèo Đỏ',
      'Cá Viên',
      'Tí Còi',
      'Anh Bảy',
      'Bình Luận Dạo',
      'Mía Đá',
      'Gấu Xanh',
    ];
    if (ambient) {
      points.length = 0;
      const count = scene.scale.width < 650 ? 16 : 30;
      for (let i = 0; i < count; i++) {
        let x = 460 + ((i * 193) % 1490),
          y = 650 + ((i * 127) % 770);
        if (!walkable(map, x, y)) {
          x = map === 'plaza' ? 920 + ((i * 87) % 630) : 950 + ((i * 67) % 490);
          y = map === 'plaza' ? 1010 + ((i * 53) % 480) : 900 + ((i * 57) % 450);
        }
        if (walkable(map, x, y)) points.push([x, y]);
      }
    }
    points.forEach(([x, y], i) => {
      const team = TEAMS[(i * 7 + 2) % 6];
      const player = new PlayerController(
        scene,
        x,
        y,
        { nickname: names[i % names.length], team: team.id, avatar: i % 4 },
        ambient ? 'CĐV · NPC' : `${names[i % names.length]} · NPC`,
        ambient ? 'crowd' : 'guest',
      );
      this.actors.push({ player, tx: x, ty: y, wait: i * 0.8 });
    });
  }
  update(map: MapId, dt: number, time: number) {
    for (const a of this.actors) {
      a.wait -= dt;
      let dx = 0,
        dy = 0;
      if (a.wait < 0) {
        dx = a.tx - a.player.container.x;
        dy = a.ty - a.player.container.y;
        if (Math.hypot(dx, dy) < 9 || a.wait < -5) {
          const x = a.player.container.x + Math.sin(time * 0.001 + a.ty) * 140,
            y = a.player.container.y + Math.cos(time * 0.0008 + a.tx) * 100;
          if (walkable(map, x, y)) {
            a.tx = x;
            a.ty = y;
          }
          a.wait = 2 + Math.random() * 4;
          dx = dy = 0;
        }
      }
      a.player.update(map, dx, dy, dt * 0.32);
    }
  }
  destroy() {
    this.actors.forEach((a) => a.player.destroy());
    this.actors = [];
  }
}

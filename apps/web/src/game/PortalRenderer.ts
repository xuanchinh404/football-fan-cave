import Phaser from 'phaser';
import { TEAMS, type Interaction } from '../../../../packages/shared/world';
import { ART } from './artDirection';
import { halo, motes } from './LightFX';
export function renderPortal(scene: Phaser.Scene, p: Interaction, reduced = false) {
  const t = TEAMS.find((t) => t.id === p.id)!;
  const hero = p.id === 'united',
    w = hero ? ART.portal.heroWidth : ART.portal.width,
    h = hero ? ART.portal.heroHeight : ART.portal.height;
  const color = Phaser.Display.Color.HexStringToColor(t.color).color;
  halo(scene, p.x, p.y - 30, color, w * 1.3, h * 0.5, p.y - 3, 0.8);
  scene.add.image(p.x, p.y, `portal-${t.id}`).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(p.y);
  const text = scene.add
    .text(p.x, p.y - h * 0.735, hero ? 'HANG QUỶ ĐỎ' : t.name, {
      fontFamily: 'Be Vietnam Pro, Arial',
      fontSize: hero ? '29px' : '23px',
      fontStyle: 'bold',
      color: '#fff4dc',
      stroke: '#3d1b13',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#120b19', blur: 3, fill: true },
    })
    .setOrigin(0.5)
    .setResolution(2)
    .setDepth(p.y + 2);
  if (text.width > w * 0.68) text.setScale((w * 0.68) / text.width);
  scene.add
    .text(p.x, p.y - h * 0.91, t.icon, {
      fontFamily: 'Georgia',
      fontSize: hero ? '39px' : '30px',
      color: t.color,
      stroke: '#ffe0a5',
      strokeThickness: 1,
      shadow: { blur: 12, color: t.color, fill: true },
    })
    .setOrigin(0.5)
    .setResolution(2)
    .setDepth(p.y + 3);
  const light = halo(scene, p.x, p.y - h * 0.32, color, w * 0.5, h * 0.6, p.y + 1, 0.2);
  scene.tweens.add({ targets: light, alpha: 0.5, duration: 1700, yoyo: true, repeat: -1 });
  motes(scene, p.x, p.y - 45, color, reduced ? 3 : hero ? 14 : 7, w * 0.35, p.y + 4);
}

import Phaser from 'phaser';
import { move, SPEED, type MapId, type Profile } from '../../../../packages/shared/world';
import { ART } from './artDirection';
export class PlayerController {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  bubble?: Phaser.GameObjects.Container;
  direction = -Math.PI / 2;
  moving = false;
  phase = 0;
  private baseFrame: number;
  private facingBack = true;
  private height: number;
  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    public profile: Profile,
    label?: string,
    kind: 'hero' | 'guest' | 'crowd' = 'guest',
  ) {
    this.baseFrame =
      profile.avatar === 2 ? 6 : profile.team === 'city' ? 4 : profile.team === 'chelsea' ? 2 : 0;
    this.height =
      kind === 'hero'
        ? ART.player.heroHeight
        : kind === 'crowd'
          ? ART.player.crowdHeight
          : ART.player.guestHeight;
    this.body = scene.add
      .image(0, 3, `fan-${this.baseFrame}`)
      .setOrigin(0.5, 1)
      .setDisplaySize((this.height * 2) / 3, this.height);
    const shadow = scene.add.ellipse(0, -3, this.height * 0.47, this.height * 0.13, 0x1c1830, 0.22);
    this.name = scene.add
      .text(0, -this.height - 10, label || profile.nickname, {
        fontFamily: 'Be Vietnam Pro, Arial',
        fontSize: kind === 'hero' ? '16px' : kind === 'crowd' ? '9px' : '12px',
        fontStyle: kind === 'hero' ? 'bold' : 'normal',
        color: kind === 'hero' ? '#fff9dc' : '#e4efff',
        backgroundColor: kind === 'hero' ? '#b51c29ee' : '#17273d99',
        padding: { x: kind === 'crowd' ? 4 : 9, y: kind === 'crowd' ? 2 : 5 },
        stroke: '#112437',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setResolution(2);
    this.container = scene.add.container(x, y, [shadow, this.body, this.name]).setDepth(y);
  }
  animate(direction: number, moving: boolean, time: number) {
    this.direction = direction;
    this.moving = moving;
    if (moving) {
      const back = Math.sin(direction) < 0.25;
      if (this.facingBack !== back) {
        this.facingBack = back;
        this.body.setTexture(`fan-${this.baseFrame + (back ? 0 : 1)}`);
        this.body.setDisplaySize((this.height * 2) / 3, this.height);
      }
      this.body.setFlipX(Math.cos(direction) < -0.25);
      this.body.y = 3 - Math.abs(Math.sin(time * 13)) * 5;
      this.body.rotation = Math.sin(time * 13) * 0.025;
    } else {
      this.body.y = 3;
      this.body.rotation = 0;
    }
  }
  update(map: MapId, dx: number, dy: number, dt: number) {
    const len = Math.hypot(dx, dy);
    if (len) {
      dx /= len;
      dy /= len;
      const p = move(map, this.container, dx * SPEED * dt, dy * SPEED * dt);
      this.container.setPosition(p.x, p.y);
      this.direction = Math.atan2(dy, dx);
      this.phase += dt;
    }
    this.animate(this.direction, len > 0, this.phase);
    this.container.setDepth(this.container.y);
  }
  sit(value: boolean) {
    this.body.setDisplaySize((this.height * 2) / 3, this.height * (value ? 0.82 : 1));
    if (value) this.body.y = 14;
  }
  say(text: string) {
    this.bubble?.destroy();
    const t = this.scene.add
      .text(0, -this.height - 44, text, {
        fontFamily: 'Be Vietnam Pro, Arial',
        fontSize: '14px',
        color: '#222437',
        backgroundColor: '#fff5e4',
        padding: { x: 13, y: 10 },
        wordWrap: { width: 205 },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setResolution(2);
    this.bubble = this.scene.add.container(0, 0, [t]);
    this.container.add(this.bubble);
    const b = this.bubble;
    this.scene.time.delayedCall(4200, () => {
      b.destroy();
      if (this.bubble === b) this.bubble = undefined;
    });
  }
  destroy() {
    this.container.destroy();
  }
}

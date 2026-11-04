import Phaser from 'phaser';
import {
  EMOJIS,
  near,
  spawn,
  mapSize,
  type MapId,
  type Player,
  type Profile,
} from '../../../../packages/shared/world';
import { preloadAssets } from './assets';
import { emit, on, type RemoteEvent, type StartEvent } from './bridge';
import { MapLoader } from './MapLoader';
import { PlayerController } from './PlayerController';
import { NpcController } from './NpcController';
import { ART } from './artDirection';
export class WorldScene extends Phaser.Scene {
  map: MapId = 'plaza';
  player!: PlayerController;
  npcs?: NpcController;
  crowd?: NpcController;
  remotes = new Map<string, { actor: PlayerController; target: Player }>();
  profile: Profile = { nickname: 'Khách', team: 'united', avatar: 0 };
  self = 'demo';
  online = false;
  enabled = false;
  blocked = false;
  seated = false;
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  joystick = { x: 0, y: 0 };
  unsubs: (() => void)[] = [];
  lastSync = 0;
  lastState = 0;
  lastEffect = 0;
  marker?: Phaser.GameObjects.Ellipse;
  constructor() {
    super('World');
  }
  preload() {
    preloadAssets(this);
  }
  create() {
    if (!this.textures.exists('glow')) {
      const texture = this.textures.createCanvas('glow', 256, 256)!;
      const ctx = texture.context,
        gr = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,255,255,.4)');
      gr.addColorStop(0.4, 'rgba(255,255,255,.15)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 256, 256);
      texture.refresh();
    }
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.input.keyboard!.on('keydown-E', () => {
      if (!this.blocked && this.enabled) {
        const position = { x: this.player.container.x, y: this.player.container.y };
        // Send the latest feet position before an authoritative interaction request.
        emit('movement', {
          ...position,
          direction: this.player.direction,
          moving: this.player.moving,
        });
        emit('interact', { map: this.map, position, seated: this.seated });
      }
    });
    this.input.keyboard!.on('keydown-ENTER', () => {
      if (!this.blocked && this.enabled) emit('focus-chat');
    });
    this.unsubs = [
      on<StartEvent>('start', (e) => {
        this.profile = e.profile;
        this.self = e.id;
        this.enabled = true;
        this.build(this.map, { x: this.player.container.x, y: this.player.container.y });
      }),
      on<boolean>('block', (v) => {
        this.blocked = v;
        this.input.keyboard!.enabled = !v;
        Object.values(this.keys).forEach((k) => k.reset());
      }),
      on<{ x: number; y: number }>('joystick', (v) => (this.joystick = v)),
      on<boolean>('connected', (v) => {
        this.online = v;
        if (v && this.map !== 'united' && this.map !== 'hall-of-legends') {
          this.npcs?.destroy();
          this.npcs = undefined;
        } else if ((!v || this.map === 'united' || this.map === 'hall-of-legends') && !this.npcs)
          this.npcs = new NpcController(this, this.map);
      }),
      on<{ map: MapId; x?: number; y?: number }>('travel', (e) => {
        this.cameras.main.fadeOut(170, 12, 24, 22);
        this.time.delayedCall(180, () => {
          this.build(e.map, e.x !== undefined ? { x: e.x, y: e.y! } : spawn(e.map));
          this.cameras.main.fadeIn(250, 12, 24, 22);
        });
      }),
      on<RemoteEvent>('remotes', (e) => this.sync(e)),
      on<{ id: string; text: string }>('bubble', (e) => {
        if (e.id === this.self || e.id === 'demo') this.player.say(e.text);
        else this.remotes.get(e.id)?.actor.say(e.text);
      }),
      on<boolean>('quality', (value) => {
        this.reduced = value;
        const wasSeated = this.seated;
        this.build(this.map, { x: this.player.container.x, y: this.player.container.y });
        this.seated = wasSeated;
      }),
      on('toggle-seat', () => {
        this.seated = !this.seated;
      }),
      on<{ seated: boolean }>('seated', (p) => {
        this.seated = p.seated;
      }),
      on<string>('effect', (v) => this.effect(v)),
      on('screenshot', () =>
        this.game.renderer.snapshot((img) => {
          if (img instanceof HTMLImageElement) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'hoi-vao-hang.png';
            link.click();
            emit('notice', 'Đã chụp cảnh game. Hẹn gặp bạn trong hang!');
          }
        }),
      ),
      on<{ x: number; y: number }>('correct', (p) => this.player.container.setPosition(p.x, p.y)),
    ];
    this.build('plaza', spawn('plaza'));
    this.scale.on('resize', () => this.resize());
    this.events.once('shutdown', () => this.unsubs.forEach((fn) => fn()));
    emit('ready');
  }
  resize() {
    const w = this.scale.width;
    if (this.map === 'hall-of-legends') {
      const p = this.player?.container;
      const overview = p && p.x > 950 && p.x < 2800 && p.y > 1400 && p.y < 1750;
      this.cameras.main.setZoom(
        w < 650 ? 0.72 : overview ? Math.min(w / 2500, this.scale.height / 1800) : 0.78,
      );
      this.cameras.main.setFollowOffset(0, w < 650 ? 300 : overview ? 650 : 220);
      return;
    }
    if (this.map === 'united') {
      this.cameras.main.setZoom(w < 650 ? 0.55 : 0.5);
      return;
    }
    const h = this.scale.height;
    const zoom =
      w < 650
        ? Math.min(0.86, Math.max(0.68, h / 1050))
        : Math.min(1.1, Math.max(w / ART.camera.visibleWidth, h / ART.camera.visibleHeight));
    this.cameras.main.setZoom(zoom);
  }
  build(map: MapId, p: { x: number; y: number }) {
    this.tweens.killAll();
    this.children.removeAll(true);
    this.remotes.clear();
    this.npcs = undefined;
    this.map = map;
    this.seated = false;
    new MapLoader(this, this.reduced).build(map);
    this.marker = this.add.ellipse(p.x, p.y - 5, 65, 23).setStrokeStyle(2, 0xffd452, 0.9);
    this.player = new PlayerController(
      this,
      p.x,
      p.y,
      this.profile,
      `${this.profile.nickname} · BẠN`,
      'hero',
    );
    this.crowd =
      map === 'united' || map === 'hall-of-legends'
        ? undefined
        : new NpcController(this, map, true);
    if (!this.online || map === 'united' || map === 'hall-of-legends')
      this.npcs = new NpcController(this, map);
    const camera = this.cameras.main;
    const size = mapSize(map);
    camera.setBounds(0, 0, size.width, size.height);
    camera.startFollow(
      this.player.container,
      true,
      0.09,
      0.09,
      0,
      map === 'hall-of-legends' ? 300 : map === 'united' ? 515 : ART.camera.lookAhead,
    );
    this.resize();
    emit('map-changed', map);
  }
  sync(e: RemoteEvent) {
    this.self = e.self;
    const present = new Set<string>();
    for (const p of e.players) {
      if (p.id === e.self || p.map !== this.map) continue;
      present.add(p.id);
      let remote = this.remotes.get(p.id);
      if (!remote) {
        remote = { actor: new PlayerController(this, p.x, p.y, p), target: p };
        this.remotes.set(p.id, remote);
      }
      remote.target = p;
    }
    for (const [id, r] of this.remotes)
      if (!present.has(id)) {
        r.actor.destroy();
        this.remotes.delete(id);
      }
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    const dt = Math.min(delta / 1000, 0.1);
    let dx = 0,
      dy = 0;
    if (this.enabled && !this.blocked) {
      dx =
        +this.keys.D.isDown +
        +this.keys.RIGHT.isDown -
        (+this.keys.A.isDown + +this.keys.LEFT.isDown) +
        this.joystick.x;
      dy =
        +this.keys.S.isDown +
        +this.keys.DOWN.isDown -
        (+this.keys.W.isDown + +this.keys.UP.isDown) +
        this.joystick.y;
    }
    if (this.seated && (dx || dy)) {
      this.seated = false;
      emit('stand');
    }
    this.player.update(this.map, this.seated ? 0 : dx, this.seated ? 0 : dy, dt);
    this.player.sit(this.seated);

    this.marker
      ?.setPosition(this.player.container.x, this.player.container.y - 4)
      .setDepth(this.player.container.y - 1);
    this.npcs?.update(this.map, dt, time);
    this.crowd?.update(this.map, dt, time);
    for (const r of this.remotes.values()) {
      const { actor, target } = r;
      actor.container.x = Phaser.Math.Linear(actor.container.x, target.x, Math.min(1, dt * 12));
      actor.container.y = Phaser.Math.Linear(actor.container.y, target.y, Math.min(1, dt * 12));
      actor.container.setDepth(actor.container.y);
      actor.animate(target.direction, target.moving, time / 1000);
      actor.sit(!!target.seated);
    }
    if (time - this.lastSync > 65 && this.enabled) {
      emit('movement', {
        x: this.player.container.x,
        y: this.player.container.y,
        direction: this.player.direction,
        moving: this.player.moving,
      });
      this.lastSync = time;
    }
    if (time - this.lastState > 100) {
      if (this.map === 'hall-of-legends') this.resize();
      emit('state', {
        map: this.map,
        position: { x: this.player.container.x, y: this.player.container.y },
        near: near(this.map, this.player.container),
        seated: this.seated,
        fps: Math.round(this.game.loop.actualFps),
        direction: this.player.direction,
      });
      this.lastState = time;
    }
  }
  effect(kind: string) {
    const now = this.time.now;
    if (now - this.lastEffect < 3000) {
      emit('notice', 'Đợi hiệu ứng trước kết thúc nhé.');
      return;
    }
    this.lastEffect = now;
    const { x, y } = this.player.container;
    if (kind === 'banner') {
      this.player.say('Hẹn mùa sau nhé! 😂');
      return;
    }
    if (kind === 'speaker') {
      this.player.say('Phong độ là nhất thời 😎');
      return;
    }
    for (let i = 0; i < (this.reduced ? 12 : 40); i++) {
      const tomato = kind === 'tomato';
      const p = tomato
        ? this.add.text(x - 250 + Math.random() * 500, y - 450 - Math.random() * 180, '🍅', {
            fontSize: '25px',
          })
        : this.add.rectangle(
            x - 270 + Math.random() * 540,
            y - 400 - Math.random() * 200,
            5 + Math.random() * 5,
            9,
            [0xdf866b, 0xe5d78d, 0xb4cf83, 0x8dbdb6, 0xd399bd][i % 5],
          );
      p.setDepth(5000);
      this.tweens.add({
        targets: p,
        y: y + 50 + Math.random() * 120,
        x: p.x + Math.random() * 100 - 50,
        angle: 360,
        alpha: 0,
        duration: 1500 + Math.random() * 1200,
        delay: i * 25,
        onComplete: () => p.destroy(),
      });
    }
    this.player.say(
      kind === 'tomato' ? 'Cà chua hữu cơ, cà khịa vô tư! 🍅' : 'Bóng đá là để vui! 🎉',
    );
  }
}

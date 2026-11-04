import Phaser from 'phaser';
export function halo(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  width: number,
  height = width,
  depth = y - 1,
  alpha = 0.7,
) {
  return scene.add
    .image(x, y, 'glow')
    .setTint(color)
    .setDisplaySize(width, height)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}
export function motes(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  count = 8,
  spread = 75,
  depth = y + 1,
) {
  for (let i = 0; i < count; i++) {
    const p = scene.add
      .circle(
        x + (Math.random() - 0.5) * spread,
        y - Math.random() * 70,
        1 + Math.random() * 2,
        color,
        0.9,
      )
      .setDepth(depth);
    scene.tweens.add({
      targets: p,
      x: p.x + (Math.random() - 0.5) * 40,
      y: p.y - 70,
      alpha: 0,
      duration: 1600 + Math.random() * 2300,
      delay: Math.random() * 2000,
      repeat: -1,
    });
  }
}

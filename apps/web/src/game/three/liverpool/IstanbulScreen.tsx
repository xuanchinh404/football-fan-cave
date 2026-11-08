import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

export function IstanbulScreen() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    const sky = ctx.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, '#150c29');
    sky.addColorStop(0.6, '#78283c');
    sky.addColorStop(1, '#180d20');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 480);
    // Original graphic of a floodlit stadium at night.
    ctx.fillStyle = '#1b1124';
    ctx.beginPath();
    ctx.ellipse(512, 364, 552, 160, 0, Math.PI, 2 * Math.PI);
    ctx.lineTo(1064, 480);
    ctx.lineTo(-40, 480);
    ctx.fill();
    for (let i = 0; i < 490; i++) {
      const x = (i * 127.3) % 1024;
      const y = 285 + ((i * 69.57) % 210);
      if (y < 225 + (x - 512) ** 2 / 3100) continue;
      ctx.fillStyle = ['#f89c61', '#cf494b', '#6b4b72', '#e2c494'][i % 4];
      ctx.globalAlpha = 0.27 + (i % 8) * 0.07;
      ctx.fillRect(x, y, 1.5 + (i % 3), 1.5 + ((i * 3) % 5));
    }
    ctx.globalAlpha = 1;
    for (const x of [90, 934]) {
      const halo = ctx.createRadialGradient(x, 113, 2, x, 113, 91);
      halo.addColorStop(0, '#fff3b9c5');
      halo.addColorStop(1, '#ffa57100');
      ctx.fillStyle = halo;
      ctx.fillRect(x - 91, 22, 182, 182);
      ctx.fillStyle = '#e0ae85';
      ctx.fillRect(x - 3, 114, 6, 116);
      ctx.fillStyle = '#fff2c6';
      ctx.fillRect(x - 23, 103, 46, 17);
    }
    ctx.fillStyle = '#130d1bd9';
    ctx.fillRect(153, 104, 718, 243);
    ctx.strokeStyle = '#d8a059';
    ctx.lineWidth = 3;
    ctx.strokeRect(153, 104, 718, 243);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe6a4';
    ctx.font = 'bold 55px Georgia';
    ctx.fillText('ĐÊM ISTANBUL 2005', 512, 55);
    ctx.font = 'bold 28px Arial';
    ctx.fillText('LIVERPOOL FC', 291, 173);
    ctx.fillText('AC MILAN', 734, 173);
    ctx.font = 'bold 100px Arial';
    ctx.fillText('3 : 3', 512, 200);
    ctx.fillStyle = '#f2ceac';
    ctx.font = 'bold 27px Arial';
    ctx.fillText('HIỆP MỘT 0–3   •   LUÂN LƯU 3–2', 512, 281);
    ctx.font = '22px Arial';
    ctx.fillText('25.05.2005  /  CHUNG KẾT UEFA CHAMPIONS LEAGUE', 512, 321);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 3.48, -0.64]}>
      <planeGeometry args={[5.12, 2.4]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

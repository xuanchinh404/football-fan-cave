import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { PlayerAvatar3D, avatarClips, avatarFaces } from './PlayerAvatar3D';

export default function AnimationTest() {
  const [preview, setPreview] = useState<{ name: string; sequence: number }>({
    name: 'Idle',
    sequence: 0,
  });
  const [face, setFace] = useState('');
  const [angle, setAngle] = useState(25);
  const [close, setClose] = useState(false);
  return (
    <main style={{ maxWidth: 1050, margin: 'auto', padding: 16, color: '#f6efd8' }}>
      <h1>Animation Test · Chibi số 7</h1>
      <div role="group" aria-label="Animation clips">
        {avatarClips.map((name) => (
          <button
            key={name}
            aria-pressed={preview.name === name}
            onClick={() => {
              setFace('');
              setPreview((old) => ({ name, sequence: old.sequence + 1 }));
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Biểu cảm khuôn mặt">
        {['', ...avatarFaces].map((name) => (
          <button key={name} aria-pressed={face === name} onClick={() => setFace(name)}>
            {name || 'Tự động'}
          </button>
        ))}
      </div>
      <label>
        Góc nhìn
        <input
          type="range"
          min={-180}
          max={180}
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </label>
      <button aria-pressed={close} onClick={() => setClose((value) => !value)}>
        Cận mặt
      </button>
      <div style={{ height: 'min(65vh, 680px)', minHeight: 340 }}>
        <Canvas
          key={String(close)}
          shadows
          dpr={[1, 1.5]}
          camera={
            close ? { position: [0, 1.62, 1.15], fov: 32 } : { position: [0, 1.45, 4.4], fov: 36 }
          }
          onCreated={({ camera }) => camera.lookAt(0, close ? 1.59 : 0.95, 0)}
        >
          <color attach="background" args={['#1e2841']} />
          <hemisphereLight args={['#fff6eb', '#8897bf', 2]} />
          <directionalLight position={[3, 5, 4]} intensity={2.5} castShadow />
          <group rotation-y={(angle * Math.PI) / 180}>
            <PlayerAvatar3D motion="Idle" preview={preview} face={face} fallback={null} />
          </group>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color="#53627d" />
          </mesh>
        </Canvas>
      </div>
    </main>
  );
}

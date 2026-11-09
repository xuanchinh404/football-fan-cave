import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { product, type Product } from '../../../../packages/shared/store/catalog';
import { roomSize, type Placement } from '../../../../packages/shared/store/state';
import { Character } from '../game/three/Models';
import { Burst } from './StoreWorldEffects';
import { Block, Ring, StoreModel } from './StoreModel';

function Turntable({
  item,
  teamColor,
  tryOn,
}: {
  item: Product;
  teamColor?: string;
  tryOn: boolean;
}) {
  const ref = useRef<Group>(null);
  const loadout = useMemo(
    () => (item.slot && item.action === 'equip' && tryOn ? { [item.slot]: item.id } : undefined),
    [item, tryOn],
  );
  const avatar = loadout || (item.action === 'emote' && tryOn);
  const at = useRef(performance.now());
  const burst = item.action === 'effect' && tryOn;
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.48;
  });
  return (
    <>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[1.02, 1.13, 0.18, 36]} />
        <meshStandardMaterial color="#362655" metalness={0.3} roughness={0.28} />
      </mesh>
      <Ring at={[0, 0.02, 0]} radius={0.94} color="#c177ff" rotation={[-Math.PI / 2, 0, 0]} />
      <group ref={ref} position={[0, avatar ? 0.02 : 0.8, 0]}>
        {burst ? (
          <Burst data={{ id: item.id, item, point: [0, 0, 0], at: at.current }} preview />
        ) : avatar ? (
          <Character
            name=""
            direction={0}
            gesture={item.clip}
            loadout={loadout}
            color={teamColor}
            hideTemplateCrest
          />
        ) : (
          <StoreModel item={item} size={1.45} asset />
        )}
      </group>
    </>
  );
}
export function StorePreview({
  item,
  teamColor,
  tryOn,
}: {
  item: Product;
  teamColor?: string;
  tryOn: boolean;
}) {
  return (
    <div className="store-preview" aria-hidden="true">
      <Canvas
        dpr={[1, 1.4]}
        camera={{ position: [2.5, 1.95, 3.9], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.84, 0)}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 4, 3]} intensity={2.15} color="#fff0d2" />
        <pointLight position={[-2, 2, -2]} intensity={18} color="#bc76ff" />
        <Turntable key={item.id} item={item} teamColor={teamColor} tryOn={tryOn} />
      </Canvas>
    </div>
  );
}
export function FurniturePreview({
  items,
  selected,
  draft,
  choose,
}: {
  items: Record<string, Placement>;
  selected?: Product;
  draft: Placement;
  choose: (x: number, z: number) => void;
}) {
  const furniture = Object.entries(items).filter(([id]) => id !== selected?.id);
  return (
    <div className="store-room-preview">
      <Canvas
        dpr={[1, 1.3]}
        camera={{ position: [7, 10, 10], fov: 45 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[2, 8, 5]} intensity={2} color="#ffe2ae" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => choose(e.point.x, e.point.z)}>
          <planeGeometry args={[roomSize.x * 2, roomSize.z * 2]} />
          <meshStandardMaterial color="#6b434b" />
        </mesh>
        <gridHelper
          args={[10, 10, '#b68177', '#89565e']}
          position={[0, 0.014, 0]}
          scale={[1, 1, 0.8]}
        />
        <Block at={[0, 1, -4]} size={[10, 2, 0.24]} color="#50375f" />
        <Block at={[-5, 0.75, 0]} size={[0.24, 1.5, 8]} color="#60436d" />
        <Block at={[0, 0.028, 3.24]} size={[1.8, 0.03, 1.47]} color="#ca9760" />
        {[...furniture, ...(selected ? [[selected.id, draft] as const] : [])].map(([id, p]) => {
          const item = product(id);
          if (!item) return null;
          const size = Math.min(1.85, p.radius * 1.44);
          const y = item.visual === 'rug' || item.visual === 'pitch' ? 0.03 : size * 0.46;
          return (
            <group key={id} position={[p.x, y, p.z]} rotation={[0, (p.turn * Math.PI) / 2, 0]}>
              <StoreModel item={item} size={size} asset />
              {selected?.id === id && (
                <Ring
                  at={[0, 0.037 - y, 0]}
                  radius={p.radius}
                  color="#d3b6ff"
                  rotation={[-Math.PI / 2, 0, 0]}
                />
              )}
            </group>
          );
        })}
      </Canvas>
    </div>
  );
}

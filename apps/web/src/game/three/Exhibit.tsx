import { useState, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { emit } from '../bridge';
export function Exhibit({
  id,
  children,
  highlight,
}: {
  id: string;
  children: ReactNode;
  highlight?: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <group
      name={`exhibit-${id}`}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        emit('inspect', id);
      }}
    >
      {children}
      {hover &&
        (highlight ?? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <ringGeometry args={[0.6, 0.68, 24]} />
            <meshBasicMaterial color="#ffe6a6" />
          </mesh>
        ))}
    </group>
  );
}

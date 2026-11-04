import { useRef, useState } from 'react';
import { emit } from '../game/bridge';
export function Joystick() {
  const ref = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const update = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    let x = (e.clientX - r.x - r.width / 2) / 36,
      y = (e.clientY - r.y - r.height / 2) / 36;
    const m = Math.max(1, Math.hypot(x, y));
    x /= m;
    y /= m;
    setPoint({ x: x * 28, y: y * 28 });
    emit('joystick', { x, y });
  };
  return (
    <div
      ref={ref}
      className="joystick"
      aria-label="Joystick di chuyển"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons) update(e);
      }}
      onPointerUp={() => {
        setPoint({ x: 0, y: 0 });
        emit('joystick', { x: 0, y: 0 });
      }}
      onLostPointerCapture={() => {
        setPoint({ x: 0, y: 0 });
        emit('joystick', { x: 0, y: 0 });
      }}
      onPointerCancel={() => {
        setPoint({ x: 0, y: 0 });
        emit('joystick', { x: 0, y: 0 });
      }}
    >
      <span>⌃</span>
      <i style={{ transform: `translate(${point.x}px,${point.y}px)` }} />
      <small>W A S D</small>
    </div>
  );
}

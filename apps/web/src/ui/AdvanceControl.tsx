import { Footprints, ChevronUp } from 'lucide-react';
import { emit } from '../game/bridge';
/** Same movement input as the joystick; no speed boost or client-only teleport. */
export function AdvanceControl({ enabled }: { enabled: boolean }) {
  const stop = () => {
    emit('joystick', { x: 0, y: 0 });
    emit('run', false);
  };
  return (
    <button
      className="advance-control"
      disabled={!enabled}
      aria-label="Giữ để chạy"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        emit('joystick', { x: 0, y: -1 });
        emit('run', true);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      <Footprints />
      <span>CHẠY</span>
      <ChevronUp />
    </button>
  );
}

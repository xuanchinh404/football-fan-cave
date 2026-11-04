import { Component, Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { World3D } from './three/World3D';
import './three/playtest.css';

class GameErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="three-error" role="alert">
        Không thể mở thế giới 3D. Hãy bật WebGL 2 / tăng tốc đồ họa rồi tải lại trang.
        <button onClick={() => location.reload()}>Thử lại</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function GameCanvas() {
  return (
    <div className="game-canvas three-canvas" aria-label="Thế giới 3D Hội Vào Hang">
      <GameErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 1.25]}
          camera={{ fov: 60, near: 0.08, far: 320, position: [0, 4, 8] }}
          gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
          fallback={
            <div className="three-error">Trình duyệt cần hỗ trợ WebGL 2 để chơi bản 3D.</div>
          }
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -22, 0]} timeStep={1 / 60} interpolate>
              <World3D />
            </Physics>
          </Suspense>
        </Canvas>
      </GameErrorBoundary>
      <div className="three-controls">
        <b>3D PLAYTEST</b>
        <span>WASD / Joystick · Kéo / vuốt để xoay 360° · Cuộn để zoom · R đặt lại camera</span>
      </div>
    </div>
  );
}

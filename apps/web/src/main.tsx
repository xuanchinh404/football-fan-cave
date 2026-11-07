import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import AuthGateway from './auth/AuthGateway';
import { useAuth } from './auth/useAuth';
import './styles.css';
const Playtest = lazy(() => import('./App'));
const AnimationTest = import.meta.env.DEV ? lazy(() => import('./game/three/AnimationTest')) : null;
function PlaytestGateway() {
  // Reuse the existing session lifecycle; verified Socket.IO auth is never bypassed.
  const auth = useAuth();
  if (auth.loading) return <p>Đang khôi phục phiên…</p>;
  return (
    <Suspense fallback={<p>Đang mở Đại Sảnh 3D…</p>}>
      <Playtest
        accountProfile={{ nickname: 'Fan khám phá', team: 'united', avatar: 0 }}
        isGuest={auth.session?.user.is_anonymous !== false}
      />
    </Suspense>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  AnimationTest && window.location.pathname === '/animation-test' ? (
    <Suspense fallback={<p>Đang tải animation…</p>}>
      <AnimationTest />
    </Suspense>
  ) : window.location.pathname === '/playtest' ? (
    <PlaytestGateway />
  ) : (
    <AuthGateway />
  ),
);

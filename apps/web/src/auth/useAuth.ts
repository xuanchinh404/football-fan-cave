import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { socket } from '../network/client';
import { errorMessage } from './authService';
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(window.location.pathname === '/auth/reset-password');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let changed = false;
    const apply = (next: Session | null) => {
      socket.auth = { accessToken: next?.access_token };
      if (socket.connected) socket.emit('auth:refresh', { accessToken: next?.access_token });
      setSession(next);
      setLoading(false);
    };
    const recover = () => {
      void supabase!.auth.refreshSession().then(({ error }) => {
        if (!error) socket.connect();
        else setError(errorMessage(error));
      });
    };
    socket.on('auth:expired', recover);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      changed = true;
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      apply(next);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errorMessage(error));
        if (!changed) apply(data.session);
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
      socket.off('auth:expired', recover);
    };
  }, []);
  return { session, loading, error, recovery, setRecovery };
}

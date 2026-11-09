import { useEffect, useState } from 'react';
import type { BarcaMatch } from '../../../../../../packages/shared/barcelona/match';

export function useBarcaMatch() {
  const [match, setMatch] = useState<BarcaMatch | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SERVER_URL || ''}/api/barcelona/result`,
          { signal: controller.signal },
        );
        const result = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setMatch(result);
      } catch {
        if (!controller.signal.aborted) setMatch(null);
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 10 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);
  return match;
}

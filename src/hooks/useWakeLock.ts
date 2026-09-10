/**
 * FLIPLY — useWakeLock Hook
 * Keeps display awake during clock presentation
 */

import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Electron Desktop Mode
    if (typeof window !== 'undefined' && window.electronAPI?.setWakeLock) {
      window.electronAPI.setWakeLock(enabled).catch(() => {});
      return;
    }

    // Web Browser Screen Wake Lock API
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && !wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch {
        // Wake lock request failed or rejected by browser policy
      }
    };

    requestLock();

    // Re-acquire lock if tab was hidden and becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isMounted) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}

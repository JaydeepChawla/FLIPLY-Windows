/**
 * FLIPLY — useMouseActivity Hook
 * Manages control visibility timeout and screensaver interaction
 */

import { useEffect, useRef, useState } from 'react';

export function useMouseActivity(
  timeoutMs = 3000,
  onActivityInScreenSaver?: () => void,
  isScreenSaver = false
) {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef<number | NodeJS.Timeout | null>(null);
  const initialPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      setIsInactive(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsInactive(true);
      }, timeoutMs);
    };

    const handlePointerMove = (e: MouseEvent) => {
      // For screensaver: slight table vibrations shouldn't immediately exit,
      // but purposeful mouse movement (> 6px distance) or click exits.
      if (isScreenSaver && onActivityInScreenSaver) {
        if (!initialPosRef.current) {
          initialPosRef.current = { x: e.clientX, y: e.clientY };
        } else {
          const dx = Math.abs(e.clientX - initialPosRef.current.x);
          const dy = Math.abs(e.clientY - initialPosRef.current.y);
          if (dx > 6 || dy > 6) {
            onActivityInScreenSaver();
          }
        }
      }
      resetTimer();
    };

    const handleAction = () => {
      if (isScreenSaver && onActivityInScreenSaver) {
        onActivityInScreenSaver();
      }
      resetTimer();
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handleAction);
    window.addEventListener('keydown', handleAction);
    window.addEventListener('touchstart', handleAction);

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handleAction);
      window.removeEventListener('keydown', handleAction);
      window.removeEventListener('touchstart', handleAction);
    };
  }, [timeoutMs, onActivityInScreenSaver, isScreenSaver]);

  return { isInactive };
}

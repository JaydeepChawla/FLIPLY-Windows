/**
 * FLIPLY — useClock Hook
 * Updates time strictly synchronized to second boundary without drift
 */

import { useEffect, useState } from 'react';
import { ClockFormat, ClockTime } from '../types';
import { getClockTime } from '../utils/clockUtils';

export function useClock(format: ClockFormat): ClockTime {
  const [time, setTime] = useState<ClockTime>(() => getClockTime(new Date(), format));

  useEffect(() => {
    let timeoutId: number | NodeJS.Timeout;
    let isMounted = true;

    // Immediately update with current format
    setTime(getClockTime(new Date(), format));

    function tick() {
      if (!isMounted) return;
      const now = new Date();
      setTime(getClockTime(now, format));

      // Calculate exact delay to next full second to prevent time drift
      const msUntilNextSecond = 1000 - (now.getTime() % 1000);
      timeoutId = setTimeout(tick, msUntilNextSecond);
    }

    // Initial sync
    const initialDelay = 1000 - (Date.now() % 1000);
    timeoutId = setTimeout(tick, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [format]);

  return time;
}

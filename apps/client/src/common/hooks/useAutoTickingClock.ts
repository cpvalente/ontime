import { useEffect, useRef, useState } from 'react';

import { useRuntimeStore } from '../stores/runtime';

const takeOverTimeMs = 1500;

/**
 * Keeps the clock value ticking if the server drops updates
 */
export function useAutoTickingClock(): number {
  const clock = useRuntimeStore((state) => state.clock);

  const baselineRef = useRef({ clock, time: performance.now() });
  const [, setTick] = useState(0);

  // Update baseline when server clock changes
  useEffect(() => {
    baselineRef.current = { clock, time: performance.now() };
  }, [clock]);

  // Force periodic re-renders
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Always derive from baseline + elapsed at render time
  const elapsed = performance.now() - baselineRef.current.time;
  if (elapsed < takeOverTimeMs) {
    return clock;
  }
  return baselineRef.current.clock + Math.round(elapsed);
}

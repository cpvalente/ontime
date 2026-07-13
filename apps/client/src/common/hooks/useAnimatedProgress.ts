import { MaybeNumber, Playback } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';

import { getProgress } from '../utils/getProgress';
import { usePlayback } from './useSocket';

/**
 * Returns the live completion percentage (0–100) of a countdown, interpolated locally.
 */
export function useAnimatedProgress(current: MaybeNumber, duration: MaybeNumber): number {
  const playback = usePlayback();
  const isRunning = playback === Playback.Play || playback === Playback.Roll;

  const baseline = useRef({ current, at: performance.now() });
  const [, setTick] = useState(0);

  // there is only something to animate while a running timer is counting down towards 0
  const shouldAnimate = isRunning && current !== null && current > 0 && duration !== null;

  // re-anchor to the authoritative value whenever the server pushes a new timer update
  useEffect(() => {
    baseline.current = { current, at: performance.now() };
  }, [current, duration, playback]);

  // while counting down, re-render every animation frame so the derived progress stays smooth
  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    let frame = requestAnimationFrame(function tick() {
      setTick((value) => value + 1);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate]);

  // derive from the anchor plus elapsed time at render; frozen to the anchor when not running
  const anchored = baseline.current.current;
  const value = isRunning && anchored !== null ? anchored - (performance.now() - baseline.current.at) : anchored;
  return getProgress(value, duration);
}

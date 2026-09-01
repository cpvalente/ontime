import { EntryId, MaybeNumber, Playback } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';

import { getProgress } from '../utils/getProgress';
import { useIsOnline, usePlayback } from './useSocket';

/**
 * Returns the live completion percentage (0–100) of a countdown, interpolated locally.
 */
export function useAnimatedProgress(current: MaybeNumber, duration: MaybeNumber, eventId?: EntryId | null): number {
  const playback = usePlayback();
  const isOnline = useIsOnline();
  const isRunning = playback === Playback.Play || playback === Playback.Roll;

  const baseline = useRef({ current, duration, eventId, playback, at: performance.now() });
  const [, setTick] = useState(0);
  const now = performance.now();

  const hasAuthoritativeUpdate =
    baseline.current.current !== current || // handle timer updates
    baseline.current.duration !== duration || // handle duration changes
    baseline.current.eventId !== eventId || // handle event changing
    baseline.current.playback !== playback; // handle playback changes

  if (hasAuthoritativeUpdate) {
    // Reset during render so an event change is reflected in this very paint.
    baseline.current = { current, duration, eventId, playback, at: now };
  }

  // There is only something to animate while a connected timer is counting down towards 0.
  const shouldAnimate = isOnline && isRunning && current !== null && current > 0 && duration !== null;

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

  // Derive from the anchor plus elapsed time at render; freeze while disconnected or not running.
  const anchored = baseline.current.current;
  const value = isOnline && isRunning && anchored !== null ? anchored - (now - baseline.current.at) : anchored;
  return getProgress(value, duration);
}

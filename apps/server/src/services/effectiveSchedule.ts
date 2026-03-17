import type { OntimeEvent } from 'ontime-types';
import { calculateEffectiveSchedule } from 'ontime-utils';

type TimedEventLike = Pick<OntimeEvent, 'id' | 'timeStart' | 'timeEnd' | 'dayOffset' | 'delay'>;

export type EffectiveEventOverlay = {
  delay: number;
  delayAtThisPoint: number;
  effectiveStart: number;
  effectiveEnd: number;
};

export function getEffectiveEventOverlays(
  timedEvents: TimedEventLike[],
  activeIndex: number | null,
  globalDelay: number,
): Map<string, EffectiveEventOverlay> {
  const effectiveSchedule = calculateEffectiveSchedule(
    timedEvents.map((event) => ({
      timeStart: event.timeStart,
      timeEnd: event.timeEnd,
      dayOffset: event.dayOffset,
      baseDelay: event.delay ?? 0,
    })),
    activeIndex,
    globalDelay,
  );

  return new Map(
    timedEvents.map((event, index) => [
      event.id,
      {
        delay: (event.delay ?? 0) + effectiveSchedule[index].delayAtThisPoint,
        delayAtThisPoint: effectiveSchedule[index].delayAtThisPoint,
        effectiveStart: effectiveSchedule[index].effectiveStart,
        effectiveEnd: effectiveSchedule[index].effectiveEnd,
      },
    ]),
  );
}

export function getEffectiveEventOverlayAtIndex(
  timedEvents: TimedEventLike[],
  activeIndex: number | null,
  globalDelay: number,
  targetIndex: number | null,
): EffectiveEventOverlay | null {
  if (targetIndex === null || targetIndex < 0 || targetIndex >= timedEvents.length) {
    return null;
  }

  return getEffectiveEventOverlays(timedEvents, activeIndex, globalDelay).get(timedEvents[targetIndex].id) ?? null;
}

export function applyEffectiveOverlay<T extends OntimeEvent | null>(event: T, overlays: Map<string, EffectiveEventOverlay>): T {
  if (!event) {
    return event;
  }

  const overlay = overlays.get(event.id);
  if (!overlay) {
    return event;
  }

  return {
    ...event,
    delay: overlay.delay,
  } as T;
}

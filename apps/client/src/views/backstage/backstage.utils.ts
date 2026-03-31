import { MaybeNumber, OntimeEvent, Playback, SupportedEvent, TimerPhase } from 'ontime-types';

import { enDash } from '../../common/utils/styleUtils';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';

/**
 * Whether the current time is in overtime
 */
export function isOvertime(current: MaybeNumber): boolean {
  return (current ?? 0) < 0;
}

/**
 * Whether the progress bar should be shown
 */
export function getShowProgressBar(playback: Playback): boolean {
  return playback !== Playback.Stop;
}

/**
 * Whether the playback is pending start (ie: Roll mode waiting to start)
 */
export function getIsPendingStart(playback: Playback, phase: TimerPhase): boolean {
  return playback === Playback.Roll && phase === TimerPhase.Pending;
}

/**
 * What should we be showing in the cards?
 */
export function getCardData(
  eventNow: OntimeEvent | null,
  eventNext: OntimeEvent | null,
  mainSource: keyof OntimeEvent | null,
  secondarySource: keyof OntimeEvent | null,
  playback: Playback,
) {
  if (playback === Playback.Stop) {
    return {
      showNow: false,
      nowMain: undefined,
      nowSecondary: undefined,
      showNext: false,
      nextMain: undefined,
      nextSecondary: undefined,
    };
  }

  // if we are loaded, we show the upcoming event as next
  const nowMain = getPropertyValue(eventNow, mainSource ?? 'title') || enDash;
  const nowSecondary = getPropertyValue(eventNow, secondarySource);
  const nextMain = getPropertyValue(eventNext, mainSource ?? 'title') || enDash;
  const nextSecondary = getPropertyValue(eventNext, secondarySource);

  return {
    showNow: eventNow !== null,
    nowMain,
    nowSecondary,
    showNext: eventNext !== null,
    nextMain,
    nextSecondary,
  };
}

/**
 * Find the event that comes after eventNext in the rundown
 */
export function getFollowedByEvent(
  backstageEvents: OntimeEvent[],
  eventNext: OntimeEvent | null,
): OntimeEvent | null {
  if (!eventNext) return null;

  const nextIndex = backstageEvents.findIndex((e) => e.id === eventNext.id);
  if (nextIndex === -1) return null;

  // find the next non-skipped event after eventNext
  for (let i = nextIndex + 1; i < backstageEvents.length; i++) {
    const event = backstageEvents[i];
    if (event.type === SupportedEvent.Event && !event.skip) {
      return event;
    }
  }
  return null;
}

/**
 * Converts remaining timer millis (plus optional extra duration) to a rounded minute string
 * Returns null if timer is not running
 */
export function getTimeToMinutes(current: MaybeNumber, extraDuration?: number): string | null {
  if (current == null) return null;
  const totalMs = Math.abs(current) + (extraDuration ?? 0);
  const minutes = Math.ceil(totalMs / 60000);
  return String(minutes);
}

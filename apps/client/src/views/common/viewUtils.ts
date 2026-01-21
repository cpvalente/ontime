import {
  MaybeNumber,
  MaybeString,
  OntimeEvent,
  OntimeGroup,
  RundownEntries,
  TimerState,
  TimerType,
} from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND, millisToString, removeLeadingZero, removeSeconds } from 'ontime-utils';

import { timerPlaceholder, timerPlaceholderMin } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';

/**
 * Gathers all options that affect which timer is displayed and selects the correct data source to display
 * it also handles edge cases such as freezing on end
 */
export function getTimerByType(
  freezeEnd: boolean,
  timerTypeNow: TimerType,
  clock: number,
  timerObject: Pick<TimerState, 'current' | 'elapsed'>,
  timerTypeOverride?: TimerType,
): number | null {
  if (!timerObject) {
    return null;
  }

  const viewTimerType = timerTypeOverride ?? timerTypeNow;

  switch (viewTimerType) {
    case TimerType.CountDown:
      if (timerObject.current === null) {
        return null;
      }
      return freezeEnd ? Math.max(timerObject.current, 0) : timerObject.current;
    case TimerType.CountUp:
      return timerObject.elapsed;
    case TimerType.Clock:
      return clock;
    case TimerType.None:
      return null;
    default: {
      viewTimerType satisfies never;
      return null;
    }
  }
}

/**
 * Parses a string to semantically verify if it represents a true value
 * Used in the context of parsing search params and local storage items which can be strings or null
 */
export function isStringBoolean(text: string | null) {
  if (text === null) {
    return false;
  }
  return text?.toLowerCase() === 'true' || text === '1';
}

/**
 * Prepares a colour string for use in views
 * Colours in params do not have the #prefix
 */
export function makeColourString(hex: string | null): string | undefined {
  if (!hex) {
    return undefined;
  }
  // ensure the hex starts with a #
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/**
 * Retrieves a dynamic property from an event
 * Considers custom fields
 * if rundown entries are provided it can also find the parent title
 */
export function getPropertyValue(
  event: OntimeEvent | null,
  property: MaybeString,
  entries?: RundownEntries,
): string | undefined {
  if (!event || typeof property !== 'string' || property === 'none') {
    return undefined;
  }

  if (property === 'parent') {
    if (!entries || !event.parent) return undefined;
    return (entries[event.parent] as OntimeGroup)?.title;
  }

  if (property.startsWith('custom-')) {
    const field = property.split('custom-')[1];
    return event.custom?.[field];
  }

  return event[property as keyof OntimeEvent] as string;
}

type FormattingOptions = {
  removeSeconds: boolean;
  removeLeadingZero: boolean;
};

export function getFormattedTimer(
  timer: MaybeNumber,
  timerType: TimerType,
  localisedMinutes: string,
  options: FormattingOptions,
): string {
  if (timer == null || timerType === TimerType.None) {
    return options.removeSeconds ? timerPlaceholderMin : timerPlaceholder;
  }

  if (timerType === TimerType.Clock) {
    return formatTime(timer);
  }

  let timeToParse = timer;
  if (options.removeSeconds) {
    const isNegative = timeToParse < -MILLIS_PER_SECOND && timerType !== TimerType.CountUp;
    if (isNegative) {
      // in negative numbers, we need to round down
      timeToParse -= MILLIS_PER_MINUTE;
    }
  }

  let display = millisToString(timeToParse, { direction: timerType });
  if (options.removeLeadingZero) {
    display = removeLeadingZero(display);
  }

  if (options.removeSeconds) {
    display = formatDisplayWithMinutes(display, localisedMinutes);
  }
  return display;
}

function formatDisplayWithMinutes(display: string, localisedMinutes: string): string {
  display = removeSeconds(display);
  return display.length < 3 ? `${display} ${localisedMinutes}` : display;
}

import { MaybeNumber, MaybeString, OntimeEvent, TimerType } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND, millisToString, removeLeadingZero, removeSeconds } from 'ontime-utils';

import type { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { timerPlaceholder, timerPlaceholderMin } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';

type TimerTypeParams = Pick<ViewExtendedTimer, 'isTimeToEnd' | 'timerType' | 'current' | 'elapsed' | 'clock'>;

export function getTimerByType(freezeEnd: boolean, timerObject?: TimerTypeParams): number | null {
  if (!timerObject) {
    return null;
  }

  if (timerObject.isTimeToEnd) {
    if (timerObject.current === null) {
      return null;
    }
    return freezeEnd ? Math.max(timerObject.current, 0) : timerObject.current;
  }

  switch (timerObject.timerType) {
    case TimerType.CountDown:
      if (timerObject.current === null) {
        return null;
      }
      return freezeEnd ? Math.max(timerObject.current, 0) : timerObject.current;
    case TimerType.CountUp:
      return Math.abs(timerObject.elapsed ?? 0);
    case TimerType.Clock:
      return timerObject.clock;
    case TimerType.None:
      return null;
    default: {
      const exhaustiveCheck: never = timerObject.timerType;
      return exhaustiveCheck;
    }
  }
}

export function isStringBoolean(text: string | null) {
  if (text === null) {
    return false;
  }
  return text?.toLowerCase() === 'true' || text === '1';
}

/**
 * Retrieves a dynamic property from an event
 * Considers custom fields
 */
export function getPropertyValue(event: OntimeEvent | null, property: MaybeString): string | undefined {
  if (!event || typeof property !== 'string' || property === 'none') {
    return undefined;
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
  if (timer == null) {
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

  let display = millisToString(timeToParse);
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

import { MaybeNumber, MaybeString, OntimeEvent, Playback, TimerPhase, TimerType } from 'ontime-types';
import { dayInMs } from 'ontime-utils';
import { RuntimeState } from '../stores/runtimeState.js';

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + dayInMs : end);

/**
 * Calculates expected finish time of a running timer
 * @param {RuntimeState} state runtime state
 * @returns {number | null} new current time or null if nothing is running
 */
export function getExpectedFinish(state: RuntimeState): MaybeNumber {
  const { startedAt, finishedAt, duration, addedTime } = state.timer;

  if (state.eventNow === null) {
    return null;
  }

  const { timerType, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { clock } = state;

  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  const pausedTime = pausedAt != null ? clock - pausedAt : 0;

  if (timerType === TimerType.TimeToEnd) {
    return timeEnd + addedTime + pausedTime;
  }

  // handle events that finish the day after
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if ther eis a timer
  const expectedFinish = startedAt + duration! + addedTime + pausedTime;
  if (expectedFinish > dayInMs) {
    return expectedFinish - dayInMs;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, startedAt);
}

/**
 * Calculates running countdown
 * @param {RuntimeState} state runtime state
 * @returns {number} current time for timer
 */

export function getCurrent(state: RuntimeState): number {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null || state.timer.duration === null) {
      throw new Error('timerUtils.getCurrent: invalid state received');
    }
  }
  const { startedAt, duration, addedTime } = state.timer;
  const { timerType, timeStart, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { clock } = state;

  if (timerType === TimerType.TimeToEnd) {
    const isEventOverMidnight = timeStart > timeEnd;
    const correctDay = isEventOverMidnight ? dayInMs : 0;
    return correctDay - clock + timeEnd + addedTime;
  }

  if (startedAt === null) {
    return duration;
  }

  if (pausedAt != null) {
    return startedAt + duration + addedTime - pausedAt;
  }

  const hasPassedMidnight = startedAt > clock;
  const correctDay = hasPassedMidnight ? dayInMs : 0;
  return startedAt + duration + addedTime - clock - correctDay;
}

/**
 * Checks whether we have skipped out of the event
 * @param {RuntimeState} state runtime state
 * @param {number} previousTime previous clock
 * @param {number} skipLimit how much time can we skip
 * @returns {boolean}
 */
export function skippedOutOfEvent(state: RuntimeState, previousTime: number, skipLimit: number): boolean {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.timer.expectedFinish === null || state.timer.startedAt === null) {
      throw new Error('timerUtils.skippedOutOfEvent: invalid state received');
    }
  }
  const { startedAt, expectedFinish } = state.timer;
  const { clock } = state;

  const hasPassedMidnight = previousTime > dayInMs - skipLimit && clock < skipLimit;
  const adjustedClock = hasPassedMidnight ? clock + dayInMs : clock;

  const timeDifference = previousTime - adjustedClock;
  const hasSkipped = Math.abs(timeDifference) > skipLimit;
  const adjustedExpectedFinish = expectedFinish >= startedAt ? expectedFinish : expectedFinish + dayInMs;

  return hasSkipped && (adjustedClock > adjustedExpectedFinish || adjustedClock < startedAt);
}

type RollTimers = {
  nowIndex: MaybeNumber;
  nowId: MaybeString;
  publicIndex: MaybeNumber;
  nextIndex: MaybeNumber;
  publicNextIndex: MaybeNumber;
  timeToNext: MaybeNumber;
  nextEvent: OntimeEvent | null;
  nextPublicEvent: OntimeEvent | null;
  currentEvent: OntimeEvent | null;
  currentPublicEvent: OntimeEvent | null;
};

/**
 * Finds loading information given a current rundown and time
 * @param {OntimeEvent[]} playableEvents - List of playable events
 * @param {number} timeNow - time now in ms
 */
export const getRollTimers = (
  playableEvents: OntimeEvent[],
  timeNow: number,
  currentIndex?: number | null,
): RollTimers => {
  let nowIndex: MaybeNumber = null; // index of event now
  let nowId: MaybeString = null; // id of event now
  let publicIndex: MaybeNumber = null; // index of public event now
  let nextIndex: MaybeNumber = null; // index of next event
  let publicNextIndex: MaybeNumber = null; // index of next public event
  let timeToNext: MaybeNumber = null; // counter: time for next event
  let publicTimeToNext: MaybeNumber = null; // counter: time for next public event

  const hasLoaded = currentIndex !== null;
  const canFilter = hasLoaded && currentIndex === playableEvents.length - 1;
  const filteredRundown = canFilter ? playableEvents.slice(currentIndex) : playableEvents;

  const lastEvent = filteredRundown.at(-1);
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);

  let nextEvent: OntimeEvent | null = null;
  let nextPublicEvent: OntimeEvent | null = null;
  let currentEvent: OntimeEvent | null = null;
  let currentPublicEvent: OntimeEvent | null = null;

  if (timeNow > lastNormalEnd) {
    // we are past last end
    // preload first and find next

    const firstEvent = filteredRundown.at(0);
    nextIndex = 0;
    nextEvent = firstEvent;
    timeToNext = firstEvent.timeStart + dayInMs - timeNow;

    if (firstEvent.isPublic) {
      nextPublicEvent = firstEvent;
      publicNextIndex = 0;
    } else {
      // look for next public
      // dev note: we feel that this is more efficient than filtering
      // since the next event will likely be close to the one playing
      for (const event of filteredRundown) {
        if (event.isPublic) {
          nextPublicEvent = event;
          // we need the index before this was sorted
          publicNextIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
          break;
        }
      }
    }
  } else {
    // flags: select first event if several overlapping
    let nowFound = false;
    // keep track of the end times when looking for public
    let publicTime = -1;

    for (const event of filteredRundown) {
      // When does the event end (handle midnight)
      const normalEnd = normaliseEndTime(event.timeStart, event.timeEnd);

      const hasNotEnded = normalEnd > timeNow;
      const isFromDayBefore = normalEnd > dayInMs && timeNow < event.timeEnd;
      const hasStarted = isFromDayBefore || timeNow >= event.timeStart;

      if (normalEnd <= timeNow) {
        // event ran already

        if (event.isPublic && normalEnd > publicTime) {
          // public event might not be the one running
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (hasNotEnded && hasStarted && !nowFound) {
        // event is running
        currentEvent = event;
        nowIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        nowId = event.id;
        nowFound = true;

        // it could also be public
        if (event.isPublic) {
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (normalEnd > timeNow) {
        // event will run

        // we already know whats next and next-public
        if (nextIndex !== null && publicNextIndex !== null) {
          continue;
        }

        // look for next events
        // check how far the start is from now
        const timeToEventStart = event.timeStart - timeNow;

        // we don't have a next or this one starts sooner than current next
        if (nextIndex === null || timeToEventStart < timeToNext) {
          timeToNext = timeToEventStart;
          nextEvent = event;
          nextIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }

        if (event.isPublic) {
          // if we don't have a public next or this one start sooner than assigned next
          if (publicNextIndex === null || timeToEventStart < publicTimeToNext) {
            publicTimeToNext = timeToEventStart;
            nextPublicEvent = event;
            publicNextIndex = filteredRundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
          }
        }
      }
    }
  }

  return {
    nowIndex,
    nowId,
    publicIndex,
    nextIndex,
    publicNextIndex,
    timeToNext,
    nextEvent,
    nextPublicEvent,
    currentEvent,
    currentPublicEvent,
  };
};

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is time ahead
 * Negative offset is time delayed
 */
export function getRuntimeOffset(state: RuntimeState): number {
  // nothing to calculate if there are no loaded events or if we havent started
  if (state.eventNow === null || state.runtime.actualStart === null) {
    return 0;
  }

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (state.timer.current === null) {
      throw new Error('timerUtils.calculate: current must be set');
    }
  }

  const { clock } = state;
  const { timeStart, timerType } = state.eventNow;
  const { addedTime, current, startedAt } = state.timer;

  // if we havent started, but the timer is armed
  // the offset is the difference to the schedule
  if (startedAt === null) {
    return timeStart - clock;
  }

  const overtime = Math.abs(Math.min(current, 0));
  // in time-to-end, offset is overtime
  if (timerType === TimerType.TimeToEnd) {
    return overtime;
  }

  const startOffset = timeStart - startedAt;
  const pausedTime = state._timer.pausedAt === null ? 0 : clock - state._timer.pausedAt;

  // startOffset - difference between scheduled start and actual start
  // addedTime - time added by user (negative offset)
  // pausedTime - time the playback was paused (negative offset)
  // overtime - how long the timer has been over-running (negative offset)
  return startOffset - addedTime - pausedTime - overtime;
}

/**
 * Calculates total duration of a time span
 * @param firstStart
 * @param lastEnd
 * @param daySpan
 * @returns
 */
export function getTotalDuration(firstStart: number, lastEnd: number, daySpan: number): number {
  if (!lastEnd) {
    return 0;
  }
  let correctDay = 0;
  if (lastEnd < firstStart) {
    correctDay = dayInMs;
    daySpan -= 1;
  }
  // eslint-disable-next-line prettier/prettier -- we like the clarity
  return lastEnd + correctDay + daySpan * dayInMs - firstStart;
}

/**
 * Calculates the expected end of the rundown
 */
export function getExpectedEnd(state: RuntimeState): MaybeNumber {
  // there is no expected end if we havent started
  if (state.runtime.actualStart === null || state.runtime.plannedEnd === null) {
    return null;
  }
  return state.runtime.plannedEnd - state.runtime.offset + state._timer.totalDelay;
}

/**
 * Utility checks whether the playback is considered to be active
 * @param state
 * @returns
 */
export function isPlaybackActive(state: RuntimeState): boolean {
  return (
    state.timer.playback === Playback.Play ||
    state.timer.playback === Playback.Pause ||
    state.timer.playback === Playback.Roll
  );
}

/**
 * Checks running timer to see which phase it currently is in
 * @param state
 */
export function getTimerPhase(state: RuntimeState): TimerPhase {
  if (!isPlaybackActive(state)) {
    return TimerPhase.None;
  }

  const current = state.timer.current;

  if (current === null || state.eventNow === null || state.timer.secondaryTimer != null) {
    return TimerPhase.Pending;
  }

  if (current < 0) {
    return TimerPhase.Overtime;
  }

  const danger = state.eventNow.timeDanger;
  if (current <= danger) {
    return TimerPhase.Danger;
  }

  const warning = state.eventNow.timeWarning;
  if (current <= warning) {
    return TimerPhase.Warning;
  }

  return TimerPhase.Default;
}

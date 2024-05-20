import { MaybeNumber, MaybeString, OntimeEvent, TimerType } from 'ontime-types';
import { dayInMs } from 'ontime-utils';
import { RuntimeState } from '../stores/runtimeState.js';
import { timerConfig } from '../config/config.js';

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
 * @param {OntimeEvent[]} rundown - List of playable events
 * @param {number} timeNow - time now in ms
 * @returns {{}}
 */
export const getRollTimers = (rundown: OntimeEvent[], timeNow: number): RollTimers => {
  let nowIndex: number | null = null; // index of event now
  let nowId: string | null = null; // id of event now
  let publicIndex: number | null = null; // index of public event now
  let nextIndex: number | null = null; // index of next event
  let publicNextIndex: number | null = null; // index of next public event
  let timeToNext: number | null = null; // counter: time for next event
  let publicTimeToNext: number | null = null; // counter: time for next public event

  const lastEvent = rundown[rundown.length - 1];
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);

  let nextEvent: OntimeEvent | null = null;
  let nextPublicEvent: OntimeEvent | null = null;
  let currentEvent: OntimeEvent | null = null;
  let currentPublicEvent: OntimeEvent | null = null;

  if (timeNow > lastNormalEnd) {
    // we are past last end
    // preload first and find next

    const firstEvent = rundown[0];
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
      for (const event of rundown) {
        if (event.isPublic) {
          nextPublicEvent = event;
          // we need the index before this was sorted
          publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
          break;
        }
      }
    }
  } else {
    // flags: select first event if several overlapping
    let nowFound = false;
    // keep track of the end times when looking for public
    let publicTime = -1;

    for (const event of rundown) {
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
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (hasNotEnded && hasStarted && !nowFound) {
        // event is running
        currentEvent = event;
        nowIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        nowId = event.id;
        nowFound = true;

        // it could also be public
        if (event.isPublic) {
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
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
          nextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }

        if (event.isPublic) {
          // if we don't have a public next or this one start sooner than assigned next
          if (publicNextIndex === null || timeToEventStart < publicTimeToNext) {
            publicTimeToNext = timeToEventStart;
            nextPublicEvent = event;
            publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
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
 * @description Implements update functions for roll mode
 * @param {RuntimeState}
 * @returns object with selection variables
 */
export const updateRoll = (state: RuntimeState) => {
  const { current, expectedFinish, startedAt, secondaryTimer } = state.timer;
  const { secondaryTarget } = state._timer;
  const { clock } = state;
  const selectedEventId = state.eventNow?.id ?? null;

  // timers
  let updatedTimer = current;
  let updatedSecondaryTimer = secondaryTimer;
  // whether rollLoad should be called: force reload of events
  let doRollLoad = false;
  // whether finished event should trigger
  let isPrimaryFinished = false;

  if (selectedEventId && current !== null) {
    // if we have something selected and a timer, we are running

    const finishAt = expectedFinish >= startedAt ? expectedFinish : expectedFinish + dayInMs;
    updatedTimer = finishAt - clock;

    if (updatedTimer > dayInMs) {
      updatedTimer -= dayInMs;
    }

    if (updatedTimer <= timerConfig.triggerAhead) {
      isPrimaryFinished = true;
      // we need a new event
      doRollLoad = true;
    }
  } else if (secondaryTimer >= 0) {
    // if secondaryTimer is running we are in waiting to roll

    updatedSecondaryTimer = secondaryTarget - clock;

    if (updatedSecondaryTimer <= 0) {
      // we need a new event
      doRollLoad = true;
    }
  }

  return { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished: isPrimaryFinished };
};

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is time ahead
 * Negative offset is time delayed
 */
export function getRuntimeOffset(state: RuntimeState): MaybeNumber {
  // nothing to calculate if there are no loaded events or if we havent started
  if (state.eventNow === null || state.runtime.actualStart === null) {
    return null;
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
  if (state.runtime.actualStart === null) {
    return null;
  }
  return state.runtime.plannedEnd - state.runtime.offset + state._timer.totalDelay;
}

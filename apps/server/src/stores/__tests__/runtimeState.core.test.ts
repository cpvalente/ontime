/**
 * Direct tests for the parameterized runtimeState cores
 *
 * These run the calculation logic against plain state objects: no module
 * mocks, no singleton, no rundown cache. They document the arithmetic of
 * the tick, the added-time edge cases and the expected-times projection.
 */
import { OffsetMode, OntimeGroup, PlayableEvent, Playback, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, dayInMs } from 'ontime-utils';

import { makeOntimeEvent, makeOntimeGroup } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { makeRuntimeStateData } from '../__mocks__/runtimeState.mocks.js';
import { type RuntimeState, addTimeCore, getExpectedTimesCore, updateCore } from '../runtimeState.js';

const h = MILLIS_PER_HOUR;
const m = MILLIS_PER_MINUTE;

/** a 10min event, planned 10:00 - 10:10 */
function makeRunningEvent(): PlayableEvent {
  return makeOntimeEvent({
    id: 'running',
    timeStart: 10 * h,
    timeEnd: 10 * h + 10 * m,
    duration: 10 * m,
    dayOffset: 0,
    delay: 0,
    gap: 0,
    countToEnd: false,
  }) as PlayableEvent;
}

/** state as it would be after starting the running event on time at 10:00 */
function makePlayingState(): RuntimeState {
  return makeRuntimeStateData({
    eventNow: makeRunningEvent(),
    timer: {
      playback: Playback.Play,
      duration: 10 * m,
      current: 10 * m,
      elapsed: 0,
      startedAt: 10 * h,
      expectedFinish: 10 * h + 10 * m,
    },
    rundown: {
      selectedEventIndex: 0,
      numEvents: 1,
      plannedStart: 10 * h,
      plannedEnd: 10 * h + 10 * m,
      actualStart: 10 * h,
      currentDay: 0,
    },
    _startDayOffset: 0,
    _startEpoch: new Date('2026-01-05T10:00:00').getTime(),
  });
}

describe('updateCore()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('recomputes the timer against the wall clock', () => {
    const state = makePlayingState();

    vi.setSystemTime(new Date('2026-01-05T10:04:00'));
    const result = updateCore(state);

    expect(result).toStrictEqual({ hasTimerFinished: false, hasSecondaryTimerFinished: false });
    expect(state.timer.current).toBe(6 * m);
    expect(state.timer.elapsed).toBe(4 * m);
    expect(state.timer.expectedFinish).toBe(10 * h + 10 * m);
    expect(state.offset.absolute).toBe(0);
  });

  test('the finish triggers once, when current enters the trigger-ahead window (10ms)', () => {
    const state = makePlayingState();

    // 11ms left on the timer: not finished yet
    vi.setSystemTime(new Date('2026-01-05T10:09:59.989'));
    expect(updateCore(state).hasTimerFinished).toBe(false);
    expect(state._timer.hasFinished).toBe(false);

    // 10ms left: the finish is triggered and latched
    vi.setSystemTime(new Date('2026-01-05T10:09:59.990'));
    expect(updateCore(state).hasTimerFinished).toBe(true);
    expect(state._timer.hasFinished).toBe(true);

    // subsequent updates do not re-trigger, the timer runs into overtime
    vi.setSystemTime(new Date('2026-01-05T10:10:30'));
    expect(updateCore(state).hasTimerFinished).toBe(false);
    expect(state.timer.current).toBe(-30_000);
    expect(state.timer.phase).toBe(TimerPhase.Overtime);
    // overtime pushes the rundown behind schedule
    expect(state.offset.absolute).toBe(30_000);
  });

  test('a pending forceFinish reports the timer as finished', () => {
    const state = makePlayingState();
    state._timer.forceFinish = 10 * h + 2 * m;

    vi.setSystemTime(new Date('2026-01-05T10:02:00'));
    expect(updateCore(state).hasTimerFinished).toBe(true);
    expect(state._timer.hasFinished).toBe(true);
  });

  test('does nothing but update the clock when playback is idle', () => {
    const state = makeRuntimeStateData();

    vi.setSystemTime(new Date('2026-01-05T10:04:00'));
    const result = updateCore(state);

    expect(result).toStrictEqual({ hasTimerFinished: false, hasSecondaryTimerFinished: false });
    expect(state.clock).toBe(10 * h + 4 * m);
    expect(state.timer.current).toBeNull();
  });
});

describe('addTimeCore()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T10:05:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('added time moves the offset and the expected finish', () => {
    const state = makePlayingState();
    state.timer.current = 5 * m; // 10:05, halfway through

    expect(addTimeCore(state, 2 * m)).toBe(true);

    expect(state.timer.addedTime).toBe(2 * m);
    expect(state.timer.current).toBe(7 * m);
    // positive offset: we are now 2min behind schedule
    expect(state.offset.absolute).toBe(2 * m);
    expect(state.timer.expectedFinish).toBe(10 * h + 12 * m);
  });

  test('removing more time than remains forces a finish', () => {
    const state = makePlayingState();
    state.timer.current = 5 * m;

    addTimeCore(state, -8 * m);

    // the force flag is raised for the next update to report
    expect(state._timer.forceFinish).not.toBeNull();
    expect(state.timer.current).toBe(-3 * m);
    // 3min overtime minus 8min removed: 5min ahead of schedule
    expect(state.offset.absolute).toBe(-5 * m);
  });

  test('adding time back over zero un-finishes the timer', () => {
    const state = makePlayingState();
    state.timer.current = -1 * m;
    state.timer.addedTime = -6 * m;
    state._timer.hasFinished = true;

    addTimeCore(state, 5 * m);

    expect(state.timer.current).toBe(4 * m);
    expect(state._timer.hasFinished).toBe(false);
  });

  test('refuses when there is no timer', () => {
    const state = makeRuntimeStateData();
    expect(addTimeCore(state, 1 * m)).toBe(false);
  });
});

describe('getExpectedTimesCore()', () => {
  /** a downstream 10min event, planned 11:00 - 11:10 */
  function makeDownstreamEvent(patch?: Record<string, unknown>) {
    return makeOntimeEvent({
      id: 'downstream',
      timeStart: 11 * h,
      timeEnd: 11 * h + 10 * m,
      duration: 10 * m,
      dayOffset: 0,
      delay: 0,
      ...patch,
    });
  }

  /**
   * playing state with a downstream rundown end
   * @param offset current absolute offset (positive = behind schedule)
   * @param accumulatedGap total gap between the running and the downstream event
   * @param isLinkedToLoaded whether the downstream event links back to the running one
   */
  function makeStateWithEnd(args: {
    offset: number;
    accumulatedGap: number;
    isLinkedToLoaded: boolean;
    mode?: OffsetMode;
    actualStart?: number;
    downstream?: ReturnType<typeof makeOntimeEvent>;
  }): RuntimeState {
    const state = makePlayingState();
    state.offset.absolute = args.offset;
    state.offset.mode = args.mode ?? OffsetMode.Absolute;
    if (args.actualStart !== undefined) state.rundown.actualStart = args.actualStart;
    state._end = {
      event: args.downstream ?? makeDownstreamEvent(),
      accumulatedGap: args.accumulatedGap,
      isLinkedToLoaded: args.isLinkedToLoaded,
    };
    return state;
  }

  test('on schedule: the rundown ends at the planned time', () => {
    const state = makeStateWithEnd({ offset: 0, accumulatedGap: 0, isLinkedToLoaded: false });
    getExpectedTimesCore(state);
    // 11:00 + 10min duration
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 10 * m);
  });

  test('behind schedule: a larger gap absorbs the whole offset', () => {
    const state = makeStateWithEnd({ offset: 5 * m, accumulatedGap: 20 * m, isLinkedToLoaded: false });
    getExpectedTimesCore(state);
    // gap (20min) > offset (5min): the downstream event still starts as scheduled
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 10 * m);
  });

  test('behind schedule: a smaller gap absorbs part of the offset', () => {
    const state = makeStateWithEnd({ offset: 5 * m, accumulatedGap: 2 * m, isLinkedToLoaded: false });
    getExpectedTimesCore(state);
    // expected start 11:00 + 5min offset - 2min gap = 11:03, ends 10min later
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 13 * m);
  });

  test('behind schedule: linked events follow the offset, gaps do not apply', () => {
    const state = makeStateWithEnd({ offset: 5 * m, accumulatedGap: 20 * m, isLinkedToLoaded: true });
    getExpectedTimesCore(state);
    // expected start 11:00 + 5min offset = 11:05, ends 10min later
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 15 * m);
  });

  test('ahead of schedule: unlinked events wait for their scheduled time', () => {
    const state = makeStateWithEnd({ offset: -4 * m, accumulatedGap: 0, isLinkedToLoaded: false });
    getExpectedTimesCore(state);
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 10 * m);
  });

  test('ahead of schedule: linked events pull in with the offset', () => {
    const state = makeStateWithEnd({ offset: -4 * m, accumulatedGap: 0, isLinkedToLoaded: true });
    getExpectedTimesCore(state);
    // expected start 10:56, ends 10min later
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 6 * m);
  });

  test('relative mode: the schedule is re-anchored to the actual start', () => {
    // started 5min late (actual 10:05, planned 10:00) with no accrued drift
    const state = makeStateWithEnd({
      offset: 0,
      accumulatedGap: 20 * m,
      isLinkedToLoaded: false,
      mode: OffsetMode.Relative,
      actualStart: 10 * h + 5 * m,
    });
    state.offset.relative = 0;
    getExpectedTimesCore(state);
    // the whole schedule shifts by the 5min late start: 11:05 + 10min
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 15 * m);
  });

  test('delays push the expected start', () => {
    const state = makeStateWithEnd({
      offset: 0,
      accumulatedGap: 10 * m,
      isLinkedToLoaded: false,
      downstream: makeDownstreamEvent({ delay: 5 * m }),
    });
    getExpectedTimesCore(state);
    // delayed start 11:05, ends 10min later
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 15 * m);
  });

  test('events on a later day are normalised over 24h', () => {
    const state = makeStateWithEnd({
      offset: 0,
      accumulatedGap: 0,
      isLinkedToLoaded: false,
      downstream: makeDownstreamEvent({ dayOffset: 1 }),
    });
    getExpectedTimesCore(state);
    // tomorrow 11:00 relative to today: 24h + 11:00, ends 10min later
    expect(state.offset.expectedRundownEnd).toBe(dayInMs + 11 * h + 10 * m);
  });

  test('flag start and group end use the same projection', () => {
    const state = makeStateWithEnd({ offset: 5 * m, accumulatedGap: 0, isLinkedToLoaded: false });
    const downstream = makeDownstreamEvent() as PlayableEvent;

    state.eventFlag = downstream;
    state._flag = { event: downstream, accumulatedGap: 0, isLinkedToLoaded: false };
    state.groupNow = makeOntimeGroup({ id: 'group' }) as OntimeGroup;
    state._group = { event: downstream, accumulatedGap: 0, isLinkedToLoaded: false };

    getExpectedTimesCore(state);

    // no gap to absorb the 5min offset: expected start 11:05
    expect(state.offset.expectedFlagStart).toBe(11 * h + 5 * m);
    // the group ends when its last event finishes: 11:05 + 10min
    expect(state.offset.expectedGroupEnd).toBe(11 * h + 15 * m);
    expect(state.offset.expectedRundownEnd).toBe(11 * h + 15 * m);
  });

  test('without a loaded event there are no expected times', () => {
    const state = makeRuntimeStateData();
    getExpectedTimesCore(state);

    expect(state.offset.expectedRundownEnd).toBeNull();
    expect(state.offset.expectedFlagStart).toBeNull();
    expect(state.offset.expectedGroupEnd).toBeNull();
  });
});

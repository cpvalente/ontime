import { Instant, PlayableEvent, Playback, SupportedEntry, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { makeOntimeGroup, makeOntimeEvent, makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';

import {
  type RuntimeState,
  addTime,
  clearState,
  getState,
  load,
  loadGroupFlagAndEnd,
  pause,
  resume,
  roll,
  start,
  stop,
  update,
} from '../runtimeState.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { RundownMetadata } from '../../api-data/rundown/rundown.types.js';

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: 1000,
  duration: 1000,
  skip: false,
  parent: null,
} as PlayableEvent;

const mockState = {
  clock: 666,
  eventNow: null,
  eventNext: null,
  rundown: {
    selectedEventIndex: null,
    numEvents: 0,
  },
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  _timer: {
    pausedAt: null,
    hasFinished: false,
  },
} as RuntimeState;

beforeAll(() => {
  vi.mock('../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setCustomFields: vi.fn().mockImplementation((newData) => newData),
          setRundown: vi.fn().mockImplementation((newData) => newData),
        };
      }),
    };
  });
});

describe('mutation on runtimeState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:01');
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('playback operations', async () => {
    it('refuses if nothing is loaded', async () => {
      // force update
      await initRundown(makeRundown({}), {});
      vi.runAllTimers();

      let success = start(mockState);
      expect(success).toBe(false);

      success = pause();
      expect(success).toBe(false);
    });

    test('normal playback cycle', async () => {
      // 1. Load event
      const mockRundown = makeRundown({
        entries: { [mockEvent.id]: mockEvent, event2: { ...mockEvent, id: 'event2' } },
        order: [mockEvent.id, 'event2'],
      });
      // force update
      await initRundown(mockRundown, {});
      vi.runAllTimers();

      const { metadata, rundown } = rundownCache.get();
      load(mockEvent, rundown, metadata);
      let newState = getState();
      expect(newState.eventNow?.id).toBe(mockEvent.id);
      expect(newState.eventNext?.id).toBe('event2');
      expect(newState.timer.playback).toBe(Playback.Armed);
      expect(newState.clock).not.toBe(666);
      expect(newState.groupNow).toBeNull();

      // 2. Start event
      vi.setSystemTime('jan 1 00:02');
      let success = start();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
      });
      expect(newState.rundown.actualStart).toBe(newState.clock);

      // 3. Pause event
      vi.setSystemTime('jan 1 00:03');
      success = pause();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.clock).not.toBe(666);
      expect(newState.timer).toMatchObject({
        playback: Playback.Pause,
        addedTime: 0,
      });
      expect(newState._timer.pausedAt).toEqual(newState.clock);

      success = pause();
      expect(success).toBe(false);

      // 4. Restart event
      vi.setSystemTime('jan 1 00:04');
      success = start();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
        secondaryTimer: null,
      });
      expect(newState.timer).toEqual(
        expect.objectContaining({
          current: expect.any(Number),
          duration: expect.any(Number),
          elapsed: expect.any(Number),
          expectedFinish: expect.any(Number),
          startedAt: expect.any(Number),
        }),
      );
      expect(newState._timer.pausedAt).toBeNull();

      // 5. Stop event
      vi.setSystemTime('jan 1 00:05');
      success = stop();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.eventNow).toBe(null);
      expect(newState.timer).toMatchObject({
        playback: Playback.Stop,
        duration: null,
        elapsed: null,
        expectedFinish: null,
        startedAt: null,
      });
      expect(newState.rundown.actualStart).toBeNull();
    });
  });

  test('runtime offset', async () => {
    const entries = {
      event1: { ...mockEvent, id: 'event1', timeStart: 0, timeEnd: 1000, duration: 1000, parent: null },
      event2: { ...mockEvent, id: 'event2', timeStart: 1000, timeEnd: 1500, duration: 500, parent: null },
    };
    const mockRundown = makeRundown({ entries, order: ['event1', 'event2'] });

    // force update
    await initRundown(mockRundown, {});
    vi.runAllTimers();

    const { metadata, rundown } = rundownCache.get();

    // 1. Load event
    vi.setSystemTime('jan 1 00:09');
    load(entries.event1, rundown, metadata);
    let newState = getState();
    expect(newState.rundown.actualStart).toBeNull();
    expect(newState.rundown.plannedStart).toBe(0);
    expect(newState.rundown.plannedEnd).toBe(1500);
    expect(newState.groupNow).toBeNull();
    expect(newState.offset.absolute).toBe(0);

    // 2. Start event
    vi.setSystemTime('jan 1 00:10');
    start();
    newState = getState();
    const firstStart = newState.clock;
    if (newState.offset.absolute === null) {
      throw new Error('Value cannot be null at this stage');
    }

    expect(newState.rundown.actualStart).toBe(newState.clock);
    expect(newState.offset.absolute).toBe(newState.clock - entries.event1.timeStart);
    expect(newState.offset.expectedRundownEnd).toBe(entries.event2.timeEnd + newState.offset.absolute);

    // 3. Next event
    vi.setSystemTime('jan 1 00:12');
    load(entries.event2, rundown, metadata);
    start();

    newState = getState();
    if (newState.rundown.actualStart === null || newState.offset.absolute === null) {
      throw new Error('Value cannot be null at this stage');
    }

    // there is a case where the calculation time overflows the millisecond which makes
    // tests fail
    const forgivingActualStart = Math.abs(newState.rundown.actualStart - firstStart);
    expect(forgivingActualStart).toBeLessThanOrEqual(1);
    // we are over-under, the difference between the schedule and the actual start
    const delayBefore = newState.clock - entries.event2.timeStart;
    expect(newState.offset.absolute).toBe(delayBefore);
    // finish is the difference between the runtime and the schedule
    expect(newState.offset.expectedRundownEnd).toBe(newState.offset.absolute + entries.event2.timeEnd);
    expect(newState.groupNow).toBeNull();

    // 4. Add time
    addTime(10);
    newState = getState();
    if (newState.offset.absolute === null) {
      throw new Error('Value cannot be null at this stage');
    }

    expect(newState.offset.absolute).toBe(delayBefore + 10);
    expect(newState.offset.expectedRundownEnd).toBe(entries.event2.timeEnd + newState.offset.absolute);

    // 5. Stop event
    stop();
    newState = getState();
    expect(newState.rundown.actualStart).toBeNull();
    expect(newState.offset.absolute).toBe(0);
    expect(newState.offset.expectedRundownEnd).toBeNull();
  });

  test('resume restores currentDay from restore point', async () => {
    clearState();
    const mockRundown = makeRundown({
      entries: {
        event1: { ...mockEvent, id: 'event1', timeStart: 0, timeEnd: 1000, duration: 1000, dayOffset: 0 },
      },
      order: ['event1'],
    });

    const startEpoch = new Date('jan 1 00:00').getTime() as Instant;
    vi.setSystemTime('jan 3 23:59:59');

    await initRundown(mockRundown, {});
    vi.runAllTimers();

    const { rundown, metadata } = rundownCache.get();
    const restorePoint = {
      playback: Playback.Play,
      selectedEventId: 'event1',
      startedAt: 0,
      addedTime: 0,
      pausedAt: null,
      firstStart: 60 * 1000,
      startEpoch,
      currentDay: 2,
    };

    resume(restorePoint, mockRundown.entries.event1 as PlayableEvent, rundown, metadata);

    const newState = getState();
    expect(newState.rundown.actualStart).toBe(60 * 1000);
    expect(newState.rundown.currentDay).toBe(2);

    // crossing midnight increments currentDay
    vi.setSystemTime('jan 4 00:00:01');
    update();
    expect(getState().rundown.currentDay).toBe(3);
  });
});

describe('roll mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:00');
    clearState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('overnight event sets correct currentDay', () => {
    test('roll into overnight event after midnight sets currentDay correctly', async () => {
      // Event spans 23:30 to 00:30 (overnight)
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 23 * 60 * 60 * 1000 + 30 * 60 * 1000, // 23:30
            timeEnd: 30 * 60 * 1000, // 00:30
            duration: 60 * 60 * 1000, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Clock is at 00:10 (morning part of overnight event)
      vi.setSystemTime('jan 1 00:10');
      const { rundown, metadata } = rundownCache.get();
      const result = roll(rundown, metadata);

      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(true);

      const state = getState();
      // currentDay should be 1 because we're in the "next day" part of the overnight event
      expect(state.rundown.currentDay).toBe(1);
    });

    test('roll into overnight event before midnight sets currentDay correctly', async () => {
      // Event spans 23:30 to 00:30 (overnight)
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 23 * 60 * 60 * 1000 + 30 * 60 * 1000, // 23:30
            timeEnd: 30 * 60 * 1000, // 00:30
            duration: 60 * 60 * 1000, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Clock is at 23:40 (evening part of overnight event)
      vi.setSystemTime('jan 1 23:40');
      const { rundown, metadata } = rundownCache.get();
      const result = roll(rundown, metadata);

      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(true);

      const state = getState();
      // currentDay should be 0 because we're still on the same day as the event start
      expect(state.rundown.currentDay).toBe(0);
    });

    test('currentDay increments when crossing midnight during roll', async () => {
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 23 * 60 * 60 * 1000 + 30 * 60 * 1000, // 23:30
            timeEnd: 30 * 60 * 1000, // 00:30
            duration: 60 * 60 * 1000, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Start at 23:40
      vi.setSystemTime('jan 1 23:40');
      const { rundown, metadata } = rundownCache.get();
      roll(rundown, metadata);

      expect(getState().rundown.currentDay).toBe(0);

      // Cross midnight
      vi.setSystemTime('jan 2 00:10');
      update();

      expect(getState().rundown.currentDay).toBe(1);
    });

    test('pending roll crossing midnight keeps currentDay null', async () => {
      // Event starts at 01:00 (future event, will be pending)
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 1 * MILLIS_PER_HOUR, // 01:00
            timeEnd: 2 * MILLIS_PER_HOUR, // 02:00
            duration: 1 * MILLIS_PER_HOUR, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Clock is at 23:50 (before midnight, event is pending for tomorrow 01:00)
      vi.setSystemTime('jan 1 23:50');
      const { rundown, metadata } = rundownCache.get();
      const result = roll(rundown, metadata);

      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(false);

      const stateBeforeMidnight = getState();
      expect(stateBeforeMidnight.timer.secondaryTimer).not.toBeNull();
      // currentDay is null when pending (rundown hasn't started)
      expect(stateBeforeMidnight.rundown.currentDay).toBeNull();

      // Cross midnight while still pending
      vi.setSystemTime('jan 2 00:10');
      update();

      const stateAfterMidnight = getState();
      // currentDay stays null while pending (rundown hasn't started yet)
      expect(stateAfterMidnight.rundown.currentDay).toBeNull();
      // should still be pending (event starts at 01:00)
      expect(stateAfterMidnight.timer.secondaryTimer).not.toBeNull();
    });

    test('waiting between events crossing midnight increments currentDay', async () => {
      // Event 1: 23:00-23:30, Event 2: 00:30-01:00 (gap over midnight)
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 23 * MILLIS_PER_HOUR, // 23:00
            timeEnd: 23 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE, // 23:30
            duration: 30 * MILLIS_PER_MINUTE,
            dayOffset: 0,
          },
          2: {
            ...mockEvent,
            id: '2',
            timeStart: 30 * MILLIS_PER_MINUTE, // 00:30
            timeEnd: 1 * MILLIS_PER_HOUR, // 01:00
            duration: 30 * MILLIS_PER_MINUTE,
            dayOffset: 0,
          },
        },
        order: ['1', '2'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      const { rundown, metadata } = rundownCache.get();

      // Start event 1 at 23:05
      vi.setSystemTime('jan 1 23:05');
      const startEpoch = Date.now() as Instant;
      let result = roll(rundown, metadata);
      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(true);
      expect(getState().rundown.currentDay).toBe(0);

      // Simulate event 1 finishing and loading event 2 (what runtime service does)
      // Load event 2 and call roll to put it in pending state
      vi.setSystemTime('jan 1 23:35');
      load(rundown.entries['2'] as PlayableEvent, rundown, metadata, {
        firstStart: getState().rundown.actualStart,
        startEpoch,
      });
      result = roll(rundown, metadata);
      expect(result.eventId).toBe('2');
      expect(result.didStart).toBe(false); // pending for 00:30
      expect(getState().timer.secondaryTimer).not.toBeNull();
      expect(getState().rundown.currentDay).toBe(0);

      // Cross midnight while waiting for event 2
      vi.setSystemTime('jan 2 00:10');
      update();

      // currentDay should increment even while waiting between events
      expect(getState().rundown.currentDay).toBe(1);
      expect(getState().timer.secondaryTimer).not.toBeNull(); // still waiting
    });

    test('pending roll sets currentDay to 0 when event starts (rundown starts fresh)', async () => {
      // Event starts at 01:00
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 1 * MILLIS_PER_HOUR, // 01:00
            timeEnd: 2 * MILLIS_PER_HOUR, // 02:00
            duration: 1 * MILLIS_PER_HOUR, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Start pending at 23:50
      vi.setSystemTime('jan 1 23:50');
      const { rundown, metadata } = rundownCache.get();
      roll(rundown, metadata);

      // Cross midnight
      vi.setSystemTime('jan 2 00:10');
      update();

      // Now the event starts at 01:05 - call roll again to simulate runtime service
      vi.setSystemTime('jan 2 01:05');
      const result = roll(rundown, metadata);

      expect(result.didStart).toBe(true);

      const state = getState();
      // currentDay is 0 because the rundown just started (this is day 0)
      // the pending time before midnight doesn't count as rundown time
      expect(state.rundown.currentDay).toBe(0);
    });

    test('pending roll crossing midnight updates secondaryTimer correctly', async () => {
      // Event starts at 01:00
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 1 * MILLIS_PER_HOUR, // 01:00
            timeEnd: 2 * MILLIS_PER_HOUR, // 02:00
            duration: 1 * MILLIS_PER_HOUR, // 1 hour
            dayOffset: 0,
          },
        },
        order: ['1'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      // Clock is at 23:50
      vi.setSystemTime('jan 1 23:50');
      const { rundown, metadata } = rundownCache.get();
      roll(rundown, metadata);

      const stateBeforeMidnight = getState();
      // secondaryTimer should be time until 01:00 (1h 10min = 70 min)
      expect(stateBeforeMidnight.timer.secondaryTimer).toBe(70 * MILLIS_PER_MINUTE);

      // Cross midnight to 00:10
      vi.setSystemTime('jan 2 00:10');
      update();

      const stateAfterMidnight = getState();
      // secondaryTimer should now be 50 minutes until 01:00
      expect(stateAfterMidnight.timer.secondaryTimer).toBe(50 * MILLIS_PER_MINUTE);
    });

    test('rolling into overnight event after midnight has correct offset and expected times', async () => {
      // Simulates a rundown with:
      // - A group starting at 13:00, containing an overnight event
      // - Overnight event: 23:50 to 01:50 (2 hours)
      // Roll into the event at 00:21 (31 minutes into the event)
      const groupId = 'group-1';
      const eventId = 'event-1';
      const eventStart = 23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 23:50
      const eventEnd = 1 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 01:50
      const eventDuration = 2 * MILLIS_PER_HOUR; // 2 hours
      const groupStart = 13 * MILLIS_PER_HOUR; // 13:00
      const groupDuration = 12 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 12h 50m (ends at 01:50)

      const mockRundown = makeRundown({
        entries: {
          [groupId]: {
            id: groupId,
            type: SupportedEntry.Group,
            title: 'Test Group',
            timeStart: groupStart,
            timeEnd: eventEnd,
            duration: groupDuration,
            entries: [eventId],
            colour: '',
            note: '',
            custom: {},
            revision: 0,
            isFirstLinked: false,
            targetDuration: null,
          },
          [eventId]: {
            ...mockEvent,
            id: eventId,
            timeStart: eventStart,
            timeEnd: eventEnd,
            duration: eventDuration,
            dayOffset: 0,
            parent: groupId,
          },
        },
        order: [groupId],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      const { rundown, metadata } = rundownCache.get();

      // Roll into the event AFTER midnight at 00:21 (31 minutes into the 2-hour event)
      const rollTime = 21 * MILLIS_PER_MINUTE; // 00:21
      vi.setSystemTime('jan 2 00:21');
      const result = roll(rundown, metadata);

      expect(result.eventId).toBe(eventId);
      expect(result.didStart).toBe(true);

      // Call update to recalculate all state (like runtime service does)
      update();

      const state = getState();

      // currentDay should be 1 (we're on the next day after midnight)
      expect(state.rundown.currentDay).toBe(1);

      // offset.absolute should be 0 (event started on time, backdated to planned start)
      expect(state.offset.absolute).toBe(0);

      // Timer should show correct remaining time
      // Event started at 23:50, duration is 2 hours, clock is 00:21
      // Time elapsed = 31 minutes, time remaining = 2h - 31m = 1h 29m = 89 minutes
      const expectedRemaining = eventDuration - (rollTime + (24 * MILLIS_PER_HOUR - eventStart));
      expect(state.timer.current).toBe(expectedRemaining);

      // expectedFinish should be 01:50 (event end time)
      expect(state.timer.expectedFinish).toBe(eventEnd);

      // expectedRundownEnd should be 01:50 (same as event end, only one event)
      expect(state.offset.expectedRundownEnd).toBe(eventEnd);

      // expectedGroupEnd should be 01:50 (group ends when the event ends)
      expect(state.offset.expectedGroupEnd).toBe(eventEnd);

      // Verify timer started at correct backdated time
      expect(state.timer.startedAt).toBe(eventStart);

      // Verify actualStart is backdated to planned start
      expect(state.rundown.actualStart).toBe(eventStart);
    });

    test('rundown loops back after finishing and resets currentDay when first event starts again', async () => {
      // Rundown: 09:00-23:00, then overnight event 23:00-01:00
      const mockRundown = makeRundown({
        entries: {
          1: {
            ...mockEvent,
            id: '1',
            timeStart: 9 * MILLIS_PER_HOUR, // 09:00
            timeEnd: 23 * MILLIS_PER_HOUR, // 23:00
            duration: 14 * MILLIS_PER_HOUR, // 14 hours
            dayOffset: 0,
          },
          2: {
            ...mockEvent,
            id: '2',
            timeStart: 23 * MILLIS_PER_HOUR, // 23:00
            timeEnd: 1 * MILLIS_PER_HOUR, // 01:00 (next day)
            duration: 2 * MILLIS_PER_HOUR, // 2 hours
            dayOffset: 0,
          },
        },
        order: ['1', '2'],
      });

      await initRundown(mockRundown, {});
      vi.runAllTimers();

      const { rundown, metadata } = rundownCache.get();

      // Day 1: Start at 09:05 - first event is playing
      vi.setSystemTime('jan 1 09:05');
      let result = roll(rundown, metadata);
      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(true);
      expect(getState().rundown.currentDay).toBe(0);

      // Day 1: Move to 23:05 - second event (overnight) is playing
      vi.setSystemTime('jan 1 23:05');
      result = roll(rundown, metadata);
      expect(result.eventId).toBe('2');
      expect(result.didStart).toBe(true);

      // Cross midnight
      vi.setSystemTime('jan 2 00:30');
      update();
      expect(getState().rundown.currentDay).toBe(1);

      // Day 2: 01:05 - rundown finishes, loops back to first event (pending for 09:00)
      vi.setSystemTime('jan 2 01:05');
      result = roll(rundown, metadata);
      // First event is pending (09:00 is in the future)
      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(false);
      // currentDay is null while pending (rundown hasn't "restarted" yet)
      expect(getState().rundown.currentDay).toBeNull();

      // Day 2: 09:05 - first event starts again (fresh rundown cycle)
      vi.setSystemTime('jan 2 09:05');
      result = roll(rundown, metadata);
      expect(result.eventId).toBe('1');
      expect(result.didStart).toBe(true);
      // currentDay resets to 0 for the new cycle
      expect(getState().rundown.currentDay).toBe(0);
    });
  });

  describe('normal roll', async () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      const mockRundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });
      await initRundown(mockRundown, {});
      vi.runAllTimers();
    });

    test('pending event', () => {
      const { rundown, metadata } = rundownCache.get();
      const { eventId, didStart } = roll(rundown, metadata);
      const state = getState();

      expect(eventId).toBe('1');
      expect(didStart).toBe(false);
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(1000);
    });

    test('roll events', () => {
      vi.setSystemTime('jan 1 00:00:01');
      const { rundown, metadata } = rundownCache.get();
      let result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '1', didStart: true });

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });

      vi.setSystemTime('jan 1 00:00:03:500');
      result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
    });
  });

  describe('roll takeover', () => {
    beforeEach(async () => {
      const rundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });

      // force update
      vi.useFakeTimers();
      await initRundown(rundown, {});
      vi.runAllTimers();
    });

    test('from load', () => {
      const { rundown, metadata } = rundownCache.get();
      load(rundown.entries[3] as PlayableEvent, rundown, metadata);
      const result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '3', didStart: false });
      const state = getState();
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(3000);
    });

    test('from play', () => {
      const { rundown, metadata } = rundownCache.get();
      load(rundown.entries[1] as PlayableEvent, rundown, metadata);
      start();
      const result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().offset.absolute).toBe(-1000);
    });
  });

  describe('roll continue with offset', () => {
    test('no gaps', async () => {
      const mockRundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });

      // force update
      vi.useFakeTimers();
      await initRundown(mockRundown, {});
      vi.runAllTimers();
      const { rundown, metadata } = rundownCache.get();

      load(rundown.entries[1] as PlayableEvent, rundown, metadata);
      start();
      // the current offset after manual play
      const currentOffset = getState().offset.absolute;
      let result = roll(rundown, metadata, getState().offset);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      // the current offset should be maintain by roll mode when taking over from play
      expect(getState().offset.absolute).toBe(currentOffset);

      vi.setSystemTime('jan 1 00:00:01');
      result = roll(rundown, metadata, getState().offset);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });
      expect(getState().offset.absolute).toBe(-1000);

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, metadata, getState().offset);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
      expect(getState().offset.absolute).toBe(-1000);

      vi.useRealTimers();
    });
  });
});

describe('loadGroupFlagAndEnd()', () => {
  test('from no-group to a group will clear groupNow', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: [] }),
        3: makeOntimeEvent({ id: '3', parent: null }),
      },
      order: ['0', '1', '2', '3'],
    });

    const state = {
      groupNow: null,
      eventNow: rundown.entries[11],
      rundown: { actualGroupStart: null },
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '3'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 2, state);

    expect(state).toMatchObject({
      groupNow: rundown.entries[1],
      eventNow: rundown.entries[11],
    });
  });

  test('from a group to a different group will clear groupNow', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      groupNow: rundown.entries[1],
      eventNow: rundown.entries[22],
      rundown: { actualGroupStart: null },
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '22'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 1, state);

    expect(state).toMatchObject({
      groupNow: rundown.entries[2],
      eventNow: rundown.entries[22],
    });
  });

  test('from group to a no-group will clear groupNow', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      groupNow: rundown.entries[1],
      eventNow: rundown.entries[0],
      rundown: { actualGroupStart: null },
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '22'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 1, state);

    expect(state).toMatchObject({
      groupNow: null,
      eventNow: rundown.entries[0],
    });
  });

  test('from no-group to no-group will keep startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeEvent({ id: '1', parent: null }),
      },
      order: ['0', '1'],
    });

    const state = {
      groupNow: null,
      eventNow: rundown.entries[0],
      rundown: { actualGroupStart: null },
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '1'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 0, state);

    expect(state).toMatchObject({
      groupNow: null,
      eventNow: rundown.entries[0],
    });
  });
});

/**
 * Characterisation tests for the runtimeState machinery
 *
 * These tests lock down the CURRENT behaviour of the runtime state hot path:
 * playback transitions, tick updates, absolute and relative offsets,
 * expected times (rundown end, group end, flag start) and roll mode.
 *
 * They drive the real runtimeState singleton through scripted scenarios
 * with fake timers, exactly as the EventTimer would in production.
 *
 * !!! These tests are a behavioural baseline for refactors: if one of these
 * assertions fails, production behaviour has changed !!!
 */
import { OffsetMode, Playback, TimerPhase } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import {
  makeCountToEndRundown,
  makeDelayedRundown,
  makeFlatRundown,
  makeGroupedRundown,
  makeOvernightRundown,
  time,
} from './harness/scenario.fixtures.js';
import { countFinishes, createScenario } from './harness/scenario.utils.js';

const { h, m } = time;

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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('characterisation: loading and rundown data', () => {
  test('initialising a rundown populates planned times', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:00');

    expect(scenario.digest()).toMatchObject({
      playback: Playback.Stop,
      plannedStart: 10 * h,
      plannedEnd: 11 * h,
      absolute: 0,
      relative: 0,
      expectedRundownEnd: null,
      expectedFlagStart: null,
      expectedGroupEnd: null,
    });
  });

  test('loading an event arms the timer and resolves now/next/flag', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:59');
    scenario.load('flat1');

    expect(scenario.digest()).toMatchObject({
      playback: Playback.Armed,
      eventNow: 'flat1',
      eventNext: 'flat2',
      // the loaded event cannot be the flag, so the first flag after flat1 is flat2
      eventFlag: 'flat2',
      groupNow: null,
      current: 10 * m,
      duration: 10 * m,
      selectedEventIndex: 0,
      actualStart: null,
      currentDay: null,
    });
  });

  test('setOffsetMode while stopped only changes the mode', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:59');
    scenario.setOffsetMode(OffsetMode.Relative);

    expect(scenario.digest()).toMatchObject({
      mode: OffsetMode.Relative,
      expectedRundownEnd: null,
      expectedFlagStart: null,
    });
  });
});

describe('characterisation: timed playback', () => {
  test('on-time start ticks through phases and finishes exactly once', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:59');
    scenario.load('flat1');

    scenario.setTime('jan 5 10:00');
    expect(scenario.start()).toBe(true);

    expect(scenario.digest()).toMatchObject({
      playback: Playback.Play,
      phase: TimerPhase.Default,
      startedAt: 10 * h,
      actualStart: 10 * h,
      currentDay: 0,
      startDayOffset: 0,
      current: 10 * m,
      expectedFinish: 10 * h + 10 * m,
      absolute: 0,
      relative: 0,
      // flag (flat2) is linked to the loaded event: it follows the offset directly
      expectedFlagStart: 10 * h + 10 * m,
      // rundown ends on schedule
      expectedRundownEnd: 11 * h,
      expectedGroupEnd: null,
    });

    // tick to the warning threshold (2min)
    let results = scenario.tick(8 * m, 1000);
    expect(countFinishes(results).timerFinished).toBe(0);
    expect(scenario.digest()).toMatchObject({ phase: TimerPhase.Warning, current: 2 * m });

    // tick to the danger threshold (1min)
    results = scenario.tick(1 * m, 1000);
    expect(countFinishes(results).timerFinished).toBe(0);
    expect(scenario.digest()).toMatchObject({ phase: TimerPhase.Danger, current: 1 * m });

    // tick to the end: the finish flag is raised exactly once, when current <= triggerAhead
    results = scenario.tick(1 * m, 1000);
    expect(countFinishes(results).timerFinished).toBe(1);
    expect(scenario.digest()).toMatchObject({ current: 0, hasFinished: true });

    // continuing into overtime does not re-trigger the finish
    results = scenario.tick(30 * 1000, 1000);
    expect(countFinishes(results).timerFinished).toBe(0);
    expect(scenario.digest()).toMatchObject({
      phase: TimerPhase.Overtime,
      current: -30 * 1000,
      // overtime pushes the rundown behind schedule
      absolute: 30 * 1000,
      relative: 30 * 1000,
    });
  });

  test('late start: absolute and relative offsets with gap compensation', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:59');
    scenario.load('flat1');

    scenario.setTime('jan 5 10:05');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      startedAt: 10 * h + 5 * m,
      actualStart: 10 * h + 5 * m,
      // positive offset: we are 5min behind schedule
      absolute: 5 * m,
      // relative to our actual start, we are on time
      relative: 0,
      // flat2 is linked to the loaded event, so it follows the offset: 10:10 + 5min
      expectedFlagStart: 10 * h + 15 * m,
      // the accumulated gap (20min) is larger than the offset (5min): rundown still ends on schedule
      expectedRundownEnd: 11 * h,
    });

    // switching to relative mode re-anchors the schedule to the actual start
    scenario.setOffsetMode(OffsetMode.Relative);
    expect(scenario.digest()).toMatchObject({
      mode: OffsetMode.Relative,
      absolute: 5 * m,
      relative: 0,
      // linked flag: same wall time as in absolute mode
      expectedFlagStart: 10 * h + 15 * m,
      // in relative mode the whole schedule shifts by the late start: gaps are kept, not consumed
      expectedRundownEnd: 11 * h + 5 * m,
    });

    // full state checkpoint
    expect(scenario.state()).toMatchSnapshot();
  });

  test('early start in relative mode', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:50');
    scenario.load('flat1');

    scenario.setTime('jan 5 09:56');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      // negative offset: we are 4min ahead of schedule
      absolute: -4 * m,
      relative: 0,
      // linked flag follows the offset
      expectedFlagStart: 10 * h + 6 * m,
      // ahead of schedule: unlinked events are still expected at their scheduled time
      expectedRundownEnd: 11 * h,
    });

    scenario.setOffsetMode(OffsetMode.Relative);
    expect(scenario.digest()).toMatchObject({
      // the schedule shifts 4min earlier
      expectedFlagStart: 10 * h + 6 * m,
      expectedRundownEnd: 10 * h + 56 * m,
    });
  });

  test('partial gap compensation consumes the gap', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat2');

    // start flat2 15min late (planned 10:10)
    scenario.setTime('jan 5 10:25');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      eventNow: 'flat2',
      eventNext: 'flat3',
      // first flag after the loaded event is flat3
      eventFlag: 'flat3',
      absolute: 15 * m,
      // relative to the actual start, flat2 began 10min early
      // (the rundown started at flat2, skipping flat1's 10min)
      relative: -10 * m,
      // flag flat3: gap (10min) only partially compensates the offset (15min)
      // expected start = scheduled (10:30) + offset (15min) - gap (10min) = 10:35
      expectedFlagStart: 10 * h + 35 * m,
      // rundown end: gap (20min) fully compensates the offset (15min)
      expectedRundownEnd: 11 * h,
    });
  });

  test('addTime adjusts offsets, can force finish and un-finish', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.start();

    scenario.tick(1 * m, 1000);
    expect(scenario.digest()).toMatchObject({ current: 9 * m });

    // adding time puts us behind schedule
    scenario.addTime(2 * m);
    expect(scenario.digest()).toMatchObject({
      addedTime: 2 * m,
      current: 11 * m,
      absolute: 2 * m,
      relative: 2 * m,
      expectedFinish: 10 * h + 12 * m,
      expectedRundownEnd: 11 * h,
    });

    // removing more time than the timer has forces a finish
    scenario.addTime(-12 * m);
    expect(scenario.digest()).toMatchObject({
      addedTime: -10 * m,
      current: -1 * m,
      hasFinished: false,
    });

    // the finish is reported on the next update
    let results = scenario.tick();
    expect(countFinishes(results).timerFinished).toBe(1);
    expect(scenario.digest()).toMatchObject({ hasFinished: true, phase: TimerPhase.Overtime });

    // !!! characterised quirk: the forced finish flag (_timer.forceFinish) is never
    // cleared by update(), so every subsequent update keeps reporting a finished timer
    results = scenario.tick();
    expect(countFinishes(results).timerFinished).toBe(1);

    // adding time back over zero un-finishes the timer
    scenario.addTime(5 * m);
    expect(scenario.digest()).toMatchObject({
      addedTime: -5 * m,
      hasFinished: false,
      // net added time: we are now 5min ahead of schedule
      absolute: -5 * m,
    });
  });

  test('pause freezes the timer and accumulates paused time into the offset', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.start();

    scenario.tick(2 * m, 1000);
    expect(scenario.pause()).toBe(true);
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Pause,
      pausedAt: 10 * h + 2 * m,
      current: 8 * m,
    });

    // while paused, the timer freezes but the offset grows with the pause
    scenario.setTime('jan 5 10:04');
    expect(scenario.digest()).toMatchObject({
      current: 8 * m,
      absolute: 2 * m,
      relative: 2 * m,
      expectedFinish: 10 * h + 12 * m,
    });

    // restarting folds the paused time into addedTime
    expect(scenario.start()).toBe(true);
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Play,
      pausedAt: null,
      addedTime: 2 * m,
      current: 8 * m,
      absolute: 2 * m,
    });

    // pause then stop clears everything
    scenario.pause();
    expect(scenario.stop()).toBe(true);
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Stop,
      eventNow: null,
      current: null,
      startedAt: null,
      actualStart: null,
      absolute: 0,
      relative: 0,
      expectedRundownEnd: null,
      currentDay: null,
    });
  });

  test('countToEnd: absolute offset is overtime only', async () => {
    const scenario = await createScenario(makeCountToEndRundown(), 'jan 5 10:35');
    scenario.load('toEnd');

    // start the count-to-end event 10min late
    scenario.setTime('jan 5 10:40');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      // !!! characterised: start() does not recompute current, the value
      // set at load time (11:00 - 10:35) sticks until the next update()
      current: 25 * m,
      expectedFinish: 11 * h,
      // count-to-end absorbs the late start: absolute offset is overtime only
      absolute: 0,
      // the relative offset still reflects the raw event start offset
      relative: -30 * m,
    });

    // the next update recalculates current against the scheduled end
    scenario.tick(1000, 1000);
    expect(scenario.digest()).toMatchObject({ current: 20 * m - 1000 });

    // going into overtime
    scenario.setTime('jan 5 11:05');
    expect(scenario.digest()).toMatchObject({
      current: -5 * m,
      phase: TimerPhase.Overtime,
      absolute: 5 * m,
      relative: -25 * m,
      expectedFinish: 11 * h,
    });
  });

  test('group: expectedGroupEnd and actualGroupStart', async () => {
    const scenario = await createScenario(makeGroupedRundown(), 'jan 5 10:00');
    scenario.load('grouped1');

    scenario.setTime('jan 5 10:05');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      groupNow: 'group',
      actualGroupStart: 10 * h + 5 * m,
      absolute: 5 * m,
      // group end: grouped2 is not linked and has no gap to absorb the 5min offset
      // expected start = 10:30 + 5min, group ends 30min later
      expectedGroupEnd: 11 * h + 5 * m,
      // rundown end: the 30min gap before 'after' absorbs the offset
      expectedRundownEnd: 12 * h,
    });
  });

  test('updateRundownData recomputes expected times while playing', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.setTime('jan 5 10:05');
    scenario.start();
    scenario.setOffsetMode(OffsetMode.Relative);

    expect(scenario.digest()).toMatchObject({ expectedRundownEnd: 11 * h + 5 * m });

    // a rundown edit moves the planned start earlier
    scenario.updateRundownData({
      numEvents: 4,
      firstStart: 9 * h + 30 * m,
      lastEnd: 10 * h + 30 * m,
      totalDelay: 0,
      totalDuration: 1 * h,
    });

    expect(scenario.digest()).toMatchObject({
      plannedStart: 9 * h + 30 * m,
      plannedEnd: 10 * h + 30 * m,
      // in relative mode the expected end shifts with the (actualStart - plannedStart) delta
      expectedRundownEnd: 11 * h + 35 * m,
    });
  });

  test('updateRundownData while stopped does not produce expected times', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');

    scenario.updateRundownData({
      numEvents: 4,
      firstStart: 9 * h + 30 * m,
      lastEnd: 10 * h + 30 * m,
      totalDelay: 0,
      totalDuration: 1 * h,
    });

    expect(scenario.digest()).toMatchObject({
      plannedStart: 9 * h + 30 * m,
      plannedEnd: 10 * h + 30 * m,
      expectedRundownEnd: null,
      absolute: 0,
    });
  });

  test('delay entries push the expected start of unlinked events', async () => {
    const scenario = await createScenario(makeDelayedRundown(), 'jan 5 10:00');
    scenario.load('delayed1');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      absolute: 0,
      // delayed2 is delayed by 5min: expected start 10:25, ends 10min later
      expectedRundownEnd: 10 * h + 35 * m,
    });
  });
});

describe('characterisation: hot reload during playback', () => {
  test('editing the running event recomputes the timer without interrupting playback', async () => {
    const scenario = await createScenario(makeCountToEndRundown(), 'jan 5 10:00');
    scenario.load('lead');
    scenario.start();
    scenario.tick(2 * m, 1000);

    // the running event (10:00 - 10:30) is shortened to 10:00 - 10:20
    const editedRundown = makeCountToEndRundown();
    // @ts-expect-error -- fixture entries are events
    editedRundown.entries.lead.timeEnd = 10 * h + 20 * m;
    // @ts-expect-error -- fixture entries are events
    editedRundown.entries.lead.duration = 20 * m;
    scenario.hotReload(editedRundown);

    expect(scenario.digest()).toMatchObject({
      eventNow: 'lead',
      // playback is not interrupted
      playback: Playback.Play,
      startedAt: 10 * h,
      actualStart: 10 * h,
      // the timer is recomputed against the new duration
      duration: 20 * m,
      current: 18 * m,
      expectedFinish: 10 * h + 20 * m,
      // expected times are recomputed: the 10min gap before toEnd absorbs
      // nothing (offset 0), the rundown still ends on schedule
      expectedRundownEnd: 11 * h,
    });
  });

  test('removing the running event slides the selection to the event at the same index', async () => {
    const scenario = await createScenario(makeCountToEndRundown(), 'jan 5 10:00');
    scenario.load('lead');
    scenario.start();
    scenario.tick(2 * m, 1000);

    // the running event is deleted from the rundown
    const editedRundown = makeCountToEndRundown();
    delete editedRundown.entries.lead;
    editedRundown.order = ['toEnd'];
    scenario.hotReload(editedRundown);

    expect(scenario.digest()).toMatchObject({
      // the event at the previously selected index is loaded in its place
      eventNow: 'toEnd',
      eventNext: null,
      selectedEventIndex: 0,
      playback: Playback.Play,
      // !!! characterised: the original start time is kept, the replacement
      // event plays as if it had started with the removed event
      startedAt: 10 * h,
      actualStart: 10 * h,
      duration: 30 * m,
      // toEnd counts to its scheduled end: 11:00 - 10:02
      current: 58 * m,
      expectedFinish: 11 * h,
    });
  });

  test('reloading the loaded event re-arms the timer and clears progress', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.start();
    scenario.tick(2 * m, 1000);
    scenario.addTime(1 * m);

    const reloadedId = scenario.reloadLoaded();

    expect(reloadedId).toBe('flat1');
    expect(scenario.digest()).toMatchObject({
      eventNow: 'flat1',
      playback: Playback.Armed,
      startedAt: null,
      addedTime: 0,
      pausedAt: null,
      current: 10 * m,
      duration: 10 * m,
      elapsed: null,
      expectedFinish: null,
      hasFinished: false,
    });
  });
});

describe('characterisation: playback across midnight', () => {
  test('playing across midnight increments currentDay and keeps offsets', async () => {
    const scenario = await createScenario(makeOvernightRundown(), 'jan 5 23:30');
    scenario.load('night2');

    scenario.setTime('jan 5 23:35');
    scenario.start();

    expect(scenario.digest()).toMatchObject({
      startedAt: 23 * h + 35 * m,
      actualStart: 23 * h + 35 * m,
      currentDay: 0,
      absolute: 5 * m,
      // relative offset re-anchors to the rundown start (planned 22:00, actual 23:35)
      relative: -90 * m,
      // before midnight, next-day events are normalised over 24h:
      // night3 expected start = 24:30 + 5min offset, ends 30min later
      expectedRundownEnd: 25 * h + 5 * m,
    });

    // cross midnight in 1min steps
    scenario.tick(35 * m, 1 * m);

    expect(scenario.digest()).toMatchObject({
      clock: 10 * m,
      currentDay: 1,
      // started 23:35 with 60min duration: ends 00:35, 25min left at 00:10
      current: 25 * m,
      absolute: 5 * m,
      relative: -90 * m,
      // after midnight the same expected end is expressed in today's time
      expectedRundownEnd: 1 * h + 5 * m,
    });

    // full state checkpoint
    expect(scenario.state()).toMatchSnapshot();
  });
});

describe('characterisation: roll mode', () => {
  test('roll: pending then start on schedule', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 09:55');

    const result = scenario.roll();
    expect(result).toStrictEqual({ eventId: 'flat1', didStart: false });
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Roll,
      phase: TimerPhase.Pending,
      secondaryTimer: 5 * m,
      secondaryTarget: 10 * h,
      actualStart: null,
      currentDay: null,
    });

    // the secondary timer counts down to the event start
    const results = scenario.tick(5 * m, 1000);
    expect(countFinishes(results).secondaryFinished).toBe(1);
    expect(scenario.digest()).toMatchObject({ secondaryTimer: 0 });

    // the runtime service reacts to the secondary timer finishing by calling roll again
    const startResult = scenario.roll();
    expect(startResult).toStrictEqual({ eventId: 'flat1', didStart: true });
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Roll,
      startedAt: 10 * h,
      actualStart: 10 * h,
      currentDay: 0,
      absolute: 0,
      secondaryTimer: null,
    });
  });

  test('roll: takeover from play keeps the running state', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.setTime('jan 5 10:05');
    scenario.start();

    const result = scenario.roll();
    expect(result).toStrictEqual({ eventId: 'flat1', didStart: false });
    expect(scenario.digest()).toMatchObject({
      playback: Playback.Roll,
      startedAt: 10 * h + 5 * m,
      absolute: 5 * m,
    });
  });

  test('roll: continuation carries the offset to the next event', async () => {
    const scenario = await createScenario(makeFlatRundown(), 'jan 5 10:00');
    scenario.load('flat1');
    scenario.setTime('jan 5 10:05');
    scenario.start();
    scenario.roll();

    // flat1 (started 10:05, 10min duration) is finished at 10:16
    // the update pushes flat1 1min into overtime, growing the offset to 6min
    scenario.setTime('jan 5 10:16');
    expect(scenario.digest()).toMatchObject({ absolute: 6 * m });

    // the runtime service rolls into the next event passing the current offset
    const result = scenario.roll(true);
    // with a 6min offset, the offset-clock is 10:10 which is inside flat2 (10:10-10:20)
    expect(result).toStrictEqual({ eventId: 'flat2', didStart: true });
    expect(scenario.digest()).toMatchObject({
      eventNow: 'flat2',
      // start times are backdated to the planned start
      startedAt: 10 * h + 10 * m,
      // the offset passed by the service is kept
      absolute: 6 * m,
      // !!! characterised: unlike the pending-roll branch, the roll-continuation
      // branch overwrites actualStart with the new event's planned start
      actualStart: 10 * h + 10 * m,
    });
  });

  test('roll into overnight event after midnight backdates start metadata', async () => {
    const scenario = await createScenario(makeOvernightRundown(), 'jan 6 00:05');

    const result = scenario.roll();
    expect(result).toStrictEqual({ eventId: 'night2', didStart: true });

    scenario.tick();

    expect(scenario.digest()).toMatchObject({
      eventNow: 'night2',
      // started mid-event: times are backdated to the planned start
      startedAt: 23 * h + 30 * m,
      actualStart: 23 * h + 30 * m,
      startDayOffset: 0,
      // the backdated epoch is yesterday: we are on day 1
      currentDay: 1,
      absolute: 0,
      // night3 is expected on schedule
      expectedRundownEnd: 1 * h,
    });

    // full state checkpoint
    expect(scenario.state()).toMatchSnapshot();
  });

  test('roll: pending across midnight renormalises the secondary target', async () => {
    const scenario = await createScenario(makeCountToEndRundown(), 'jan 5 23:50');

    // all events are in the past: roll pends for tomorrow's first event (10:00)
    const result = scenario.roll();
    expect(result).toStrictEqual({ eventId: 'lead', didStart: false });
    expect(scenario.digest()).toMatchObject({
      phase: TimerPhase.Pending,
      // 10h10min until tomorrow 10:00, target normalised over 24h
      secondaryTimer: 10 * h + 10 * m,
      secondaryTarget: dayInMs + 10 * h,
      currentDay: null,
    });

    // crossing midnight renormalises the target to today's time
    scenario.setTime('jan 6 00:10');
    expect(scenario.digest()).toMatchObject({
      secondaryTimer: 9 * h + 50 * m,
      secondaryTarget: 10 * h,
      currentDay: null,
    });
  });
});

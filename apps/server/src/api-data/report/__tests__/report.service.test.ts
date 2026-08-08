import { TimerLifeCycle } from 'ontime-types';
import type { PlayableEvent, ShowRun } from 'ontime-types';
import { vi } from 'vitest';

import { makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';

// in-memory stand-in for the sidecar store, verified separately in report.store.test.ts
let runs: ShowRun[] = [];

vi.mock('../../../services/report-service/report.store.js', () => ({
  // isolation between tests comes from the top-level beforeEach resetting `runs`,
  // this mirrors the real store returning whatever is already on "disk"
  loadReports: vi.fn(async () => ({ runs })),
  getRuns: vi.fn(() => runs),
  getRun: vi.fn((id: string) => runs.find((run) => run.id === id)),
  upsertRun: vi.fn(async (run: ShowRun) => {
    const index = runs.findIndex((candidate) => candidate.id === run.id);
    if (index === -1) {
      runs.unshift(run);
    } else {
      runs[index] = run;
    }
  }),
  upsertRuns: vi.fn(async (updated: ShowRun[]) => {
    for (const run of updated) {
      const index = runs.findIndex((candidate) => candidate.id === run.id);
      if (index === -1) {
        runs.unshift(run);
      } else {
        runs[index] = run;
      }
    }
  }),
  deleteRun: vi.fn(async (id: string) => {
    const index = runs.findIndex((run) => run.id === id);
    if (index === -1) return false;
    runs.splice(index, 1);
    return true;
  }),
  deleteRunsForRundown: vi.fn(async (rundownId: string) => {
    const before = runs.length;
    runs = runs.filter((run) => run.rundownId !== rundownId);
    return before - runs.length;
  }),
  deleteAllRuns: vi.fn(async () => {
    runs = [];
  }),
}));

let currentRundown = makeRundown({ id: 'rundown-1', title: 'Test rundown' });
/** rundowns reachable by id, standing in for what is on disk */
let storedRundowns: Record<string, ReturnType<typeof makeRundown>> = {};

vi.mock('../../rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => currentRundown),
  getCurrentRundownId: vi.fn(() => currentRundown.id),
}));

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({
    getRundown: vi.fn((id: string) => {
      if (!(id in storedRundowns)) throw new Error(`Rundown with id: ${id} not found`);
      return storedRundowns[id];
    }),
  })),
}));

const {
  generate,
  clear,
  triggerReportEntry,
  closeRun,
  initReports,
  listRuns,
  getRun,
  getLatestRun,
  renameRun,
  deleteRun,
  deleteAllRuns,
} = await import('../report.service.js');

const eventA = makeOntimeEvent({ id: 'event-a', timeStart: 0, timeEnd: 10000, duration: 10000 }) as PlayableEvent;
const eventB = makeOntimeEvent({ id: 'event-b', timeStart: 10000, timeEnd: 20000, duration: 10000 }) as PlayableEvent;

beforeEach(async () => {
  runs = [];
  currentRundown = makeRundown({
    id: 'rundown-1',
    title: 'Test rundown',
    entries: { [eventA.id]: eventA, [eventB.id]: eventB },
    order: [eventA.id, eventB.id],
    flatOrder: [eventA.id, eventB.id],
  });
  storedRundowns = { 'rundown-1': currentRundown };
  await initReports('project-a');
});

/** an epoch instant, as the runtime would supply on the first event start */
const showEpoch = Date.UTC(2026, 7, 8, 9, 30);

describe('triggerReportEntry()', () => {
  it('captures a snapshot of the schedule when an event starts', () => {
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 500 }, clock: 500 });
    triggerReportEntry(TimerLifeCycle.onStart, state);

    expect(generate()).toMatchObject({
      [eventA.id]: {
        startedAt: 500,
        endedAt: null,
        scheduledStart: eventA.timeStart,
        scheduledDuration: eventA.duration,
        playCount: 1,
      },
    });
  });

  it('records the end time on stop, keeping the snapshot taken at start', () => {
    const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, start);

    const stop = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 12000 });
    triggerReportEntry(TimerLifeCycle.onStop, stop);

    expect(generate()[eventA.id]).toMatchObject({
      startedAt: 0,
      endedAt: 12000,
      scheduledDuration: eventA.duration,
    });
  });

  it('increments playCount when an event is re-run within the same show', () => {
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 5000 } as typeof state);
    triggerReportEntry(TimerLifeCycle.onStart, { ...state, clock: 5000 } as typeof state);

    expect(generate()[eventA.id].playCount).toBe(2);
  });

  it('ignores events without an id', () => {
    const state = makeRuntimeStateData({ eventNow: null });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    expect(generate()).toEqual({});
  });

  it('ignores a stop arriving when no run is open', () => {
    // a project load stops playback and reinitialises reporting, the trailing
    // stop must not attribute the old project's event to the new one
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 10000 });
    triggerReportEntry(TimerLifeCycle.onStop, state);
    expect(generate()).toEqual({});
  });

  it('persists a run to history on the first event stop', async () => {
    const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, start);
    const stop = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 10000 });
    triggerReportEntry(TimerLifeCycle.onStop, stop);

    // persistence happens off the event loop
    await new Promise((resolve) => setImmediate(resolve));

    expect(listRuns()).toHaveLength(1);
    expect(listRuns()[0].rundownId).toBe('rundown-1');
  });
});

describe('run timestamps', () => {
  it('dates a run with the wall clock epoch, not the time of day', async () => {
    // clock/actualStart are millis since midnight, which cannot date a run.
    // The run must take _startEpoch so it is not stamped 1 Jan 1970.
    const state = makeRuntimeStateData({
      eventNow: eventA,
      timer: { startedAt: 0 },
      clock: 34200000, // 09:30 as a time of day
      rundown: { actualStart: 34200000 },
      _startEpoch: showEpoch,
    });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 44200000 } as typeof state);
    await new Promise((resolve) => setImmediate(resolve));

    const run = listRuns()[0];
    expect(run.startedAt).toBe(showEpoch);
    expect(new Date(run.startedAt).getUTCFullYear()).toBe(2026);
  });

  it('falls back to the current instant when no start epoch is available', async () => {
    const before = Date.now();
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0, _startEpoch: null });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 10000 } as typeof state);
    await new Promise((resolve) => setImmediate(resolve));

    const run = listRuns()[0];
    expect(run.startedAt).toBeGreaterThanOrEqual(before);
    expect(run.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it('orders runs from different days correctly', async () => {
    // a run at 09:30 today must rank above one at 20:00 yesterday, which
    // time-of-day ordering would get backwards
    const yesterdayEvening = Date.UTC(2026, 7, 7, 20, 0);
    await makeClosedRunAt('older', yesterdayEvening);
    await makeClosedRunAt('newer', showEpoch);

    expect(getLatestRun()?.id).toBe('newer');
  });

  async function makeClosedRunAt(id: string, epoch: number) {
    // the time of day deliberately disagrees with chronological order here:
    // 20:00 yesterday is a larger time of day than 09:30 today
    const timeOfDay = epoch % 86400000;
    const state = makeRuntimeStateData({
      eventNow: eventA,
      timer: { startedAt: 0 },
      clock: timeOfDay,
      rundown: { actualStart: timeOfDay },
      _startEpoch: epoch,
    });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: timeOfDay + 10000 } as typeof state);
    closeRun();
    await new Promise((resolve) => setImmediate(resolve));
    runs[0] = { ...runs[0], id };
  }
});

describe('closeRun()', () => {
  it('closes the open run and starts a fresh one on the next event', async () => {
    const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, start);
    triggerReportEntry(TimerLifeCycle.onStop, { ...start, clock: 10000 } as typeof start);

    closeRun();
    await new Promise((resolve) => setImmediate(resolve));

    expect(listRuns()).toHaveLength(1);
    expect(listRuns()[0].endedAt).toBe(10000);

    // a new start after closing opens a second run rather than reusing the first
    const secondStart = makeRuntimeStateData({ eventNow: eventB, timer: { startedAt: 20000 }, clock: 20000 });
    triggerReportEntry(TimerLifeCycle.onStart, secondStart);
    triggerReportEntry(TimerLifeCycle.onStop, { ...secondStart, clock: 30000 } as typeof secondStart);
    await new Promise((resolve) => setImmediate(resolve));

    expect(listRuns()).toHaveLength(2);
  });

  it('does nothing when no run is open', () => {
    expect(() => closeRun()).not.toThrow();
    expect(listRuns()).toHaveLength(0);
  });
});

describe('initReports()', () => {
  it('closes a dangling run left open by a crash or shutdown', async () => {
    runs = [
      {
        id: 'dangling',
        rundownId: 'rundown-1',
        rundownTitle: 'Test rundown',
        label: 'unfinished',
        startedAt: 0,
        endedAt: null,
        report: {
          [eventA.id]: {
            startedAt: 0,
            endedAt: 9000,
            scheduledStart: 0,
            scheduledDuration: 10000,
            playCount: 1,
          },
        },
        summary: {
          eventsRun: 1,
          eventsPlanned: 2,
          scheduledDuration: 10000,
          actualDuration: 9000,
          drift: -1000,
          eventsOver: 0,
          eventsUnder: 1,
          eventsOnTime: 0,
          worstOverrun: null,
        },
      },
    ];

    await initReports('project-a');

    const recovered = getRun('dangling');
    expect(recovered?.endedAt).toBe(9000);
  });

  it('closes every dangling run, not only the first', async () => {
    runs = [makeDanglingRun('first', 4000), makeDanglingRun('second', 7000)];

    await initReports('project-a');

    expect(getRun('first')?.endedAt).toBe(4000);
    expect(getRun('second')?.endedAt).toBe(7000);
    expect(listRuns().every((run) => run.endedAt !== null)).toBe(true);
  });

  function makeDanglingRun(id: string, endedAt: number): ShowRun {
    return {
      id,
      rundownId: 'rundown-1',
      rundownTitle: 'Test rundown',
      label: id,
      startedAt: showEpoch,
      endedAt: null,
      report: {
        [eventA.id]: { startedAt: 0, endedAt, scheduledStart: 0, scheduledDuration: 10000, playCount: 1 },
      },
      summary: {
        eventsRun: 1,
        eventsPlanned: 2,
        scheduledDuration: 10000,
        actualDuration: endedAt,
        drift: endedAt - 10000,
        eventsOver: 0,
        eventsUnder: 1,
        eventsOnTime: 0,
        worstOverrun: null,
      },
    };
  }
});

describe('summary is measured against the run\'s own rundown', () => {
  it('counts planned events from the rundown the run belongs to', async () => {
    // a three event rundown that is not the loaded one
    const otherEvent = makeOntimeEvent({ id: 'event-c', timeStart: 0, timeEnd: 1000, duration: 1000 });
    storedRundowns['rundown-2'] = makeRundown({
      id: 'rundown-2',
      title: 'Other rundown',
      entries: { [eventA.id]: eventA, [eventB.id]: eventB, [otherEvent.id]: otherEvent },
      order: [eventA.id, eventB.id, otherEvent.id],
      flatOrder: [eventA.id, eventB.id, otherEvent.id],
    });

    // open a run against rundown-2, then switch the loaded rundown away
    currentRundown = storedRundowns['rundown-2'];
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0, _startEpoch: showEpoch });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    currentRundown = storedRundowns['rundown-1'];

    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 10000 } as typeof state);
    await new Promise((resolve) => setImmediate(resolve));

    // three, from rundown-2, not two from the now loaded rundown-1
    expect(listRuns()[0].summary.eventsPlanned).toBe(3);
  });

  it('keeps the last known count when the rundown has been deleted', async () => {
    currentRundown = makeRundown({ id: 'gone', title: 'Deleted rundown', entries: {}, order: [], flatOrder: [] });
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0, _startEpoch: showEpoch });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 10000 } as typeof state);
    await new Promise((resolve) => setImmediate(resolve));

    // rundown disappears from both the loaded slot and storage
    const runId = listRuns()[0].id;
    runs[0] = { ...runs[0], summary: { ...runs[0].summary, eventsPlanned: 7 } };
    currentRundown = storedRundowns['rundown-1'];

    triggerReportEntry(TimerLifeCycle.onStop, { ...state, clock: 20000 } as typeof state);
    await new Promise((resolve) => setImmediate(resolve));

    expect(getRun(runId)?.summary.eventsPlanned).toBe(7);
  });
});

describe('run history queries and edits', () => {
  async function makeClosedRun(id: string, rundownId = 'rundown-1') {
    const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    currentRundown = { ...currentRundown, id: rundownId };
    triggerReportEntry(TimerLifeCycle.onStart, start);
    triggerReportEntry(TimerLifeCycle.onStop, { ...start, clock: 10000 } as typeof start);
    closeRun();
    await new Promise((resolve) => setImmediate(resolve));
    // stamp a predictable id so tests can address the run directly
    const created = listRuns()[0];
    runs[0] = { ...runs[0], id };
    return created;
  }

  it('filters listRuns by rundown', async () => {
    await makeClosedRun('run-a', 'rundown-1');
    await makeClosedRun('run-b', 'rundown-2');

    expect(listRuns('rundown-1').map((run) => run.id)).toEqual(['run-a']);
    expect(listRuns('rundown-2').map((run) => run.id)).toEqual(['run-b']);
    expect(listRuns()).toHaveLength(2);
  });

  it('returns the most recently started closed run', async () => {
    await makeClosedRun('older');
    await makeClosedRun('newer');
    runs.find((run) => run.id === 'older')!.startedAt = 0;
    runs.find((run) => run.id === 'newer')!.startedAt = 100000;

    expect(getLatestRun()?.id).toBe('newer');
  });

  it('renames a run', async () => {
    await makeClosedRun('run-a');
    const renamed = await renameRun('run-a', 'Dress rehearsal');
    expect(renamed?.label).toBe('Dress rehearsal');
    expect(getRun('run-a')?.label).toBe('Dress rehearsal');
  });

  it('returns undefined when renaming a run that does not exist', async () => {
    expect(await renameRun('missing', 'x')).toBeUndefined();
  });

  it('deletes a single run', async () => {
    await makeClosedRun('run-a');
    expect(await deleteRun('run-a')).toBe(true);
    expect(getRun('run-a')).toBeUndefined();
  });

  it('clears the in-progress report when the open run is deleted', async () => {
    const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, start);
    triggerReportEntry(TimerLifeCycle.onStop, { ...start, clock: 10000 } as typeof start);
    await new Promise((resolve) => setImmediate(resolve));

    const openRunId = listRuns()[0].id;
    await deleteRun(openRunId);

    expect(generate()).toEqual({});
  });

  it('deletes all run history', async () => {
    await makeClosedRun('run-a');
    await makeClosedRun('run-b');
    await deleteAllRuns();
    expect(listRuns()).toHaveLength(0);
  });
});

describe('clear()', () => {
  it('clears a single event from the in-progress report', () => {
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    clear(eventA.id);
    expect(generate()).toEqual({});
  });

  it('clears the entire in-progress report', () => {
    const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, clock: 0 });
    triggerReportEntry(TimerLifeCycle.onStart, state);
    clear();
    expect(generate()).toEqual({});
  });
});

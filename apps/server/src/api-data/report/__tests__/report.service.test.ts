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

vi.mock('../../rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => currentRundown),
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
  await initReports('project-a');
});

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

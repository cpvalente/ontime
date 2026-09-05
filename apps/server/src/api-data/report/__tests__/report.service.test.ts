import type { PlayableEvent } from 'ontime-types';
import { RefetchKey, TimerLifeCycle } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { vi } from 'vitest';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { clear, generate, generateReport, triggerReportEntry } from '../report.service.js';

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn() }));

const eventA = makeOntimeEvent({
  id: 'event-a',
  dayOffset: 0,
  timeStart: 0,
  timeEnd: MILLIS_PER_MINUTE,
  duration: MILLIS_PER_MINUTE,
}) as PlayableEvent;
const eventB = makeOntimeEvent({
  id: 'event-b',
  dayOffset: 0,
  timeStart: MILLIS_PER_MINUTE,
  timeEnd: 2 * MILLIS_PER_MINUTE,
  duration: MILLIS_PER_MINUTE,
}) as PlayableEvent;

beforeEach(() => {
  clear();
  vi.clearAllMocks();
});

it('records lifecycle times while keeping the schedule captured at start', () => {
  const start = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 500 }, _startEpoch: 1 });
  triggerReportEntry(TimerLifeCycle.onStart, start);

  const edited = { ...eventA, timeStart: 999, duration: 999 } as PlayableEvent;
  const stop = makeRuntimeStateData({ eventNow: edited, clock: 2 * MILLIS_PER_MINUTE, rundown: { currentDay: 1 } });
  triggerReportEntry(TimerLifeCycle.onStop, stop);

  expect(generate()[eventA.id]).toEqual({
    startedAt: 500,
    startedAtDay: 0,
    endedAt: 2 * MILLIS_PER_MINUTE,
    endedAtDay: 1,
    scheduledStart: eventA.timeStart,
    scheduledDay: eventA.dayOffset,
    scheduledDuration: eventA.duration,
  });
  expect(sendRefetch).toHaveBeenCalledTimes(2);
  expect(sendRefetch).toHaveBeenLastCalledWith(RefetchKey.Report);
});

it('falls back to the current event when a stop arrives without a start', () => {
  const stop = makeRuntimeStateData({ eventNow: eventA, clock: MILLIS_PER_MINUTE });
  triggerReportEntry(TimerLifeCycle.onStop, stop);

  expect(generate()[eventA.id]).toMatchObject({
    startedAt: null,
    endedAt: MILLIS_PER_MINUTE,
    scheduledDuration: eventA.duration,
  });
});

it('captures the rundown plan when a stop is the first report entry', () => {
  const rundown = makeRundown({
    id: 'run-1',
    title: 'Stopped without start',
    order: [eventA.id],
    entries: { [eventA.id]: eventA },
  });
  const stop = makeRuntimeStateData({
    eventNow: eventA,
    clock: MILLIS_PER_MINUTE,
    rundown: { plannedStart: 0, plannedEnd: MILLIS_PER_MINUTE },
  });

  triggerReportEntry(TimerLifeCycle.onStop, stop, rundown);

  expect(generateReport()).toMatchObject({
    eventReports: { [eventA.id]: { endedAt: MILLIS_PER_MINUTE } },
    rundown: { id: rundown.id, title: rundown.title },
  });
});

it('accumulates entries until the report is explicitly cleared', () => {
  const firstRun = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, _startEpoch: 1 });
  triggerReportEntry(TimerLifeCycle.onStart, firstRun);
  triggerReportEntry(TimerLifeCycle.onStart, { ...firstRun, eventNow: eventB, _startEpoch: 2 });

  expect(Object.keys(generate())).toEqual([eventA.id, eventB.id]);
});

it('returns the report with the rundown plan captured at its first event', () => {
  const rundown = makeRundown({
    id: 'run-1',
    title: 'Original title',
    order: [eventA.id, eventB.id],
    entries: { [eventA.id]: eventA, [eventB.id]: eventB },
  });
  const start = makeRuntimeStateData({
    eventNow: eventA,
    timer: { startedAt: 500 },
    _startEpoch: 1,
    rundown: { plannedStart: 0, plannedEnd: 2 * MILLIS_PER_MINUTE },
  });
  triggerReportEntry(TimerLifeCycle.onStart, start, rundown);
  triggerReportEntry(TimerLifeCycle.onStop, { ...start, clock: MILLIS_PER_MINUTE });
  rundown.title = 'Edited later';

  expect(generateReport()).toMatchObject({
    rundown: { id: 'run-1', title: 'Original title' },
    eventReports: { [eventA.id]: { scheduledDuration: MILLIS_PER_MINUTE } },
    show: {
      plannedStart: 0,
      plannedEnd: 2 * MILLIS_PER_MINUTE,
      plannedDuration: 2 * MILLIS_PER_MINUTE,
      actualStart: 500,
      actualEnd: MILLIS_PER_MINUTE,
    },
  });
});

it('clears the retained report and rundown snapshot together', () => {
  const rundown = makeRundown({ order: [eventA.id], entries: { [eventA.id]: eventA } });
  const state = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, _startEpoch: 1 });
  triggerReportEntry(TimerLifeCycle.onStart, state, rundown);
  vi.clearAllMocks();
  clear();

  expect(generateReport()).toMatchObject({ eventReports: {}, rundown: null });
  expect(sendRefetch).toHaveBeenCalledOnce();
  expect(sendRefetch).toHaveBeenCalledWith(RefetchKey.Report);
});

it('captures a new plan after removing the final event by id', () => {
  const firstRundown = makeRundown({
    id: 'run-1',
    title: 'First run',
    order: [eventA.id],
    entries: { [eventA.id]: eventA },
  });
  const secondRundown = makeRundown({
    id: 'run-2',
    title: 'Second run',
    order: [eventB.id],
    entries: { [eventB.id]: eventB },
  });
  const firstStart = makeRuntimeStateData({ eventNow: eventA, timer: { startedAt: 0 }, _startEpoch: 1 });
  const secondStart = makeRuntimeStateData({
    eventNow: eventB,
    timer: { startedAt: MILLIS_PER_MINUTE },
    _startEpoch: 2,
  });

  triggerReportEntry(TimerLifeCycle.onStart, firstStart, firstRundown);
  clear(eventA.id);
  triggerReportEntry(TimerLifeCycle.onStart, secondStart, secondRundown);

  expect(generateReport()).toMatchObject({
    eventReports: { [eventB.id]: { startedAt: MILLIS_PER_MINUTE } },
    rundown: { id: secondRundown.id, title: secondRundown.title },
  });
});

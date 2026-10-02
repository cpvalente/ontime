import { Instant, PlayableEvent, Playback } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { makeOntimeEvent, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../../api-data/rundown/rundown.service.js';
import { addTime, clearState, getState, load, pause, resume, start, update } from '../../../stores/runtimeState.js';
import { makeRestorePoint } from '../restore.utils.js';

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({
    setCustomFields: vi.fn((newData) => newData),
    setRundown: vi.fn((newData) => newData),
    getAutomation: vi.fn(() => ({
      enabledAutomations: false,
      enabledOscIn: false,
      oscPortIn: 0,
      triggers: [],
      automations: {},
    })),
  })),
}));

const event = makeOntimeEvent({
  id: 'restore-event',
  timeStart: 0,
  timeEnd: 30 * MILLIS_PER_MINUTE,
  duration: 30 * MILLIS_PER_MINUTE,
}) as PlayableEvent;

const instant = (date: string) => new Date(date).getTime() as Instant;

/** saves the playback, clears it and resumes from the saved point at the given instant */
function saveAndResumeAt(savedAt: Instant, resumedAt: Instant) {
  const { rundown, metadata } = rundownCache.get();
  const restorePoint = makeRestorePoint(getState(), rundown.id, savedAt);
  clearState();
  vi.setSystemTime(resumedAt);
  resume(restorePoint, event, rundown, metadata);
  update(resumedAt);
  return restorePoint;
}

describe('makeRestorePoint()', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    clearState();
    await initRundown(makeRundown({ entries: { [event.id]: event }, order: [event.id] }), {});
    vi.runAllTimers();
    const { rundown, metadata } = rundownCache.get();
    load(event, rundown, metadata);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('saves times as instants and resumes a playing timer where it was', () => {
    start(undefined, instant('jan 1 2025 10:00'));
    addTime(MILLIS_PER_MINUTE, instant('jan 1 2025 10:02'));
    update(instant('jan 1 2025 10:05'));
    const before = getState();

    const restorePoint = saveAndResumeAt(instant('jan 1 2025 10:05'), instant('jan 1 2025 10:05'));

    expect(restorePoint.startedAt).toBe(instant('jan 1 2025 10:00'));
    expect(restorePoint.startEpoch).toBe(instant('jan 1 2025 10:00'));
    expect(getState().timer).toStrictEqual(before.timer);
    expect(getState().rundown.actualStart).toBe(before.rundown.actualStart);
  });

  test('resumes a paused timer, excluding the time it stayed paused', () => {
    start(undefined, instant('jan 1 2025 10:00'));
    pause(undefined, instant('jan 1 2025 10:03'));

    const restorePoint = saveAndResumeAt(instant('jan 1 2025 10:04'), instant('jan 1 2025 10:06'));
    expect(restorePoint.pausedAt).toBe(instant('jan 1 2025 10:03'));
    expect(getState().timer.playback).toBe(Playback.Pause);

    start(undefined, instant('jan 1 2025 10:07'));
    expect(getState().timer.elapsed).toBe(3 * MILLIS_PER_MINUTE);
  });

  test('saves a start from before midnight on the previous day', () => {
    start(undefined, instant('jan 1 2025 23:50'));

    const restorePoint = saveAndResumeAt(instant('jan 2 2025 00:05'), instant('jan 2 2025 00:05'));

    expect(restorePoint.startedAt).toBe(instant('jan 1 2025 23:50'));
    expect(getState().timer.elapsed).toBe(15 * MILLIS_PER_MINUTE);
  });
});

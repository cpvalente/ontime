import { EndAction, Playback, type PlayableEvent } from 'ontime-types';

import { makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { initRundown } from '../../../api-data/rundown/rundown.service.js';
import { timerConfig } from '../../../setup/config.js';
import * as runtimeState from '../../../stores/runtimeState.js';
import { runtimeService } from '../runtime.service.js';

/** the timer and the runtime singletons are created on import, so time is faked before any import */
const origin = vi.hoisted(() => {
  vi.useFakeTimers();
  vi.setSystemTime('jan 1 00:01');
  return Date.now();
});

/** when the runtime first reported the timer as finished */
const finished = vi.hoisted(() => ({ at: null as number | null }));

vi.mock('../../../stores/runtimeState.js', async (importOriginal) => {
  const actual = await importOriginal<typeof runtimeState>();
  return {
    ...actual,
    update: (...args: Parameters<typeof actual.update>) => {
      const result = actual.update(...args);
      if (result.hasTimerFinished) finished.at ??= Date.now();
      return result;
    },
  };
});

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    setCustomFields: <T>(newData: T) => newData,
    setRundown: <T>(newData: T) => newData,
  }),
}));

vi.mock('../../restore-service/restore.service.js', () => ({
  restoreService: { save: vi.fn(() => Promise.resolve()), load: vi.fn(), clear: vi.fn() },
}));
vi.mock('../../../api-data/automation/automation.service.js', () => ({ triggerAutomations: vi.fn() }));
vi.mock('../../../api-data/report/report.service.js', () => ({ triggerReportEntry: vi.fn() }));

const interval = timerConfig.updateRate;
// one tick short of the end, the timer still has more than triggerAhead remaining
// and the next tick lands after the end, so only an anticipated tick can catch it in time
const duration = 32 * interval - 15;

function makeEvent(id: string, endAction = EndAction.None) {
  return {
    type: 'event',
    id,
    cue: id,
    timeStart: 0,
    timeEnd: duration,
    duration,
    skip: false,
    parent: null,
    endAction,
  } as PlayableEvent;
}

/** moves time to the next regular tick, so the cases above hold whatever ran before */
function alignToTick() {
  const sinceTick = (Date.now() - origin) % interval;
  if (sinceTick > 0) vi.advanceTimersByTime(interval - sinceTick);
}

/** the end must be seen within triggerAhead of the instant it happens, never after */
function expectFinishedNear(end: number) {
  expect(finished.at).not.toBeNull();
  const drift = finished.at! - end;
  expect(drift).toBeGreaterThanOrEqual(-timerConfig.triggerAhead);
  expect(drift).toBeLessThanOrEqual(0);
}

describe('runtime service playback', () => {
  beforeAll(() => {
    runtimeService.init(null);
  });

  afterAll(() => {
    runtimeService.shutdown();
    vi.useRealTimers();
  });

  async function loadRundown(...events: PlayableEvent[]) {
    const entries = Object.fromEntries(events.map((event) => [event.id, event]));
    await initRundown(makeRundown({ entries, order: events.map((event) => event.id) }), {});
    vi.advanceTimersByTime(0);
    alignToTick();
    finished.at = null;
  }

  afterEach(() => {
    runtimeService.stop();
  });

  it('observes the end of an event ahead of its nominal end', async () => {
    await loadRundown(makeEvent('end'));

    const nominalEnd = Date.now() + duration;
    expect(runtimeService.startById('end')).toBe(true);

    vi.advanceTimersByTime(duration + interval);
    expectFinishedNear(nominalEnd);
  });

  it('reschedules the boundary after adding time', async () => {
    await loadRundown(makeEvent('add-time'));
    const startedAt = Date.now();
    runtimeService.startById('add-time');
    vi.advanceTimersByTime(10 * interval);

    // bring the end inside the current interval, ahead of the next regular tick
    const remaining = duration - 10 * interval;
    runtimeService.addTime(-(remaining - 20));

    vi.advanceTimersByTime(interval);
    expectFinishedNear(startedAt + 10 * interval + 20);
  });

  it('holds the end while paused and observes it after resuming', async () => {
    await loadRundown(makeEvent('pause'));
    runtimeService.startById('pause');
    vi.advanceTimersByTime(16 * interval);

    runtimeService.pause();
    vi.advanceTimersByTime(2 * duration);
    expect(finished.at).toBeNull();

    alignToTick();
    const resumedEnd = Date.now() + duration - 16 * interval;
    runtimeService.start();

    vi.advanceTimersByTime(duration);
    expectFinishedNear(resumedEnd);
  });

  it('does not observe an end after stopping', async () => {
    await loadRundown(makeEvent('stop'));
    runtimeService.startById('stop');
    vi.advanceTimersByTime(interval);

    expect(runtimeService.stop()).toBe(true);
    vi.advanceTimersByTime(2 * duration);

    expect(finished.at).toBeNull();
    expect(runtimeState.getState().timer.playback).toBe(Playback.Stop);
  });

  it('plays the next event when an event with PlayNext ends', async () => {
    await loadRundown(makeEvent('first', EndAction.PlayNext), makeEvent('second'));
    runtimeService.startById('first');

    vi.advanceTimersByTime(duration + interval);

    const { eventNow, timer } = runtimeState.getState();
    expect(eventNow?.id).toBe('second');
    expect(timer.playback).toBe(Playback.Play);
  });
});

import type { PlayableEvent } from 'ontime-types';

import { makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { timerConfig } from '../../setup/config.js';
import * as runtimeState from '../../stores/runtimeState.js';
import { EventTimer } from '../EventTimer.js';

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    setCustomFields: <T>(newData: T) => newData,
    setRundown: <T>(newData: T) => newData,
  }),
}));

const refresh = 32;
// one tick short of the end, the timer still has more than triggerAhead remaining
// and the next tick lands after the end, so only an anticipated update can catch it in time
const duration = 32 * refresh - 15;

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: duration,
  duration,
  skip: false,
  parent: null,
} as PlayableEvent;

describe('EventTimer playback', () => {
  let timer: EventTimer;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:01');
  });

  afterEach(() => {
    timer.shutdown();
    runtimeState.clearState();
    vi.useRealTimers();
  });

  it('observes the end of an event ahead of its nominal end', async () => {
    await initRundown(makeRundown({ entries: { [mockEvent.id]: mockEvent }, order: [mockEvent.id] }), {});
    vi.runAllTimers();
    const { metadata, rundown } = rundownCache.get();
    runtimeState.load(mockEvent, rundown, metadata);

    let finishedAt: number | null = null;
    timer = new EventTimer({ refresh, updateInterval: 1000 });
    timer.setOnUpdateCallback(({ hasTimerFinished }) => {
      if (hasTimerFinished) finishedAt ??= Date.now();
    });

    const nominalEnd = Date.now() + duration;
    expect(timer.start()).toBe(true);
    vi.advanceTimersByTime(duration + refresh);

    expect(finishedAt).not.toBeNull();
    const drift = finishedAt! - nominalEnd;
    expect(drift).toBeGreaterThanOrEqual(-timerConfig.triggerAhead);
    expect(drift).toBeLessThanOrEqual(0);
  });
});

import { type MaybeNumber, type PlayableEvent, Playback } from 'ontime-types';

import { makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { timerConfig } from '../../setup/config.js';
import { clearState, getState, load } from '../../stores/runtimeState.js';
import { EventTimer } from '../EventTimer.js';

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn<() => unknown>(() => ({
    setCustomFields: vi.fn<(newData: unknown) => unknown>((newData) => newData),
    setRundown: vi.fn<(newData: unknown) => unknown>((newData) => newData),
    getAutomation: vi.fn<() => unknown>(() => ({
      enabledAutomations: false,
      enabledOscIn: false,
      oscPortIn: 0,
      triggers: [],
      automations: {},
    })),
  })),
}));

/**
 * Lands the end of the event just after a tick, which is the case the interval cannot
 * resolve: without anticipating the boundary the timer is only seen finishing on the
 * following tick, 15ms after the event was due to end instead of 10ms ahead of it.
 */
const eventDuration = 10001;

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: eventDuration,
  duration: eventDuration,
  skip: false,
  parent: null,
} as PlayableEvent;

describe('accuracy of the event boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:01');
  });

  afterEach(() => {
    clearState();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('sees a running event finish inside the trigger ahead window', async () => {
    await initRundown(makeRundown({ entries: { [mockEvent.id]: mockEvent }, order: [mockEvent.id] }), {});
    vi.runAllTimers();
    const { metadata, rundown } = rundownCache.get();

    clearState();
    load(mockEvent, rundown, metadata);

    const eventTimer = new EventTimer({
      refresh: timerConfig.updateRate,
      updateInterval: timerConfig.notificationRate,
    });
    let finishedAt: MaybeNumber = null;
    eventTimer.setOnUpdateCallback(({ hasTimerFinished }) => {
      if (hasTimerFinished && finishedAt === null) {
        finishedAt = Date.now();
      }
    });

    const startedAt = Date.now();
    expect(eventTimer.start()).toBe(true);
    expect(getState().timer.playback).toBe(Playback.Play);

    // run past the end of the event, with room for a full cycle
    vi.advanceTimersByTime(eventDuration + timerConfig.updateRate);
    eventTimer.shutdown();

    expect(finishedAt).not.toBeNull();
    const lateness = (finishedAt as unknown as number) - (startedAt + eventDuration);

    // we trigger ahead of the end of the event, never after it
    expect(lateness).toBeLessThanOrEqual(0);
    expect(lateness).toBeGreaterThanOrEqual(-timerConfig.triggerAhead);
  });

  it('runs an event whose end does not line up with a tick', () => {
    // guards the fixture above: if the end of the event landed on a tick, the interval
    // would resolve the boundary on its own and the test would pass without anticipating
    const ticksToBoundary = (eventDuration - timerConfig.triggerAhead) / timerConfig.updateRate;
    expect(Number.isInteger(ticksToBoundary)).toBe(false);

    // and the tick which follows the boundary falls after the event was due to end
    expect(Math.ceil(ticksToBoundary) * timerConfig.updateRate).toBeGreaterThan(eventDuration);
  });
});

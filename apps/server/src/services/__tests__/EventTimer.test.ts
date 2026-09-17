import type { MaybeNumber } from 'ontime-types';

import { EventTimer } from '../EventTimer.js';

vi.mock('../../stores/runtimeState.js', () => ({
  start: vi.fn<() => boolean>(() => true),
  pause: vi.fn<() => boolean>(() => true),
  stop: vi.fn<() => boolean>(() => true),
  addTime: vi.fn<(amount: number) => boolean>(() => true),
  update: vi.fn<() => { hasTimerFinished: boolean; hasSecondaryTimerFinished: boolean }>(() => ({
    hasTimerFinished: false,
    hasSecondaryTimerFinished: false,
  })),
  getTimeToNextBoundary: vi.fn<() => MaybeNumber>(() => null),
}));

import * as runtimeState from '../../stores/runtimeState.js';

const getTimeToNextBoundary = vi.mocked(runtimeState.getTimeToNextBoundary);
const makeTimer = (refresh: number) => new EventTimer({ refresh, updateInterval: 1000 });

/**
 * The interval resolves a boundary to its own rate, so the timer anticipates the ones
 * which fall inside the current cycle with a dedicated update.
 */
describe('EventTimer anticipates the next boundary', () => {
  let eventTimer: EventTimer | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    getTimeToNextBoundary.mockReturnValue(null);
  });

  afterEach(() => {
    eventTimer?.shutdown();
    eventTimer = undefined;
    vi.useRealTimers();
  });

  it('schedules an update for a boundary which falls inside the current cycle', () => {
    eventTimer = makeTimer(1000);
    // the boundary is 200ms into the next cycle, after which there is nothing to anticipate
    getTimeToNextBoundary.mockReturnValueOnce(200).mockReturnValue(null);

    vi.advanceTimersByTime(1000);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);

    // the interval alone would only have seen this boundary 800ms later
    vi.advanceTimersByTime(200);
    expect(runtimeState.update).toHaveBeenCalledTimes(2);
  });

  it('leaves a boundary beyond the current cycle to the interval', () => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(5000);

    vi.advanceTimersByTime(1500);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing when there is no boundary ahead', () => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(null);

    eventTimer.start();
    vi.advanceTimersByTime(999);
    expect(runtimeState.update).not.toHaveBeenCalled();
  });

  it('leaves a boundary which is already due to the interval, rather than spinning on it', async () => {
    // a boundary the side effects cannot clear, ie. a roll which keeps failing to load.
    // scheduling it would re-derive the same boundary and run the runtime as fast as it can
    vi.useRealTimers();
    getTimeToNextBoundary.mockReturnValue(-500);

    eventTimer = makeTimer(50);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 300ms at a 50ms rate, with room for scheduling jitter
    expect(vi.mocked(runtimeState.update).mock.calls.length).toBeLessThanOrEqual(10);
  });

  it('anticipates the end of an event which was just started', () => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(50);

    expect(eventTimer.start()).toBe(true);

    vi.advanceTimersByTime(50);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);
  });

  it('anticipates the new end of an event which had time added to it', () => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(50);

    expect(eventTimer.addTime(-100)).toBe(true);

    vi.advanceTimersByTime(50);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);
  });

  it.each(['pause', 'stop'] as const)('drops the scheduled boundary on %s', (action) => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(50);
    eventTimer.start();

    getTimeToNextBoundary.mockReturnValue(null);
    eventTimer[action]();

    vi.advanceTimersByTime(500);
    expect(runtimeState.update).not.toHaveBeenCalled();
  });

  it('drops the scheduled boundary on shutdown', () => {
    eventTimer = makeTimer(1000);
    getTimeToNextBoundary.mockReturnValue(50);
    eventTimer.start();

    eventTimer.shutdown();

    vi.advanceTimersByTime(1000);
    expect(runtimeState.update).not.toHaveBeenCalled();
  });
});

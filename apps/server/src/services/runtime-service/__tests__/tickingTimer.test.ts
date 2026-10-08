import type { Instant } from 'ontime-types';

import { createTickingTimer, type TickingTimer } from '../tickingTimer.js';

const interval = 50;

describe('createTickingTimer()', () => {
  let timer: TickingTimer;
  const onTick = vi.fn<(at: Instant) => void>();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    timer = createTickingTimer({ interval, onTick });
  });

  afterEach(() => {
    timer.stop();
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('does not tick until started', () => {
    timer.scheduleBoundary(20);

    vi.advanceTimersByTime(interval * 2);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('ticks at the interval with the instant of the tick', () => {
    timer.start();

    vi.advanceTimersByTime(interval);
    expect(onTick).toHaveBeenCalledExactlyOnceWith(1000 + interval);
  });

  it('anticipates a boundary which falls inside the current interval', () => {
    timer.start();
    timer.scheduleBoundary(20);

    vi.advanceTimersByTime(19);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledExactlyOnceWith(1020);
  });

  it('leaves a boundary beyond the current interval to the regular interval', () => {
    timer.start();
    timer.scheduleBoundary(interval);

    vi.advanceTimersByTime(interval - 1);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('replaces a scheduled boundary when it is rescheduled', () => {
    timer.start();
    timer.scheduleBoundary(20);
    timer.scheduleBoundary(30);

    vi.advanceTimersByTime(29);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no boundary', () => timer.scheduleBoundary(null)],
    ['stop', () => timer.stop()],
  ])('clears the scheduled boundary on %s', (_name, action) => {
    timer.start();
    timer.scheduleBoundary(20);
    action();

    vi.advanceTimersByTime(interval - 1);
    expect(onTick).not.toHaveBeenCalled();
  });
});

describe('createTickingTimer() with a boundary which is already due', () => {
  it('does not reschedule it', async () => {
    // fake timers do not surface a tight reschedule loop, it needs real time to elapse
    // eg: a roll pre-roll whose side effects keep failing to load the next event
    const onTick = vi.fn(() => timer.scheduleBoundary(-5));
    const timer = createTickingTimer({ interval, onTick });
    timer.start();
    timer.scheduleBoundary(-5);

    await new Promise((resolve) => setTimeout(resolve, 300));
    timer.stop();

    // ~6 ticks expected from the interval
    expect(onTick.mock.calls.length).toBeLessThanOrEqual(10);
  });
});

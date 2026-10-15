import { dayInMs } from 'ontime-utils';

import {
  ClockEstimate,
  getEstimatedClock,
  getNextTickDelay,
  slewRate,
  updateClockEstimate,
} from '../autoTickingClock.utils';

// local monotonic time is unrelated to the time of day
const localStart = 50_000;
const serverStart = 12 * 60 * 60 * 1000;

describe('updateClockEstimate', () => {
  it('counts locally between server values', () => {
    const estimate = updateClockEstimate(null, serverStart, localStart);
    expect(getEstimatedClock(estimate, localStart)).toBe(serverStart);
    expect(getEstimatedClock(estimate, localStart + 2500)).toBe(serverStart + 2500);
  });

  it('produces a monotonic clock that tracks the least delayed sample under jitter', () => {
    const delays = [40, 5, 80, 20, 60, 10, 90, 30];
    let estimate: ClockEstimate | null = null;
    let previous = -Infinity;

    const arrivals = delays.map((delay, second) => localStart + second * 1000 + delay);

    arrivals.forEach((receivedAt, second) => {
      estimate = updateClockEstimate(estimate, serverStart + second * 1000, receivedAt);

      const nextArrival = arrivals[second + 1] ?? receivedAt + 1000;
      for (let now = receivedAt; now < nextArrival; now += 10) {
        const clock = getEstimatedClock(estimate, now);
        expect(clock).toBeGreaterThanOrEqual(previous);
        previous = clock;
      }
    });

    // the 5ms sample left the window, the best remaining one is 10ms late
    const now = localStart + 8000;
    expect(getEstimatedClock(estimate!, now)).toBe(serverStart + 8000 - 10);
  });

  it('does not move the clock back for a late packet', () => {
    const onTime = updateClockEstimate(null, serverStart, localStart);
    const late = updateClockEstimate(onTime, serverStart + 1000, localStart + 1400);

    for (let now = localStart + 1400; now < localStart + 3000; now += 100) {
      expect(getEstimatedClock(late, now)).toBe(getEstimatedClock(onTime, now));
    }
  });

  it('absorbs small drift gradually', () => {
    const estimate = updateClockEstimate(null, serverStart, localStart);
    const ahead = updateClockEstimate(estimate, serverStart + 1100, localStart + 1000);

    expect(getEstimatedClock(ahead, localStart + 1000)).toBe(serverStart + 1000);
    expect(getEstimatedClock(ahead, localStart + 1200)).toBe(serverStart + 1200 + 200 * slewRate);
    expect(getEstimatedClock(ahead, localStart + 2000)).toBe(serverStart + 2100);
  });

  it.each([
    ['forwards', 5000],
    ['backwards', -5000],
  ])('snaps when the server clock jumps %s', (_, jump) => {
    const estimate = updateClockEstimate(null, serverStart, localStart);
    const jumped = updateClockEstimate(estimate, serverStart + 1000 + jump, localStart + 1000);
    expect(getEstimatedClock(jumped, localStart + 1000)).toBe(serverStart + 1000 + jump);
  });

  it('wraps at midnight', () => {
    const beforeMidnight = dayInMs - 500;
    const estimate = updateClockEstimate(null, beforeMidnight, localStart);
    expect(getEstimatedClock(estimate, localStart + 800)).toBe(300);

    // a value just after midnight is a small correction, not a day apart
    const corrected = updateClockEstimate(estimate, 340, localStart + 800);
    expect(getEstimatedClock(corrected, localStart + 800)).toBe(300);
    expect(getEstimatedClock(corrected, localStart + 1000)).toBe(540);
  });
});

describe('getNextTickDelay', () => {
  it('aligns the next draw to the change of second', () => {
    const estimate = updateClockEstimate(null, serverStart + 250, localStart);
    const delay = getNextTickDelay(estimate, localStart);

    expect(delay).toBeGreaterThan(750);
    expect(delay).toBeLessThan(800);
    expect(getEstimatedClock(estimate, localStart + delay) % 1000).toBeLessThan(50);
  });
});

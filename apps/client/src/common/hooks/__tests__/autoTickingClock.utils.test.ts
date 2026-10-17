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

  it('snaps when the server clock jumps forwards', () => {
    const estimate = updateClockEstimate(null, serverStart, localStart);
    const jumped = updateClockEstimate(estimate, serverStart + 6000, localStart + 1000);
    expect(getEstimatedClock(jumped, localStart + 1000)).toBe(serverStart + 6000);
  });

  it('snaps back only once the server clock stays behind', () => {
    let estimate = updateClockEstimate(null, serverStart, localStart);

    estimate = updateClockEstimate(estimate, serverStart - 4000, localStart + 1000);
    expect(getEstimatedClock(estimate, localStart + 1000)).toBe(serverStart + 1000);

    estimate = updateClockEstimate(estimate, serverStart - 3000, localStart + 2000);
    expect(getEstimatedClock(estimate, localStart + 2000)).toBe(serverStart - 3000);
  });

  it('keeps counting through a burst of packets delayed by a stall', () => {
    let estimate = updateClockEstimate(null, serverStart, localStart);

    // the connection stalls for 3 seconds, then the queued packets arrive together
    const burstAt = localStart + 4000;
    [1000, 2000, 3000, 4000].forEach((second, index) => {
      estimate = updateClockEstimate(estimate, serverStart + second, burstAt + index);
    });

    expect(getEstimatedClock(estimate, burstAt + 10)).toBe(serverStart + 4010);
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

  it.each([
    // a faster clock reaches the second sooner
    { name: 'running faster', serverClock: serverStart + 1900, receivedAt: localStart + 1000, expected: 810 },
    // the correction finishes 400ms in, at 500ms of clock, the remaining 500ms run at normal speed
    { name: 'finishing a correction', serverClock: serverStart + 1100, receivedAt: localStart + 1000, expected: 910 },
    // the first sample has left the window, so the slower one becomes the target
    { name: 'running slower', serverClock: serverStart + 5100, receivedAt: localStart + 6000, expected: 1344 },
  ])('aligns the next draw while $name to correct drift', ({ serverClock, receivedAt, expected }) => {
    const initial = updateClockEstimate(null, serverStart, localStart);
    const estimate = updateClockEstimate(initial, serverClock, receivedAt);
    const delay = getNextTickDelay(estimate, receivedAt);

    expect(delay).toBe(expected);
    expect(getEstimatedClock(estimate, receivedAt + delay) % 1000).toBeLessThan(50);
  });
});

import { MessageTag } from 'ontime-types';
import { dayInMs } from 'ontime-utils';
import { describe, expect, it } from 'vitest';

import { getDisplayedClock, measurePong, sampleClockOffset } from '../clockSync';

describe('measurePong()', () => {
  const pendingPing = { payload: new Date(1000), sentAt: 100 };
  const pong = { tag: MessageTag.Pong, payload: pendingPing.payload, clock: 10000 } as const;

  it('anchors the server clock to the midpoint of the round trip', () => {
    expect(measurePong(pong, pendingPing, [], 300)).toEqual({
      ping: 100,
      samples: [{ offset: 9800, roundTrip: 200 }],
      offset: 9800,
    });
  });

  it('ignores a reply to a ping which is no longer pending', () => {
    expect(measurePong({ ...pong, payload: new Date(2000) }, pendingPing, [], 300)).toBeNull();
  });

  it('ignores a reply without a valid server clock', () => {
    expect(measurePong({ ...pong, clock: Number.NaN }, pendingPing, [], 300)).toBeNull();
  });

  it('keeps zero-delay replies positive, since a non-positive ping means offline', () => {
    expect(measurePong(pong, pendingPing, [], 100)?.ping).toBe(1);
  });
});

describe('sampleClockOffset()', () => {
  const previous = [{ offset: 9800, roundTrip: 200 }];

  it('prefers the least delayed sample, so congestion does not steer the clock', () => {
    // a 10s round trip measures 9900, within the uncertainty of the slow sample
    expect(sampleClockOffset(previous, 15200, 300, 10300).offset).toBe(9800);
  });

  it('forgets samples older than the last five, so a changed offset can take effect', () => {
    const history = [{ offset: 9800, roundTrip: 10 }, ...Array(4).fill({ offset: 9900, roundTrip: 200 })];
    expect(sampleClockOffset(history, 11000, 1000, 1200).offset).toBe(9900);
  });

  it('keeps samples within a second plus the measurement uncertainty', () => {
    // 1200ms apart, within 1000ms + (200ms + 200ms) / 2
    expect(sampleClockOffset(previous, 12100, 1000, 1200).samples).toHaveLength(2);
  });

  it('starts a new set of samples after a clock jump, eg: a daylight saving change', () => {
    expect(sampleClockOffset(previous, 10900 + 3600000, 1000, 1200).samples).toEqual([
      { offset: 9800 + 3600000, roundTrip: 200 },
    ]);
  });

  it('does not treat midnight as a clock jump', () => {
    expect(sampleClockOffset(previous, 10900 - dayInMs, 1000, 1200).samples).toHaveLength(2);
  });
});

describe('getDisplayedClock()', () => {
  it('shows the current server second, changing at the next one', () => {
    expect(getDisplayedClock(9800, 1000, null)).toEqual({ clock: 10000, untilNextSecond: 200 });
  });

  it('wraps at midnight', () => {
    expect(getDisplayedClock(dayInMs - 500, 1000, null).clock).toBe(0);
  });

  it('holds the shown second until the measured clock catches up after a correction backwards', () => {
    // shown 11000, a new estimate measures 10970
    expect(getDisplayedClock(9970, 1000, 11000)).toEqual({ clock: 11000, untilNextSecond: 30 });
  });

  it('shows a clock jump at once, even backwards', () => {
    expect(getDisplayedClock(8000, 1000, 11000).clock).toBe(9000);
  });
});

import {
  advance,
  clampSpeed,
  easeCatchUp,
  frameDeltaSeconds,
  linesPerMinuteToPxPerSecond,
  MAX_FONT_SIZE,
  MAX_FRAME_DELTA_MS,
  MAX_SPEED,
  MIN_FONT_SIZE,
  MIN_SPEED,
  stepFontSize,
} from '../teleprompter.scroll';

describe('linesPerMinuteToPxPerSecond()', () => {
  test('converts a read rate into a pixel rate', () => {
    // 30 lines a minute over a 64px line is half a line a second
    expect(linesPerMinuteToPxPerSecond(30, 64)).toBe(32);
  });
});

describe('stepFontSize()', () => {
  test('steps by a ratio, so a press is the same visual change at any size', () => {
    // a fixed pixel step would be a big jump at 20px and imperceptible at 200px
    expect(stepFontSize(100, 1)).toBe(110);
    expect(stepFontSize(20, 1)).toBe(22);
  });

  test('shrinking undoes growing', () => {
    expect(stepFontSize(stepFontSize(50, 1), -1)).toBe(50);
  });

  test('stays inside the range the option accepts', () => {
    expect(stepFontSize(MAX_FONT_SIZE, 5)).toBe(MAX_FONT_SIZE);
    expect(stepFontSize(MIN_FONT_SIZE, -5)).toBe(MIN_FONT_SIZE);
  });
});

describe('clampSpeed()', () => {
  test('bounds the speed to the usable range', () => {
    expect(clampSpeed(MIN_SPEED - 10)).toBe(MIN_SPEED);
    expect(clampSpeed(MAX_SPEED + 10)).toBe(MAX_SPEED);
    expect(clampSpeed(30)).toBe(30);
  });

  test('falls back to the minimum for a non number, rather than stalling at zero', () => {
    expect(clampSpeed(Number.NaN)).toBe(MIN_SPEED);
  });
});

describe('frameDeltaSeconds()', () => {
  test('clamps a long gap so returning to a background tab cannot teleport the script', () => {
    // requestAnimationFrame is suspended while hidden, so the first timestamp
    // back can be minutes stale
    expect(frameDeltaSeconds(1000 / 60)).toBeCloseTo(1 / 60, 6);
    expect(frameDeltaSeconds(60_000)).toBe(MAX_FRAME_DELTA_MS / 1000);
  });

  test('ignores nonsense deltas', () => {
    expect(frameDeltaSeconds(-5)).toBe(0);
    expect(frameDeltaSeconds(Number.NaN)).toBe(0);
  });
});

describe('advance()', () => {
  test('accumulates sub-pixel movement without losing any to rounding', () => {
    // 32px/s sampled at 60fps is 0.53px a frame: rounding each frame would stall
    const pxPerSecond = 32;
    const frame = 1 / 60;
    let position = 0;

    for (let i = 0; i < 100; i += 1) {
      position = advance(position, pxPerSecond, frame, 10_000).position;
    }

    expect(position).toBeCloseTo((pxPerSecond * 100) / 60, 5);
  });

  test('reports the end of the script once the bottom is reached', () => {
    expect(advance(499, 100, 1, 500).atEnd).toBe(true);
    expect(advance(100, 100, 1, 500).atEnd).toBe(false);
  });

  test('reports the end without bounding the position, which the caller owns', () => {
    // the loop has to bound the position anyway, for nudges and for a document
    // which shrank, so this does not do it a second time
    expect(advance(490, 100, 1, 500)).toEqual({ position: 590, atEnd: true });
  });

  test('never reports the end for a document which does not overflow', () => {
    // it may simply not have been measured yet, and stopping playback on an
    // unmeasured document would look like the prompter refusing to run
    expect(advance(0, 100, 1, 0).atEnd).toBe(false);
  });
});

describe('easeCatchUp()', () => {
  test('approaches the target monotonically from either side', () => {
    let fromAbove = 500;
    let fromBelow = 0;
    let previousAbove = 501;
    let previousBelow = -1;

    for (let i = 0; i < 20; i += 1) {
      fromBelow = easeCatchUp(fromBelow, 500, 1 / 60);
      fromAbove = easeCatchUp(fromAbove, 0, 1 / 60);

      expect(fromBelow).toBeGreaterThan(previousBelow);
      expect(fromBelow).toBeLessThanOrEqual(500);
      expect(fromAbove).toBeLessThan(previousAbove);
      expect(fromAbove).toBeGreaterThanOrEqual(0);

      previousBelow = fromBelow;
      previousAbove = fromAbove;
    }
  });

  test('settles exactly on the target instead of creeping forever', () => {
    let position = 0;
    for (let i = 0; i < 300; i += 1) {
      position = easeCatchUp(position, 500, 1 / 60);
    }
    expect(position).toBe(500);
  });

  test('is framerate independent, so a jump takes the same time on any display', () => {
    let atSixty = 0;
    for (let i = 0; i < 60; i += 1) {
      atSixty = easeCatchUp(atSixty, 1000, 1 / 60);
    }

    let atThirty = 0;
    for (let i = 0; i < 30; i += 1) {
      atThirty = easeCatchUp(atThirty, 1000, 1 / 30);
    }

    expect(atSixty).toBeCloseTo(atThirty, 3);
  });
});

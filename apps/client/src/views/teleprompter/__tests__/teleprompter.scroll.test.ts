import {
  advance,
  anchorAtReadPoint,
  type BlockGeometry,
  clampSpeed,
  easeCatchUp,
  FOLLOW_BREAK_LINES,
  frameDeltaSeconds,
  hasBrokenFollow,
  indexAtReadPoint,
  linesPerMinuteToPxPerSecond,
  MAX_FONT_SIZE,
  MAX_FRAME_DELTA_MS,
  MAX_SPEED,
  MIN_FONT_SIZE,
  MIN_SPEED,
  readPointForAnchor,
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

describe('hasBrokenFollow()', () => {
  const lineHeight = 40;

  test('tolerates drift under the threshold, so momentum or a stray touch does not break it', () => {
    const underThreshold = lineHeight * FOLLOW_BREAK_LINES - 1;
    expect(hasBrokenFollow(underThreshold, lineHeight)).toBe(false);
    expect(hasBrokenFollow(-underThreshold, lineHeight)).toBe(false);
  });

  test('counts a deliberate scroll past the threshold, in either direction', () => {
    const overThreshold = lineHeight * FOLLOW_BREAK_LINES + 1;
    expect(hasBrokenFollow(overThreshold, lineHeight)).toBe(true);
    expect(hasBrokenFollow(-overThreshold, lineHeight)).toBe(true);
  });

  test('never breaks follow before the document has been measured', () => {
    // an unmeasured line height would make any distance look like a break
    expect(hasBrokenFollow(10_000, 0)).toBe(false);
  });
});

describe('the read anchor', () => {
  const script: BlockGeometry[] = [
    { id: 'welcome', top: 0, height: 100 },
    { id: 'keynote', top: 100, height: 300 },
    { id: 'lunch', top: 400, height: 100 },
  ];
  const ids = script.map((block) => block.id);

  describe('indexAtReadPoint()', () => {
    test('finds the block the reading line is over', () => {
      expect(indexAtReadPoint(150, script)).toBe(1);
      expect(indexAtReadPoint(400, script)).toBe(2);
    });

    test('clamps past either end, so a jump from there still lands on a block', () => {
      expect(indexAtReadPoint(-50, script)).toBe(0);
      expect(indexAtReadPoint(10_000, script)).toBe(2);
    });

    test('reports no block for an empty script', () => {
      expect(indexAtReadPoint(0, [])).toBe(-1);
    });
  });

  describe('readPointForAnchor()', () => {
    test('round trips an unchanged document', () => {
      const anchor = anchorAtReadPoint(250, script);
      expect(anchor).toEqual({ blockId: 'keynote', offset: 150 });
      expect(readPointForAnchor(anchor!, script, ids)).toBe(250);
    });

    test('holds the same words under the reading line when an event above grows', () => {
      // the whole point: the rundown is edited while it is being read, and an
      // edit above the reader moves every pixel below it
      const anchor = anchorAtReadPoint(250, script);
      const grown: BlockGeometry[] = [
        { id: 'welcome', top: 0, height: 180 },
        { id: 'keynote', top: 180, height: 300 },
        { id: 'lunch', top: 480, height: 100 },
      ];
      expect(readPointForAnchor(anchor!, grown, ids)).toBe(330);
    });

    test('follows the anchored event when the rundown is reordered', () => {
      const anchor = anchorAtReadPoint(250, script);
      const reordered: BlockGeometry[] = [
        { id: 'lunch', top: 0, height: 100 },
        { id: 'welcome', top: 100, height: 100 },
        { id: 'keynote', top: 200, height: 300 },
      ];
      expect(readPointForAnchor(anchor!, reordered, ids)).toBe(350);
    });

    test('stays inside an event which was edited shorter than the read offset', () => {
      const anchor = anchorAtReadPoint(250, script);
      const trimmed: BlockGeometry[] = [
        { id: 'welcome', top: 0, height: 100 },
        { id: 'keynote', top: 100, height: 40 },
        { id: 'lunch', top: 140, height: 100 },
      ];
      expect(readPointForAnchor(anchor!, trimmed, ids)).toBe(140);
    });

    test('falls back to the end of the nearest surviving event when the anchored one is deleted', () => {
      // where the deleted text used to begin, rather than wherever its pixels
      // now happen to point
      const anchor = anchorAtReadPoint(250, script);
      const deleted: BlockGeometry[] = [
        { id: 'welcome', top: 0, height: 100 },
        { id: 'lunch', top: 100, height: 100 },
      ];
      expect(readPointForAnchor(anchor!, deleted, ids)).toBe(100);
    });

    test('gives up rather than guessing when nothing before the anchor survives', () => {
      const anchor = anchorAtReadPoint(250, script);
      expect(readPointForAnchor(anchor!, [{ id: 'lunch', top: 0, height: 100 }], ids)).toBeNull();
    });
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

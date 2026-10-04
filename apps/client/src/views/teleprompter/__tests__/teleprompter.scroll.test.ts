import {
  advance,
  anchorAtReadPoint,
  type BlockGeometry,
  easeCatchUp,
  FOLLOW_BREAK_LINES,
  frameDeltaSeconds,
  hasBrokenFollow,
  indexAtReadPoint,
  MAX_FRAME_DELTA_MS,
  readPointForAnchor,
  segmentAfter,
  segmentEndFor,
} from '../teleprompter.scroll';

describe('frameDeltaSeconds()', () => {
  test('caps a long gap, so a tab returning from the background does not jump the script', () => {
    expect(frameDeltaSeconds(1000 / 60)).toBeCloseTo(1 / 60, 6);
    expect(frameDeltaSeconds(60_000)).toBe(MAX_FRAME_DELTA_MS / 1000);
  });
});

describe('advance()', () => {
  test('accumulates sub-pixel movement, which rounding each frame would stall', () => {
    // 32px/s at 60fps is about half a pixel per frame
    let position = 0;
    for (let i = 0; i < 100; i += 1) {
      position = advance(position, 32, 1 / 60, 10_000).position;
    }
    expect(position).toBeCloseTo((32 * 100) / 60, 5);
  });

  test('reports the end once the bottom is reached', () => {
    expect(advance(499, 100, 1, 500).atEnd).toBe(true);
    expect(advance(100, 100, 1, 500).atEnd).toBe(false);
  });

  test('never reports the end of a document which does not overflow, as it may not be measured yet', () => {
    expect(advance(0, 100, 1, 0).atEnd).toBe(false);
  });
});

describe('easeCatchUp()', () => {
  test('lands exactly on the target, so the ease can end', () => {
    let position = 0;
    for (let i = 0; i < 300; i += 1) {
      position = easeCatchUp(position, 500, 1 / 60);
    }
    expect(position).toBe(500);
  });

  test('takes the same time at any framerate', () => {
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

describe('hasBrokenFollow()', () => {
  const lineHeight = 40;

  test('breaks follow only once the reader has moved past the threshold, in either direction', () => {
    const threshold = lineHeight * FOLLOW_BREAK_LINES;
    expect(hasBrokenFollow(threshold - 1, lineHeight)).toBe(false);
    expect(hasBrokenFollow(threshold + 1, lineHeight)).toBe(true);
    expect(hasBrokenFollow(-(threshold + 1), lineHeight)).toBe(true);
  });

  test('never breaks follow before the document has been measured', () => {
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
  const anchor = anchorAtReadPoint(250, script)!;

  test('indexAtReadPoint() clamps past either end, so a jump from there still lands on a block', () => {
    expect(indexAtReadPoint(150, script)).toBe(1);
    expect(indexAtReadPoint(-50, script)).toBe(0);
    expect(indexAtReadPoint(10_000, script)).toBe(2);
  });

  test('keeps the same words under the reading line when an event above grows', () => {
    const grown: BlockGeometry[] = [
      { id: 'welcome', top: 0, height: 180 },
      { id: 'keynote', top: 180, height: 300 },
      { id: 'lunch', top: 480, height: 100 },
    ];
    expect(readPointForAnchor(anchor, grown, ids)).toBe(330);
  });

  test('follows the anchored event when the rundown is reordered', () => {
    const reordered: BlockGeometry[] = [
      { id: 'lunch', top: 0, height: 100 },
      { id: 'welcome', top: 100, height: 100 },
      { id: 'keynote', top: 200, height: 300 },
    ];
    expect(readPointForAnchor(anchor, reordered, ids)).toBe(350);
  });

  test('stays inside an event which was edited shorter than the read offset', () => {
    const trimmed: BlockGeometry[] = [
      { id: 'welcome', top: 0, height: 100 },
      { id: 'keynote', top: 100, height: 40 },
      { id: 'lunch', top: 140, height: 100 },
    ];
    expect(readPointForAnchor(anchor, trimmed, ids)).toBe(140);
  });

  test('keeps a read point resting in the gap between events', () => {
    // blocks are spaced by a margin which is not part of their height
    const spaced: BlockGeometry[] = [
      { id: 'welcome', top: 0, height: 100 },
      { id: 'keynote', top: 150, height: 300 },
    ];
    const inGap = anchorAtReadPoint(120, spaced)!;
    expect(readPointForAnchor(inGap, spaced, ['welcome', 'keynote'])).toBe(120);
  });

  test('lands where a deleted event used to begin', () => {
    const deleted: BlockGeometry[] = [
      { id: 'welcome', top: 0, height: 100 },
      { id: 'lunch', top: 100, height: 100 },
    ];
    expect(readPointForAnchor(anchor, deleted, ids)).toBe(100);
  });

  test('gives up rather than guessing when nothing before the anchor survives', () => {
    expect(readPointForAnchor(anchor, [{ id: 'lunch', top: 0, height: 100 }], ids)).toBeNull();
  });
});

describe('segmentAfter()', () => {
  const readingOffset = 100;
  const script: BlockGeometry[] = [
    { id: 'welcome', top: 0, height: 300 },
    { id: 'keynote', top: 300, height: 500 },
  ];

  const endAfter = (position: number) => {
    const block = segmentAfter(position, readingOffset, script);
    return block === null ? null : segmentEndFor(block, readingOffset);
  };

  test('stops playback at the end of the event being read', () => {
    expect(endAfter(0)).toBe(200);
    expect(endAfter(150)).toBe(200);
  });

  test('moves on to the next event from a position parked on a boundary', () => {
    expect(endAfter(200)).toBe(700);
  });

  test('treats a position within measurement noise of a boundary as parked on it', () => {
    expect(endAfter(199.5)).toBe(700);
    expect(endAfter(190)).toBe(200);
  });

  test('leaves the end of the script as the bound past the last event', () => {
    expect(endAfter(700)).toBeNull();
  });
});

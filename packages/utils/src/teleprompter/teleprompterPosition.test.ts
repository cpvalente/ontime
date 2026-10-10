import type { TeleprompterLine, TeleprompterScriptEvent } from 'ontime-types';

import {
  anchorAtRow,
  makeTeleprompterLayout,
  mapOffsetThroughEdit,
  reanchor,
  rowOfAnchor,
  startOfEvent,
} from './teleprompterPosition.js';
import { wrapText } from './teleprompterWrap.js';

/** An event as the script shows it: a heading, its text cut at 12 characters, and a blank line */
function makeEvent(id: string, text: string): TeleprompterScriptEvent {
  const lines: TeleprompterLine[] = [
    { kind: 'heading', text: id },
    ...wrapText(text, 12).map((line) => ({ kind: 'text' as const, text: line.text, start: line.start })),
    { kind: 'blank' },
  ];
  return { id, cue: id, title: id, lines };
}

describe('makeTeleprompterLayout()', () => {
  test('places reading between the headings above an event and the gap after it', () => {
    const layout = makeTeleprompterLayout([makeEvent('a', 'one two three four'), makeEvent('b', '')]);
    expect(layout.events).toMatchObject([
      // heading, 2 lines of text, blank
      { id: 'a', firstRow: 0, startRow: 1, endRow: 3, nextRow: 4 },
      // an event without text starts and ends where its text would be
      { id: 'b', firstRow: 4, startRow: 5, endRow: 5, nextRow: 6 },
    ]);
    expect(layout.rowCount).toBe(6);
  });
});

describe('the position is a place in the text, never a line number', () => {
  const layout = makeTeleprompterLayout([makeEvent('a', 'one two three four'), makeEvent('b', 'five six')]);

  test('a line of text is anchored at its first character', () => {
    expect(anchorAtRow(layout, 2)).toEqual({ eventId: 'a', charOffset: 8, lines: 0 });
  });

  test('headings and gaps are anchored by their distance from the text', () => {
    expect(anchorAtRow(layout, 0)).toEqual({ eventId: 'a', charOffset: 0, lines: -1 });
    expect(anchorAtRow(layout, 3)).toEqual({ eventId: 'a', charOffset: 8, lines: 1 });
  });

  test.each([0, 1, 1.5, 2.25, 3, 3.5, 4, 5, 5.75])('row %d maps to an anchor and back', (row) => {
    const anchor = anchorAtRow(layout, row);
    expect(anchor).not.toBeNull();
    expect(rowOfAnchor(layout, anchor!)).toBe(row);
  });

  test('the start of an event is its first line of text', () => {
    expect(rowOfAnchor(layout, startOfEvent('b'))).toBe(5);
  });

  test('an anchor to an event outside the script has no row', () => {
    expect(rowOfAnchor(layout, startOfEvent('gone'))).toBeNull();
  });
});

describe('editing another event never moves the reader', () => {
  test('an event above grows, and the reader stays on the same words', () => {
    const previous = [makeEvent('a', 'one'), makeEvent('b', 'five six seven eight')];
    const next = [makeEvent('a', 'one two three four five six'), previous[1]];
    const anchor = anchorAtRow(makeTeleprompterLayout(previous), 4)!;

    const moved = reanchor(previous, next, anchor);
    expect(moved).toEqual(anchor);
    expect(rowOfAnchor(makeTeleprompterLayout(next), moved!)).toBe(6);
  });
});

describe('editing the reader event', () => {
  test.each([
    ['a change after the reader leaves them in place', 'one two three', 'one two three four', 4, 4],
    ['a change starting at the reader leaves them in place', 'one two three', 'one zero two three', 4, 4],
    ['a change before the reader shifts them by the difference', 'one two three', 'zero one two three', 8, 13],
    ['a shorter text before the reader shifts them back', 'one two three', 'two three', 8, 4],
    ['a change around the reader moves them to its start', 'one two three', 'one TWO three', 5, 4],
    ['an unchanged text leaves them in place', 'one two three', 'one two three', 8, 8],
  ])('%s', (_, previous, next, offset, expected) => {
    expect(mapOffsetThroughEdit(previous, next, offset)).toBe(expected);
  });

  test('the edit is found through the lines of the script', () => {
    const previous = [makeEvent('a', 'one two three four five six')];
    const next = [makeEvent('a', 'zero one two three four five six')];
    // reading "five six"
    const anchor = anchorAtRow(makeTeleprompterLayout(previous), 3)!;
    expect(anchor.charOffset).toBe(19);

    expect(reanchor(previous, next, anchor)).toEqual({ ...anchor, charOffset: 24 });
  });

  test('cutting the text differently is not an edit', () => {
    const text = 'one two three four five six';
    const previous = [makeEvent('a', text)];
    const wider: TeleprompterScriptEvent = {
      ...previous[0],
      lines: wrapText(text, 20).map((line) => ({ kind: 'text', text: line.text, start: line.start })),
    };
    const anchor = { eventId: 'a', charOffset: 19, lines: 0 };
    expect(reanchor(previous, [wider], anchor)).toEqual(anchor);
  });
});

describe('events which move or disappear', () => {
  const a = makeEvent('a', 'one two');
  const b = makeEvent('b', 'three four');
  const c = makeEvent('c', 'five six');
  const inB = { eventId: 'b', charOffset: 6, lines: 0.5 };

  test('the reader moves with their event', () => {
    expect(reanchor([a, b, c], [b, a, c], inB)).toEqual(inB);
  });

  test('a deleted event leaves the reader where its text used to begin', () => {
    expect(reanchor([a, b, c], [a, c], inB)).toEqual(startOfEvent('c'));
  });

  test('a deleted last event leaves the reader at the end of the script', () => {
    const next = [a];
    const end = makeTeleprompterLayout(next).events[0].endRow;
    expect(rowOfAnchor(makeTeleprompterLayout(next), reanchor([a, b], next, inB)!)).toBe(end);
  });

  test('with nothing of the previous script left, the reader goes to the top', () => {
    const other = [makeEvent('x', 'seven'), makeEvent('y', 'eight')];
    expect(reanchor([a, b, c], other, inB)).toEqual(startOfEvent('x'));
  });

  test('an empty script has no position', () => {
    expect(reanchor([a, b, c], [], inB)).toBeNull();
  });
});

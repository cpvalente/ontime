import type { TeleprompterLine, TeleprompterScriptEvent, TeleprompterTransport } from 'ontime-types';

import { makeTeleprompterLayout, startOfEvent } from './teleprompterPosition.js';
import {
  applyTransportCommand,
  describeSync,
  describeTransport,
  positionAt,
  reanchorTransport,
  settle,
  syncPositionAt,
  type TeleprompterTransportCommand,
} from './teleprompterTransport.js';
import { wrapText } from './teleprompterWrap.js';

/** An event with a heading, some lines of text 10 characters apart, and a blank line */
function makeEvent(id: string, textLines: number): TeleprompterScriptEvent {
  const lines: TeleprompterLine[] = [{ kind: 'heading', text: id }];
  for (let i = 0; i < textLines; i++) {
    lines.push({ kind: 'text', text: `${id} line ${i}`, start: i * 10 });
  }
  lines.push({ kind: 'blank' });
  return { id, cue: id.toUpperCase(), title: id, lines };
}

// a: heading 0, text 1-2, blank 3 | b: heading 4, text 5-7, blank 8 | c: heading 9, text 10, blank 11
const events = [makeEvent('a', 2), makeEvent('b', 3), makeEvent('c', 1)];
const layout = makeTeleprompterLayout(events);
/** The transport reading the whole script, rather than stopping at the end of each event */
const freeRun = (transport: TeleprompterTransport): TeleprompterTransport => ({ ...transport, mode: 'script' });

function makeState(patch: Partial<TeleprompterTransport> = {}): TeleprompterTransport {
  return {
    playback: 'pause',
    mode: 'event',
    speed: 30,
    anchor: startOfEvent('a'),
    at: 0,
    ended: null,
    ...patch,
  };
}

function apply(state: TeleprompterTransport, command: TeleprompterTransportCommand, now = 0) {
  return applyTransportCommand(state, command, layout, now);
}

describe('the transport holds playback, a forward speed of 1 to 100 lines per minute, an anchor and the time it was set', () => {
  test.each([
    [{ type: 'speed', value: 20 }, 20],
    [{ type: 'speed', value: 0 }, 1],
    [{ type: 'speedBy', value: -5 }, 25],
    [{ type: 'speedBy', value: 200 }, 100],
  ] as const)('%j sets speed %d', (command, speed) => {
    expect(apply(makeState(), command).speed).toBe(speed);
  });

  test('a repeated command is still a change of state', () => {
    const first = apply(makeState(), { type: 'speed', value: 20 }, 1000);
    expect(apply(first, { type: 'speed', value: 20 }, 2000)).not.toEqual(first);
  });
});

describe('the position is calculated from the transport and the clock', () => {
  test.each([
    ['paused, at its anchor', makeState(), 5000, 1],
    ['playing, moved by speed × time', makeState({ playback: 'play' }), 1000, 1.5],
  ])('%s', (_, state, now, row) => {
    expect(positionAt(freeRun(state), layout, now)).toBe(row);
  });

  test('playback is held at the end of the event when event by event, at the end of the script reading the whole script', () => {
    expect(positionAt(makeState({ playback: 'play' }), layout, 60_000)).toBe(3);
    expect(positionAt(freeRun(makeState({ playback: 'play' })), layout, 60_000)).toBe(11);
  });

  test('an anchor to an event the screen does not have yet has no position', () => {
    expect(positionAt(makeState({ anchor: startOfEvent('new') }), layout, 0)).toBeNull();
  });
});

describe('playback reaching an end', () => {
  test('event by event, it stops at the end of the event and says so', () => {
    expect(settle(makeState({ playback: 'play' }), layout, 4000)).toMatchObject({
      playback: 'pause',
      ended: 'event',
      at: 4000,
    });
  });

  test('event by event, playing again reads on to the end of the next event', () => {
    const stopped = settle(makeState({ playback: 'play' }), layout, 4000);
    const playing = apply(stopped, { type: 'play' }, 4000);
    expect(positionAt(playing, layout, 60_000)).toBe(8);
  });

  test('event by event, the last event ends the script', () => {
    const atLast = makeState({ playback: 'play', anchor: startOfEvent('c') });
    expect(settle(atLast, layout, 60_000)).toMatchObject({ playback: 'pause', ended: 'script' });
  });

  test('whole script, it reads across events and stops at the end of the script', () => {
    expect(settle(freeRun(makeState({ playback: 'play' })), layout, 6000)).toMatchObject({ playback: 'play' });
    expect(settle(freeRun(makeState({ playback: 'play' })), layout, 60_000)).toMatchObject({
      playback: 'pause',
      ended: 'script',
    });
  });

  test('playing from the end of the script stops straight away', () => {
    const atEnd = settle(freeRun(makeState({ playback: 'play' })), layout, 60_000);
    expect(apply(atEnd, { type: 'play' }, 61_000)).toMatchObject({ playback: 'pause', ended: 'script' });
  });
});

describe('moving the reader keeps the play state', () => {
  test.each<[string, TeleprompterTransportCommand, number]>([
    ['scroll by lines', { type: 'scroll', lines: 2 }, 3],
    ['scroll back past the top', { type: 'scroll', lines: -20 }, 0],
    ['next', { type: 'next' }, 5],
    ['go to', { type: 'goto', eventId: 'c' }, 10],
  ])('%s', (_, command, row) => {
    for (const playback of ['play', 'pause'] as const) {
      const moved = apply(freeRun(makeState({ playback })), command, 0);
      expect(moved.playback).toBe(playback);
      expect(positionAt(moved, layout, 0)).toBe(row);
    }
  });

  test('scrolling stops at the end of the script', () => {
    expect(positionAt(apply(makeState(), { type: 'scroll', lines: 50 }), layout, 0)).toBe(11);
  });

  test('top goes to the start of the script', () => {
    const inB = makeState({ anchor: { eventId: 'b', charOffset: 10, lines: 0 } });
    expect(positionAt(apply(inB, { type: 'top' }), layout, 0)).toBe(1);
  });

  describe('previous restarts the event once the reader is more than a line into its text, like a media player', () => {
    test.each([
      ['at the start of b, goes to a', startOfEvent('b'), 1],
      ['a line into b, goes to a', { eventId: 'b', charOffset: 10, lines: 0 }, 1],
      ['in the heading of b, goes to a', { eventId: 'b', charOffset: 0, lines: -1 }, 1],
      ['past a line into b, restarts b', { eventId: 'b', charOffset: 10, lines: 0.5 }, 5],
      ['at the end of b, restarts b', { eventId: 'b', charOffset: 20, lines: 1 }, 5],
      ['at the start of the script, stays', startOfEvent('a'), 1],
    ])('%s', (_, anchor, row) => {
      expect(positionAt(apply(makeState({ anchor }), { type: 'previous' }), layout, 0)).toBe(row);
    });
  });

  test('a go to an event which is not in the script is refused', () => {
    expect(() => apply(makeState(), { type: 'goto', eventId: 'missing' })).toThrow('Event not found');
  });
});

test('a new script during playback re-anchors the reader, who carries on without a jump', () => {
  const playing = makeState({ playback: 'play', anchor: startOfEvent('b'), at: 0 });
  // the event above gains two lines
  const edited = [makeEvent('a', 4), events[1], events[2]];

  const moved = reanchorTransport(freeRun(playing), events, edited, 1000);
  expect(moved).toMatchObject({ playback: 'play', at: 1000, anchor: { eventId: 'b' } });

  const before = positionAt(freeRun(playing), layout, 1500)!;
  const after = positionAt(moved, makeTeleprompterLayout(edited), 1500)!;
  expect(after - before).toBeCloseTo(2);
});

test('a paused reader keeps their place in the text however often the lines are cut differently', () => {
  const text = 'the quick brown fox jumps over the lazy dog and runs off into the woods';
  const cutAt = (charsPerLine: number): TeleprompterScriptEvent[] => [
    {
      id: 'a',
      cue: 'A',
      title: 'a',
      lines: wrapText(text, charsPerLine).map((line) => ({ kind: 'text', text: line.text, start: line.start })),
    },
  ];
  // cut at 12, a line starts at character 31, which is inside a line when cut at 20
  const narrow = cutAt(12);
  const wide = cutAt(20);
  const anchor = { eventId: 'a', charOffset: 31, lines: 0 };
  const paused = makeState({ anchor });

  const widened = reanchorTransport(paused, narrow, wide, 1000);
  const narrowedAgain = reanchorTransport(widened, wide, narrow, 2000);
  expect(narrowedAgain.anchor).toEqual(anchor);
});

test('switching to event by event while reading the whole script leaves the reader where they are', () => {
  // playing from the start of a, through the whole script, has moved into b
  const playing = freeRun(makeState({ playback: 'play', anchor: startOfEvent('a'), at: 0 }));
  expect(positionAt(playing, layout, 6000)).toBe(4);

  const switched = apply(playing, { type: 'mode', mode: 'event' }, 6000);
  expect(switched).toMatchObject({ mode: 'event', playback: 'play' });
  expect(positionAt(switched, layout, 6000)).toBe(4);
});

test('the mode toggles between event by event and the whole script', () => {
  const toggled = apply(makeState(), { type: 'mode', mode: 'toggle' });
  expect(toggled.mode).toBe('script');
  expect(apply(toggled, { type: 'mode', mode: 'toggle' }).mode).toBe('event');
});

test('any command clears where playback ended', () => {
  const stopped = settle(makeState({ playback: 'play' }), layout, 4000);
  expect(stopped.ended).toBe('event');
  expect(apply(stopped, { type: 'speed', value: 20 }, 5000).ended).toBeNull();
});

test('a command while paused keeps the reader on their exact anchor', () => {
  const between = { eventId: 'b', charOffset: 15, lines: 0.25 };
  expect(apply(makeState({ anchor: between }), { type: 'speed', value: 20 }).anchor).toEqual(between);
});

test('playback carries on across midnight on the server clock', () => {
  // set 2 seconds before midnight, read 2 seconds after
  const playing = makeState({ playback: 'play', at: 86_398_000 });
  expect(positionAt(freeRun(playing), layout, 2000)).toBe(3);
});

test('a clock a little behind the time the transport changed has not moved the reader', () => {
  // a screen's clock trails the server's by the time a message takes to arrive
  const playing = makeState({ playback: 'play', at: 10_000 });
  expect(positionAt(playing, layout, 9950)).toBe(positionAt(playing, layout, 10_000));
  expect(settle(playing, layout, 9950)).toBe(playing);
  expect(syncPositionAt(describeSync(playing, layout, 1), 9950)).toBe(positionAt(playing, layout, 10_000));
});

test('a clock a little behind a change just after midnight has not moved the reader either', () => {
  const playing = makeState({ playback: 'play', at: 10 });
  expect(positionAt(playing, layout, 86_399_970)).toBe(positionAt(playing, layout, 10));
  expect(settle(playing, layout, 86_399_970)).toBe(playing);
});

test('a long playback is timed for as long as it runs', () => {
  // twenty hours at one line every four hours, from the first line of a
  const crawling = makeState({ playback: 'play', speed: 1 / 240, at: 0 });
  expect(positionAt(freeRun(crawling), layout, 20 * 3_600_000)).toBeCloseTo(6, 5);
});

describe('describeTransport()', () => {
  test('a paused reader: the event they read, and the time left in its text at the current speed', () => {
    // two lines into b, one and a half lines of its text left to read at 30 lines per minute
    const paused = makeState({ anchor: { eventId: 'b', charOffset: 10, lines: 0.5 } });
    expect(describeTransport(paused, layout, 1000)).toEqual({
      playback: 'pause',
      mode: 'event',
      speed: 30,
      event: { id: 'b', cue: 'B', title: 'b' },
      remaining: 3000,
      endsAt: null,
      ended: null,
    });
  });

  test('a playing reader moves on with the clock, and their event ends at a time of day', () => {
    const playing = freeRun(makeState({ playback: 'play', anchor: startOfEvent('b'), at: 0 }));
    expect(describeTransport(playing, layout, 2000)).toMatchObject({
      playback: 'play',
      event: { id: 'b' },
      remaining: 4000,
      endsAt: 6000,
    });
  });

  test('the end of an event a reader reaches before midnight is a time of day after it', () => {
    const playing = makeState({ playback: 'play', at: 86_399_000 });
    expect(describeTransport(playing, layout, 86_399_000).endsAt).toBe(3000);
  });

  test('a reader in the heading reads the event, with all its text left', () => {
    const inHeading = makeState({ anchor: { eventId: 'b', charOffset: 0, lines: -1 } });
    expect(describeTransport(inHeading, layout, 0)).toMatchObject({ event: { id: 'b' }, remaining: 8000 });
  });

  test('playback which reached its end shows where it ended, with nothing left to read', () => {
    expect(describeTransport(makeState({ playback: 'play' }), layout, 60_000)).toMatchObject({
      playback: 'pause',
      event: { id: 'a' },
      remaining: 0,
      endsAt: null,
      ended: 'event',
    });
  });

  test('without a reading position there is no event', () => {
    expect(describeTransport(makeState({ anchor: null }), makeTeleprompterLayout([]), 0)).toMatchObject({
      event: null,
      remaining: null,
      endsAt: null,
    });
  });
});

describe('the position screens following a transport read', () => {
  test('is the row the host resolved, and where playback stops, so screens only add speed × time', () => {
    const playing = makeState({ playback: 'play', anchor: startOfEvent('b'), at: 1000 });
    const sync = describeSync(playing, layout, 7);
    expect(sync).toEqual({ revision: 7, playback: 'play', speed: 30, row: 5, until: 8, at: 1000 });

    // every screen calculates the same row from it, whenever it connected
    for (const now of [1000, 3000, 60_000]) {
      expect(syncPositionAt(sync, now)).toBe(positionAt(playing, layout, now));
    }
  });

  test('reading the whole script, playback stops at its end; paused, the row stays', () => {
    expect(describeSync(freeRun(makeState({ playback: 'play' })), layout, 1).until).toBe(11);
    const paused = describeSync(makeState({ anchor: startOfEvent('c') }), layout, 1);
    expect(paused).toMatchObject({ row: 10, until: 10 });
    expect(syncPositionAt(paused, 60_000)).toBe(10);
  });
});

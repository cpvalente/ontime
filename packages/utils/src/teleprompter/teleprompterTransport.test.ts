import type { TeleprompterLine, TeleprompterScriptEvent, TeleprompterState } from 'ontime-types';

import { makeTeleprompterLayout, startOfEvent } from './teleprompterPosition.js';
import {
  applyTransportCommand,
  msUntilChange,
  positionAt,
  reanchorTransport,
  settle,
  type TeleprompterTransportCommand,
} from './teleprompterTransport.js';

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
const cued = { cued: true };
const freeRun = { cued: false };

function makeState(patch: Partial<TeleprompterState> = {}): TeleprompterState {
  return {
    playing: false,
    speed: 30,
    anchor: startOfEvent('a'),
    since: 0,
    eventId: 'a',
    cue: 'A',
    stoppedAt: null,
    ...patch,
  };
}

function apply(state: TeleprompterState, command: TeleprompterTransportCommand, now = 0, mode = cued) {
  return applyTransportCommand(state, command, layout, now, mode);
}

describe('TRN-1 the transport holds play state, a forward speed of 1 to 40 lines per minute, an anchor and the time it was set', () => {
  test.each([
    [{ type: 'speed', value: 20 }, 20],
    [{ type: 'speed', value: 100 }, 40],
    [{ type: 'speed', value: -100 }, 1],
    [{ type: 'speed', value: 0 }, 1],
    [{ type: 'speedBy', value: -5 }, 25],
    [{ type: 'speedBy', value: -50 }, 1],
    [{ type: 'speedBy', value: 50 }, 40],
  ] as const)('%j sets speed %d', (command, speed) => {
    expect(apply(makeState(), command).speed).toBe(speed);
  });

  test('a repeated command is still a change of state', () => {
    const first = apply(makeState(), { type: 'speed', value: 20 }, 1000);
    expect(apply(first, { type: 'speed', value: 20 }, 2000)).not.toEqual(first);
  });
});

describe('TRN-2 the position is calculated from the transport and the clock', () => {
  test.each([
    ['paused, at its anchor', makeState(), 5000, 1],
    ['playing, moved by speed × time', makeState({ playing: true }), 1000, 1.5],
  ])('%s', (_, state, now, row) => {
    expect(positionAt(state, layout, now, freeRun)).toBe(row);
  });

  test('cued, playback is held at the end of the event', () => {
    expect(positionAt(makeState({ playing: true }), layout, 60_000, cued)).toBe(3);
  });

  test('free run, playback is held at the end of the script', () => {
    expect(positionAt(makeState({ playing: true }), layout, 60_000, freeRun)).toBe(11);
  });

  test('an anchor to an event the screen does not have yet has no position', () => {
    expect(positionAt(makeState({ anchor: startOfEvent('new') }), layout, 0, cued)).toBeNull();
  });
});

describe('playback reaching an end', () => {
  test('cued, it stops at the end of the event and says so', () => {
    expect(settle(makeState({ playing: true }), layout, 4000, cued)).toMatchObject({
      playing: false,
      stoppedAt: 'event',
      since: 4000,
      eventId: 'a',
    });
  });

  test('cued, playing again reads on to the end of the next event', () => {
    const stopped = settle(makeState({ playing: true }), layout, 4000, cued);
    const playing = apply(stopped, { type: 'play' }, 4000);
    expect(positionAt(playing, layout, 60_000, cued)).toBe(8);
  });

  test('cued, the last event ends the script', () => {
    const atLast = makeState({ playing: true, anchor: startOfEvent('c') });
    expect(settle(atLast, layout, 60_000, cued)).toMatchObject({ playing: false, stoppedAt: 'script' });
  });

  test('free run, it reads across events and stops at the end of the script', () => {
    expect(settle(makeState({ playing: true }), layout, 6000, freeRun)).toMatchObject({ playing: true, eventId: 'b' });
    expect(settle(makeState({ playing: true }), layout, 60_000, freeRun)).toMatchObject({
      playing: false,
      stoppedAt: 'script',
    });
  });

  test('playing from the end of the script stops straight away', () => {
    const atEnd = settle(makeState({ playing: true }), layout, 60_000, freeRun);
    expect(apply(atEnd, { type: 'play' }, 61_000, freeRun)).toMatchObject({ playing: false, stoppedAt: 'script' });
  });

  test('the next change is the end of the event when cued, or the reader moving into the next event', () => {
    expect(msUntilChange(makeState({ playing: true }), layout, 0, cued)).toBe(4000);
    expect(msUntilChange(makeState({ playing: true }), layout, 0, freeRun)).toBe(6000);
    expect(msUntilChange(makeState(), layout, 0, freeRun)).toBeNull();
  });
});

describe('TRN-6 moving the reader keeps the play state', () => {
  test.each<[string, TeleprompterTransportCommand, number]>([
    ['scroll by lines', { type: 'scroll', lines: 2 }, 3],
    ['scroll back past the top', { type: 'scroll', lines: -20 }, 0],
    ['next', { type: 'next' }, 5],
    ['go to', { type: 'goto', eventId: 'c' }, 10],
  ])('%s', (_, command, row) => {
    for (const playing of [true, false]) {
      const moved = apply(makeState({ playing }), command, 0, freeRun);
      expect(moved.playing).toBe(playing);
      expect(positionAt(moved, layout, 0, freeRun)).toBe(row);
    }
  });

  test('scrolling stops at the end of the script', () => {
    expect(positionAt(apply(makeState(), { type: 'scroll', lines: 50 }), layout, 0, cued)).toBe(11);
  });

  test('previous goes to the start of the event before the reader, top to the start of the script', () => {
    const inB = makeState({ anchor: { eventId: 'b', charOffset: 10, lines: 0 } });
    expect(positionAt(apply(inB, { type: 'previous' }), layout, 0, cued)).toBe(1);
    expect(positionAt(apply(inB, { type: 'top' }), layout, 0, cued)).toBe(1);
  });

  test('a go to an event which is not in the script is refused', () => {
    expect(() => apply(makeState(), { type: 'goto', eventId: 'missing' })).toThrow('Event not found');
  });
});

test('POS-5 a new script during playback re-anchors the reader, who carries on without a jump', () => {
  const playing = makeState({ playing: true, anchor: startOfEvent('b'), since: 0 });
  // the event above gains two lines
  const edited = [makeEvent('a', 4), events[1], events[2]];

  const moved = reanchorTransport(playing, events, edited, 1000, freeRun);
  expect(moved).toMatchObject({ playing: true, since: 1000, anchor: { eventId: 'b' } });

  const before = positionAt(playing, layout, 1500, freeRun)!;
  const after = positionAt(moved, makeTeleprompterLayout(edited), 1500, freeRun)!;
  expect(after - before).toBeCloseTo(2);
});

test('POS-5 switching to cued during free playback leaves the reader where they are', () => {
  // playing from the start of a, in free run, has moved into b
  const playing = makeState({ playing: true, anchor: startOfEvent('a'), since: 0 });
  expect(positionAt(playing, layout, 6000, freeRun)).toBe(4);

  const switched = reanchorTransport(playing, events, events, 6000, cued, freeRun);
  expect(positionAt(switched, layout, 6000, cued)).toBe(4);
  expect(switched.playing).toBe(true);
});

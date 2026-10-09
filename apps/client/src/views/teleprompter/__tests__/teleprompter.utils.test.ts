import type { TeleprompterScriptEvent } from 'ontime-types';

import {
  composeFlip,
  createScrollBatcher,
  easeTowards,
  filterToLoadedEvent,
  toTransportCommand,
  wheelToLines,
} from '../teleprompter.utils';

function makeEvent(id: string, group?: string, text = `${id} text`): TeleprompterScriptEvent {
  return {
    id,
    cue: id,
    title: id,
    group,
    lines: [
      { kind: 'heading', text: id },
      ...(text ? [{ kind: 'text' as const, text, start: 0 }] : []),
      { kind: 'blank' },
    ],
  };
}

describe('composeFlip()', () => {
  test.each([
    [{ flipH: true, flipV: false }, false, { flipH: true, flipV: false }],
    [{ flipH: false, flipV: false }, true, { flipH: true, flipV: true }],
    [{ flipH: true, flipV: false }, true, { flipH: false, flipV: true }],
    [{ flipH: true, flipV: true }, true, { flipH: false, flipV: false }],
  ])('DSP-4 view flips %j with Flip Screen %s show as %j', (view, isMirrored, expected) => {
    expect(composeFlip(view.flipH, view.flipV, isMirrored)).toEqual(expected);
  });
});

describe('DSP-6 filterToLoadedEvent()', () => {
  const events = [makeEvent('a', 'Morning'), makeEvent('b', 'Morning'), makeEvent('c', undefined, '')];

  test('shows the loaded event alone, with its group title', () => {
    expect(filterToLoadedEvent(events, 'b')).toEqual({
      events: [{ ...events[1], lines: [{ kind: 'group', text: 'Morning' }, ...events[1].lines] }],
    });
  });

  test('does not repeat a group title the event already shows', () => {
    const titled = { ...events[0], lines: [{ kind: 'group' as const, text: 'Morning' }, ...events[0].lines] };
    expect(filterToLoadedEvent([titled], 'a')).toEqual({ events: [titled] });
  });

  test('waits for an event while nothing is loaded', () => {
    expect(filterToLoadedEvent(events, null)).toEqual({ waiting: 'nothing-loaded' });
  });

  test('says a loaded event has no script, when it has no text or is not in the script', () => {
    expect(filterToLoadedEvent(events, 'c')).toEqual({ waiting: 'no-script' });
    expect(filterToLoadedEvent(events, 'skipped')).toEqual({ waiting: 'no-script' });
  });
});

describe('easeTowards()', () => {
  test('follows small moves exactly, as playback makes', () => {
    expect(easeTowards(10, 10.2, 1 / 60)).toBe(10.2);
  });

  test('animates a jump, at the same pace at any framerate', () => {
    let atSixty = 0;
    for (let i = 0; i < 30; i++) atSixty = easeTowards(atSixty, 100, 1 / 60);
    let atThirty = 0;
    for (let i = 0; i < 15; i++) atThirty = easeTowards(atThirty, 100, 1 / 30);

    expect(atSixty).toBeGreaterThan(0);
    expect(atSixty).toBeLessThan(100);
    expect(atSixty).toBeCloseTo(atThirty, 3);
  });

  test('lands on the target', () => {
    let shown = 0;
    for (let i = 0; i < 120; i++) shown = easeTowards(shown, 100, 1 / 60);
    expect(shown).toBe(100);
  });
});

describe('CTL-3 createScrollBatcher()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('sends a single step straight away', () => {
    const send = vi.fn<(lines: number) => void>();
    createScrollBatcher(send).add(1);
    expect(send).toHaveBeenCalledExactlyOnceWith(1);
  });

  test('groups a fast spin into one command per interval', () => {
    const send = vi.fn<(lines: number) => void>();
    const batcher = createScrollBatcher(send, 100);
    for (let i = 0; i < 30; i++) {
      batcher.add(1);
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(200);

    expect(send.mock.calls.length).toBeLessThanOrEqual(5);
    expect(send.mock.calls.reduce((total, [lines]) => total + lines, 0)).toBe(30);
  });

  test('sends nothing after it is disposed', () => {
    const send = vi.fn<(lines: number) => void>();
    const batcher = createScrollBatcher(send, 100);
    batcher.add(1);
    batcher.add(1);
    batcher.dispose();
    vi.advanceTimersByTime(200);
    expect(send).toHaveBeenCalledOnce();
  });
});

describe('wheelToLines()', () => {
  test.each([
    ['pixels', 120, 0, 2],
    ['lines', 3, 1, 3],
    ['pages', 1, 2, 10],
  ])('converts a wheel moving in %s', (_, delta, mode, lines) => {
    expect(wheelToLines(delta, mode, 60, 10)).toBe(lines);
  });
});

describe('LOC-2 toTransportCommand()', () => {
  test.each([
    ['toggle', { type: 'toggle' }],
    ['next', { type: 'next' }],
    [{ scroll: -1 }, { type: 'scroll', lines: -1 }],
    [{ speed: { by: 5 } }, { type: 'speedBy', value: 5 }],
    [{ speed: 20 }, { type: 'speed', value: 20 }],
    ['loaded', { type: 'goto', eventId: 'loaded-id' }],
  ] as const)('the keys act on the view itself: %j', (payload, command) => {
    expect(toTransportCommand(payload, 'loaded-id')).toEqual(command);
  });

  test('going back to the loaded event does nothing while nothing is loaded', () => {
    expect(toTransportCommand('loaded', null)).toBeNull();
  });
});

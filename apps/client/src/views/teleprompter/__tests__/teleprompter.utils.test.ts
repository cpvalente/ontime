import type { TeleprompterScriptEvent } from 'ontime-types';
import { makeTeleprompterLayout } from 'ontime-utils';

import {
  composeFlip,
  easeTowards,
  filterToLoadedEvent,
  rowInShown,
  toTeleprompterPayload,
} from '../teleprompter.utils';

function makeEvent(id: string): TeleprompterScriptEvent {
  return { id, cue: id, title: id, lines: [{ kind: 'text', text: `${id} text`, start: 0 }] };
}

describe('composeFlip()', () => {
  test.each([
    [{ flipH: true, flipV: false }, false, { flipH: true, flipV: false }],
    [{ flipH: false, flipV: false }, true, { flipH: true, flipV: true }],
    [{ flipH: true, flipV: false }, true, { flipH: false, flipV: true }],
    [{ flipH: true, flipV: true }, true, { flipH: false, flipV: false }],
  ])('view flips %j with Flip Screen %s show as %j', (view, isMirrored, expected) => {
    expect(composeFlip(view.flipH, view.flipV, isMirrored)).toEqual(expected);
  });
});

describe('filterToLoadedEvent()', () => {
  const events = [makeEvent('a'), makeEvent('b')];

  test('shows the loaded event alone', () => {
    expect(filterToLoadedEvent(events, 'b')).toEqual({ events: [events[1]] });
  });

  test('says what it waits for while nothing is loaded, or the loaded event is not in the script', () => {
    expect(filterToLoadedEvent(events, null)).toEqual({ waiting: 'nothing-loaded' });
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
});

describe('toTeleprompterPayload()', () => {
  test.each([
    [{ type: 'toggle' }, 'toggle'],
    [{ type: 'goto', target: 'loaded' }, { goto: 'loaded' }],
    [{ type: 'mode', mode: 'toggle' }, { mode: 'toggle' }],
    [{ type: 'scroll', lines: -1 }, { scroll: -1 }],
    [{ type: 'speedBy', value: 5 }, { speed: { by: 5 } }],
    [{ type: 'speed', value: 20 }, { speed: 20 }],
  ] as const)('a controller sends %j as %j', (command, payload) => {
    expect(toTeleprompterPayload(command)).toEqual(payload);
  });
});

describe('rowInShown()', () => {
  // each event is one row: a, b, c
  const script = makeTeleprompterLayout([makeEvent('a'), makeEvent('b'), makeEvent('c')]);

  test('places a row of the script in a screen showing only some events', () => {
    const onlyB = makeTeleprompterLayout([makeEvent('b')]);
    expect(rowInShown(1.5, script, onlyB)).toBe(0.5);
    expect(rowInShown(2.5, script, onlyB)).toBeNull();
    expect(rowInShown(2.5, script, script)).toBe(2.5);
  });
});

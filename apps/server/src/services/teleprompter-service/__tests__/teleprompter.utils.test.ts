import type { CustomFields, OntimeEntry, OntimeEvent, TeleprompterSettings } from 'ontime-types';
import { defaultTeleprompterSettings } from 'ontime-utils';

import {
  makeCustomField,
  makeOntimeDelay,
  makeOntimeEvent,
  makeOntimeGroup,
  makeOntimeMilestone,
  makeRundown,
} from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { buildScriptEvents } from '../teleprompter.utils.js';

function makeEvent(id: string, patch: Partial<OntimeEvent> = {}): OntimeEvent {
  return makeOntimeEvent({
    id,
    cue: id.toUpperCase(),
    title: `Title ${id}`,
    note: `Note ${id}`,
    custom: { script: `Script ${id}` },
    parent: null,
    ...patch,
  });
}

function rundownOf(entries: OntimeEntry[], order = entries.map((entry) => entry.id)) {
  return makeRundown({ order, entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])) });
}

const customFields: CustomFields = {
  script: makeCustomField({ type: 'text', label: 'Script' }),
  poster: makeCustomField({ type: 'image', label: 'Poster' }),
};

function build(entries: OntimeEntry[], settings: Partial<TeleprompterSettings> = {}, order?: string[]) {
  return buildScriptEvents(rundownOf(entries, order), customFields, { ...defaultTeleprompterSettings, ...settings });
}

describe('buildScriptEvents()', () => {
  describe('the script comes from the note, the title or a text custom field', () => {
    test.each([
      ['note', 'Note a'],
      ['title', 'Title a'],
      ['custom-script', 'Script a'],
    ])('reads %s', (script, text) => {
      const [event] = build([makeEvent('a')], { script, heading: 'none' });
      expect(event.lines).toEqual([{ kind: 'text', text, start: 0 }, { kind: 'blank' }]);
    });

    test.each(['custom-poster', 'custom-missing', 'skip', 'none', 'custom-constructor'])(
      '%s gives an empty script',
      (script) => {
        expect(build([makeEvent('a')], { script })).toEqual([]);
      },
    );
  });

  test('events appear in rundown order, without skipped events and entries which are not events', () => {
    const entries = [
      makeEvent('b'),
      makeEvent('skipped', { skip: true }),
      makeOntimeDelay({ id: 'delay' }),
      makeOntimeMilestone({ id: 'milestone' }),
      makeEvent('a'),
    ];
    expect(build(entries).map((event) => event.id)).toEqual(['b', 'a']);
  });

  describe('headings, group titles and the gap between events are lines of the script', () => {
    test.each([
      ['title', 'Title a'],
      ['cue', 'A'],
      ['both', 'A · Title a'],
    ] as const)('the %s heading', (heading, text) => {
      expect(build([makeEvent('a')], { heading })[0].lines).toEqual([
        { kind: 'heading', text },
        { kind: 'text', text: 'Note a', start: 0 },
        { kind: 'blank' },
      ]);
    });

    test('no heading, and no heading for an event without a cue', () => {
      expect(build([makeEvent('a')], { heading: 'none' })[0].lines[0].kind).toBe('text');
      expect(build([makeEvent('a', { cue: '' })], { heading: 'cue' })[0].lines[0].kind).toBe('text');
      expect(build([makeEvent('a', { cue: '' })], { heading: 'both' })[0].lines[0]).toEqual({
        kind: 'heading',
        text: 'Title a',
      });
    });

    test('a group title when the script enters a group', () => {
      const entries = [
        makeOntimeGroup({ id: 'g', title: 'Morning', entries: ['a', 'b'] }),
        makeEvent('a', { parent: 'g' }),
        makeEvent('b', { parent: 'g' }),
        makeEvent('c'),
        makeOntimeGroup({ id: 'h', title: 'Afternoon', entries: ['d'] }),
        makeEvent('d', { parent: 'h' }),
      ];
      const order = ['g', 'c', 'h'];
      const titles = (showGroups: boolean) =>
        build(entries, { showGroups }, order).map((event) => event.lines.find((line) => line.kind === 'group'));

      expect(titles(true)).toEqual([
        { kind: 'group', text: 'Morning' },
        undefined,
        undefined,
        { kind: 'group', text: 'Afternoon' },
      ]);
      expect(titles(false)).toEqual([undefined, undefined, undefined, undefined]);
    });

    test('lines keep their indentation and position in the text', () => {
      const [event] = build([makeEvent('a', { note: 'one\n  two three' })], { heading: 'none', charsPerLine: 12 });
      expect(event.lines).toEqual([
        { kind: 'text', text: 'one', start: 0 },
        { kind: 'text', text: 'two three', start: 6, indent: 2 },
        { kind: 'blank' },
      ]);
    });
  });

  test('an event missing the field reads as empty, never an error', () => {
    const entries = [makeEvent('a', { note: undefined, custom: undefined })];
    expect(build(entries, { hideEmpty: false })[0].lines).toEqual([
      { kind: 'heading', text: 'Title a' },
      { kind: 'blank' },
    ]);
    expect(build(entries, { hideEmpty: false, script: 'custom-script' })).toHaveLength(1);
  });

  test('events without script text can be hidden', () => {
    const entries = [makeEvent('a', { note: ' \n ' }), makeEvent('b')];
    expect(build(entries).map((event) => event.id)).toEqual(['b']);
    expect(build(entries, { hideEmpty: false })[0].lines).toEqual([
      { kind: 'heading', text: 'Title a' },
      { kind: 'blank' },
    ]);
  });
});

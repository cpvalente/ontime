import type { CustomFields, OntimeEntry, OntimeEvent, TeleprompterSettings } from 'ontime-types';
import { defaultTeleprompterSettings } from 'ontime-utils';

import {
  makeCustomField,
  makeOntimeDelay,
  makeOntimeEvent,
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

  describe('headings and the gap between events are lines of the script', () => {
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

    test('an event without a cue has no cue heading', () => {
      expect(build([makeEvent('a', { cue: '' })], { heading: 'cue' })[0].lines[0].kind).toBe('text');
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

  test('events without text, or without the field, are left out', () => {
    const entries = [
      makeEvent('a', { note: ' \n ' }),
      makeEvent('b', { note: undefined, custom: undefined }),
      makeEvent('c'),
    ];
    expect(build(entries).map((event) => event.id)).toEqual(['c']);
  });
});

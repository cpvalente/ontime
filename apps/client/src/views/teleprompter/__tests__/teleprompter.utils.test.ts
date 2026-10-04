import { type CustomFields, type OntimeEntry, type Rundown, SupportedEntry } from 'ontime-types';

import type { RundownMetadata, RundownMetadataObject } from '../../../common/utils/rundownMetadata';
import { buildScript, composeFlip } from '../teleprompter.utils';

function makeEvent(id: string, overrides: Partial<OntimeEntry> = {}): OntimeEntry {
  return {
    type: SupportedEntry.Event,
    id,
    cue: id.toUpperCase(),
    title: `Title ${id}`,
    note: `Note ${id}`,
    skip: false,
    custom: { script: `Script ${id}` },
    parent: null,
    ...overrides,
  } as OntimeEntry;
}

function makeGroup(id: string, title: string, entries: string[]): OntimeEntry {
  return { type: SupportedEntry.Group, id, title, entries } as OntimeEntry;
}

function makeMetadata(overrides: Partial<RundownMetadata> = {}): RundownMetadata {
  return { isPast: false, isLoaded: false, groupId: null, ...overrides } as RundownMetadata;
}

function makeRundown(entries: OntimeEntry[], flatOrder?: string[]): Rundown {
  return {
    id: 'default',
    title: 'test',
    order: flatOrder ?? entries.map((entry) => entry.id),
    flatOrder: flatOrder ?? entries.map((entry) => entry.id),
    entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
    revision: 1,
  };
}

const customFields: CustomFields = {
  script: { type: 'text', colour: '', label: 'Script' },
  poster: { type: 'image', colour: '', label: 'Poster' },
};

const defaultOptions = {
  scriptSource: 'custom-script',
  heading: 'title' as const,
  onlyPlaying: false,
  hideEmpty: true,
  showGroups: true,
};

function metadataFor(ids: string[], overrides: Record<string, Partial<RundownMetadata>> = {}): RundownMetadataObject {
  return Object.fromEntries(ids.map((id) => [id, makeMetadata(overrides[id])]));
}

describe('buildScript()', () => {
  test('resolves the script from the selected custom field, in rundown order', () => {
    const rundown = makeRundown([makeEvent('a'), makeEvent('b')]);
    const blocks = buildScript(rundown, metadataFor(['a', 'b']), customFields, defaultOptions);

    expect(blocks).toHaveLength(2);
    expect(blocks.map((block) => block.id)).toEqual(['a', 'b']);
    expect(blocks[0].text).toBe('Script a');
  });

  test('returns nothing when no script source is selected', () => {
    const rundown = makeRundown([makeEvent('a')]);
    expect(buildScript(rundown, metadataFor(['a']), customFields, { ...defaultOptions, scriptSource: 'none' })).toEqual(
      [],
    );
  });

  test('refuses an image custom field, which the select filters but the URL does not', () => {
    const rundown = makeRundown([makeEvent('a', { custom: { poster: 'https://example.com/a.png' } })]);
    const blocks = buildScript(rundown, metadataFor(['a']), customFields, {
      ...defaultOptions,
      scriptSource: 'custom-poster',
    });

    expect(blocks).toEqual([]);
  });

  test('reads the note and the title as script sources', () => {
    const rundown = makeRundown([makeEvent('a')]);
    expect(
      buildScript(rundown, metadataFor(['a']), customFields, { ...defaultOptions, scriptSource: 'note' })[0].text,
    ).toBe('Note a');
    expect(
      buildScript(rundown, metadataFor(['a']), customFields, { ...defaultOptions, scriptSource: 'title' })[0].text,
    ).toBe('Title a');
  });

  test('reads only events which are not skipped', () => {
    const rundown = makeRundown([
      makeEvent('a'),
      makeEvent('s', { skip: true }),
      { type: SupportedEntry.Delay, id: 'd', duration: 10 } as OntimeEntry,
      { type: SupportedEntry.Milestone, id: 'm', title: 'milestone' } as OntimeEntry,
    ]);

    const blocks = buildScript(rundown, metadataFor(['a', 's', 'd', 'm']), customFields, defaultOptions);
    expect(blocks.map((block) => block.id)).toEqual(['a']);
  });

  test('onlyPlaying narrows the script to the event being played', () => {
    const rundown = makeRundown([makeEvent('a'), makeEvent('b')]);
    const metadata = metadataFor(['a', 'b'], { b: { isLoaded: true } });

    expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, onlyPlaying: true }).map((b) => b.id)) //
      .toEqual(['b']);
  });

  test('onlyPlaying shows the whole script while nothing is playing', () => {
    const rundown = makeRundown([makeEvent('a'), makeEvent('b')]);

    expect(
      buildScript(rundown, metadataFor(['a', 'b']), customFields, { ...defaultOptions, onlyPlaying: true }).map(
        (b) => b.id,
      ),
    ).toEqual(['a', 'b']);
  });

  test('hideEmpty drops events with no script text', () => {
    const rundown = makeRundown([makeEvent('a', { custom: { script: '   ' } }), makeEvent('b')]);

    expect(buildScript(rundown, metadataFor(['a', 'b']), customFields, defaultOptions).map((b) => b.id)).toEqual(['b']);
    expect(
      buildScript(rundown, metadataFor(['a', 'b']), customFields, { ...defaultOptions, hideEmpty: false }).map(
        (b) => b.id,
      ),
    ).toEqual(['a', 'b']);
  });

  test('marks the block belonging to the loaded event', () => {
    const rundown = makeRundown([makeEvent('a'), makeEvent('b')]);
    const metadata = metadataFor(['a', 'b'], { b: { isLoaded: true } });

    const blocks = buildScript(rundown, metadata, customFields, defaultOptions);
    expect(blocks.map((block) => block.isLoaded)).toEqual([false, true]);
  });

  test('emits a group title once, on the first block of the group', () => {
    const rundown = makeRundown(
      [makeGroup('g', 'Morning session', ['a', 'b']), makeEvent('a'), makeEvent('b')],
      ['g', 'a', 'b'],
    );
    const metadata = metadataFor(['g', 'a', 'b'], { a: { groupId: 'g' }, b: { groupId: 'g' } });

    const blocks = buildScript(rundown, metadata, customFields, defaultOptions);
    expect(blocks.map((block) => block.groupTitle)).toEqual(['Morning session', null]);
  });

  test('repeats a group title when the script returns to it after an ungrouped event', () => {
    const rundown = makeRundown(
      [makeGroup('g', 'Morning session', ['a', 'c']), makeEvent('a'), makeEvent('b'), makeEvent('c')],
      ['g', 'a', 'b', 'c'],
    );
    const metadata = metadataFor(['g', 'a', 'b', 'c'], { a: { groupId: 'g' }, c: { groupId: 'g' } });

    const blocks = buildScript(rundown, metadata, customFields, defaultOptions);
    expect(blocks.map((block) => block.groupTitle)).toEqual(['Morning session', null, 'Morning session']);
  });

  test('does not emit group titles when they are turned off', () => {
    const rundown = makeRundown([makeGroup('g', 'Morning session', ['a']), makeEvent('a')], ['g', 'a']);
    const metadata = metadataFor(['g', 'a'], { a: { groupId: 'g' } });

    const blocks = buildScript(rundown, metadata, customFields, { ...defaultOptions, showGroups: false });
    expect(blocks[0].groupTitle).toBeNull();
  });

  describe('headings', () => {
    const rundown = makeRundown([makeEvent('a')]);
    const metadata = metadataFor(['a']);

    test('shows the title, the cue, both, or nothing', () => {
      expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, heading: 'title' })[0].heading).toBe(
        'Title a',
      );
      expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, heading: 'cue' })[0].heading).toBe('A');
      expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, heading: 'both' })[0].heading).toBe(
        'A · Title a',
      );
      expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, heading: 'none' })[0].heading).toBe('');
    });

    test('leaves no dangling separator when an event has no cue', () => {
      const noCue = makeRundown([makeEvent('a', { cue: '' })]);
      expect(buildScript(noCue, metadata, customFields, { ...defaultOptions, heading: 'both' })[0].heading).toBe(
        'Title a',
      );
    });
  });
});

describe('composeFlip()', () => {
  // Flip Screen is a rotation, which the view composes with its own mirror flips
  test.each([
    [{ flipH: true, flipV: false }, false, { flipH: true, flipV: false }],
    [{ flipH: false, flipV: false }, true, { flipH: true, flipV: true }],
    [{ flipH: true, flipV: false }, true, { flipH: false, flipV: true }],
    [{ flipH: true, flipV: true }, true, { flipH: false, flipV: false }],
  ])('view flips %j with Flip Screen %s show as %j', (view, isMirrored, expected) => {
    expect(composeFlip(view.flipH, view.flipV, isMirrored)).toEqual(expected);
  });
});

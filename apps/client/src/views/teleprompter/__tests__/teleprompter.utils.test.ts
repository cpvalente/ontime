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

  test('skips entries which are not events', () => {
    const rundown = makeRundown([
      makeEvent('a'),
      { type: SupportedEntry.Delay, id: 'd', duration: 10 } as OntimeEntry,
      { type: SupportedEntry.Milestone, id: 'm', title: 'milestone' } as OntimeEntry,
    ]);

    const blocks = buildScript(rundown, metadataFor(['a', 'd', 'm']), customFields, defaultOptions);
    expect(blocks.map((block) => block.id)).toEqual(['a']);
  });

  test('skips events flagged as skipped', () => {
    const rundown = makeRundown([makeEvent('a', { skip: true }), makeEvent('b')]);
    const blocks = buildScript(rundown, metadataFor(['a', 'b']), customFields, defaultOptions);
    expect(blocks.map((block) => block.id)).toEqual(['b']);
  });

  test('onlyPlaying narrows the script to the event being played', () => {
    const rundown = makeRundown([makeEvent('a'), makeEvent('b')]);
    const metadata = metadataFor(['a', 'b'], { b: { isLoaded: true } });

    expect(buildScript(rundown, metadata, customFields, { ...defaultOptions, onlyPlaying: true }).map((b) => b.id)) //
      .toEqual(['b']);
  });

  test('onlyPlaying shows the whole script while nothing is playing', () => {
    // narrowing to nothing would leave a blank screen, which is a worse answer
    // than the script the reader asked to see
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

  test('emits each group title as the script moves between groups', () => {
    const rundown = makeRundown(
      [
        makeGroup('g1', 'Morning session', ['a']),
        makeEvent('a'),
        makeGroup('g2', 'Afternoon session', ['b']),
        makeEvent('b'),
      ],
      ['g1', 'a', 'g2', 'b'],
    );
    const metadata = metadataFor(['g1', 'a', 'g2', 'b'], { a: { groupId: 'g1' }, b: { groupId: 'g2' } });

    const blocks = buildScript(rundown, metadata, customFields, defaultOptions);
    expect(blocks.map((block) => block.groupTitle)).toEqual(['Morning session', 'Afternoon session']);
  });

  test('repeats a group title when the script returns to it after an ungrouped event', () => {
    // the reader has lost the context by then, so naming the group again is right
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
  test('passes the per view flips through when Flip Screen is off', () => {
    expect(composeFlip(false, false, false)).toEqual({ flipH: false, flipV: false });
    expect(composeFlip(true, false, false)).toEqual({ flipH: true, flipV: false });
    expect(composeFlip(false, true, false)).toEqual({ flipH: false, flipV: true });
  });

  test('Flip Screen alone flips both axes, matching rotate(180deg) in every other view', () => {
    expect(composeFlip(false, false, true)).toEqual({ flipH: true, flipV: true });
  });

  test('a horizontal flip and Flip Screen leave only the vertical axis flipped', () => {
    // scale(-1, 1) composed with scale(-1, -1) is scale(1, -1)
    expect(composeFlip(true, false, true)).toEqual({ flipH: false, flipV: true });
  });

  test('both flips cancel Flip Screen out', () => {
    expect(composeFlip(true, true, true)).toEqual({ flipH: false, flipV: false });
  });
});

import { CustomFields, OntimeDelay, OntimeEvent, OntimeGroup, OntimeMilestone, SupportedEntry } from 'ontime-types';

import { parseQuery, searchByIndex, searchByText } from './useFinder';

function makeEvent(id: string, overrides: Partial<OntimeEvent> = {}): OntimeEvent {
  return {
    type: SupportedEntry.Event,
    id,
    cue: '',
    title: '',
    note: '',
    colour: '#000000',
    custom: {},
    parent: null,
    ...overrides,
  } as OntimeEvent;
}

function makeGroup(id: string, overrides: Partial<OntimeGroup> = {}): OntimeGroup {
  return {
    type: SupportedEntry.Group,
    id,
    title: '',
    note: '',
    colour: '#000000',
    custom: {},
    ...overrides,
  } as OntimeGroup;
}

function makeMilestone(id: string, overrides: Partial<OntimeMilestone> = {}): OntimeMilestone {
  return {
    type: SupportedEntry.Milestone,
    id,
    cue: '',
    title: '',
    note: '',
    colour: '#000000',
    custom: {},
    parent: null,
    ...overrides,
  } as OntimeMilestone;
}

function makeDelay(id: string): OntimeDelay {
  return { type: SupportedEntry.Delay, id, duration: 1000, parent: null };
}

describe('parseQuery()', () => {
  const filters = [
    { key: 'cue', label: 'Cue' },
    { key: 'Camera_Notes', label: 'Camera Notes' },
  ];

  it.each([
    ['cue 12', { filterKey: 'cue', searchString: '12' }],
    ['cue:12', { filterKey: 'cue', searchString: '12' }],
    ['camera_notes:wide', { filterKey: 'Camera_Notes', searchString: 'wide' }],
  ])('parses the field prefix in %s', (searchValue, expected) => {
    expect(parseQuery(searchValue, filters)).toStrictEqual(expected);
  });

  it('keeps an unprefixed query as a search across all fields', () => {
    expect(parseQuery('zebrafish', filters)).toStrictEqual({ filterKey: null, searchString: 'zebrafish' });
  });

  it('recognises a filter before any search text has been entered', () => {
    expect(parseQuery('cue', filters)).toStrictEqual({ filterKey: 'cue', searchString: '' });
  });
});

describe('searchByText()', () => {
  const customFields: CustomFields = {
    Camera_Notes: { type: 'text', label: 'Camera Notes', colour: '#000000' },
    Slide: { type: 'image', label: 'Slide', colour: '#000000' },
  };

  it('searches cue, title, note, and text custom fields in rundown order', () => {
    const data = [
      makeMilestone('milestone', { cue: 'needle' }),
      makeGroup('group', { title: 'needle' }),
      makeEvent('note', { note: 'find the needle here' }),
      makeEvent('custom', { custom: { Camera_Notes: 'needle' } }),
    ];

    const outcome = searchByText(data, customFields, null, 'needle');

    expect(outcome.results.map(({ id, match }) => ({ id, field: match?.key }))).toStrictEqual([
      { id: 'milestone', field: 'cue' },
      { id: 'group', field: 'title' },
      { id: 'note', field: 'note' },
      { id: 'custom', field: 'Camera_Notes' },
    ]);
    expect(outcome.total).toBe(4);
  });

  it('searches only the selected field', () => {
    const data = [
      makeEvent('title', { title: 'needle' }),
      makeEvent('note', { note: 'needle' }),
      makeEvent('custom', { custom: { Camera_Notes: 'needle' } }),
    ];

    const outcome = searchByText(data, customFields, 'note', 'needle');

    expect(outcome.results.map((result) => result.id)).toStrictEqual(['note']);
    expect(outcome.total).toBe(1);
  });

  it('reports the first matching field so the result can explain why it matched', () => {
    const data = [makeEvent('event', { cue: 'NEEDLE', title: 'another needle' })];

    const outcome = searchByText(data, customFields, null, 'needle');

    expect(outcome.results[0].match).toStrictEqual({ key: 'cue', label: 'Cue', excerpt: 'NEEDLE' });
  });

  it('does not search image custom fields', () => {
    const data = [makeEvent('image-only', { custom: { Slide: 'needle' } })];

    expect(searchByText(data, customFields, null, 'needle')).toStrictEqual({ results: [], error: null, total: 0 });
  });

  it('reports the full match count while limiting rendered results', () => {
    const data = Array.from({ length: 51 }, (_, index) => makeEvent(String(index), { title: 'needle' }));

    const outcome = searchByText(data, customFields, null, 'needle');

    expect(outcome.results).toHaveLength(50);
    expect(outcome.total).toBe(51);
  });
});

describe('searchByIndex()', () => {
  it('counts only events while preserving the flat rundown position', () => {
    const data = [
      makeGroup('group'),
      makeDelay('delay'),
      makeEvent('first'),
      makeMilestone('milestone'),
      makeEvent('second'),
    ];

    const outcome = searchByIndex(data, '2');

    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0]).toMatchObject({ id: 'second', index: 4, eventIndex: 2 });
    expect(outcome.total).toBe(1);
  });

  it.each(['0', 'not-a-number'])('rejects invalid index %s', (index) => {
    expect(searchByIndex([makeEvent('event')], index)).toStrictEqual({
      results: [],
      error: 'Invalid index',
      total: 0,
    });
  });

  it('returns no result when the event index is beyond the rundown', () => {
    expect(searchByIndex([makeEvent('event')], '2')).toStrictEqual({ results: [], error: null, total: 0 });
  });
});

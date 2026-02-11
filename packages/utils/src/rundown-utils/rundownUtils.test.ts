import type { OntimeDelay, OntimeEntry, OntimeEvent, OntimeGroup, Rundown } from 'ontime-types';
import { SupportedEntry } from 'ontime-types';

import {
  addToRundown,
  getFirstGroupNormal,
  getInsertAfterId,
  getLastEvent,
  getLastGroupNormal,
  getLastNormal,
  getNextEvent,
  getNextGroupNormal,
  getNextNormal,
  getPreviousGroupNormal,
  getPreviousNormal,
  swapEventData,
} from './rundownUtils';
import { demoDb } from './rundownUtils.mock';

describe('getNextEvent()', () => {
  it('returns the next event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEntry.Event } as OntimeEvent,
      { id: '2', type: SupportedEntry.Event } as OntimeEvent,
      { id: '3', type: SupportedEntry.Event } as OntimeEvent,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });

  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEntry.Event } as OntimeEvent,
      { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
      { id: '3', type: SupportedEntry.Group } as OntimeGroup,
      { id: '4', type: SupportedEntry.Event } as OntimeEvent,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent?.id).toBe('4');
    expect(nextIndex).toBe(3);
  });

  it('returns null if none found', () => {
    const testRundown = [
      { id: '1', type: SupportedEntry.Event } as OntimeEvent,
      { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
      { id: '3', type: SupportedEntry.Group } as OntimeGroup,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent).toBe(null);
    expect(nextIndex).toBe(null);
  });
});

describe('swapEventData', () => {
  it('swaps some data between two events', () => {
    const eventA = {
      id: '1',
      cue: 'A',
      timeStart: 1,
      timeEnd: 1,
      duration: 1,
      delay: 1,
      revision: 3,
      parent: null,
    } as OntimeEvent;
    const eventB = {
      id: '2',
      cue: 'B',
      timeStart: 2,
      timeEnd: 2,
      duration: 2,
      delay: 2,
      revision: 7,
      parent: 'testing',
    } as OntimeEvent;

    const [newA, newB] = swapEventData(eventA, eventB);

    expect(newA).toMatchObject({
      id: '1',
      cue: 'B',
      timeStart: 1,
      timeEnd: 1,
      duration: 1,
      delay: 1,
      revision: 3,
      parent: null,
    });
    expect(newB).toMatchObject({
      id: '2',
      cue: 'A',
      timeStart: 2,
      timeEnd: 2,
      duration: 2,
      delay: 2,
      revision: 7,
      parent: 'testing',
    });
  });
});

describe('getNextNormal / getPreviousNormal (flat order)', () => {
  const demoRundown = demoDb.rundowns.default;

  it('steps forward using flat order', () => {
    const { entry, index } = getNextNormal(demoRundown.entries, demoRundown.flatOrder, '7eaf99');
    expect(entry?.id).toBe('9bf60f');
    expect(index).toBe(2);
  });

  it('steps backward using flat order', () => {
    const { entry, index } = getPreviousNormal(demoRundown.entries, demoRundown.flatOrder, '9bf60f');
    expect(entry?.id).toBe('7eaf99');
    expect(index).toBe(1);
  });

  it('uses start/end boundaries for null cursor', () => {
    const next = getNextNormal(demoRundown.entries, demoRundown.flatOrder, null);
    const previous = getPreviousNormal(demoRundown.entries, demoRundown.flatOrder, null);
    expect(next.entry?.id).toBe('e2163f');
    expect(next.index).toBe(0);
    expect(previous.entry?.id).toBe('07df89');
    expect(previous.index).toBe(demoRundown.flatOrder.length - 1);
  });
});

describe('getNextGroupNormal / getPreviousGroupNormal (flat order)', () => {
  const demoRundown = demoDb.rundowns.default;

  it('finds the next group from inside a group', () => {
    const { entry, index } = getNextGroupNormal(demoRundown.entries, demoRundown.flatOrder, '9bf60f');
    expect(entry?.id).toBe('f60403');
    expect(index).toBe(7);
  });

  it('finds the previous group from inside a group', () => {
    const { entry, index } = getPreviousGroupNormal(demoRundown.entries, demoRundown.flatOrder, '9bf60f');
    expect(entry?.id).toBe('7eaf99');
    expect(index).toBe(1);
  });

  it('uses start/end boundaries for null cursor', () => {
    const next = getNextGroupNormal(demoRundown.entries, demoRundown.flatOrder, null);
    const previous = getPreviousGroupNormal(demoRundown.entries, demoRundown.flatOrder, null);
    expect(next.entry?.id).toBe('7eaf99');
    expect(next.index).toBe(1);
    expect(previous.entry?.id).toBe('6b0edb');
    expect(previous.index).toBe(9);
  });
});

describe('getFirstGroupNormal / getLastGroupNormal (flat order)', () => {
  const demoRundown = demoDb.rundowns.default;

  it('finds the first group in flat order', () => {
    const { entry, index } = getFirstGroupNormal(demoRundown.entries, demoRundown.flatOrder);
    expect(entry?.id).toBe('7eaf99');
    expect(index).toBe(1);
  });

  it('finds the last group in flat order', () => {
    const { entry, index } = getLastGroupNormal(demoRundown.entries, demoRundown.flatOrder);
    expect(entry?.id).toBe('6b0edb');
    expect(index).toBe(9);
  });
});

describe('getLastEvent', () => {
  it('returns the last event of type event', () => {
    const testRundown: OntimeEntry[] = [
      { id: '1', type: SupportedEntry.Event } as OntimeEvent,
      { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
      { id: '3', type: SupportedEntry.Event } as OntimeEvent,
      { id: '4', type: SupportedEntry.Group } as OntimeGroup,
    ];

    const { lastEvent } = getLastEvent(testRundown);
    expect(lastEvent?.id).toBe('3');
  });

  it('handles rundowns with a single event', () => {
    const testRundown: OntimeEntry[] = [{ id: '1', type: SupportedEntry.Event } as OntimeEvent];
    const { lastEvent } = getLastEvent(testRundown);
    expect(lastEvent?.id).toBe('1');
  });

  describe('getLastNormal', () => {
    it('returns the last entry', () => {
      const entries = {
        4: { id: '4', type: SupportedEntry.Group } as OntimeGroup,
        1: { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        3: { id: '3', type: SupportedEntry.Event } as OntimeEvent,
        2: { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
      };

      const order = ['1', '2', '3', '4'];

      const lastEntry = getLastNormal(entries, order);
      expect(lastEntry?.id).toBe('4');
    });

    it('handles rundowns with a single event', () => {
      const entries = {
        1: { id: '1', type: SupportedEntry.Event } as OntimeEvent,
      };

      const lastEvent = getLastNormal(entries, ['1']);
      expect(lastEvent?.id).toBe('1');
    });

    it('handles empty order', () => {
      const testRundown = {
        1: { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        2: { id: '2', type: SupportedEntry.Event } as OntimeEvent,
      };

      const lastEntry = getLastNormal(testRundown, []);
      expect(lastEntry).toBe(null);
    });

    it('handles empty rundown', () => {
      const lastEntry = getLastNormal({}, ['1', '2', '3', '4']);
      expect(lastEntry).toBe(null);
    });
  });
});

describe('getInsertAfterId()', () => {
  const rundown = {
    id: 'test',
    title: 'test',
    entries: {
      '1': { id: '1', type: SupportedEntry.Event, parent: null } as OntimeEvent,
      '2': { id: '2', type: SupportedEntry.Event, parent: null } as OntimeEvent,
      group: { id: 'group', type: SupportedEntry.Group, entries: ['31', '32'] } as unknown as OntimeGroup,
      '31': { id: '31', type: SupportedEntry.Event, parent: 'group' } as OntimeEvent,
      '32': { id: '32', type: SupportedEntry.Event, parent: 'group' } as OntimeEvent,
      '4': { id: '4', type: SupportedEntry.Event, parent: null } as OntimeEvent,
    },
    order: ['1', '2', 'group', '4'],
    flatOrder: ['1', '2', 'group', '31', '32', '4'],
    revision: 1,
  } as Rundown;

  it('returns afterId if provided', () => {
    expect(getInsertAfterId(rundown, null, 'b')).toBe('b');
  });

  it('returns null if neither afterId nor beforeId is provided', () => {
    expect(getInsertAfterId(rundown, null)).toBeNull();
  });

  it('returns null if beforeId is not found', () => {
    expect(getInsertAfterId(rundown, null, undefined, 'z')).toBeNull();
    expect(getInsertAfterId(rundown, null, undefined, '1')).toBeNull();
  });

  it('returns the previous id of an entry in the rundown', () => {
    expect(getInsertAfterId(rundown, null, undefined, '2')).toBe('1');
    expect(getInsertAfterId(rundown, null, undefined, '4')).toBe('group');
    expect(getInsertAfterId(rundown, null, undefined, 'group')).toBe('2');
  });

  it('returns the previous id of an event in a group', () => {
    expect(getInsertAfterId(rundown, rundown.entries.group as OntimeGroup, undefined, '31')).toBeNull();
    expect(getInsertAfterId(rundown, rundown.entries.group as OntimeGroup, undefined, '32')).toBe('31');
  });
});

describe('addToRundown()', () => {
  const makeTestRundown = (): Rundown =>
    ({
      id: 'test',
      title: 'test',
      entries: {
        '1': { id: '1', type: SupportedEntry.Event, parent: null } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Event, parent: null } as OntimeEvent,
        group: { id: 'group', type: SupportedEntry.Group, entries: ['31', '32'] } as unknown as OntimeGroup,
        '31': { id: '31', type: SupportedEntry.Event, parent: 'group' } as OntimeEvent,
        '32': { id: '32', type: SupportedEntry.Event, parent: 'group' } as OntimeEvent,
      },
      order: ['1', '2', 'group'],
      flatOrder: ['1', '2', 'group', '31', '32'],
      revision: 1,
    }) as Rundown;

  it('adds an entry to an empty rundown', () => {
    const rundown = { id: 'test', title: '', entries: {}, order: [], flatOrder: [], revision: 0 } as Rundown;
    const newEntry = { id: 'new', type: SupportedEntry.Event } as OntimeEvent;

    addToRundown(rundown, newEntry, null, null);

    expect(rundown.order).toEqual(['new']);
    expect(rundown.flatOrder).toEqual(['new']);
    expect(rundown.entries['new']).toBe(newEntry);
  });

  // case 2b: insert at the beginning of the rundown
  it('adds at the beginning of order and flatOrder when afterId is null', () => {
    const rundown = makeTestRundown();
    const newEntry = { id: 'new', type: SupportedEntry.Event } as OntimeEvent;

    addToRundown(rundown, newEntry, null, null);

    expect(rundown.order).toEqual(['new', '1', '2', 'group']);
    expect(rundown.flatOrder).toEqual(['new', '1', '2', 'group', '31', '32']);
  });

  // case 2a: insert after a given entry at top level
  it('inserts after the referenced entry in both order and flatOrder', () => {
    const rundown = makeTestRundown();
    const newEntry = { id: 'new', type: SupportedEntry.Event } as OntimeEvent;

    addToRundown(rundown, newEntry, '1', null);

    expect(rundown.order).toEqual(['1', 'new', '2', 'group']);
    expect(rundown.flatOrder).toEqual(['1', 'new', '2', 'group', '31', '32']);
  });

  // case 1b: insert at the beginning of a group
  it('inserts right after the group header in flatOrder and sets parent', () => {
    const rundown = makeTestRundown();
    const parent = rundown.entries['group'] as OntimeGroup;
    const newEntry = { id: 'new', type: SupportedEntry.Event, parent: null } as OntimeEvent;

    addToRundown(rundown, newEntry, null, parent);

    expect(parent.entries).toEqual(['new', '31', '32']);
    expect(newEntry.parent).toBe('group');
    expect(rundown.flatOrder).toEqual(['1', '2', 'group', 'new', '31', '32']);
    // top-level order must not change when inserting into a group
    expect(rundown.order).toEqual(['1', '2', 'group']);
  });

  // case 1a: insert after a given entry within a group
  it('inserts after the referenced entry within the group and in flatOrder', () => {
    const rundown = makeTestRundown();
    const parent = rundown.entries['group'] as OntimeGroup;
    const newEntry = { id: 'new', type: SupportedEntry.Event, parent: null } as OntimeEvent;

    addToRundown(rundown, newEntry, '31', parent);

    expect(parent.entries).toEqual(['31', 'new', '32']);
    expect(newEntry.parent).toBe('group');
    expect(rundown.flatOrder).toEqual(['1', '2', 'group', '31', 'new', '32']);
    expect(rundown.order).toEqual(['1', '2', 'group']);
  });
});

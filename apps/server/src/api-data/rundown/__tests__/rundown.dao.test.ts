import { SupportedEntry } from 'ontime-types';
import {
  makeOntimeEvent,
  makeRundown,
  makeOntimeBlock,
  makeOntimeDelay,
} from '../../../services/rundown-service/__mocks__/rundown.mocks.js';

import { createTransaction, rundownMutation } from '../rundown.dao.js';

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setRundown: vi.fn().mockImplementation(() => undefined),
        };
      }),
    };
  });
});

afterAll(() => {
  vi.clearAllMocks();
});

describe('createTransaction', () => {
  it('should return a snapshot of the cached rundown and an commit function', () => {
    const { rundown, commit } = createTransaction();
    expect(rundown).toBeDefined();
    expect(typeof commit).toBe('function');
  });

  it('should return the updated rundown after commit is called and update the db', () => {
    const { rundown, commit } = createTransaction();
    rundown.title = 'Another Title';
    const updated = commit();
    expect(updated.rundown.title).toBe('Another Title');
  });
});

describe('rundownMutation.add()', () => {
  test('adds an event an empty rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({});

    rundownMutation.add(rundown, mockEvent, null, null);

    expect(rundown.order.length).toBe(1);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the top if no afterId is given', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1'],
      order: ['1'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, null, null);

    expect(rundown.order).toStrictEqual(['mock', '1']);
    expect(rundown.flatOrder).toStrictEqual(['mock', '1']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the top of the block if no after is given', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1', '1a'],
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1' }),
        '1a': makeOntimeEvent({ id: '1a', parent: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, null, '1');

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.flatOrder).toStrictEqual(['1', 'mock', '1a']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the a given location inside a block', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1', '1a'],
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1' }),
        '1a': makeOntimeEvent({ id: '1a', parent: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, '1a', '1');

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.flatOrder).toStrictEqual(['1', '1a', 'mock']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });
});

describe('rundownMutation.edit()', () => {
  test('edits an event in the rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const mockEventPatch = { id: 'mock', cue: 'patched' };
    const rundown = makeRundown({
      order: ['mock'],
      entries: {
        mock: mockEvent,
      },
    });

    const { entry, didInvalidate } = rundownMutation.edit(rundown, mockEventPatch);

    expect(rundown.order.length).toBe(1);
    expect(didInvalidate).toBeFalsy();
    expect(entry).toMatchObject({
      id: 'mock',
      cue: 'patched',
      type: SupportedEntry.Event,
    });
  });

  test('changing time fields invalidates the rundown', () => {
    const rundown = makeRundown({
      order: ['delay', 'event'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay' }),
        event: makeOntimeEvent({ id: 'event' }),
      },
    });

    expect(rundownMutation.edit(rundown, { id: 'delay', duration: 1000 }).didInvalidate).toBeTruthy();

    expect(rundownMutation.edit(rundown, { id: 'event', timeStart: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', timeEnd: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', duration: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', linkStart: true }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', linkStart: false }).didInvalidate).toBeTruthy();
  });
});

describe('rundownMutation.remove()', () => {
  it('deletes an event from the rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'mock' }),
        '2': makeOntimeEvent({ id: '2', cue: 'mock' }),
        '3': makeOntimeEvent({ id: '3', cue: 'mock' }),
      },
    });

    rundownMutation.remove(rundown, '2');

    expect(rundown.order).toStrictEqual(['1', '3']);
    expect(rundown.entries['1']).not.toBeUndefined();
    expect(rundown.entries['2']).toBeUndefined();
    expect(rundown.entries['3']).not.toBeUndefined();
  });

  it('deletes a block and its children', () => {
    const rundown = makeRundown({
      order: ['1', '4'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['2', '3'] }),
        '2': makeOntimeEvent({ id: '2', parent: '1' }),
        '3': makeOntimeDelay({ id: '3', parent: '1' }),
        '4': makeOntimeEvent({ id: '4', parent: null }),
      },
    });

    rundownMutation.remove(rundown, '1');

    expect(rundown.order).toStrictEqual(['4']);
    expect(rundown.entries).not.toHaveProperty('1');
    expect(rundown.entries).not.toHaveProperty('2');
    expect(rundown.entries).not.toHaveProperty('3');
    expect(rundown.entries['4']).toMatchObject({
      parent: null,
    });
  });

  it('deletes a nested event and its reference in the parent', () => {
    const rundown = makeRundown({
      order: ['1', '4'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['2', '3'] }),
        '2': makeOntimeEvent({ id: '2', parent: '1' }),
        '3': makeOntimeDelay({ id: '3', parent: '1' }),
        '4': makeOntimeEvent({ id: '4', parent: null }),
      },
    });

    rundownMutation.remove(rundown, '2');

    expect(rundown.order).toStrictEqual(['1', '4']);
    expect(rundown.entries).not.toHaveProperty('2');
    expect(rundown.entries['1']).toMatchObject({
      events: ['3'],
    });
  });
});

describe('rundownMutation.removeAll()', () => {
  test('deletes all events from the rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'mock' }),
        '2': makeOntimeEvent({ id: '2', cue: 'mock' }),
        '3': makeOntimeEvent({ id: '3', cue: 'mock' }),
      },
    });

    rundownMutation.removeAll(rundown);

    expect(rundown.order).toStrictEqual([]);
    expect(rundown.entries['1']).toBeUndefined();
    expect(rundown.entries['2']).toBeUndefined();
    expect(rundown.entries['3']).toBeUndefined();
  });
});

describe('rundownMutation.reorder()', () => {
  it('moves an event into a block', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: [] }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
        '3': makeOntimeEvent({ id: '3', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, '3', '1', 'insert');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      events: ['3'],
    });
    expect(rundown.entries['3']).toMatchObject({
      parent: '1',
    });
  });

  it('adds an event into a block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, '2', '11', 'before');

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.entries['1']).toMatchObject({
      events: ['2', '11'],
    });
    expect(rundown.entries['2']).toMatchObject({
      parent: '1',
    });
  });

  it('moves an event after another', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      flatOrder: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1' }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2' }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3' }),
      },
    });

    // move first event to the end
    rundownMutation.reorder(rundown, '1', '2', 'after');

    expect(rundown.order).toStrictEqual(['2', '1', '3']);
  });

  it('moves an event before another', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      flatOrder: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1' }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2' }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3' }),
      },
    });

    // move last event to the beginning
    rundownMutation.reorder(rundown, '3', '1', 'before');

    expect(rundown.order).toStrictEqual(['3', '1', '2']);
  });

  it('moves an event out of a block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, '11', '2', 'before');

    expect(rundown.order).toStrictEqual(['1', '11', '2']);
    expect(rundown.entries['1']).toMatchObject({
      events: [],
    });
    expect(rundown.entries['2']).toMatchObject({
      parent: null,
    });
  });

  it('moves an event between blocks', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', events: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, '11', '22', 'before');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      events: [],
    });
    expect(rundown.entries['2']).toMatchObject({
      events: ['11', '22'],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: '2',
    });
  });

  it('moves an event into an empty block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: [] }),
        '2': makeOntimeBlock({ id: '2', events: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, '22', '1', 'insert');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      events: ['22'],
    });
    expect(rundown.entries['2']).toMatchObject({
      events: [],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: '1',
    });
  });

  it('moves an event out of a block (up)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', events: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, '22', '2', 'before');

    expect(rundown.order).toStrictEqual(['1', '22', '2']);
    // expect(newRundown.flatOrder).toStrictEqual(['1', '2', '11', '22']);
    // expect(changeList).toStrictEqual(['1', '2', '11', '22']);
    expect(rundown.entries['1']).toMatchObject({
      events: ['11'],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: '1',
    });
    expect(rundown.entries['2']).toMatchObject({
      events: [],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: null,
    });
  });

  it('moves an event out of a block (down)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', events: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', events: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, '11', '1', 'after');

    expect(rundown.order).toStrictEqual(['1', '11', '2']);
    expect(rundown.entries['1']).toMatchObject({
      events: [],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: null,
    });
    expect(rundown.entries['2']).toMatchObject({
      events: ['22'],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: '2',
    });
  });
});

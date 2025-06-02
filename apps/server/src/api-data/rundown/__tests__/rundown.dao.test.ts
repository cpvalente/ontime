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

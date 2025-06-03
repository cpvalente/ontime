import { OntimeEvent, SupportedEntry } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import {
  makeOntimeEvent,
  makeRundown,
  makeOntimeBlock,
  makeOntimeDelay,
} from '../../../services/rundown-service/__mocks__/rundown.mocks.js';

import { createTransaction, rundownCache, rundownMutation } from '../rundown.dao.js';

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

describe('rundownMutation.applyDelay()', () => {
  it('applies a positive delay to the rundown', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 10, timeEnd: 20, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 30, timeEnd: 40, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 40, timeEnd: 50, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('applies negative delays', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 10, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 0, timeEnd: 10, duration: 10, revision: 2, linkStart: false },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 10, timeEnd: 20, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('should account for minimum duration and start when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 2,
      } as OntimeEvent,
      '2': {
        id: '2',
        type: SupportedEntry.Event,
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying positive delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('maintains links if there is no gap', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 50,
        timeEnd: 150,
        duration: 100,
        revision: 2,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: true,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 },
      '2': {
        id: '2',
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('gaps reduce positive delay', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        // gap 50
        '2': makeOntimeEvent({ id: '2', timeStart: 150, timeEnd: 200, duration: 50, gap: 50 }),
        // gap 0
        '3': makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 250, duration: 50, gap: 0 }),
        // gap 50
        '4': makeOntimeEvent({ id: '4', timeStart: 300, timeEnd: 350, duration: 50, gap: 50 }),
        // linked
        '5': makeOntimeEvent({ id: '5', timeStart: 350, timeEnd: 400, duration: 50, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0 + 100, timeEnd: 100 + 100, duration: 100, revision: 2 },
      // gap 50 (100 - 50)
      '2': { id: '2', timeStart: 150 + 50, timeEnd: 200 + 50, duration: 50, revision: 2 },
      // gap 50 (50 - 50)
      '3': { id: '3', timeStart: 200 + 50, timeEnd: 250 + 50, duration: 50, revision: 2, gap: 0 },
      // gap (delay is 0)
      '4': { id: '4', timeStart: 300, timeEnd: 350, duration: 50, revision: 1 },
      // linked
      '5': { id: '5', timeStart: 350, timeEnd: 400, duration: 50, revision: 1, linkStart: true },
    });
  });

  it('gaps reduce positive delay (2)', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 2 * MILLIS_PER_HOUR }),
        '1': makeOntimeEvent({
          id: '1',
          gap: 0,
          dayOffset: 0,
          timeStart: 46800000, // 13:00:00
          timeEnd: 50400000, // 14:00:00
          duration: MILLIS_PER_HOUR,
        }),
        // gap 1h
        '2': makeOntimeEvent({
          id: '2',
          gap: 1 * MILLIS_PER_HOUR,
          dayOffset: 0,
          timeStart: 54000000, // 15:00:00
          timeEnd: 57600000, // 16:00:00
          duration: MILLIS_PER_HOUR,
        }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 54000000 /* 16 */, revision: 2 },
      // gap 1h (2h - 1h)
      '2': { id: '2', timeStart: 57600000 /* 16 */, revision: 2 },
    });
  });

  it('removes empty delays without applying changes', () => {
    const testRundown = makeRundown({
      order: ['delay', '1'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 0 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('removes delays in last position without applying changes', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('unlinks events to across blocks is it is the first event after the delay', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', 'block', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        block: makeOntimeBlock({ id: 'block' }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      block: { id: 'block' },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('applies a delay from inside a block', () => {
    const testRundown = makeRundown({
      order: ['1', 'block', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        block: makeOntimeBlock({ id: 'block', events: ['delay'] }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100, parent: 'block' }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 200, duration: 100, linkStart: true }),
        '3': makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      '2': {
        id: '2',
        timeStart: 200,
        timeEnd: 300,
        duration: 100,
        linkStart: false,
        revision: 2,
      },
      '3': {
        id: '3',
        timeStart: 300,
        timeEnd: 400,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
    });
  });

  it('applies a delay from across nested orders', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', 'block', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
        block: makeOntimeBlock({ id: 'block', events: ['block-1'] }),
        'block-1': makeOntimeEvent({
          id: 'block-1',
          timeStart: 100,
          timeEnd: 200,
          duration: 100,
          linkStart: true,
          parent: 'block',
        }),
        '2': makeOntimeEvent({ id: '2', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
        '3': makeOntimeEvent({ id: '3', timeStart: 300, timeEnd: 400, duration: 100, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, 'delay');

    expect(testRundown.entries).toMatchObject({
      '1': {
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      'block-1': {
        timeStart: 200,
        timeEnd: 300,
        duration: 100,
        linkStart: false,
        revision: 2,
      },
      '2': {
        timeStart: 300,
        timeEnd: 400,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
      '3': {
        timeStart: 400,
        timeEnd: 500,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
    });
  });
});

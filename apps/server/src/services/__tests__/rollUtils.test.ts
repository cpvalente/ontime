import { dayInMs, MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { loadRoll } from '../rollUtils.js';
import { makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { PlayableEvent } from 'ontime-types';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';

beforeAll(() => {
  vi.mock('../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setCustomFields: vi.fn().mockImplementation((newData) => newData),
          setRundown: vi.fn().mockImplementation((newData) => newData),
        };
      }),
    };
  });
});

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: 1000,
  duration: 1000,
  skip: false,
  parent: null,
} as PlayableEvent;

describe('loadRoll()', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 5,
            timeEnd: 10,
            duration: 5,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 10,
            timeEnd: 20,
            duration: 10,
          },
          '3': {
            ...mockEvent,
            id: '3',
            timeStart: 20,
            timeEnd: 30,
            duration: 10,
          },
          '4': {
            ...mockEvent,
            id: '4',
            timeStart: 30,
            timeEnd: 40,
            duration: 10,
          },
          '5': {
            ...mockEvent,
            id: '5',
            timeStart: 40,
            timeEnd: 50,
            duration: 10,
          },
          '6': {
            ...mockEvent,
            id: '6',
            timeStart: 50,
            timeEnd: 60,
            duration: 10,
          },
          '7': {
            ...mockEvent,
            id: '7',
            timeStart: 60,
            timeEnd: 70,
            duration: 10,
          },
          '8': {
            ...mockEvent,
            id: '8',
            timeStart: 70,
            timeEnd: 80,
            duration: 10,
          },
        },
        order: ['1', '2', '3', '4', '5', '6', '7', '8'],
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('should roll to the day after if timer is at 100', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 100;
    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should be waiting to start if timer is at 0', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 0;
    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the first event if timer is at 5', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 5;
    const expected = {
      event: rundown.entries['1'],
      index: 0,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the second event if timer is at 15', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 15;
    const expected = {
      event: rundown.entries['2'],
      index: 1,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the third event if timer is at 10', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 20;
    const expected = {
      event: rundown.entries['3'],
      index: 2,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the fifth event if timer is at 49', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 49;
    const expected = {
      event: rundown.entries['5'],
      index: 4,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the seventh event if timer is at 63', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 63;
    const expected = {
      event: rundown.entries['7'],
      index: 6,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the eight event if timer is at 75', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 75;
    const expected = {
      event: rundown.entries['8'],
      index: 7,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() handle edge cases with midnight', () => {
  it('should find an event that crosses midnight', async () => {
    const now = 23 * MILLIS_PER_HOUR;
    vi.useFakeTimers();
    rundownCache.init(
      makeRundown({
        order: ['0', '1', '2', '3', '4'],
        entries: {
          '0': {
            ...mockEvent,
            id: '0',
            timeStart: 9 * MILLIS_PER_HOUR,
            timeEnd: 10 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 20 * MILLIS_PER_HOUR,
            timeEnd: 22 * MILLIS_PER_HOUR,
            duration: 2 * MILLIS_PER_HOUR,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 22 * MILLIS_PER_HOUR,
            timeEnd: 1 * MILLIS_PER_HOUR,
            duration: 3 * MILLIS_PER_HOUR,
          },
          '3': {
            ...mockEvent,
            id: '3',
            timeStart: 1 * MILLIS_PER_HOUR,
            timeEnd: 1 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE,
            duration: 10 * MILLIS_PER_MINUTE,
          },
          '4': {
            ...mockEvent,
            id: '4',
            timeStart: 1 * MILLIS_PER_HOUR,
            timeEnd: 2 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const expected = {
      event: rundown.entries['2'],
      index: 2,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should not skip to the second day', async () => {
    /**
     * NOTE: this is a potentially contentious decision
     *
     * The idea here is that it makes no sense for us to jump to the second / third day on activating roll
     * if the user wants to skip a portion of the rundown, they can manually jump to the event and activate roll
     *
     * On our side, this simplifies logic and makes behaviour more predictable
     */

    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['0', '1', '2'],
        entries: {
          '0': {
            ...mockEvent,
            id: '0',
            timeStart: 21 * MILLIS_PER_HOUR,
            timeEnd: 22 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 22 * MILLIS_PER_HOUR,
            timeEnd: 3 * MILLIS_PER_HOUR,
            duration: 5 * MILLIS_PER_HOUR,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 3 * MILLIS_PER_HOUR,
            timeEnd: 10 * MILLIS_PER_HOUR,
            duration: 7 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 8 * MILLIS_PER_HOUR;

    const expected = {
      event: rundown.entries['0'],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() handle rundowns with several days', () => {
  it('should find the correct event, when we have many days', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['0', '2', '3', '4'],
        entries: {
          '0': {
            ...mockEvent,
            id: '0',
            timeStart: 10 * MILLIS_PER_HOUR,
            timeEnd: 11 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 11 * MILLIS_PER_HOUR,
            timeEnd: 12 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '3': {
            ...mockEvent,
            id: '3',
            timeStart: 12 * MILLIS_PER_HOUR,
            timeEnd: 13 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '4': {
            ...mockEvent,
            id: '4',
            timeStart: 11 * MILLIS_PER_HOUR,
            timeEnd: 12 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 11 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE;

    const state = loadRoll(rundown, metadata, now);
    const expected = {
      event: rundown.entries['2'],
      index: 1,
    };
    expect(state).toMatchObject(expected);
  });

  it('should find the correct event, when we have events of zero duration', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['0', '1 no duration', '2', '3 no duration', '4'],
        entries: {
          '0': {
            ...mockEvent,
            id: '0',
            timeStart: 18 * MILLIS_PER_HOUR,
            timeEnd: 19 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          '1 no duration': {
            ...mockEvent,
            id: '1 no duration',
            timeStart: 0,
            timeEnd: 0,
            duration: 0,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 19 * MILLIS_PER_HOUR,
            timeEnd: 20 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
          ['3 no duration']: {
            ...mockEvent,
            id: '3 no duration',
            timeStart: 0,
            timeEnd: 0,
            duration: 0,
          },
          '4': {
            ...mockEvent,
            id: '4',
            timeStart: 20 * MILLIS_PER_HOUR,
            timeEnd: 21 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 20 * MILLIS_PER_HOUR + 37 * MILLIS_PER_MINUTE;

    const state = loadRoll(rundown, metadata, now);
    const expected = {
      event: rundown.entries['4'],
      index: 4,
    };
    expect(state).toMatchObject(expected);
  });
});

describe('loadRoll() handle edge cases with before and after start', () => {
  it('should prepare first event, if we are not yet in the rundown start', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 10 * MILLIS_PER_HOUR,
            timeEnd: 11 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 7 * MILLIS_PER_HOUR;

    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should prepare first event, if we are over the rundown end', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 10 * MILLIS_PER_HOUR,
            timeEnd: 11 * MILLIS_PER_HOUR,
            duration: 1 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 18 * MILLIS_PER_HOUR;

    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('should account for a rundown that goes through midnight', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 10 * MILLIS_PER_HOUR,
            timeEnd: 2 * MILLIS_PER_HOUR,
            duration: 16 * MILLIS_PER_HOUR,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 1 * MILLIS_PER_HOUR;

    const expected = {
      event: rundown.entries['1'],
      index: 0,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state.isPending).toBeUndefined(); // we are playing the event
    expect(state).toStrictEqual(expected);
  });

  it('loads upcoming event while waiting to roll', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          ['1']: {
            ...mockEvent,
            id: '1',
            timeStart: 72000000, // 20:00
            timeEnd: 72010000, // 20:10
            duration: 10 * MILLIS_PER_MINUTE,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 6000; // 00:01

    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() test that roll behaviour with overlapping times', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1', '2', '3'],
        entries: {
          ['1']: {
            ...mockEvent,
            id: '1',
            timeStart: 9,
            timeEnd: 10,
            duration: 1,
          },
          ['2']: {
            ...mockEvent,
            id: '2',
            timeStart: 10,
            timeEnd: 20,
            duration: 10,
          },
          ['3']: {
            ...mockEvent,
            id: '3',
            timeStart: 10,
            timeEnd: 30,
            duration: 10,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('if timer is at 0', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 0;
    const expected = {
      event: rundown.entries['1'],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10, it ignores events with 0 duration', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 10;
    const expected = {
      event: rundown.entries['2'],
      index: 1,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 15;
    const expected = {
      event: rundown.entries['2'],
      index: 1,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 20;
    const expected = {
      event: rundown.entries['3'],
      index: 2,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const { rundown, metadata } = rundownCache.get();
    const now = 25;
    const expected = {
      event: rundown.entries['3'],
      index: 2,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });
});

// issue #58
describe('loadRoll() test that roll behaviour multi day event edge cases', () => {
  it('should recognise a playing event where its schedule spans over midnight', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 66000000, // 19:20
            timeEnd: 54600000, // 16:10
            duration: 1, // value not important
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 66600000; // 19:30
    const expected = {
      event: rundown.entries['1'],
      index: 0,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 67200000, // 19:40
            timeEnd: 66900000, // 19:35
            duration: dayInMs - 5 * MILLIS_PER_MINUTE,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 66840000; // 19:34

    const expected = {
      event: rundown.entries['1'],
      index: 0,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state.isPending).toBeUndefined(); // we are playing the event
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() should not roll skipped events', () => {
  test('', async () => {
    vi.useFakeTimers();
    await initRundown(
      makeRundown({
        order: ['1', '2'],
        entries: {
          '1': {
            ...mockEvent,
            id: '1',
            timeStart: 10,
            timeEnd: 20,
            duration: 10,
            skip: true,
          },
          '2': {
            ...mockEvent,
            id: '2',
            timeStart: 20,
            timeEnd: 30,
            duration: 10,
          },
        },
      }),
      {},
    );
    vi.runAllTimers();
    vi.useRealTimers();

    const { rundown, metadata } = rundownCache.get();
    const now = 2;
    const expected = {
      event: rundown.entries['2'],
      index: 1,
      isPending: true,
    };

    const state = loadRoll(rundown, metadata, now);
    expect(state).toStrictEqual(expected);
  });
});

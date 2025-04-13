import type { OntimeBlock, OntimeDelay, OntimeEntry, OntimeEvent } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import {
  getLastEvent,
  getLastNormal,
  getNext,
  getNextEvent,
  getPrevious,
  getPreviousBlock,
  getPreviousEvent,
  swapEventData,
} from './rundownUtils';

describe('getNext()', () => {
  it('returns the next event of type event', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        '3': { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3'],
    };

    const { nextEvent, nextIndex } = getNext(testRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });

  it('returns any type of OntimeEntry ', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
        '3': { id: '3', type: SupportedEvent.Block } as OntimeBlock,
        '4': { id: '4', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3', '4'],
    };

    const { nextEvent, nextIndex } = getNext(testRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });

  it('returns null if none found', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        '3': { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3'],
    };
    const { nextEvent, nextIndex } = getNext(testRundown, '3');
    expect(nextEvent).toBe(null);
    expect(nextIndex).toBe(null);
  });
});

describe('getNextEvent()', () => {
  it('returns the next event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event } as OntimeEvent,
      { id: '2', type: SupportedEvent.Event } as OntimeEvent,
      { id: '3', type: SupportedEvent.Event } as OntimeEvent,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });

  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event } as OntimeEvent,
      { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
      { id: '3', type: SupportedEvent.Block } as OntimeBlock,
      { id: '4', type: SupportedEvent.Event } as OntimeEvent,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent?.id).toBe('4');
    expect(nextIndex).toBe(3);
  });

  it('returns null if none found', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event } as OntimeEvent,
      { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
      { id: '3', type: SupportedEvent.Block } as OntimeBlock,
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown, '1');
    expect(nextEvent).toBe(null);
    expect(nextIndex).toBe(null);
  });
});

describe('getPrevious()', () => {
  it('returns the previous event of type event', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        '3': { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3'],
    };

    const { entry, index } = getPrevious(testRundown, '3');
    expect(entry?.id).toBe('2');
    expect(index).toBe(1);
  });

  it('allow other event types', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
        '3': { id: '3', type: SupportedEvent.Block } as OntimeBlock,
        '4': { id: '4', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3', '4'],
    };

    const { entry, index } = getPrevious(testRundown, '3');
    expect(entry?.id).toBe('2');
    expect(index).toBe(1);
  });

  it('returns null if none found', () => {
    const testRundown = {
      entries: {
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        '3': { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3'],
    };

    const { entry, index } = getPrevious(testRundown, '2');
    expect(entry).toBe(null);
    expect(index).toBe(null);
  });
});

describe('getPreviousEvent()', () => {
  it('returns the previous event of type event', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        '3': { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3'],
    };

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown, '3');
    expect(previousEvent?.id).toBe('2');
    expect(previousIndex).toBe(1);
  });

  it('ignores other event types', () => {
    const testRundown = {
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
        '3': { id: '3', type: SupportedEvent.Block } as OntimeBlock,
        '4': { id: '4', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['1', '2', '3', '4'],
    };

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown, '4');
    expect(previousEvent?.id).toBe('1');
    expect(previousIndex).toBe(0);
  });

  it('returns null if none found', () => {
    const testRundown = {
      entries: {
        '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
        '3': { id: '3', type: SupportedEvent.Block } as OntimeBlock,
        '4': { id: '4', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['2', '3', '4'],
    };

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown, '2');
    expect(previousEvent).toBe(null);
    expect(previousIndex).toBe(null);
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

describe('getLastEvent', () => {
  it('returns the last event of type event', () => {
    const testRundown: OntimeEntry[] = [
      { id: '1', type: SupportedEvent.Event } as OntimeEvent,
      { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
      { id: '3', type: SupportedEvent.Event } as OntimeEvent,
      { id: '4', type: SupportedEvent.Block } as OntimeBlock,
    ];

    const { lastEvent } = getLastEvent(testRundown);
    expect(lastEvent?.id).toBe('3');
  });

  it('handles rundowns with a single event', () => {
    const testRundown: OntimeEntry[] = [{ id: '1', type: SupportedEvent.Event } as OntimeEvent];
    const { lastEvent } = getLastEvent(testRundown);
    expect(lastEvent?.id).toBe('1');
  });

  describe('getLastNormal', () => {
    it('returns the last entry', () => {
      const entries = {
        4: { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        1: { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        3: { id: '3', type: SupportedEvent.Event } as OntimeEvent,
        2: { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
      };

      const order = ['1', '2', '3', '4'];

      const lastEntry = getLastNormal(entries, order);
      expect(lastEntry?.id).toBe('4');
    });

    it('handles rundowns with a single event', () => {
      const entries = {
        1: { id: '1', type: SupportedEvent.Event } as OntimeEvent,
      };

      const lastEvent = getLastNormal(entries, ['1']);
      expect(lastEvent?.id).toBe('1');
    });

    it('handles empty order', () => {
      const testRundown = {
        1: { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        2: { id: '2', type: SupportedEvent.Event } as OntimeEvent,
      };

      const lastEntry = getLastNormal(testRundown, []);
      expect(lastEntry).toBe(null);
    });

    it('handles empty rundown', () => {
      const lastEntry = getLastNormal({}, ['1', '2', '3', '4']);
      expect(lastEntry).toBe(null);
    });
  });

  describe('getPreviousBlock()', () => {
    const testRundown = {
      entries: {
        a: { id: 'a', type: SupportedEvent.Event } as OntimeEvent,
        b: { id: 'b', type: SupportedEvent.Event } as OntimeEvent,
        c: { id: 'c', type: SupportedEvent.Event } as OntimeEvent,
        d: { id: 'd', type: SupportedEvent.Delay } as OntimeDelay,
        e: { id: 'e', type: SupportedEvent.Block } as OntimeBlock,
        f: { id: 'f', type: SupportedEvent.Event } as OntimeEvent,
        g: { id: 'g', type: SupportedEvent.Block } as OntimeBlock,
        h: { id: 'h', type: SupportedEvent.Event } as OntimeEvent,
      },
      order: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    };

    test.each([
      ['h', 'g'],
      ['f', 'e'],
    ])('returns the relevant block', (id, expected) => {
      const block = getPreviousBlock(testRundown, id);
      expect(block?.id).toBe(expected);
    });

    it('returns null if there is no parent block relevant block', () => {
      const block = getPreviousBlock(testRundown, 'a');
      expect(block).toBe(null);
    });

    it('also works on index 0', () => {
      testRundown.order.unshift('0');
      // @ts-expect-error -- we are adding an event to the rundown
      testRundown.entries['0'] = { id: '0', type: SupportedEvent.Block } as OntimeBlock;
      const block = getPreviousBlock(testRundown, 'a');
      expect(block?.id).toBe('0');
    });

    it('returns the parent block if nested event', () => {
      const testRundown = {
        entries: {
          1: { id: '1', type: SupportedEvent.Event } as OntimeEvent,
          block: { id: 'block', type: SupportedEvent.Block, events: ['21', '22', '23'] } as OntimeBlock,
          21: { id: '21', type: SupportedEvent.Event, parent: 'block' } as OntimeEvent,
          22: { id: '22', type: SupportedEvent.Event, parent: 'block' } as OntimeEvent,
          23: { id: '23', type: SupportedEvent.Event, parent: 'block' } as OntimeEvent,
        },
        order: ['1', 'block'],
      };
      const block = getPreviousBlock(testRundown, '21');
      expect(block?.id).toBe('block');
    });
  });
});

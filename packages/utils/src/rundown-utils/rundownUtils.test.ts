import type { NormalisedRundown, OntimeEvent, OntimeRundown } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import {
  filterPlayable,
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
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const { nextEvent, nextIndex } = getNext(testRundown as OntimeRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });
  it('alows other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { nextEvent, nextIndex } = getNext(testRundown as OntimeRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
    ];

    const { nextEvent, nextIndex } = getNext(testRundown as OntimeRundown, '3');
    expect(nextEvent).toBe(null);
    expect(nextIndex).toBe(null);
  });
});

describe('getNextEvent()', () => {
  it('returns the next event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown as OntimeRundown, '1');
    expect(nextEvent?.id).toBe('2');
    expect(nextIndex).toBe(1);
  });
  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown as OntimeRundown, '1');
    expect(nextEvent?.id).toBe('4');
    expect(nextIndex).toBe(3);
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
    ];

    const { nextEvent, nextIndex } = getNextEvent(testRundown as OntimeRundown, '1');
    expect(nextEvent).toBe(null);
    expect(nextIndex).toBe(null);
  });
});

describe('getPrevious()', () => {
  it('returns the previous event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const { entry, index } = getPrevious(testRundown as OntimeRundown, '3');
    expect(entry?.id).toBe('2');
    expect(index).toBe(1);
  });
  it('allow other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { entry, index } = getPrevious(testRundown as OntimeRundown, '3');
    expect(entry?.id).toBe('2');
    expect(index).toBe(1);
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { entry, index } = getPrevious(testRundown as OntimeRundown, '2');
    expect(entry).toBe(null);
    expect(index).toBe(null);
  });
});

describe('getPreviousEvent()', () => {
  it('returns the previous event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown as OntimeRundown, '3');
    expect(previousEvent?.id).toBe('2');
    expect(previousIndex).toBe(1);
  });
  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown as OntimeRundown, '4');
    expect(previousEvent?.id).toBe('1');
    expect(previousIndex).toBe(0);
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { previousEvent, previousIndex } = getPreviousEvent(testRundown as OntimeRundown, '2');
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
    } as OntimeEvent;
    const eventB = {
      id: '2',
      cue: 'B',
      timeStart: 2,
      timeEnd: 2,
      duration: 2,
      delay: 2,
    } as OntimeEvent;

    const { newA, newB } = swapEventData(eventA, eventB);

    expect(newA).toMatchObject({
      id: '1',
      cue: 'B',
      timeStart: 1,
      timeEnd: 1,
      duration: 1,
      delay: 1,
    });
    expect(newB).toMatchObject({
      id: '2',
      cue: 'A',
      timeStart: 2,
      timeEnd: 2,
      duration: 2,
      delay: 2,
    });
  });
});

describe('getLastEvent', () => {
  it('returns the last event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Event },
      { id: '4', type: SupportedEvent.Block },
    ];

    const { lastEvent } = getLastEvent(testRundown as OntimeRundown);
    expect(lastEvent?.id).toBe('3');
  });
  it('handles rundowns with a single event', () => {
    const testRundown = [{ id: '1', type: SupportedEvent.Event }];

    const { lastEvent } = getLastEvent(testRundown as OntimeRundown);
    expect(lastEvent?.id).toBe('1');
  });

  describe('getLastNormal', () => {
    it('returns the last entry', () => {
      const testRundown = {
        4: { id: '4', type: SupportedEvent.Block },
        1: { id: '1', type: SupportedEvent.Event },
        3: { id: '3', type: SupportedEvent.Event },
        2: { id: '2', type: SupportedEvent.Delay },
      };

      const order = ['1', '2', '3', '4'];

      const lastEntry = getLastNormal(testRundown as unknown as NormalisedRundown, order);
      expect(lastEntry?.id).toBe('4');
    });
    it('handles rundowns with a single event', () => {
      const testRundown = [{ id: '1', type: SupportedEvent.Event }];

      const { lastEvent } = getLastEvent(testRundown as OntimeRundown);
      expect(lastEvent?.id).toBe('1');
    });

    it('handles empty order', () => {
      const testRundown = {
        4: { id: '4', type: SupportedEvent.Block },
        1: { id: '1', type: SupportedEvent.Event },
        3: { id: '3', type: SupportedEvent.Event },
        2: { id: '2', type: SupportedEvent.Delay },
      };

      const order: string[] = [];

      const lastEntry = getLastNormal(testRundown as unknown as NormalisedRundown, order);
      expect(lastEntry).toBe(null);
    });

    it('handles empty rundown', () => {
      const testRundown = {};

      const order = ['1', '2', '3', '4'];

      const lastEntry = getLastNormal(testRundown as unknown as NormalisedRundown, order);
      expect(lastEntry).toBe(null);
    });
  });

  describe('relevantBlock', () => {
    const testRundown = [
      { id: 'a', type: SupportedEvent.Event },
      { id: 'b', type: SupportedEvent.Event },
      { id: 'c', type: SupportedEvent.Event },
      { id: 'd', type: SupportedEvent.Delay },
      { id: 'e', type: SupportedEvent.Block },
      { id: 'f', type: SupportedEvent.Event },
      { id: 'g', type: SupportedEvent.Block },
      { id: 'h', type: SupportedEvent.Event },
    ];

    it('returns the relevant block', () => {
      const block = getPreviousBlock(testRundown as unknown as OntimeRundown, 'h');

      expect(block?.id).toBe('g');
    });
    it('returns the relevant block', () => {
      const block = getPreviousBlock(testRundown as unknown as OntimeRundown, 'f');

      expect(block?.id).toBe('e');
    });
    it('returns the relevant block', () => {
      const block = getPreviousBlock(testRundown as unknown as OntimeRundown, 'a');

      expect(block).toBeNull();
    });
    it('also works on index 0', () => {
      testRundown.unshift({ id: '0', type: SupportedEvent.Block });
      const block = getPreviousBlock(testRundown as unknown as OntimeRundown, 'a');
      expect(block?.id).toBe('0');
    });
  });

  describe('filterPlayable()', () => {
    test('should return an array with only playable events', () => {
      const eventA = { id: 'a', type: SupportedEvent.Event } as OntimeEvent;
      const eventB = { id: 'b', skip: true, type: SupportedEvent.Event } as OntimeEvent;
      const testRundown = [
        eventA,
        eventB,
        { id: 'c', type: SupportedEvent.Delay },
        { id: 'd', type: SupportedEvent.Block },
      ];

      const result = filterPlayable(testRundown as unknown as OntimeRundown);
      expect(result).toMatchObject([eventA]);
    });
  });
});

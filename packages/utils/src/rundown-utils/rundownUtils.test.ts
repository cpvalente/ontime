import type { NormalisedRundown, OntimeEvent, OntimeRundown } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import {
  getLastEvent,
  getLastNormal,
  getNext,
  getNextEvent,
  getPrevious,
  getPreviousEvent,
  relevantBlock,
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
    const testRundown = {
      h: { id: 'h', type: SupportedEvent.Event },
      g: { id: 'g', type: SupportedEvent.Block },
      f: { id: 'f', type: SupportedEvent.Event },
      e: { id: 'e', type: SupportedEvent.Block },
      a: { id: 'a', type: SupportedEvent.Event },
      b: { id: 'b', type: SupportedEvent.Event },
      c: { id: 'c', type: SupportedEvent.Event },
      d: { id: 'd', type: SupportedEvent.Delay },
    };

    const order = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    it('returns the relevant block', () => {
      const { block, index } = relevantBlock(testRundown as unknown as NormalisedRundown, order, 'h');

      expect(block?.id).toBe('g');
      expect(index).toBe(6);
    });
    it('returns the relevant block', () => {
      const { block, index } = relevantBlock(testRundown as unknown as NormalisedRundown, order, 'f');

      expect(block?.id).toBe('e');
      expect(index).toBe(4);
    });
    it('returns the relevant block', () => {
      const { block, index } = relevantBlock(testRundown as unknown as NormalisedRundown, order, 'a');

      expect(block).toBe(null);
      expect(index).toBe(null);
    });
  });
});

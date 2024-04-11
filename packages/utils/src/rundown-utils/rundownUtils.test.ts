import type { OntimeEvent, OntimeRundown } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import { getLastEvent, getNext, getNextEvent, getPrevious, getPreviousEvent, swapEventData } from './rundownUtils';

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

    const { previousEvent, previousIndex } = getPrevious(testRundown as OntimeRundown, '3');
    expect(previousEvent?.id).toBe('2');
    expect(previousIndex).toBe(1);
  });
  it('allow other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { previousEvent, previousIndex } = getPrevious(testRundown as OntimeRundown, '3');
    expect(previousEvent?.id).toBe('2');
    expect(previousIndex).toBe(1);
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const { previousEvent, previousIndex } = getPrevious(testRundown as OntimeRundown, '2');
    expect(previousEvent).toBe(null);
    expect(previousIndex).toBe(null);
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
});

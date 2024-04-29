import type { NormalisedRundown, OntimeEvent, OntimeRundown } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import {
  getLastEvent,
  getLastNormal,
  getNext,
  getNextEvent,
  getNextEventWithCue,
  getPrevious,
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
});

describe('getNextEventWithCue', () => {
  it('returns the first event with cue', () => {
    const testRundown = [
      { id: '1', cue: 'A', type: SupportedEvent.Event },
      { id: '2', cue: 'B', type: SupportedEvent.Event },
      { id: '3', cue: 'C', type: SupportedEvent.Event },
      { id: '4', cue: 'D', type: SupportedEvent.Event },
      { id: '5', cue: 'E', type: SupportedEvent.Event },
      { id: '6', cue: 'F', type: SupportedEvent.Event },
    ];

    const event = getNextEventWithCue(testRundown as OntimeRundown, 'd');
    expect(event?.id).toBe('4');
  });
  it('returns the null if cue not found', () => {
    const testRundown = [
      { id: '1', cue: 'A', type: SupportedEvent.Event },
      { id: '2', cue: 'B', type: SupportedEvent.Event },
      { id: '3', cue: 'C', type: SupportedEvent.Event },
      { id: '4', cue: 'D', type: SupportedEvent.Event },
      { id: '5', cue: 'E', type: SupportedEvent.Event },
      { id: '6', cue: 'F', type: SupportedEvent.Event },
    ];

    const event = getNextEventWithCue(testRundown as OntimeRundown, 'G');
    expect(event).toBe(null);
  });
  it('returns the next event with cue given index', () => {
    const testRundown = [
      { id: '1', cue: 'A', type: SupportedEvent.Event },
      { id: '2', cue: 'B', type: SupportedEvent.Event },
      { id: '3', cue: 'C', type: SupportedEvent.Event },
      { id: '4', cue: 'D', type: SupportedEvent.Event },
      { id: '5', cue: 'E', type: SupportedEvent.Event },
      { id: '6', cue: 'A', type: SupportedEvent.Event },
    ];

    const event = getNextEventWithCue(testRundown as OntimeRundown, 'A', 2);
    expect(event?.id).toBe('6');
  });
  it('handles mixed entry types', () => {
    const testRundown = [
      { id: '1', cue: 'A', type: SupportedEvent.Event },
      { id: '2', cue: 'B', type: SupportedEvent.Event },
      { id: 'B1', type: SupportedEvent.Block },
      { id: '3', cue: 'C', type: SupportedEvent.Event },
      { id: '4', cue: 'D', type: SupportedEvent.Event },
      { id: 'D1', type: SupportedEvent.Delay },
      { id: '5', cue: 'E', type: SupportedEvent.Event },
      { id: '6', cue: 'A', type: SupportedEvent.Event },
    ];

    const event = getNextEventWithCue(testRundown as OntimeRundown, 'A', 2);
    expect(event?.id).toBe('6');
  });
  it('do not loop around', () => {
    const testRundown = [
      { id: '1', cue: 'A', type: SupportedEvent.Event },
      { id: '2', cue: 'B', type: SupportedEvent.Event },
      { id: '3', cue: 'C', type: SupportedEvent.Event },
      { id: '4', cue: 'D', type: SupportedEvent.Event },
      { id: '5', cue: 'E', type: SupportedEvent.Event },
      { id: '6', cue: 'F', type: SupportedEvent.Event },
    ];

    const event = getNextEventWithCue(testRundown as OntimeRundown, 'A', 2);
    expect(event).toBe(null);
  });
});

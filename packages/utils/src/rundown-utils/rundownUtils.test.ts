import { OntimeRundown, SupportedEvent } from 'ontime-types';

import { getNext, getNextEvent, getPrevious, getPreviousEvent } from './rundownUtils';

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

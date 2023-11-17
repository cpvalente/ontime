import { OntimeRundown, SupportedEvent } from 'ontime-types';

import { getNextEvent, getPreviousEvent } from './rundownUtils';

describe('getNextEvent()', () => {
  it('returns the next event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const next = getNextEvent(testRundown as OntimeRundown, '1');
    expect(next?.id).toBe('2');
  });
  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const next = getNextEvent(testRundown as OntimeRundown, '1');
    expect(next?.id).toBe('4');
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
    ];

    const next = getNextEvent(testRundown as OntimeRundown, '1');
    expect(next).toBe(null);
  });
});

describe('getPreviousEvent()', () => {
  it('returns the previous event of type event', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Event },
      { id: '3', type: SupportedEvent.Event },
    ];

    const previous = getPreviousEvent(testRundown as OntimeRundown, '3');
    expect(previous?.id).toBe('2');
  });
  it('ignores other event types', () => {
    const testRundown = [
      { id: '1', type: SupportedEvent.Event },
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const previous = getPreviousEvent(testRundown as OntimeRundown, '4');
    expect(previous?.id).toBe('1');
  });
  it('returns null if none found', () => {
    const testRundown = [
      { id: '2', type: SupportedEvent.Delay },
      { id: '3', type: SupportedEvent.Block },
      { id: '4', type: SupportedEvent.Event },
    ];

    const previous = getNextEvent(testRundown as OntimeRundown, '1');
    expect(previous).toBe(null);
  });
});

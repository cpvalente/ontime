import { OntimeRundown, SupportedEvent } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';
import { getNextEvent, getPreviousEvent } from './rundownUtils';
import { calculateDuration } from './rundownUtils.js';

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

describe('calculateDuration()', () => {
  describe('Given start and end values', () => {
    it('is the difference between end and start', () => {
      const duration = calculateDuration(10, 20);
      expect(duration).toBe(10);
    });
  });

  describe('Handles edge cases', () => {
    it('handles events that go over midnight', () => {
      const duration = calculateDuration(51, 50);
      expect(duration).not.toBe(-50);
      expect(duration).toBe(dayInMs - 1);
    });
    it('when both are equal', () => {
      const testStart = 1;
      const testEnd = 1;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd - testStart);
    });

    it('handles no difference', () => {
      const duration1 = calculateDuration(0, 0);
      const duration2 = calculateDuration(dayInMs, dayInMs);
      expect(duration1).toBe(0);
      expect(duration2).toBe(0);
    });
  });
});

describe('calculateDuration()', () => {
  describe('Given start and end values', () => {
    it('is the difference between end and start', () => {
      const duration = calculateDuration(10, 20);
      expect(duration).toBe(10);
    });
  });

  describe('Handles edge cases', () => {
    it('handles events that go over midnight', () => {
      const duration = calculateDuration(51, 50);
      expect(duration).not.toBe(-50);
      expect(duration).toBe(dayInMs - 1);
    });
    it('when both are equal', () => {
      const testStart = 1;
      const testEnd = 1;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd - testStart);
    });

    it('handles no difference', () => {
      const duration1 = calculateDuration(0, 0);
      const duration2 = calculateDuration(dayInMs, dayInMs);
      expect(duration1).toBe(0);
      expect(duration2).toBe(0);
    });
  });
});
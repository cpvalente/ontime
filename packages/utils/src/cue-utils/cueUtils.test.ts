import type { OntimeDelay, OntimeEntry, OntimeEvent, RundownEntries } from 'ontime-types';
import { SupportedEntry } from 'ontime-types';

import { getCueCandidate, getIncrement } from './cueUtils.js';

describe('getIncrement()', () => {
  it('increments number', () => {
    expect(getIncrement('1')).toBe('2');
    expect(getIncrement('10')).toBe('11');
    expect(getIncrement('99')).toBe('100');
    expect(getIncrement('101')).toBe('102');
  });
  it('increments decimal number', () => {
    expect(getIncrement('1.1')).toBe('1.2');
    expect(getIncrement('1.9')).toBe('1.10');
    expect(getIncrement('10.10')).toBe('10.11');
    expect(getIncrement('99.99')).toBe('99.100');
    expect(getIncrement('101.101')).toBe('101.102');
    expect(getIncrement('101.999')).toBe('101.1000');
  });
  // NOTE: we also know the following fails since we only handle one decimal
  //it('handles multiple decimals', () => {
  //  expect(getIncrement('2.1.1')).toBe('2.1.2');
  //});
  it('finds last digit in string without separator', () => {
    expect(getIncrement('Presenter1')).toBe('Presenter2');
    expect(getIncrement('Presenter10')).toBe('Presenter11');
    expect(getIncrement('Presenter99')).toBe('Presenter100');
    expect(getIncrement('Presenter101')).toBe('Presenter102');
  });
  it('finds last digit in string with space separator', () => {
    expect(getIncrement('Presenter 1')).toBe('Presenter 2');
    expect(getIncrement('Presenter 10')).toBe('Presenter 11');
    expect(getIncrement('Presenter 99')).toBe('Presenter 100');
    expect(getIncrement('Presenter 101')).toBe('Presenter 102');
  });
  it('adds a 2 if none is found', () => {
    expect(getIncrement('Presenter')).toBe('Presenter-2');
  });
});

describe('getCueCandidate()', () => {
  describe('in the beginning of the rundown', () => {
    it('names cue as 1 if next event does not collide', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '11', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], null);
      expect(cue).toBe('1');
    });

    it('creates decimal stem if next cue is 1', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], null);
      expect(cue).toBe('0.1');
    });
  });

  describe('in the middle of the rundown', () => {
    it('names cue as an increment if next event has different stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('2');
    });

    it('names cue as an increment if next event has different stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter', type: SupportedEntry.Event } as OntimeEvent,
        '2': {
          id: '2',
          cue: 'Interval',
          type: SupportedEntry.Event,
        } as OntimeEntry,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter-2');
    });

    it.fails('creates decimal stem if next cue has same stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '2', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('1.1');
    });

    it.fails('creates decimal stem if next cue has same stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Presenter2', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter1.1');
    });
  });

  describe('considers edge cases', () => {
    it('previousEvent might not be a cue', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '2');
      expect(cue).toBe('11');
    });
  });

  it('there might not be events before', () => {
    const entries: RundownEntries = {
      '1': { id: '1', type: SupportedEntry.Delay } as OntimeDelay,
      '2': { id: '2', type: SupportedEntry.Delay } as OntimeDelay,
    };
    const cue = getCueCandidate(entries, ['1', '2'], '2');
    expect(cue).toBe('1');
  });
});

describe('findCueName() with mixed events', () => {
  describe('in the beginning of the rundown', () => {
    it('names cue as 1 if next event does not collide', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '11', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], null);
      expect(cue).toBe('1');
    });

    it('creates decimal stem if next cue is 1', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], null);
      expect(cue).toBe('0.1');
    });
  });

  describe('in the middle of the rundown', () => {

    it.todo('test inside groupp', () => { })

    it('names cue as an increment if next event has different stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('2');
    });

    it('names cue as an increment if next event has different stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Interval', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter-2');
    });

    it.fails('creates decimal stem if next cue has same stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: '2', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('1.1');
    });

    it.fails('creates decimal stem if next cue has same stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Presenter2', type: SupportedEntry.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter1.1');
    });
  });
});

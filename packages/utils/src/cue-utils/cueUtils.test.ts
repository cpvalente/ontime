import type { OntimeDelay, OntimeEntry, OntimeEvent, RundownEntries } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';

import { getCueCandidate, getIncrement, sanitiseCue } from './cueUtils.js';

describe('getIncrement()', () => {
  it('increments number', () => {
    expect(getIncrement('1')).toBe('2');
    expect(getIncrement('10')).toBe('11');
    expect(getIncrement('99')).toBe('100');
    expect(getIncrement('101')).toBe('102');
  });
  it('increments decimal number', () => {
    expect(getIncrement('1.1')).toBe('1.2');
    expect(getIncrement('10.10')).toBe('10.11');
    expect(getIncrement('99.99')).toBe('99.100');
    expect(getIncrement('101.101')).toBe('101.102');
    // NOTE: we know the below would fail, handling this amount of decimals is outside of scope
    // expect(getIncrement('101.999')).toBe('101.1000');
  });
  // NOTE: we also know the following fails since we only handle one decimal
  //it('handles multiple decimals', () => {
  //  expect(getIncrement('2.1.1')).toBe('2.1.2');
  //});
  it('finds last digit in string', () => {
    expect(getIncrement('Presenter1')).toBe('Presenter2');
    expect(getIncrement('Presenter10')).toBe('Presenter11');
    expect(getIncrement('Presenter99')).toBe('Presenter100');
    expect(getIncrement('Presenter101')).toBe('Presenter102');
  });
  it('adds a 2 if none is found', () => {
    expect(getIncrement('Presenter')).toBe('Presenter2');
  });
});

describe('getCueCandidate()', () => {
  describe('in the beginning of the rundown', () => {
    it('names cue as 1 if next event does not collide', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '11', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2']);
      expect(cue).toBe('1');
    });

    it('creates decimal stem if next cue is 1', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2']);
      expect(cue).toBe('0.1');
    });
  });

  describe('in the middle of the rundown', () => {
    it('names cue as an increment if next event has different stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('2');
    });

    it('names cue as an increment if next event has different stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter', type: SupportedEvent.Event } as OntimeEvent,
        '2': {
          id: '2',
          cue: 'Interval',
          type: SupportedEvent.Event,
        } as OntimeEntry,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter2');
    });

    it('creates decimal stem if next cue has same stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '2', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('1.1');
    });

    it('creates decimal stem if next cue has same stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Presenter2', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter1.1');
    });
  });

  describe('considers edge cases', () => {
    it('previousEvent might not be a cue', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '2');
      expect(cue).toBe('11');
    });
  });

  it('there might not be events before', () => {
    const entries: RundownEntries = {
      '1': { id: '1', type: SupportedEvent.Delay } as OntimeDelay,
      '2': { id: '2', type: SupportedEvent.Delay } as OntimeDelay,
    };
    const cue = getCueCandidate(entries, ['1', '2'], '2');
    expect(cue).toBe('1');
  });
});

describe('findCueName() with mixed events', () => {
  describe('in the beginning of the rundown', () => {
    it('names cue as 1 if next event does not collide', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '11', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2']);
      expect(cue).toBe('1');
    });

    it('creates decimal stem if next cue is 1', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2']);
      expect(cue).toBe('0.1');
    });
  });

  describe('in the middle of the rundown', () => {
    it('names cue as an increment if next event has different stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '10', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('2');
    });

    it('names cue as an increment if next event has different stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Interval', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter2');
    });

    it('creates decimal stem if next cue has same stem (case of numbers)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: '2', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('1.1');
    });

    it('creates decimal stem if next cue has same stem (case of letters)', () => {
      const entries: RundownEntries = {
        '1': { id: '1', cue: 'Presenter1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', cue: 'Presenter2', type: SupportedEvent.Event } as OntimeEvent,
      };
      const cue = getCueCandidate(entries, ['1', '2'], '1');
      expect(cue).toBe('Presenter1.1');
    });
  });
});

describe('sanitiseCue()', () => {
  it('removes spaces', () => {
    expect(sanitiseCue('  test')).toBe('test');
    expect(sanitiseCue('  test   ')).toBe('test');
    expect(sanitiseCue('test')).toBe('test');
    expect(sanitiseCue('t e s t ')).toBe('test');
  });
  it('enforces . as decimals', () => {
    expect(sanitiseCue('1,2')).toBe('1.2');
    expect(sanitiseCue('1,2,3')).toBe('1.2.3');
  });
});

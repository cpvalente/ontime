import { getAuxTimerIndexedLabel, getAuxTimerLabel } from '../auxTimerUtils';

describe('getAuxTimerLabel()', () => {
  it('shows the custom name when the timer is named', () => {
    expect(getAuxTimerLabel('Speaker', 1)).toBe('Speaker');
  });

  it('falls back to the timer index when unnamed', () => {
    expect(getAuxTimerLabel('', 2)).toBe('Aux 2');
    expect(getAuxTimerLabel(undefined, 3)).toBe('Aux 3');
    expect(getAuxTimerLabel('   ', 1)).toBe('Aux 1');
  });
});

describe('getAuxTimerIndexedLabel()', () => {
  it('keeps the timer identifiable by index when named', () => {
    expect(getAuxTimerIndexedLabel('Speaker', 1)).toBe('Aux 1: Speaker');
  });

  it('shows the index alone when unnamed', () => {
    expect(getAuxTimerIndexedLabel('', 2)).toBe('Aux 2');
    expect(getAuxTimerIndexedLabel(undefined, 3)).toBe('Aux 3');
  });
});

import { auxTimerNameMaxLength, normaliseAuxTimerNames, numberOfAuxTimers } from './auxTimerUtils.js';

describe('normaliseAuxTimerNames()', () => {
  it('generates the default value when given nothing', () => {
    expect(normaliseAuxTimerNames()).toStrictEqual(['', '', '']);
  });

  it('always returns an entry per aux timer', () => {
    expect(normaliseAuxTimerNames(['Speaker'])).toHaveLength(numberOfAuxTimers);
    expect(normaliseAuxTimerNames(['a', 'b', 'c', 'extra'])).toStrictEqual(['a', 'b', 'c']);
  });

  it('pads missing entries with an empty string', () => {
    expect(normaliseAuxTimerNames(['Speaker'])).toStrictEqual(['Speaker', '', '']);
  });

  it('trims whitespace', () => {
    expect(normaliseAuxTimerNames(['  Speaker  ', '', ''])).toStrictEqual(['Speaker', '', '']);
  });

  it('caps the name length', () => {
    const tooLong = 'a'.repeat(auxTimerNameMaxLength + 10);
    expect(normaliseAuxTimerNames([tooLong])[0]).toHaveLength(auxTimerNameMaxLength);
  });

  it('falls back to defaults for malformed data', () => {
    expect(normaliseAuxTimerNames('not-an-array')).toStrictEqual(['', '', '']);
    expect(normaliseAuxTimerNames(null)).toStrictEqual(['', '', '']);
    expect(normaliseAuxTimerNames([42, {}, undefined])).toStrictEqual(['', '', '']);
  });
});

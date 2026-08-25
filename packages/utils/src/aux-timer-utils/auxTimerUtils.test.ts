import { auxTimerNameMaxLength, sanitiseAuxTimerNames } from './auxTimerUtils.js';

describe('sanitiseAuxTimerNames()', () => {
  it('generates the default value when given nothing', () => {
    expect(sanitiseAuxTimerNames()).toStrictEqual(['', '', '']);
  });

  it('always returns exactly three entries', () => {
    expect(sanitiseAuxTimerNames(['a', 'b', 'c', 'extra'])).toStrictEqual(['a', 'b', 'c']);
  });

  it('pads missing entries with an empty string', () => {
    expect(sanitiseAuxTimerNames(['Speaker'])).toStrictEqual(['Speaker', '', '']);
  });

  it('trims whitespace', () => {
    expect(sanitiseAuxTimerNames(['  Speaker  ', '', ''])).toStrictEqual(['Speaker', '', '']);
  });

  it('caps the name length', () => {
    const tooLong = 'a'.repeat(auxTimerNameMaxLength + 10);
    expect(sanitiseAuxTimerNames([tooLong])[0]).toHaveLength(auxTimerNameMaxLength);
  });

  it('falls back to defaults for malformed data', () => {
    expect(sanitiseAuxTimerNames('not-an-array')).toStrictEqual(['', '', '']);
    expect(sanitiseAuxTimerNames(null)).toStrictEqual(['', '', '']);
    expect(sanitiseAuxTimerNames([42, {}, undefined])).toStrictEqual(['', '', '']);
  });
});

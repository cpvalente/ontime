import { millisToDelayString } from '../dateConfig';

describe('millisToDelayString()', () => {
  it('returns null for null values', () => {
    expect(millisToDelayString(null)).toBe('');
  });
  it('returns null 0', () => {
    expect(millisToDelayString(0)).toBe('');
  });
  describe('converts values in seconds', () => {
    it('shows a simple string with value in seconds', () => {
      expect(millisToDelayString(10000)).toBe('+10 sec');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-10000)).toBe('-10 sec');
    });

    const underAMinute = [1, 500, 1000, 6000, 55000, 59999];
    underAMinute.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('sec')).toBe(true);
      });
    });
  });

  describe('converts values in minutes', () => {
    it('shows a simple string with value in minutes', () => {
      expect(millisToDelayString(720000)).toBe('+12 min');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-720000)).toBe('-12 min');
    });
    it('shows a simple string with value in minutes and seconds', () => {
      expect(millisToDelayString(630000)).toBe('+00:10:30');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-630000)).toBe('-00:10:30');
    });

    const underAnHour = [60000, 360000, 720000];
    underAnHour.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('min')).toBe(true);
      });
    });
  });

  describe('converts values with full time string', () => {
    it('positive added time', () => {
      expect(millisToDelayString(45015000)).toBe('+12:30:15');
    });
    it('negative added time', () => {
      expect(millisToDelayString(-45015000)).toBe('-12:30:15');
    });
  });
});

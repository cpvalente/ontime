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
      expect(millisToDelayString(10000)).toBe('+10s');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-10000)).toBe('-10s');
    });

    const underAMinute = [1000, 6000, 55000, 59999];
    underAMinute.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('s')).toBe(true);
      });
    });
  });

  describe('converts values in minutes', () => {
    it('shows a simple string with value in minutes', () => {
      expect(millisToDelayString(720000)).toBe('+12m');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-720000)).toBe('-12m');
    });
    it('shows a simple string with value in minutes and seconds', () => {
      expect(millisToDelayString(630000)).toBe('+10m30s');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-630000)).toBe('-10m30s');
    });

    const underAnHour = [60000, 360000, 720000];
    underAnHour.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('m')).toBe(true);
      });
    });
  });

  describe('converts values with full time string', () => {
    it('positive added time', () => {
      expect(millisToDelayString(45015000)).toBe('+12h30m15s');
    });
    it('negative added time', () => {
      expect(millisToDelayString(-45015000)).toBe('-12h30m15s');
    });
  });
});

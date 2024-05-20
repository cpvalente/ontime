import { isISO8601, isTimeString } from './isTimeString';

describe('test isTimeString() function', () => {
  it('it validates time strings', () => {
    const ts = ['2', '2:10', '2:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(true);
    }
  });

  it('it fails overloaded times', () => {
    const ts = ['70', '89:10', '26:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(false);
    }
  });
});

describe('test isTimeString() function handle different separators', () => {
  const ts = ['2:10', '2,10', '2.10'];
  for (const s of ts) {
    it(`it handles ${s}`, () => {
      expect(isTimeString(s)).toBe(true);
    });
  }
});

describe('test isTimeString() function handle AM/PM', () => {
  const ts = ['2:10AM', '2:10PM', '2:10'];
  for (const s of ts) {
    it(`it handles ${s}`, () => {
      expect(isTimeString(s)).toBe(true);
    });
  }
});

describe('isISO8601()', () => {
  it('returns true for valid ISO 8601 date-time strings', () => {
    expect(isISO8601('1899-12-30T08:30:00.000Z')).toBe(true);
    expect(isISO8601('2022-01-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false for invalid ISO 8601 date-time strings', () => {
    expect(isISO8601('not a date')).toBe(false);
    expect(isISO8601('1899-12-30T08:30:00Z')).toBe(false); // missing milliseconds
    expect(isISO8601('1899-12-30 08:30:00.000Z')).toBe(false); // space instead of 'T'
  });
});

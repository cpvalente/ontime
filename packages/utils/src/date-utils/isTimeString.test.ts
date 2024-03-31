import { isTimeString } from './isTimeString';

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

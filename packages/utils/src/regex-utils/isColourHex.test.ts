import { isColourHex } from './isColourHex';

describe('test isColourHex() function', () => {
  it('validates colour hex strings', () => {
    const ts = ['#FFF', '#FFFF', '#FFFFFF', '#FFFFFFFF'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(true);
    }
  });

  it('validates colour hex strings', () => {
    const ts = ['#F90', '#1234', '#56789A', '#BCDEF012'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(true);
    }
  });

  it('validates colour hex strings', () => {
    const ts = ['#f90', '#1234', '#56789a', '#bcdef012'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(true);
    }
  });

  it('fails digits bigger than F', () => {
    const ts = ['#FFG'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(false);
    }
  });

  it('fails incorrect amount of digits', () => {
    const ts = ['#F', '#FF', '#FFFFF', '#FFFFFFF', '#FFFFFFFFF'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(false);
    }
  });

  it('fails missing #', () => {
    const ts = ['FFF', 'FFFF', 'FFFFFF', 'FFFFFFFF'];
    for (const s of ts) {
      expect(isColourHex(s)).toBe(false);
    }
  });
});

import { isAlphanumeric } from './isAlphanumeric';

describe('test isAlphanumeric() function', () => {
  it('it OK strings', () => {
    const ts = ['abcdefghijklmnopqrstuvwxyz', '0123456798', '123asd'];
    for (const s of ts) {
      expect(isAlphanumeric(s)).toBe(true);
    }
  });

  it('it bad strings', () => {
    const ts = ['!abcd1234', 'åøæ', '*'];
    for (const s of ts) {
      expect(isAlphanumeric(s)).toBe(false);
    }
  });
});

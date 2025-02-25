import { isAlphanumeric, isIPAddress, isNotEmpty, isOnlyNumbers, startsWithHttp, startsWithSlash } from '../regex';

describe('simple tests for regex', () => {
  test('isOnlyNumbers', () => {
    const right = ['1231', '1'];
    const wrong = ['a', 'asdas1asdas', '11as', '1_', '1.1'];

    right.forEach((t) => {
      expect(isOnlyNumbers.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(isOnlyNumbers.test(t)).toBe(false);
    });
  });

  test('isIPAddress', () => {
    const right = ['0.0.0.0', '127.0.0.1'];
    const wrong = ['0', 'testing', '123.0.1'];

    right.forEach((t) => {
      expect(isIPAddress.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(isIPAddress.test(t)).toBe(false);
    });
  });

  test('startsWithHttp', () => {
    const right = ['https://test', 'http://test'];
    const wrong = ['testing', '123.0.1'];

    right.forEach((t) => {
      expect(startsWithHttp.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(startsWithHttp.test(t)).toBe(false);
    });
  });

  test('startsWithSlash', () => {
    const right = ['//test'];
    const wrong = ['testing', '123.0.1'];

    right.forEach((t) => {
      expect(startsWithSlash.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(startsWithSlash.test(t)).toBe(false);
    });
  });

  test('isAlphanumeric', () => {
    const right = ['dsafdsafa9f9sdafdsSADFHASDF', '1231', '1', 'a', 'asdas1asdas', '11as', '1'];
    const wrong = ['with space', 'with @', '#'];

    right.forEach((t) => {
      expect(isAlphanumeric.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(isAlphanumeric.test(t)).toBe(false);
    });
  });

  test('isNotEmpty', () => {
    const right = ['notempty'];
    const wrong = ['', ' '];

    right.forEach((t) => {
      expect(isNotEmpty.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(isNotEmpty.test(t)).toBe(false);
    });
  });
});

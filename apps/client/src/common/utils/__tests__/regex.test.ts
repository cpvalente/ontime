import { isIPAddress, isOnlyNumbers, startsWithHttp } from '../regex';

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
    const right = ['http://test'];
    const wrong = ['https://test', 'testing', '123.0.1'];

    right.forEach((t) => {
      expect(startsWithHttp.test(t)).toBe(true);
    });
    wrong.forEach((t) => {
      expect(startsWithHttp.test(t)).toBe(false);
    });
  });
});

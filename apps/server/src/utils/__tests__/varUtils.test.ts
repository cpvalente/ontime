import { isObject } from '../varUtils.js';

describe('isObject', () => {
  const testCases = [1, 0, false, undefined, 'test', null, () => undefined, []];
  testCases.forEach((test) => {
    it(`recognises normal primitives ${test}`, () => {
      const result = isObject(test);
      expect(result).toBe(false);
    });
  });
});

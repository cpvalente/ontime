import { isEmptyObject, mergeObject, removeUndefined } from '../parserUtils.js';

describe('isEmptyObject()', () => {
  test('finds an empty object', () => {
    const isEmpty = isEmptyObject({});
    expect(isEmpty).toBe(true);
  });
  test('throws on other types', () => {
    expect(() => isEmptyObject(12)).toThrow();
  });
  test('resolves an object with methods', () => {
    const isEmpty = isEmptyObject({ test: 'yes' });
    expect(isEmpty).toBe(false);
  });
});

describe('mergeObject()', () => {
  test('it suppresses undefined keys', () => {
    const a = {
      first: 'yes',
      second: 'yes',
    };
    const b = {
      first: undefined,
      second: 'no',
    };
    const merged = mergeObject(a, b);
    expect(merged).toStrictEqual({
      first: 'yes',
      second: 'no',
    });
  });
  test('it handles falsy values', () => {
    const a = {
      first: 'yes',
      second: 'yes',
      third: 'yes',
    };
    const b = {
      first: 0,
      second: null,
      third: '',
    };
    const merged = mergeObject(a, b);
    expect(merged).toStrictEqual({
      first: 0,
      second: null,
      third: '',
    });
  });
  test.skip('it only merges fields of the first object', () => {
    const a = {
      first: 'yes',
      second: 'yes',
      third: 'yes',
    };
    const b = {
      first: 0,
      second: null,
      third: '',
      forth: 'not-this',
    };
    const merged = mergeObject(a, b);
    expect(merged).toStrictEqual({
      first: 0,
      second: null,
      third: '',
    });
  });
});

describe('removeUndefined()', () => {
  test('it removes undefined keys from object', () => {
    const obj = {
      first: 'yes',
      second: undefined,
      third: 'yes',
    };
    expect(removeUndefined(obj)).toStrictEqual({
      first: 'yes',
      third: 'yes',
    });
  });
  test('it handles falsy values object', () => {
    const obj = {
      first: '',
      second: 0,
      third: 'null',
    };
    expect(removeUndefined(obj)).toStrictEqual(obj);
  });
});

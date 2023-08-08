import { isEmptyObject, mergeObject, removeUndefined, validateDuration } from '../parserUtils.js';
import { dayInMs } from 'ontime-utils';

describe('isEmptyObject()', () => {
  test('finds an empty object', () => {
    const isEmpty = isEmptyObject({});
    expect(isEmpty).toBe(true);
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

describe('validateDuration()', () => {
  it('is the difference between end and start', () => {
    const duration = validateDuration(10, 20);
    expect(duration).toBe(10);
  });
  it('handles no difference', () => {
    const duration1 = validateDuration(0, 0);
    const duration2 = validateDuration(dayInMs, dayInMs);
    expect(duration1).toBe(0);
    expect(duration2).toBe(0);
  });
  it('handles events that go over midnight', () => {
    const duration = validateDuration(51, 50);
    expect(duration).not.toBe(-50);
    expect(duration).toBe(dayInMs - 1);
  });
});

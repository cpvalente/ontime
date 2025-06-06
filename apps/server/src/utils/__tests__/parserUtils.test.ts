import { isEmptyObject, makeString, removeUndefined } from '../parserUtils.js';

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

describe('makeString()', () => {
  it('converts variables to string', () => {
    const cases = [
      {
        val: 2,
        expected: '2',
      },
      {
        val: 2.22222222,
        expected: '2.22222222',
      },
      {
        val: ['testing'],
        expected: 'testing',
      },
      {
        val: ' testing    ',
        expected: 'testing',
      },
      {
        val: { doing: 'testing' },
        expected: 'fallback',
      },
      {
        val: undefined,
        expected: 'fallback',
      },
    ];

    cases.forEach(({ val, expected }) => {
      const converted = makeString(val, 'fallback');
      expect(converted).toBe(expected);
    });
  });
});

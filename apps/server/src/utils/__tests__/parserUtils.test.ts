import { isEmptyObject, mergeObject, removeUndefined } from '../parserUtils.js';

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
      second: 'yes' as string | null,
      third: 'yes',
    };
    const b = {
      first: 'no',
      second: null,
      third: '',
    };
    const merged = mergeObject(a, b);
    expect(merged).toStrictEqual({
      first: 'no',
      second: null,
      third: '',
    });
  });
  test('it only merges fields of the first object', () => {
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
    // @ts-expect-error -- testing changing type
    const merged = mergeObject(a, b);
    expect(merged).toStrictEqual({
      first: 0,
      second: null,
      third: '',
    });
  });
  test('merges nested objects', () => {
    // Define a sample object with nested properties
    const a = {
      name: 'John',
      address: {
        city: 'New York',
        postalCode: '10001',
      },
    };

    // Define a partial object with nested properties for merging
    const b = {
      name: 'Doe',
      address: {
        city: 'San Francisco',
        state: 'CA',
      },
    };

    // @ts-expect-error -- testing missing property
    const merged = mergeObject(a, b);

    expect(merged.name).toBe('Doe');
    expect(merged.address.city).toBe('San Francisco');
    // @ts-expect-error -- its ok, just checking
    expect(merged.address.state).toBe('CA');
    expect(merged.address.postalCode).toBe('10001');
    expect(merged.address).not.toBe(a.address);
    expect(merged.address).not.toBe(b.address);
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

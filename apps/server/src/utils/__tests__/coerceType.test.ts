import { coerceBoolean, coerceColour, coerceEnum, coerceNumber, coerceString } from '../coerceType.js';

describe('parses a colour string that is', () => {
  it('valid hex', () => {
    const color = coerceColour('#000');
    expect(color).toBe('#000');
  });
  it('valid name', () => {
    const color = coerceColour('darkgoldenrod');
    expect(color).toBe('darkgoldenrod');
  });
  it('invalid hex', () => {
    expect(() => coerceColour('#not a hex color')).toThrowError(Error('Invalid hex colour received'));
  });
  it('invalid name', () => {
    expect(() => coerceColour('bad name')).toThrowError(Error('Invalid colour name received'));
  });
  it('not a string', () => {
    expect(() => coerceColour(5)).toThrowError(Error('Invalid colour value received'));
  });
  it('undefinde and null are not valid', () => {
    expect(() => coerceColour(null)).toThrowError(Error('Invalid colour value received'));
    expect(() => coerceColour(undefined)).toThrowError(Error('Invalid colour value received'));
  });
  it('empty string is allowed', () => {
    expect(coerceColour('')).toBe('');
  });
});

describe('match a string to an enum that is', () => {
  enum testEnum {
    ABC = 'abc',
    DEF = 'def',
    GHI = 'ghi',
  }
  it('valid key', () => {
    const key = coerceEnum<testEnum>('abc', testEnum);
    expect(key).toBe('abc');
  });
  it('invalid key', () => {
    expect(() => coerceEnum('123', testEnum)).toThrow();
  });
  it('invalid type', () => {
    expect(() => coerceEnum(123, testEnum)).toThrow();
  });
});

describe('coerce unknown value to a number', () => {
  it('throws on null', () => {
    expect(() => coerceNumber(null)).toThrowError('Invalid value received');
  });

  it('throws on NaN', () => {
    expect(() => coerceNumber('abc')).toThrowError('Invalid value received');
  });

  it('throws on undefined', () => {
    expect(() => coerceNumber(undefined)).toThrowError('Invalid value received');
  });

  it('throws on object', () => {
    expect(() => coerceNumber({ test: 'object' })).toThrowError('Invalid value received');
  });

  it('throws on array', () => {
    expect(() => coerceNumber([1, 2, 3])).toThrowError('Invalid value received');
  });

  it('casts string to number', () => {
    expect(coerceNumber('123')).toStrictEqual(123);
  });

  it('handles white space', () => {
    expect(coerceNumber('   9   ')).toStrictEqual(9);
  });

  it('handles normal numbers', () => {
    expect(coerceNumber(5)).toStrictEqual(5);
  });

  it('handles booleans', () => {
    expect(coerceNumber(true)).toStrictEqual(1);
    expect(coerceNumber(false)).toStrictEqual(0);
  });
});

describe('coerce unknown value to a string', () => {
  it('throws on null', () => {
    expect(() => coerceString(null)).toThrowError('Invalid value received');
  });

  it('throws on undefined', () => {
    expect(() => coerceString(undefined)).toThrowError('Invalid value received');
  });

  it('throws on objects', () => {
    expect(() => coerceString({ test: 'object' })).toThrowError('Invalid value received');
  });

  it('throws on array', () => {
    expect(() => coerceString([1, 2, 3])).toThrowError('Invalid value received');
  });

  it('casts number to string', () => {
    expect(coerceString(123)).toStrictEqual('123');
  });

  it('handles normal strings', () => {
    expect(coerceString('abcd')).toStrictEqual('abcd');
  });

  it('handles booleans', () => {
    expect(coerceString(true)).toStrictEqual('true');
    expect(coerceString(false)).toStrictEqual('false');
  });
});

describe('coerce unknown value to a boolean', () => {
  it('throws on null', () => {
    expect(() => coerceBoolean(null)).toThrowError('Invalid value received');
  });

  it('throws on undefined', () => {
    expect(() => coerceBoolean(undefined)).toThrowError('Invalid value received');
  });

  it('throws on objects', () => {
    expect(() => coerceBoolean({ test: 'object' })).toThrowError('Invalid value received');
  });

  it('throws on array', () => {
    expect(() => coerceBoolean([1, 2, 3])).toThrowError('Invalid value received');
  });

  test('true strings', () => {
    expect(coerceBoolean('true')).toStrictEqual(true);
    expect(coerceBoolean('1')).toStrictEqual(true);
    expect(coerceBoolean('yes')).toStrictEqual(true);
  });

  test('false strings', () => {
    expect(coerceBoolean('false')).toStrictEqual(false);
    expect(coerceBoolean('0')).toStrictEqual(false);
    expect(coerceBoolean('no')).toStrictEqual(false);
    expect(coerceBoolean('')).toStrictEqual(false);
  });

  test('invalid strings', () => {
    expect(() => coerceBoolean('bla')).toThrowError('Invalid value received');
    expect(() => coerceBoolean(' ')).toThrowError('Invalid value received');
  });

  test('true numbers', () => {
    expect(coerceBoolean(1)).toStrictEqual(true);
  });

  test('false numbers', () => {
    expect(coerceBoolean(0)).toStrictEqual(false);
  });

  test('invalid numbers', () => {
    expect(() => coerceBoolean(0.5)).toThrowError('Invalid value received');
    expect(() => coerceBoolean(-1)).toThrowError('Invalid value received');
    expect(() => coerceBoolean(2)).toThrowError('Invalid value received');
    expect(() => coerceBoolean(NaN)).toThrowError('Invalid value received');
    expect(() => coerceBoolean(Infinity)).toThrowError('Invalid value received');
  });

  test('booleans', () => {
    expect(coerceBoolean(true)).toStrictEqual(true);
    expect(coerceBoolean(false)).toStrictEqual(false);
  });
});

describe('coerce unknown value to a colour', () => {
  it('throws on all non strings', () => {
    expect(() => coerceColour(null)).toThrowError('Invalid colour value received');
    expect(() => coerceColour(undefined)).toThrowError('Invalid colour value received');
    expect(() => coerceColour({ test: 'object' })).toThrowError('Invalid colour value received');
    expect(() => coerceColour([1, 2, 3])).toThrowError('Invalid colour value received');
    expect(() => coerceColour(true)).toThrowError('Invalid colour value received');
    expect(() => coerceColour(false)).toThrowError('Invalid colour value received');
  });

  test('hex values', () => {
    expect(() => coerceColour('#1')).toThrowError('Invalid hex colour received');
    expect(coerceColour('#AAA')).toStrictEqual('#aaa');
    expect(coerceColour('#FF3366')).toStrictEqual('#ff3366');
  });

  test('css values', () => {
    expect(() => coerceColour('grøn')).toThrowError('Invalid colour name received');
    expect(coerceColour('')).toStrictEqual('');
    expect(coerceColour('aliceblue')).toStrictEqual('aliceblue');
    expect(coerceColour('darkkhaki')).toStrictEqual('darkkhaki');
  });
});

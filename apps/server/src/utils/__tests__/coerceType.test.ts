import { coerceColour, coerceEnum } from '../coerceType.js';

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
    'abc',
    'def',
    'ghi',
  }
  it('valid key', () => {
    const key = coerceEnum<testEnum>('abc', testEnum);
    expect(key).toBe('abc');
  });
  it('invalid key', () => {
    expect(() => coerceEnum('123', testEnum)).toThrowError(Error('Invalid value received'));
  });
  it('invalid type', () => {
    expect(() => coerceEnum(123, testEnum)).toThrowError(Error('Invalid value received'));
  });
});

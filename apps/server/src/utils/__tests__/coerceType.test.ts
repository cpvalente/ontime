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
    expect(() => coerceEnum('123', testEnum)).toThrowError(Error('Invalid value received'));
  });
  it('invalid type', () => {
    expect(() => coerceEnum(123, testEnum)).toThrowError(Error('Invalid value received'));
  });
});

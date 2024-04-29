import { coerceColour, coerceString } from '../coerceType.js';

describe('coerceString', () => {
  it('valid string', () => {
    const string = coerceString('TEST');
    expect(string).toBe('TEST');
  });
  it('valid number to string', () => {
    const string = coerceString(12345);
    expect(string).toBe('12345');
  });
  it('allow nullish values', () => {
    const string = coerceString(0);
    expect(string).toBe('0');
  });
  it('objects are dropped', () => {
    expect(() => coerceString({ test: 'test' })).toThrowError(Error('Invalid string value received'));
  });
  it('undefinde is dropped', () => {
    expect(() => coerceString(undefined)).toThrowError(Error('Invalid string value received'));
  });
  it('null is dropped', () => {
    expect(() => coerceString(null)).toThrowError(Error('Invalid string value received'));
  });
});

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

import { coerceColour } from '../coerceType.js';

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

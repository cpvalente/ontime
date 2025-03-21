import { hasKeys, isArray, isDefined, isNumber, isObject, isString } from '../assert.js';

describe('assert utilities', () => {
  it('should assert strings', () => {
    expect(() => isString('hello')).not.toThrow();
    expect(() => isString(123)).toThrow('Unexpected payload type: 123');
  });

  it('should assert numbers', () => {
    expect(() => isNumber(123)).not.toThrow();
    expect(() => isNumber('123')).toThrow('Unexpected payload type: 123');
  });

  it('should assert defined values', () => {
    expect(() => isDefined('value')).not.toThrow();
    expect(() => isDefined(undefined)).toThrow('Payload not found');
  });

  it('should assert objects', () => {
    expect(() => isObject({})).not.toThrow();
    expect(() => isObject(null)).toThrow('Unexpected payload type: null');
    expect(() => isObject([])).toThrow('Unexpected payload type: ');
  });

  it('should assert objects with specific keys', () => {
    expect(() => hasKeys({ a: 1, b: 2 }, ['a', 'b'])).not.toThrow();
    expect(() => hasKeys({ a: 1 }, ['a', 'b'])).toThrow('Unexpected payload type: [object Object]');
  });

  it('should assert arrays', () => {
    expect(() => isArray([1, 2, 3])).not.toThrow();
    expect(() => isArray('not an array')).toThrow('Unexpected payload type: not an array');
  });
});

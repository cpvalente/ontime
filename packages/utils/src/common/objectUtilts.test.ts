import { getPropertyFromPath } from './objectUtils';

describe('getNestedFromTemplate', () => {
  it('should return the value of a nested property', () => {
    expect(getPropertyFromPath('a', { a: 1 })).toBe(1);
    expect(getPropertyFromPath('a.b', { a: { b: 1 } })).toBe(1);
    expect(getPropertyFromPath('a.b.c', { a: { b: { c: 1 } } })).toBe(1);
  });

  it('should guard against values that do not exist', () => {
    expect(getPropertyFromPath('c', {})).toBe(undefined);
    expect(getPropertyFromPath('c', { a: 1 })).toBe(undefined);
    expect(getPropertyFromPath('a.c', { a: { b: 1 } })).toBeUndefined();
    expect(getPropertyFromPath('c.a', { a: { b: 1 } })).toBeUndefined();
    expect(getPropertyFromPath('a.b.b', { a: { b: { c: 1 } } })).toBeUndefined();
  });
});

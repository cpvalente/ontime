import { stringFromMillis } from '../time.js';

describe('test string to milis function', () => {
  it('test with null values', () => {
    const t = { val: null, result: '...' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: '01:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: '-01:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test  with 0', () => {
    const t = { val: 0, result: '00:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with -0', () => {
    const t = { val: -0, result: '00:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with 86400000 (24 hours)', () => {
    const t = { val: 86400000, result: '00:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with 86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: '00:00:01' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with -86401000 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: '-00:00:01' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });
});

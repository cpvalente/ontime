import { excelDateStringToMillis, stringFromMillis } from '../time.js';

describe('test string to millis function', () => {
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

  it('test with -1', () => {
    const t = { val: -1, result: '-00:00:00' };
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

  it('test with 999', () => {
    const t = { val: 999, result: '00:00:00' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });

  it('test with 1000', () => {
    const t = { val: 1000, result: '00:00:01' };
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

describe('test stringFromMillis handles partial secs', () => {
  it('test with 1795829', () => {
    const t = { val: 1795829, result: '00:29:55' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });
  it('test with 1797482', () => {
    const t = { val: 1797482, result: '00:29:57' };
    expect(stringFromMillis(t.val)).toBe(t.result);
  });
});

describe('test excel date parser', () => {
  it('handles an invalid date string', () => {
    const s = 'hello';
    expect(excelDateStringToMillis(s)).toBe(0);
  });
});

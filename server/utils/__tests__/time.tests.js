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

describe('test excel date parser', () => {
  it('parses the given dates correctly', () => {
    const d0 = '1899-12-30T00:00:00.000Z';
    const d1 = '1899-12-30T08:00:00.000Z';
    const d2 = '1899-12-30T08:30:00.000Z';

    const d0Millis = 0;
    const d1Millis = 28800000;
    const d2Millis = 30600000;

    expect(excelDateStringToMillis(d0)).toBe(d0Millis);
    expect(excelDateStringToMillis(d1)).toBe(d1Millis);
    expect(excelDateStringToMillis(d2)).toBe(d2Millis);
  });

  it('handles an invalid date string', () => {
    const s = 'hello';
    expect(excelDateStringToMillis(s)).toBe(0);
  });
});

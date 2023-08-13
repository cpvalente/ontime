import { formatDisplay } from './formatDisplay';

describe('test string from formatDisplay function', () => {
  it('test with null values', () => {
    const t = { val: null, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with not numbers', () => {
    const t = { val: 'test', result: '00:00:00' };
    // @ts-expect-error -- indulge me for the test
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: '01:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: '01:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with 0', () => {
    const t = { val: 0, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with -0', () => {
    const t = { val: -0, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with 86400 (24 hours)', () => {
    const t = { val: 86400000, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with 86401 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: '00:00:01' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with -86401 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: '00:00:01' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });
});

describe('test string from formatDisplay function with hidezero', () => {
  it('test with null values', () => {
    const t = { val: null, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: '01:00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: '01:00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with 0', () => {
    const t = { val: 0, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with -0', () => {
    const t = { val: -0, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with 86400 (24 hours)', () => {
    const t = { val: 86400000, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with 86401 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: '00:01' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with -86401 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: '00:01' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });
});

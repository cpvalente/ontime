import { expect } from 'vitest';

import { millisToString } from './timeFormatting';

describe('millisToString()', () => {
  it('returns fallback if millis is null', () => {
    const fallback = 'testFallback';
    expect(millisToString(null, { fallback })).toBe(fallback);
  });

  it('returns 00:00:00 if 0 is passed', () => {
    expect(millisToString(0)).toBe('00:00:00');
  });

  it('shows negative timers', () => {
    const testScenarios = [
      { millis: -300, expected: '-00:00:00' },
      { millis: -1000, expected: '-00:00:01' },
      { millis: -1500, expected: '-00:00:01' },
      { millis: -60000, expected: '-00:01:00' },
      { millis: -600000, expected: '-00:10:00' },
      { millis: -3600000, expected: '-01:00:00' },
      { millis: -36000000, expected: '-10:00:00' },
      { millis: -86399000, expected: '-23:59:59' },
      { millis: -86400000, expected: '-00:00:00' },
      { millis: -86401000, expected: '-00:00:01' },
    ];

    testScenarios.forEach((scenario) => {
      expect(millisToString(scenario.millis)).toBe(scenario.expected);
    });
  });

  test('random properties', () => {
    const testScenarios = [
      { millis: 300, expected: '00:00:00' },
      { millis: 1000, expected: '00:00:01' },
      { millis: 1500, expected: '00:00:01' },
      { millis: 60000, expected: '00:01:00' },
      { millis: 600000, expected: '00:10:00' },
      { millis: 3600000, expected: '01:00:00' },
      { millis: 36000000, expected: '10:00:00' },
      { millis: 86399000, expected: '23:59:59' },
      { millis: 86400000, expected: '00:00:00' },
      { millis: 86401000, expected: '00:00:01' },
    ];

    testScenarios.forEach((scenario) => {
      expect(millisToString(scenario.millis)).toBe(scenario.expected);
    });
  });

  test.skip('random properties without seconds', () => {
    const testScenarios = [
      { millis: 300, expected: '00:00' },
      { millis: 1000, expected: '00:00' },
      { millis: 1500, expected: '00:00' },
      { millis: 60000, expected: '00:01' },
      { millis: 600000, expected: '00:10' },
      { millis: 3600000, expected: '01:00' },
      { millis: 36000000, expected: '10:00' },
      { millis: 86399000, expected: '23:59' },
      { millis: 86400000, expected: '00:00' },
      { millis: 86401000, expected: '00:00' },
    ];

    testScenarios.forEach((scenario) => {
      expect(millisToString(scenario.millis)).toBe(scenario.expected);
    });
  });
});

/**
 * import { formatDisplay } from './formatDisplay';

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

 */
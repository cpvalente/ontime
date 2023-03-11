import { expect } from 'vitest';

import { millisToString } from './millisToString';

describe('millisToString()', () => {
  it('returns fallback if millis is null', () => {
    const fallback = 'testFallback';
    expect(millisToString(null, true, fallback)).toBe(fallback);
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

  test('random properties without seconds', () => {
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
      expect(millisToString(scenario.millis, false)).toBe(scenario.expected);
    });
  });
});

import { dayInMs, MILLIS_PER_HOUR } from './conversionUtils';
import { formatFromMillis, millisToString, removeLeadingZero } from './timeFormatting';

describe('millisToString()', () => {
  it('returns fallback if millis is null', () => {
    const fallback = 'testFallback';
    expect(millisToString(null, { fallback })).toBe(fallback);
  });

  it('returns 00:00:00 if 0 is passed', () => {
    expect(millisToString(0)).toBe('00:00:00');
  });

  test('negative times are rounded up', () => {
    const testScenarios = [
      { millis: 300, expected: '00:00:00' },
      { millis: -300, expected: '-00:00:01' },
      { millis: 1000, expected: '00:00:01' },
      { millis: -1000, expected: '-00:00:01' },
      { millis: 1500, expected: '00:00:01' },
      { millis: -1500, expected: '-00:00:02' },
      { millis: 60000 - 1, expected: '00:00:59' },
      { millis: -(60000 - 1), expected: '-00:01:00' },
      { millis: 60000, expected: '00:01:00' },
      { millis: -60000, expected: '-00:01:00' },
      { millis: 600000, expected: '00:10:00' },
      { millis: -600000, expected: '-00:10:00' },
      { millis: 3600000, expected: '01:00:00' },
      { millis: -3600000, expected: '-01:00:00' },
      { millis: 36000000, expected: '10:00:00' },
      { millis: -36000000, expected: '-10:00:00' },
      { millis: 86399000, expected: '23:59:59' },
      { millis: -86399000, expected: '-23:59:59' },
      { millis: 86400000, expected: '24:00:00' },
      { millis: -86400000, expected: '-24:00:00' },
      { millis: 86401000, expected: '24:00:01' },
      { millis: -86401000, expected: '-24:00:01' },
    ];

    testScenarios.forEach((scenario) => {
      expect(millisToString(scenario.millis)).toBe(scenario.expected);
    });
  });

  it('handles times over 24 hours', () => {
    expect(millisToString(dayInMs + MILLIS_PER_HOUR)).toBe('25:00:00');
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
      { millis: 86400000, expected: '24:00:00' },
      { millis: 86401000, expected: '24:00:01' },
    ];

    testScenarios.forEach((scenario) => {
      expect(millisToString(scenario.millis)).toBe(scenario.expected);
    });
  });
});

describe('removeLeadingZero()', () => {
  test('removes leading zero from timer', () => {
    expect(removeLeadingZero('00:00:00')).toBe('0:00');
    expect(removeLeadingZero('-00:08:47')).toBe('-8:47');
  });
});

describe('formatFromMillis()', () => {
  it('milliseconds', () => {
    const millis = 76211123; // Jan 1, 1970 21:10:11.123 UTC
    const format = 'S';
    const expectedResult = '123';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('seconds (no padding)', () => {
    const millis = 76211123;
    const format = 's';
    const expectedResult = '11';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('seconds (padding)', () => {
    const millis = 76211123;
    const format = 'ss';
    const expectedResult = '11';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('minute (no padding)', () => {
    const millis = 76211123;
    const format = 'm';
    const expectedResult = '10';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('minute (padding)', () => {
    const millis = 76211123;
    const format = 'mm';
    const expectedResult = '10';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 12 (no padding)', () => {
    const millis = 76211123;
    const format = 'h';
    const expectedResult = '9';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 12 (padding)', () => {
    const millis = 76211123;
    const format = 'hh';
    const expectedResult = '09';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 24 (no padding)', () => {
    const millis = 76211123;
    const format = 'H';
    const expectedResult = '21';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 24 (padding)', () => {
    const millis = 76211123;
    const format = 'HH';
    const expectedResult = '21';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('formatted time HH:mm:ss', () => {
    const millis = 76211123;
    const format = 'HH:mm:ss';
    const expectedResult = '21:10:11';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('formatted time hh:mm a', () => {
    const millis = 76211123;
    const format = 'hh:mm a';
    const expectedResult = '09:10 PM';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('milliseconds', () => {
    const millis = 29167345; // 08:06:08.345
    const format = 'S';
    const expectedResult = '345';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('seconds (no padding)', () => {
    const millis = 29167345;
    const format = 's';
    const expectedResult = '7';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('seconds (padding)', () => {
    const millis = 29167345;
    const format = 'ss';
    const expectedResult = '07';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('minute (no padding)', () => {
    const millis = 29167345;
    const format = 'm';
    const expectedResult = '6';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('minute (padding)', () => {
    const millis = 29167345;
    const format = 'mm';
    const expectedResult = '06';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 12 (no padding)', () => {
    const millis = 29167345;
    const format = 'h';
    const expectedResult = '8';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 12 (padding)', () => {
    const millis = 29167345;
    const format = 'hh';
    const expectedResult = '08';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 24 (no padding)', () => {
    const millis = 29167345;
    const format = 'H';
    const expectedResult = '8';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('hour - 24 (padding)', () => {
    const millis = 29167345;
    const format = 'HH';
    const expectedResult = '08';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('formatted time HH:mm:ss', () => {
    const millis = 29167345;
    const format = 'HH:mm:ss';
    const expectedResult = '08:06:07';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('formatted time hh:mm a', () => {
    const millis = 29167345;
    const format = 'hh:mm a';
    const expectedResult = '08:06 AM';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });
});

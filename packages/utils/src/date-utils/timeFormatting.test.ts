import { dayInMs } from '../timeConstants';
import { MILLIS_PER_HOUR } from './conversionUtils';
import { formatFromMillis, millisToString, removeLeadingZero } from './timeFormatting';

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
      { millis: -86400000, expected: '-24:00:00' },
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
  it('formats milliseconds to the specified format', () => {
    const millis = 1620072000000; // May 3, 2021 20:00:00 UTC
    const format = 'yyyy/MM/dd HH:mm:ss';
    const expectedResult = '2021/05/03 20:00:00';
    expect(formatFromMillis(millis, format)).toBe(expectedResult);
  });

  it('should throw an error if the date formatting does not match the expected regex', () => {
    const mockDate = vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(() => '01/23/24, 12:34:56');

    expect(() => formatFromMillis(Date.now(), 'yyyy-MM-dd HH:mm:ss')).toThrow('Date format mismatch or null result from regex match.');

    mockDate.mockRestore();
  });
});

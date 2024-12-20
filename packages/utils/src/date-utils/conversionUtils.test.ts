import { millisToHours, millisToMinutes, millisToSeconds, millisToUISeconds, secondsInMillis } from './conversionUtils';

describe('millisToUITimer()', () => {
  test('null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });
  test('1 sec', () => {
    const t = { val: 1000, result: 1 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });
  test('alsmot 1 sec', () => {
    const t = { val: 1032, result: 1 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });
  test('just past 1 sec', () => {
    const t = { val: 1000 - 32, result: 1 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });
  test('half way 1 sec', () => {
    const t = { val: 500, result: 1 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });

  test('zero', () => {
    const t = { val: 32, result: 0 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });

  test('zero', () => {
    const t = { val: 0, result: 0 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });

  test('negative', () => {
    const t = { val: -32, result: 0 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });

  test('negative', () => {
    const t = { val: -1000 + 33, result: 0 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });

  test('negative', () => {
    const t = { val: -1000 + 31, result: -1 };
    expect(millisToUISeconds(t.val)).toBe(t.result);
  });
});

describe('millisToSecond()', () => {
  test('null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('valid millis', () => {
    const t = { val: 3600000, result: 3600 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('negative millis', () => {
    const t = { val: -3600000, result: -3600 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('-0', () => {
    const t = { val: -0, result: 0 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: 86401 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  test('-86401000 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: -86401 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });
});

describe('millisToMinutes()', () => {
  test('null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('valid millis', () => {
    const t = { val: 3600000, result: 60 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('negative millis', () => {
    const t = { val: -3600000, result: -60 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('-0', () => {
    const t = { val: -0, result: 0 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: 1440 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });

  test('-86401000 (-24 hours and 1 second)', () => {
    // negative numbers are rounded up
    const t = { val: -86401000, result: -1441 };
    expect(millisToMinutes(t.val)).toBe(t.result);
  });
});

describe('millisToHours()', () => {
  test('null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('valid millis', () => {
    const t = { val: 3600000, result: 1 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('negative millis', () => {
    const t = { val: -3600000, result: -1 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('-0', () => {
    const t = { val: -0, result: 0 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: 24 };
    expect(millisToHours(t.val)).toBe(t.result);
  });

  test('-86401000 (-24 hours and 1 second)', () => {
    // negative numbers are rounded up
    const t = { val: -86401000, result: -25 };
    expect(millisToHours(t.val)).toBe(t.result);
  });
});

describe('secondsInMillis()', () => {
  it('return 0 if value is null', () => {
    expect(secondsInMillis(null)).toBe(0);
  });
  it('returns the seconds value of a millis date', () => {
    const date = 1686255053619; // Thu Jun 08 2023 20:10:53
    const seconds = secondsInMillis(date);
    expect(seconds).toBe(53);
  });
});

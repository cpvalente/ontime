import {
  formatDisplay,
  millisToMinutes,
  millisToSeconds,
  timeStringToMillis,
} from '../dateConfig';

describe('test string from formatDisplay function', () => {
  it('test with null values', () => {
    const t = { val: null, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600, result: '01:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600, result: '01:00:00' };
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
    const t = { val: 86400, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with 86401 (24 hours and 1 second)', () => {
    const t = { val: 86401, result: '00:00:01' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with -86401 (-24 hours and 1 second)', () => {
    const t = { val: -86401, result: '00:00:01' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });
});

describe('test string from formatDisplay function with hidezero', () => {
  it('test with null values', () => {
    const t = { val: null, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600, result: '01:00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600, result: '01:00:00' };
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
    const t = { val: 86400, result: '00:00' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with 86401 (24 hours and 1 second)', () => {
    const t = { val: 86401, result: '00:01' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });

  it('test with -86401 (-24 hours and 1 second)', () => {
    const t = { val: -86401, result: '00:01' };
    expect(formatDisplay(t.val, true)).toBe(t.result);
  });
});

describe('test millisToSeconds function', () => {
  it('test with null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: 3600 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: -3600 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test  with 0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test with -0', () => {
    const t = { val: -0, result: -0 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test with 86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: 86401 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });

  it('test with -86401000 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: -86401 };
    expect(millisToSeconds(t.val, false)).toBe(t.result);
  });
});

describe('test millisToMinutes function', () => {
  it('test with null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: 60 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: -60 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test  with 0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test with -0', () => {
    const t = { val: -0, result: -0 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test with 86401000 (24 hours and 1 second)', () => {
    const t = { val: 86401000, result: 1440 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });

  it('test with -86401000 (-24 hours and 1 second)', () => {
    const t = { val: -86401000, result: -1440 };
    expect(millisToMinutes(t.val, false)).toBe(t.result);
  });
});

describe('test timeStringToMillis function', () => {
  it('test with null', () => {
    const t = { val: null, result: 0 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 00:00:00', () => {
    const t = { val: '00:00:00', result: 0 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with -00:00:00', () => {
    const t = { val: '-00:00:00', result: 0 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 00:00:01', () => {
    const t = { val: '00:00:01', result: 1000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with -00:00:01', () => {
    const t = { val: '-00:00:01', result: 1000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 01:00:01', () => {
    const t = { val: '01:00:01', result: 3601000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 24:00:01', () => {
    const t = { val: '24:00:01', result: 86401000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 00:00:5', () => {
    const t = { val: '00:00:5', result: 5000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 00:1:00', () => {
    const t = { val: '00:1:00', result: 60000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 1:00:00', () => {
    const t = { val: '1:00:00', result: 3600000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });
});

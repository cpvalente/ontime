import {
  formatDisplay,
  isTimeString,
  millisToMinutes,
  millisToSeconds,
  forgivingStringToMillis,
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

  it('test with 1', () => {
    const t = { val: '1', result: 1000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 120', () => {
    const t = { val: '120', result: 120000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 56', () => {
    const t = { val: '56', result: 56000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 2:3', () => {
    const t = { val: '2:3', result: 123000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 02:3', () => {
    const t = { val: '02:3', result: 123000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });

  it('test with 2:03', () => {
    const t = { val: '2:03', result: 123000 };
    expect(timeStringToMillis(t.val)).toBe(t.result);
  });
});

describe('test isTimeString() function', () => {
  test('it validates time strings', () => {
    const ts = ['2', '2:10', '2:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(true);
    }
  });

  test('it fails overloaded times', () => {
    const ts = ['70', '89:10', '26:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(false);
    }
  });
});

describe('test isTimeString() function handle different separators', () => {
  const ts = ['2:10', '2,10', '2.10'];
  for (const s of ts) {
    test(`it handles ${s}`, () => {
      expect(isTimeString(s)).toBe(true);
    });
  }
});

describe('test timeHelper() function handles separators', () => {
  const ts = ['1:2:3:10', '2,10', '2.10'];
  for (const s of ts) {
    test(`it handles ${s}`, () => {
      expect(typeof forgivingStringToMillis(s)).toBe('number');
    });
  }
});

describe('test timeHelper() parses strings correctly', () => {
  const ts = [
    { value: '', expect: 0 },
    { value: '0', expect: 0 },
    { value: '-0', expect: 0 },
    { value: '1', expect: 60 * 1000 },
    { value: '-1', expect: 60 * 1000 },
    { value: '1.2', expect: 60 * 1000 + 2 * 1000 },
    { value: '1.70', expect: 60 * 1000 + 70 * 1000 },
    { value: '1.1.1', expect: 60 * 60 * 1000 + 60 * 1000 + 1000 },
    { value: '12.1.1', expect: 12 * 60 * 60 * 1000 + 60 * 1000 + 1000 },
    { value: '12.55.1', expect: 12 * 60 * 60 * 1000 + 55 * 60 * 1000 + 1000 },
    { value: '12.55.40', expect: 12 * 60 * 60 * 1000 + 55 * 60 * 1000 + 40 * 1000 },
  ];

  for (const s of ts) {
    test(`it handles ${s.value}`, () => {
      expect(forgivingStringToMillis(s.value)).toBe(s.expect);
    });
  }
});

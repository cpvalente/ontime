import {
  forgivingStringToMillis,
  formatDisplay,
  isTimeString,
  millisToDelayString,
  millisToMinutes,
  millisToSeconds,
} from '../dateConfig';

describe('test string from formatDisplay function', () => {
  it('test with null values', () => {
    const t = { val: null, result: '00:00:00' };
    expect(formatDisplay(t.val, false)).toBe(t.result);
  });

  it('test with not numbers', () => {
    const t = { val: 'test', result: '00:00:00' };
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

describe('test millisToSeconds function', () => {
  it('test with null values', () => {
    const t = { val: null, result: 0 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  it('test with valid millis', () => {
    const t = { val: 3600000, result: 3600 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  it('test with negative millis', () => {
    const t = { val: -3600000, result: -3600 };
    expect(millisToSeconds(t.val)).toBe(t.result);
  });

  it('test  with 0', () => {
    const t = { val: 0, result: 0 };
    expect(millisToSeconds(t.val)).toBe(t.result);
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

describe('test isTimeString() function', () => {
  it('it validates time strings', () => {
    const ts = ['2', '2:10', '2:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(true);
    }
  });

  it('it fails overloaded times', () => {
    const ts = ['70', '89:10', '26:10:22'];
    for (const s of ts) {
      expect(isTimeString(s)).toBe(false);
    }
  });
});

describe('test isTimeString() function handle different separators', () => {
  const ts = ['2:10', '2,10', '2.10'];
  for (const s of ts) {
    it(`it handles ${s}`, () => {
      expect(isTimeString(s)).toBe(true);
    });
  }
});

describe('test forgivingStringToMillis()', () => {
  describe('function handles time with no separators', () => {
    const testData = [
      { value: '', expect: 0 },
      { value: '0', expect: 0 },
      { value: '-0', expect: 0 },
      { value: '1', expect: 60 * 1000 },
      { value: '-1', expect: 60 * 1000 },
      { value: '000000', expect: 0 },
      { value: '000001', expect: 1000 },
      { value: '000100', expect: 1000 * 60 },
      { value: '010000', expect: 1000 * 60 * 60 },
      { value: '230000', expect: 1000 * 60 * 60 * 23 },
      { value: '121212', expect: 12 * 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 },
      { value: '0h0m0s', expect: 0 },
      { value: '0h0m1s', expect: 1000 },
      { value: '0h1m0s', expect: 1000 * 60 },
      { value: '1h0m0s', expect: 1000 * 60 * 60 },
      { value: '23h0m0s', expect: 1000 * 60 * 60 * 23 },
      { value: '12h12m12s', expect: 12 * 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 },
      { value: '2m', expect: 2 * 60 * 1000 },
      { value: '1h5s', expect: 1000 * 60 * 60 + 1000 * 5 },
      { value: '1h2m', expect: 1000 * 60 * 60 + 1000 * 60 * 2 },
    ];

    for (const s of testData) {
      it(`handles ${s.value} to left`, () => {
        expect(typeof forgivingStringToMillis(s.value)).toBe('number');
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
      it(`handles ${s.value} to right`, () => {
        expect(typeof forgivingStringToMillis(s.value, false)).toBe('number');
        expect(forgivingStringToMillis(s.value, false)).toBe(s.expect);
      });
    }
  });

  describe('parses strings correctly', () => {
    const ts = [
      { value: '1.1.1', expect: 60 * 60 * 1000 + 60 * 1000 + 1000 },
      { value: '12.1.1', expect: 12 * 60 * 60 * 1000 + 60 * 1000 + 1000 },
      { value: '12.55.1', expect: 12 * 60 * 60 * 1000 + 55 * 60 * 1000 + 1000 },
      { value: '12.55.40', expect: 12 * 60 * 60 * 1000 + 55 * 60 * 1000 + 40 * 1000 },
    ];

    for (const s of ts) {
      it(`handles ${s.value} to the left`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
      it(`handles ${s.value} to the right`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('handles overflows', () => {
    const ts = [
      // minutes overflow
      { value: '120', expect: 1000 * 60 * 120 },
      { value: '2.0.0', expect: 1000 * 60 * 120 },
      { value: '99', expect: 1000 * 60 * 99 },
      { value: '1.39.0', expect: 1000 * 60 * 99 },
      // seconds overflow
      { value: '0.0.120', expect: 120 * 1000 },
      { value: '0.2.0', expect: 120 * 1000 },
      { value: '0.0.99', expect: 99 * 1000 },
      { value: '0.1.39', expect: 99 * 1000 },
      // hours overflow
      { value: '25.0.0', expect: 1000 * 60 * 60 * 25 },
      // hours overflow
      { value: '50.0.0', expect: 1000 * 60 * 60 * 50 },
    ];

    for (const s of ts) {
      it(`handles ${s.value} to the left`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
      it(`handles ${s.value} to the right`, () => {
        expect(forgivingStringToMillis(s.value, false)).toBe(s.expect);
      });
    }
  });

  describe('test with fillRight (legacy)', () => {
    describe('function handles separators', () => {
      const testData = [
        { value: '1:2:3:10', expect: 3723000 },
        { value: '2,10', expect: 130000 },
        { value: '2.10', expect: 130000 },
        { value: '2 10', expect: 130000 },
      ];

      for (const s of testData) {
        it(`handles ${s.value}`, () => {
          expect(typeof forgivingStringToMillis(s.value, false)).toBe('number');
          expect(forgivingStringToMillis(s.value, false)).toBe(s.expect);
        });
      }
    });

    describe('parses strings correctly', () => {
      const ts = [
        { value: '1.2', expect: 60 * 1000 + 2 * 1000 },
        { value: '1.70', expect: 60 * 1000 + 70 * 1000 },
      ];

      for (const s of ts) {
        it(`handles ${s.value}`, () => {
          expect(forgivingStringToMillis(s.value, false)).toBe(s.expect);
        });
      }
    });

    describe('handles overflows', () => {
      const ts = [
        // minutes overflow
        { value: '0.120', expect: 120 * 1000 },
        { value: '0.99', expect: 99 * 1000 },
      ];

      for (const s of ts) {
        it(`handles ${s.value}`, () => {
          expect(forgivingStringToMillis(s.value, false)).toBe(s.expect);
        });
      }
    });
  });

  describe('test with fillLeft', () => {
    describe('function handles separators', () => {
      const testData = [
        { value: '1:2:3:10', expect: 3723000 },
        { value: '2,10', expect: 2 * 60 * 60 * 1000 + 60 * 10 * 1000 },
        { value: '2.10', expect: 2 * 60 * 60 * 1000 + 60 * 10 * 1000 },
        { value: '2 10', expect: 2 * 60 * 60 * 1000 + 60 * 10 * 1000 },
      ];

      for (const s of testData) {
        it(`handles ${s.value}`, () => {
          expect(typeof forgivingStringToMillis(s.value)).toBe('number');
          expect(forgivingStringToMillis(s.value)).toBe(s.expect);
        });
      }
    });

    describe('parses strings correctly', () => {
      const ts = [
        { value: '1.2', expect: 60 * 60 * 1000 + 2 * 60 * 1000 },
        { value: '1.70', expect: 60 * 60 * 1000 + 70 * 60 * 1000 },
      ];

      for (const s of ts) {
        it(`handles ${s.value}`, () => {
          expect(forgivingStringToMillis(s.value)).toBe(s.expect);
        });
      }
    });

    describe('handles overflows', () => {
      const ts = [
        // minutes overflow
        { value: '0.120', expect: 120 * 60 * 1000 },
        { value: '0.99', expect: 99 * 60 * 1000 },
      ];

      for (const s of ts) {
        it(`handles ${s.value}`, () => {
          expect(forgivingStringToMillis(s.value)).toBe(s.expect);
        });
      }
    });
  });
});

describe('millisToDelayString()', () => {
  it('returns null for null values', () => {
    expect(millisToDelayString(null)).toBeNull();
  });
  it('returns null 0', () => {
    expect(millisToDelayString(0)).toBeNull();
  });
  describe('converts values in seconds', () => {
    it(`shows a simple string with value in seconds`, () => {
      expect(millisToDelayString(10000)).toBe('+10sec');
    });
    it(`... and its negative counterpart`, () => {
      expect(millisToDelayString(-10000)).toBe('-10sec');
    });

    const underAMinute = [1, 500, 1000, 6000, 55000, 59999];
    underAMinute.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('sec')).toBe(true);
      });
    });
    expect(millisToDelayString(null)).toBeNull();
  });

  describe('converts values in minutes', () => {
    it(`shows a simple string with value in minutes`, () => {
      expect(millisToDelayString(720000)).toBe('+12min');
    });
    it(`... and its negative counterpart`, () => {
      expect(millisToDelayString(-720000)).toBe('-12min');
    });
    it(`shows a simple string with value in minutes and seconds`, () => {
      expect(millisToDelayString(630000)).toBe('+00:10:30');
    });
    it(`... and its negative counterpart`, () => {
      expect(millisToDelayString(-630000)).toBe('-00:10:30');
    });

    const underAnHour = [60000, 360000, 720000];
    underAnHour.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('min')).toBe(true);
      });
    });
  });

  describe('converts values with full time string', () => {
    it(`positive added time`, () => {
      expect(millisToDelayString(45015000)).toBe('+12:30:15');
    });
    it(`negative added time`, () => {
      expect(millisToDelayString(-45015000)).toBe('-12:30:15');
    });
  });
});

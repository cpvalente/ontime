import { forgivingStringToMillis, millisToDelayString } from '../dateConfig';

describe('test forgivingStringToMillis()', () => {
  describe('function handles time with no separators', () => {
    const testData = [
      { value: '', expect: 0 },
      { value: '0', expect: 0 },
      { value: '-0', expect: 0 },
      { value: '1', expect: 60 * 1000 },
      { value: '-1', expect: 60 * 1000 },
      { value: '0h0m0s', expect: 0 },
      { value: '0h0m1s', expect: 1000 },
      { value: '0h1m0s', expect: 1000 * 60 },
      { value: '1h0m0s', expect: 1000 * 60 * 60 },
      { value: '23h0m0s', expect: 1000 * 60 * 60 * 23 },
      { value: '12h12m12s', expect: 12 * 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 },
      { value: '12H12M12S', expect: 12 * 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 },
      { value: '2m', expect: 2 * 60 * 1000 },
      { value: '1h5s', expect: 1000 * 60 * 60 + 1000 * 5 },
      { value: '1h2m', expect: 1000 * 60 * 60 + 1000 * 60 * 2 },
    ];

    for (const s of testData) {
      it(`handles ${s.value} to left`, () => {
        expect(typeof forgivingStringToMillis(s.value)).toBe('number');
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
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
    }
  });

  describe('parses time strings', () => {
    const ts = [
      { value: '1h2m3s', expect: 60 * 60 * 1000 + 2 * 60 * 1000 + 3 * 1000 },
      { value: '1h3s', expect: 60 * 60 * 1000 + 3 * 1000 },
      { value: '1h2m', expect: 60 * 60 * 1000 + 2 * 60 * 1000 },
      { value: '10h', expect: 10 * 60 * 60 * 1000 },
      { value: '10m', expect: 10 * 60 * 1000 },
      { value: '10s', expect: 10 * 1000 },
      { value: '120h', expect: 120 * 60 * 60 * 1000 },
      { value: '120m', expect: 120 * 60 * 1000 },
      { value: '120s', expect: 120 * 1000 },
    ];

    for (const s of ts) {
      it(`handles ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('handles am/pm', () => {
    const ampm = [
      { value: '9:10:11am', expect: 9 * 60 * 60 * 1000 + 10 * 60 * 1000 + 11 * 1000 },
      { value: '9:10:11a', expect: 9 * 60 * 60 * 1000 + 10 * 60 * 1000 + 11 * 1000 },
      { value: '9:10:11pm', expect: (12 + 9) * 60 * 60 * 1000 + 10 * 60 * 1000 + 11 * 1000 },
      { value: '9:10:11p', expect: (12 + 9) * 60 * 60 * 1000 + 10 * 60 * 1000 + 11 * 1000 },
      { value: '9:10am', expect: 9 * 60 * 60 * 1000 + 10 * 60 * 1000 },
      { value: '9:10a', expect: 9 * 60 * 60 * 1000 + 10 * 60 * 1000 },
      { value: '9:10pm', expect: (12 + 9) * 60 * 60 * 1000 + 10 * 60 * 1000 },
      { value: '9:10p', expect: (12 + 9) * 60 * 60 * 1000 + 10 * 60 * 1000 },
      { value: '9am', expect: 9 * 60 * 60 * 1000 },
      { value: '9a', expect: 9 * 60 * 60 * 1000 },
      { value: '9pm', expect: (12 + 9) * 60 * 60 * 1000 },
      { value: '9p', expect: (12 + 9) * 60 * 60 * 1000 },
      { value: '12am', expect: 0 },
      { value: '12pm', expect: 12 * 60 * 60 * 1000 },
    ];

    for (const s of ampm) {
      it(`handles ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('it infers separators when non existent', () => {
    const testCases = [
      { value: '1', expect: 1000 * 60 }, // 00:01:00
      { value: '12', expect: 1000 * 60 * 12 }, // 00:12:00
      { value: '123', expect: 1000 * 60 * 23 + 1000 * 60 * 60 }, // 01:23:00
      { value: '1234', expect: 1000 * 60 * 34 + 1000 * 60 * 60 * 12 }, // 12:34:00
      { value: '12345', expect: 1000 * 60 * 34 + 1000 * 60 * 60 * 12 + 5 * 1000 }, // 12:34:05
      { value: '123456', expect: 1000 * 60 * 34 + 1000 * 60 * 60 * 12 + 56 * 1000 }, // 12:34:56
    ];

    for (const s of testCases) {
      it(`handles basic strings digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const sixDigits = [
      { value: '000000', expect: 0 },
      { value: '000001', expect: 1000 },
      { value: '000100', expect: 1000 * 60 },
      { value: '010000', expect: 1000 * 60 * 60 },
      { value: '230000', expect: 1000 * 60 * 60 * 23 },
      { value: '121212', expect: 12 * 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 },
    ];

    for (const s of sixDigits) {
      it(`handles string with 6 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const fiveDigits = [
      { value: '00000', expect: 0 },
      { value: '00001', expect: 1000 }, // 00:00:01
      { value: '00010', expect: 1000 * 60 }, // 00:01:00
      { value: '00100', expect: 1000 * 60 * 10 }, // 00:10:00
      { value: '01000', expect: 1000 * 60 * 60 }, // 01:00:00
      { value: '10000', expect: 1000 * 60 * 60 * 10 }, // 10:00:00
      { value: '23000', expect: 1000 * 60 * 60 * 23 }, // 23:00:00
      { value: '12121', expect: 1000 + 12 * 60 * 1000 + 12 * 1000 * 60 * 60 }, // 12:12:01
    ];

    for (const s of fiveDigits) {
      it(`handles string with 5 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const fourDigits = [
      { value: '0000', expect: 0 },
      { value: '0001', expect: 1000 * 60 }, // 00:01:00
      { value: '0010', expect: 1000 * 60 * 10 }, // 00:10:00
      { value: '0100', expect: 1000 * 60 * 60 }, // 01:00:00
      { value: '1000', expect: 1000 * 60 * 60 * 10 }, // 10:00:00
      { value: '2300', expect: 1000 * 60 * 60 * 23 }, // 23:00:00
      { value: '1212', expect: 12 * 60 * 1000 + 12 * 1000 * 60 * 60 }, // 12:12:00
    ];

    for (const s of fourDigits) {
      it(`handles string with 4 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const threeDigits = [
      { value: '000', expect: 0 },
      { value: '001', expect: 1000 * 60 }, // 00:01:00
      { value: '010', expect: 1000 * 60 * 10 }, // 00:10:00
      { value: '100', expect: 1000 * 60 * 60 }, // 01:00:00
      { value: '230', expect: 2 * 1000 * 60 * 60 + 30 * 1000 * 60 }, // 02:30:00
      { value: '121', expect: 21 * 60 * 1000 + 1000 * 60 * 60 }, // 01:21:00
    ];

    for (const s of threeDigits) {
      it(`handles string with 3 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const twoDigits = [
      { value: '00', expect: 0 },
      { value: '01', expect: 1000 * 60 }, // 00:01:00
      { value: '10', expect: 1000 * 60 * 10 }, // 00:10:00
      { value: '23', expect: 1000 * 60 * 23 }, // 00:23:00
    ];

    for (const s of twoDigits) {
      it(`handles string with 2 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const singleDigit = [...Array(10).keys()];

    for (const s of singleDigit) {
      it(`handles string with a single digits ${s}`, () => {
        expect(forgivingStringToMillis(`${s}`)).toBe(s * 1000 * 60);
      });
    }
  });

  describe('handles overflows', () => {
    const ts = [
      // minutes overflow
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
    }
  });

  describe('test fillLeft', () => {
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
    expect(millisToDelayString(null)).toBe('');
  });
  it('returns null 0', () => {
    expect(millisToDelayString(0)).toBe('');
  });
  describe('converts values in seconds', () => {
    it('shows a simple string with value in seconds', () => {
      expect(millisToDelayString(10000)).toBe('+10 sec');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-10000)).toBe('-10 sec');
    });

    const underAMinute = [1, 500, 1000, 6000, 55000, 59999];
    underAMinute.forEach((value) => {
      it(`handles ${value}`, () => {
        expect(millisToDelayString(value)?.endsWith('sec')).toBe(true);
      });
    });
  });

  describe('converts values in minutes', () => {
    it('shows a simple string with value in minutes', () => {
      expect(millisToDelayString(720000)).toBe('+12 min');
    });
    it('... and its negative counterpart', () => {
      expect(millisToDelayString(-720000)).toBe('-12 min');
    });
    it('shows a simple string with value in minutes and seconds', () => {
      expect(millisToDelayString(630000)).toBe('+00:10:30');
    });
    it('... and its negative counterpart', () => {
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
    it('positive added time', () => {
      expect(millisToDelayString(45015000)).toBe('+12:30:15');
    });
    it('negative added time', () => {
      expect(millisToDelayString(-45015000)).toBe('-12:30:15');
    });
  });
});

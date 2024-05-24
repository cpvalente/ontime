import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { forgivingStringToMillis, millisToDelayString } from '../dateConfig';

describe('test forgivingStringToMillis()', () => {
  describe('function handles time with no separators', () => {
    const testData = [
      { value: '', expect: 0 },
      { value: '0', expect: 0 },
      { value: '-0', expect: 0 },
      { value: '1', expect: MILLIS_PER_MINUTE },
      { value: '-1', expect: MILLIS_PER_MINUTE },
      { value: '0h0m0s', expect: 0 },
      { value: '0h0m1s', expect: MILLIS_PER_SECOND },
      { value: '0h1m0s', expect: MILLIS_PER_MINUTE },
      { value: '1h0m0s', expect: MILLIS_PER_HOUR },
      { value: '23h0m0s', expect: 23 * MILLIS_PER_HOUR },
      { value: '12h12m12s', expect: 12 * MILLIS_PER_SECOND + 12 * MILLIS_PER_MINUTE + 12 * MILLIS_PER_HOUR },
      { value: '12H12M12S', expect: 12 * MILLIS_PER_SECOND + 12 * MILLIS_PER_MINUTE + 12 * MILLIS_PER_HOUR },
      { value: '2m', expect: 2 * MILLIS_PER_MINUTE },
      { value: '1h5s', expect: MILLIS_PER_HOUR + 5 * MILLIS_PER_SECOND },
      { value: '1h2m', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE },
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
      { value: '1.1.1', expect: MILLIS_PER_HOUR + MILLIS_PER_MINUTE + MILLIS_PER_SECOND },
      { value: '12.1.1', expect: 12 * MILLIS_PER_HOUR + MILLIS_PER_MINUTE + MILLIS_PER_SECOND },
      { value: '12.55.1', expect: 12 * MILLIS_PER_HOUR + 55 * MILLIS_PER_MINUTE + MILLIS_PER_SECOND },
      { value: '12.55.40', expect: 12 * MILLIS_PER_HOUR + 55 * MILLIS_PER_MINUTE + 40 * MILLIS_PER_SECOND },
    ];

    for (const s of ts) {
      it(`handles ${s.value} to the left`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('#33 separators are parsed according to doc examples ', () => {
    const ts = [
      { value: '0.1', expect: MILLIS_PER_MINUTE },
      { value: '0 1', expect: MILLIS_PER_MINUTE },
      { value: '0:1', expect: MILLIS_PER_MINUTE },
      { value: '0,1', expect: MILLIS_PER_MINUTE },
      { value: '2.2.2', expect: 2 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 2 * MILLIS_PER_SECOND },
      { value: '2 2 2', expect: 2 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 2 * MILLIS_PER_SECOND },
      { value: '2:2:2', expect: 2 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 2 * MILLIS_PER_SECOND },
      { value: '2,2,2', expect: 2 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 2 * MILLIS_PER_SECOND },
      { value: '2,2,2', expect: 2 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 2 * MILLIS_PER_SECOND },
      { value: '10:', expect: 10 * MILLIS_PER_HOUR },
      { value: ':10', expect: 10 * MILLIS_PER_MINUTE },
      { value: '10', expect: 10 * MILLIS_PER_MINUTE },
      { value: '120', expect: MILLIS_PER_HOUR + 20 * MILLIS_PER_MINUTE },
      { value: '90m', expect: 90 * MILLIS_PER_MINUTE },
      { value: '1.2', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE },
      { value: '1.2.3', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 3 * MILLIS_PER_SECOND },
      { value: '123456', expect: 12 * MILLIS_PER_HOUR + 34 * MILLIS_PER_MINUTE + 56 * MILLIS_PER_SECOND },
    ];

    for (const s of ts) {
      it(`handles ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('parses time strings', () => {
    const ts = [
      { value: '1h2m3s', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 3 * MILLIS_PER_SECOND },
      { value: '1h3s', expect: MILLIS_PER_HOUR + 3 * MILLIS_PER_SECOND },
      { value: '1h2m', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE },
      { value: '10h', expect: 10 * MILLIS_PER_HOUR },
      { value: '10m', expect: 10 * MILLIS_PER_MINUTE },
      { value: '10s', expect: 10 * MILLIS_PER_SECOND },
      { value: '120h', expect: 120 * MILLIS_PER_HOUR },
      { value: '120m', expect: 120 * MILLIS_PER_MINUTE },
      { value: '120s', expect: 120 * MILLIS_PER_SECOND },
    ];

    for (const s of ts) {
      it(`handles ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('handles am/pm', () => {

    const ampm = [];

    // dynamically build up all string formats from 1 to 12:59:59 with a/am/p/pm tacked on space and no space
    for (var hour = 1; hour <= 12; hour += 1) {
      const adjustedHour = hour === 12 ? 0 : hour;
      ampm.push({ value: `${hour}a`, expect: adjustedHour * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour}am`, expect: adjustedHour * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour}p`, expect: (12 + adjustedHour) * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour}pm`, expect: (12 + adjustedHour) * MILLIS_PER_HOUR });

      ampm.push({ value: `${hour} a`, expect: adjustedHour * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour} am`, expect: adjustedHour * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour} p`, expect: (12 + adjustedHour) * MILLIS_PER_HOUR });
      ampm.push({ value: `${hour} pm`, expect: (12 + adjustedHour) * MILLIS_PER_HOUR });

      for (var minute = 0; minute <= 59; minute += 1) {
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')}am`,
          expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')}a`,
          expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')}pm`,
          expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')}p`,
          expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });

        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')} am`,
          expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')} a`,
          expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')} pm`,
          expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });
        ampm.push({
          value: `${hour}:${String(minute).padStart(2, '0')} p`,
          expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE,
        });

        for (var second = 0; second <= 59; second += 1) {
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}am`,
            expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}a`,
            expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}pm`,
            expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}p`,
            expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });

          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} am`,
            expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} a`,
            expect: adjustedHour * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} pm`,
            expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
          ampm.push({
            value: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} p`,
            expect: (12 + adjustedHour) * MILLIS_PER_HOUR + minute * MILLIS_PER_MINUTE + second * MILLIS_PER_SECOND,
          });
        }
      }
    }

    for (const s of ampm) {
      it(`handles ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }
  });

  describe('it infers separators when non existent', () => {
    const testCases = [
      { value: '1', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '12', expect: 12 * MILLIS_PER_MINUTE }, // 00:12:00
      { value: '123', expect: MILLIS_PER_HOUR + 23 * MILLIS_PER_MINUTE }, // 01:23:00
      { value: '1234', expect: 12 * MILLIS_PER_HOUR + 34 * MILLIS_PER_MINUTE }, // 12:34:00
      { value: '12345', expect: 12 * MILLIS_PER_HOUR + 34 * MILLIS_PER_MINUTE + 5 * MILLIS_PER_SECOND }, // 12:34:05
      { value: '123456', expect: 12 * MILLIS_PER_HOUR + 34 * MILLIS_PER_MINUTE + 56 * MILLIS_PER_SECOND }, // 12:34:56
    ];

    for (const s of testCases) {
      it(`handles basic strings digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const sixDigits = [
      { value: '000000', expect: 0 }, // 00:00:00
      { value: '000001', expect: MILLIS_PER_SECOND }, // 00:00:01
      { value: '000100', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '010000', expect: MILLIS_PER_HOUR }, // 01:00:00
      { value: '230000', expect: MILLIS_PER_HOUR * 23 }, // 23:00:00
      { value: '121212', expect: 12 * MILLIS_PER_HOUR + 12 * MILLIS_PER_MINUTE + 12 * MILLIS_PER_SECOND }, // 12:12:12
    ];

    for (const s of sixDigits) {
      it(`handles string with 6 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const fiveDigits = [
      { value: '00000', expect: 0 },
      { value: '00001', expect: MILLIS_PER_SECOND }, // 00:00:01
      { value: '00010', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '00100', expect: 10 * MILLIS_PER_MINUTE }, // 00:10:00
      { value: '01000', expect: MILLIS_PER_HOUR }, // 01:00:00
      { value: '10000', expect: 10 * MILLIS_PER_HOUR }, // 10:00:00
      { value: '23000', expect: 23 * MILLIS_PER_HOUR }, // 23:00:00
      { value: '12121', expect: 12 * MILLIS_PER_HOUR + 12 * MILLIS_PER_MINUTE + 1 * MILLIS_PER_SECOND }, // 12:12:01
    ];

    for (const s of fiveDigits) {
      it(`handles string with 5 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const fourDigits = [
      { value: '0000', expect: 0 },
      { value: '0001', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '0010', expect: 10 * MILLIS_PER_MINUTE }, // 00:10:00
      { value: '0100', expect: MILLIS_PER_HOUR }, // 01:00:00
      { value: '1000', expect: 10 * MILLIS_PER_HOUR }, // 10:00:00
      { value: '2300', expect: 23 * MILLIS_PER_HOUR }, // 23:00:00
      { value: '1212', expect: 12 * MILLIS_PER_HOUR + 12 * MILLIS_PER_MINUTE }, // 12:12:00
    ];

    for (const s of fourDigits) {
      it(`handles string with 4 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const threeDigits = [
      { value: '000', expect: 0 },
      { value: '001', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '010', expect: 10 * MILLIS_PER_MINUTE }, // 00:10:00
      { value: '100', expect: MILLIS_PER_HOUR }, // 01:00:00
      { value: '230', expect: 2 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE }, // 02:30:00
      { value: '121', expect: MILLIS_PER_HOUR + 21 * MILLIS_PER_MINUTE }, // 01:21:00
    ];

    for (const s of threeDigits) {
      it(`handles string with 3 digits: ${s.value}`, () => {
        expect(forgivingStringToMillis(s.value)).toBe(s.expect);
      });
    }

    const twoDigits = [
      { value: '00', expect: 0 },
      { value: '01', expect: MILLIS_PER_MINUTE }, // 00:01:00
      { value: '10', expect: 10 * MILLIS_PER_MINUTE }, // 00:10:00
      { value: '23', expect: 23 * MILLIS_PER_MINUTE }, // 00:23:00
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
      { value: '99', expect: 99 * MILLIS_PER_MINUTE },
      { value: '1.39.0', expect: 99 * MILLIS_PER_MINUTE },
      // seconds overflow
      { value: '0.0.120', expect: 120 * MILLIS_PER_SECOND },
      { value: '0.2.0', expect: 120 * MILLIS_PER_SECOND },
      { value: '0.0.99', expect: 99 * MILLIS_PER_SECOND },
      { value: '0.1.39', expect: 99 * MILLIS_PER_SECOND },
      // hours overflow
      { value: '25.0.0', expect: 25 * MILLIS_PER_HOUR },
      // hours overflow
      { value: '50.0.0', expect: 50 * MILLIS_PER_HOUR },
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
        { value: '1:2:3:10', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE + 3 * MILLIS_PER_SECOND }, // 01:02:03
        { value: '2,10', expect: 2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE },
        { value: '2.10', expect: 2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE },
        { value: '2 10', expect: 2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE },
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
        { value: '1.2', expect: MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE },
        { value: '1.70', expect: MILLIS_PER_HOUR + 70 * MILLIS_PER_MINUTE },
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
        { value: '0.120', expect: 120 * MILLIS_PER_MINUTE },
        { value: '0.99', expect: 99 * MILLIS_PER_MINUTE },
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

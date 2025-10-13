import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { parseExcelDate } from '../time.js';

describe('parseExcelDate', () => {
  // TODO: our parsing currently does not use UTC, so the tests can not be done in CI
  describe.todo('parses a valid date string as expected from excel', () => {
    test.each([
      ['1899-12-30T00:00:00.000Z', 3600000],
      ['1899-12-30T00:10:00.000Z', 4200000],
      ['1899-12-30T01:00:00.000Z', 7200000],
      ['1899-12-30T07:00:00.000Z', 28800000],
      ['1899-12-30T08:00:10.000Z', 32410000],
      ['1899-12-30T08:30:00.000Z', 34200000],
    ])('handles %s', (fromExcel, expected) => {
      expect(parseExcelDate(fromExcel)).toBe(expected);
    });
  });

  describe('parses a time string that passes validation', () => {
    test.each([['10:00:00'], ['10:00'], ['10:00AM'], ['10:00am'], ['10:00PM'], ['10:00pm']])(
      'handles %s',
      (fromExcel) => {
        expect(parseExcelDate(fromExcel)).not.toBe(0);
      },
    );
  });

  describe('uses numeric fields as minutes', () => {
    test.each([[1], [10], [100]])('handles numeric fields %s', (fromExcel) => {
      expect(parseExcelDate(fromExcel)).toBe(fromExcel * MILLIS_PER_MINUTE);
    });
  });

  describe('returns 0 on other strings', () => {
    test.each([['test'], [''], ['x']])('handles invalid fields %s', (fromExcel) => {
      expect(parseExcelDate(fromExcel)).toBe(0);
    });
  });
});

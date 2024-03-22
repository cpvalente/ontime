import { parseExcelDate } from '../time.js';

describe('parseExcelDate', () => {
  describe.todo('parses a valid date string as expected from excel', () => {
    const testCases = [
      {
        fromExcel: '1899-12-30T00:00:00.000Z',
        expected: 3600000,
      },
      {
        fromExcel: '1899-12-30T00:10:00.000Z',
        expected: 4200000,
      },
      {
        fromExcel: '1899-12-30T01:00:00.000Z',
        expected: 7200000,
      },
      {
        fromExcel: '1899-12-30T07:00:00.000Z',
        expected: 28800000,
      },
      {
        fromExcel: '1899-12-30T08:00:10.000Z',
        expected: 32410000,
      },
      {
        fromExcel: '1899-12-30T08:30:00.000Z',
        expected: 34200000,
      },
    ];

    for (const scenario of testCases) {
      it(`handles ${scenario.fromExcel}`, () => {
        expect(parseExcelDate(scenario.fromExcel)).toBe(scenario.expected);
      });
    }
  });

  describe('parses a time string that passes validation', () => {
    const validFields = ['10:00:00', '10:00', '10:00AM', '10:00am', '10:00PM', '10:00pm'];
    validFields.forEach((field) => {
      it(`handles ${field}`, () => {
        const millis = parseExcelDate(field);
        expect(millis).not.toBe(0);
      });
    });
  });

  describe('returns 0 on other strings', () => {
    const invalidFields = ['10', 'test', ''];
    invalidFields.forEach((field) => {
      it(`handles ${field}`, () => {
        const millis = parseExcelDate(field);
        expect(millis).toBe(0);
      });
    });
  });
});

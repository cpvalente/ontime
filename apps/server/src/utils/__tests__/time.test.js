import { parseExcelDate } from '../time';

describe('parseExcelDate', () => {
  it('parses a valid date string as expected from excel', () => {
    const millis = parseExcelDate('1899-12-30T07:00:00.000Z');
    expect(millis).not.toBe(0);
  });

  describe('parses a time string that passes validation', () => {
    const validFields = ['10:00:00', '10:00'];
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

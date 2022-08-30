import { parseExcelDate } from '../time';

describe('parseExcelDate', () => {
  it('parses a valid date string as expected from excel', () => {
    const millis = parseExcelDate('1899-12-30T07:00:00.000Z');
    expect(millis).toBe(28800000);
  });
  describe('returns 0 on other strings', () => {
    const invalidFields = ['10:00:00', 'test', ''];
    invalidFields.forEach((field) => {
      it(`handles ${field}`, () => {
        const millis = parseExcelDate(field);
        expect(millis).toBe(0);
      });
    });
  });
});

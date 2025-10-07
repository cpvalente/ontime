import { parseField } from '../cuesheet.utils';

describe('parseField()', () => {
  it('returns a string from given millis on timeStart, TimeEnd and duration', () => {
    const testData1 = 1000;
    const testData2 = 60000;
    const testData3 = 600000;
    expect(parseField('timeStart', testData1)).toBe('00:00:01');
    expect(parseField('timeEnd', testData2)).toBe('00:01:00');
    expect(parseField('duration', testData3)).toBe('00:10:00');
  });

  it('returns an empty string on undefined fields', () => {
    // @ts-expect-error -- testing user data with missing fields
    expect(parseField('title')).toBe('');
  });

  describe('simply returns any other value in any other field', () => {
    const testFields = [
      { field: 'nothing', value: '123' },
      { field: 'title', value: 'test' },
      { field: 'note', value: 'test' },
      { field: 'colour', value: 'test' },
    ];

    testFields.forEach((testCase) => {
      test(`${testCase.field}:${testCase.value}`, () => {
        expect(parseField(testCase.field, testCase.value)).toBe(testCase.value);
      });
    });
  });
});

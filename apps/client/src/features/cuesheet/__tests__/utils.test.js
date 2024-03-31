import { makeCSV, makeTable, parseField } from '../cuesheetUtils';

describe('parseField()', () => {
  it('returns a string from given millis on timeStart, TimeEnd and duration', () => {
    const testData1 = 1000;
    const testData2 = 60000;
    const testData3 = 600000;
    expect(parseField('timeStart', testData1)).toBe('00:00:01');
    expect(parseField('timeEnd', testData2)).toBe('00:01:00');
    expect(parseField('duration', testData3)).toBe('00:10:00');
  });

  describe('returns an x when isPublic is truthy, empty string otherwise', () => {
    const testTruthy = [1, true, 'x', 'test'];
    const testFalsy = ['', null, undefined, false, 0];

    testTruthy.forEach((value) => {
      test(`${value}`, () => {
        expect(parseField('isPublic', value)).toBe('x');
      });
    });
    testFalsy.forEach((value) => {
      test(`${value}`, () => {
        expect(parseField('isPublic', value)).toBe('');
      });
    });
  });

  it('returns an empty string on undefined fields', () => {
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

describe('makeTable()', () => {
  it('returns array of arrays with given fields', () => {
    const headerData = {
      title: 'test title',
      description: 'test description',
    };
    const tableData = [
      {
        title: 'test title 1',
        timeStart: 0,
        timeEnd: 0,
        isPublic: 'x',
        lighting: { value: 'test lighting' },
        sound: { value: 'test sound' },
      },
    ];
    const customFields = {
      lighting: { label: 'test' },
    };

    const table = makeTable(headerData, tableData, customFields);
    expect(table).toMatchSnapshot();
  });
});

describe('make CSV()', () => {
  it('joins an array of arrays with commas and newlines', () => {
    const testdata = [['field'], ['after newline', 'after comma'], ['', 'after empty']];
    expect(makeCSV(testdata)).toMatchInlineSnapshot(`
"field
after newline,after comma
,after empty
"
`);
  });
});

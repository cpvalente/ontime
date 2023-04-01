import { makeCSV, makeTable, parseField } from '../tableUtils';

describe('parseField()', () => {
  it('returns a string from given millis on timeStart and TimeEnd', () => {
    const testData1 = 1000;
    const testData2 = 60000;
    expect(parseField('timeStart', testData1)).toBe('00:00:01');
    expect(parseField('timeEnd', testData2)).toBe('00:01:00');
    expect(parseField('timeEnd', testData2)).toBe('00:01:00');
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
    expect(parseField('presenter', undefined)).toBe('');
  });

  describe('simply returns any other value in any other field', () => {
    const testFields = [
      { field: 'nothing', value: 123 },
      { field: 'title', value: 'test' },
      { field: 'presenter', value: 'test' },
      { field: 'subtitle', value: 'test' },
      { field: 'notes', value: 'test' },
      { field: 'colour', value: 'test' },
      { field: 'user0', value: 'test' },
      { field: 'user1', value: 'test' },
      { field: 'user2', value: 'test' },
      { field: 'user3', value: 'test' },
      { field: 'user4', value: 'test' },
      { field: 'user5', value: 'test' },
      { field: 'user6', value: 'test' },
      { field: 'user7', value: 'test' },
      { field: 'user8', value: 'test' },
      { field: 'user9', value: 'test' },
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
    const headerData = {};
    const tableData = [
      {
        title: 'test title 1',
        presenter: '',
        timeStart: 0,
        timeEnd: 0,
        isPublic: 'x',
        user0: 'test',
        user1: 'test',
      },
    ];
    const userFields = {
      user0: 'test',
    };

    const table = makeTable(headerData, tableData, userFields);
    expect(table).toMatchSnapshot();
  });
});

describe('make CSV()', () => {
  it('joins an array of arrays with commas and newlines', () => {
    const testdata = [['field'], ['after newline', 'after comma'], ['', 'after empty']];
    expect(makeCSV(testdata)).toMatchInlineSnapshot(`
"data:text/csv;charset=utf-8,field
after newline,after comma
,after empty
"
`);
  });
});

import { makeCSVFromArrayOfArrays } from '../csv';

describe('makeCSVFromArrayOfArrays()', () => {
  it('joins an array of arrays with commas and newlines', () => {
    const testdata = [['field'], ['after newline', 'after comma'], ['', 'after empty']];
    expect(makeCSVFromArrayOfArrays(testdata)).toMatchInlineSnapshot(`
"field
after newline,after comma
,after empty
"
`);
  });
});

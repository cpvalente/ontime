import { stringToOSCArgs } from '../oscArgParser.js';

describe('test stringToOSCArgs()', () => {
  it('all types', () => {
    const test = 'test 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 'string', value: 'test' },
      { type: 'integer', value: 1111 },
      { type: 'float', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('empty is nothing', () => {
    const test = undefined;
    const expected = [];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep other types in strings', () => {
    const test = 'test "1111" "0.1111" "TRUE" "FALSE"';
    const expected = [
      { type: 'string', value: 'test' },
      { type: 'string', value: '1111' },
      { type: 'string', value: '0.1111' },
      { type: 'string', value: 'TRUE' },
      { type: 'string', value: 'FALSE' },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces in quoted strings', () => {
    const test = '"test space" 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 'string', value: 'test space' },
      { type: 'integer', value: 1111 },
      { type: 'float', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces escaped quotes', () => {
    const test = '"test \\" space" 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 'string', value: 'test " space' },
      { type: 'integer', value: 1111 },
      { type: 'float', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('2 spaces', () => {
    const test = '1111   0.1111 TRUE FALSE';
    const expected = [
      { type: 'integer', value: 1111 },
      { type: 'float', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });
});

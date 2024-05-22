import { stringToOSCArgs } from '../oscArgParser.js';

describe('test stringToOSCArgs()', () => {
  it('all types', () => {
    const test = 'test 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 's', value: 'test' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep other types in strings', () => {
    const test = 'test "1111" "0.1111" "TRUE" "FALSE"';
    const expected = [
      { type: 's', value: 'test' },
      { type: 's', value: '1111' },
      { type: 's', value: '0.1111' },
      { type: 's', value: 'TRUE' },
      { type: 's', value: 'FALSE' },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces in quoted strings', () => {
    const test = '"test space" 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 's', value: 'test space' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces escaped quotes', () => {
    const test = '"test \\" space" 1111 0.1111 TRUE FALSE';
    const expected = [
      { type: 's', value: 'test " space' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
      { type: 'T', value: true },
      { type: 'F', value: false },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });
});

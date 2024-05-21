import { stringToOSCArgs } from '../oscArgParser.js';

describe('url is correctly formatted', () => {
  it('all types', () => {
    const test = 'test 1111 0.1111';
    const expected = [
      { type: 's', value: 'test' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep numbers in strings', () => {
    const test = 'test "1111" "0.1111"';
    const expected = [
      { type: 's', value: 'test' },
      { type: 's', value: '1111' },
      { type: 's', value: '0.1111' },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces in quoted strings', () => {
    const test = '"test space" 1111 0.1111';
    const expected = [
      { type: 's', value: 'test space' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });

  it('keep spaces escaped quotes', () => {
    const test = '"test \\" space" 1111 0.1111';
    const expected = [
      { type: 's', value: 'test " space' },
      { type: 'i', value: 1111 },
      { type: 'f', value: 0.1111 },
    ];
    expect(stringToOSCArgs(test)).toStrictEqual(expected);
  });
});

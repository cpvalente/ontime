import { splitWhitespace } from './splitWhitespace';

describe('test splitWhitespace() function', () => {
  it('empty string', () => {
    const test = '';
    expect(splitWhitespace(test)).toStrictEqual(null);
  });

  it('1 item', () => {
    const test = 'test';
    expect(splitWhitespace(test)).toStrictEqual(['test']);
  });

  it('2 items', () => {
    const test = 'test test';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test']);
  });

  it('2 items and quoted string', () => {
    const test = 'test test "more test"';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test', '"more test"']);
  });

  it('quotes without spaces', () => {
    const test = 'test test "moreTest"';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test', '"moreTest"']);
  });

  it('escaped quotes', () => {
    const test = 'test test "more \\" test"';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test', '"more " test"']);
  });

  it('missing end quotes', () => {
    const test = 'test test "more test';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test', '"more test']);
  });

  it('missing start quotes', () => {
    const test = 'test test more test"';
    expect(splitWhitespace(test)).toStrictEqual(['test', 'test', 'more', 'test"']);
  });
});

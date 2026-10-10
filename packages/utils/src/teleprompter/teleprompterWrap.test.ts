import { normaliseScriptText, wrapText } from './teleprompterWrap.js';

/** The lines as a screen shows them */
function cut(text: string, charsPerLine: number): string[] {
  return wrapText(text, charsPerLine).map((line) => ' '.repeat(line.indent) + line.text);
}

describe('wrapText()', () => {
  describe('a line holds at most characters per line, counting user-perceived characters', () => {
    test.each([
      ['plain words', 'one two three four', 9, ['one two', 'three', 'four']],
      ['an accent counts once', 'café café café', 9, ['café café', 'café']],
      ['a combining accent counts once', 'café café café', 9, ['café café', 'café']],
      ['an emoji counts once', '👋🏽👋🏽 hello there', 8, ['👋🏽👋🏽 hello', 'there']],
      ['a line which fits stays whole', 'Good evening', 12, ['Good evening']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });
  });

  describe('lines break only at whitespace, or after a dash or slash inside a word', () => {
    test.each([
      ['a hyphen', 'a well-known face', 10, ['a well-', 'known face']],
      ['an en dash', 'pages 10–20 here', 9, ['pages 10–', '20 here']],
      ['an em dash', 'wait—what now', 6, ['wait—', 'what', 'now']],
      ['a slash', 'and/or more', 5, ['and/', 'or', 'more']],
      ['not a leading dash', '-minus sign', 7, ['-minus', 'sign']],
      ['not a trailing dash', 'well- known', 6, ['well-', 'known']],
      ['not inside a run of dashes', 'a--b c', 3, ['a--', 'b c']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });

    test('never breaks at a no-break space', () => {
      expect(cut('see Mr.\u00a0Smith', 9)).toEqual(['see', 'Mr.\u00a0Smith']);
    });
  });

  describe('punctuation stays with its word', () => {
    test.each([
      ['closing punctuation may run over the line', 'a heading.', 9, ['a heading.']],
      ['and stays with its word when it fits over', 'abcdefghi.', 9, ['abcdefghi.']],
      ['two marks over are allowed', 'abcdefghi?!', 9, ['abcdefghi?!']],
      ['a spaced closing mark never starts a line', 'bonjour !', 7, ['bonjour !']],
      ['spaced quotes stay with their words', '« hello » there', 7, ['« hello »', 'there']],
      ['a spaced opening mark never ends a line', 'say ( this ) now', 8, ['say', '( this )', 'now']],
      ['a dash is no break before closing punctuation', 'go-) now', 4, ['go-)', 'now']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });
  });

  describe('a number stays with the word after it', () => {
    test.each([
      ['a count', 'only 10 minutes', 10, ['only', '10 minutes']],
      ['a decimal', 'about 3.5 metres', 10, ['about', '3.5 metres']],
      ['a time', 'at 10:30 sharp', 11, ['at', '10:30 sharp']],
      ['unless they cannot share a line', '10 extraordinary', 13, ['10', 'extraordinary']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });
  });

  describe('a word longer than a line breaks at the limit, never inside a character', () => {
    test.each([
      ['a long word', 'abcdefghijkl', 5, ['abcde', 'fghij', 'kl']],
      ['after a short word', 'a abcdefghijkl', 5, ['a', 'abcde', 'fghij', 'kl']],
      ['with emoji', '👋🏽👋🏽👋🏽👋🏽👋🏽', 2, ['👋🏽👋🏽', '👋🏽👋🏽', '👋🏽']],
      ['scripts without spaces break per character', '日本語の文章です', 3, ['日本語', 'の文章', 'です']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });
  });

  test('the space where a line breaks is used up', () => {
    expect(cut('one   two', 4)).toEqual(['one', 'two']);
    expect(wrapText('one two', 4)).toEqual([
      { text: 'one', start: 0, indent: 0 },
      { text: 'two', start: 4, indent: 0 },
    ]);
  });

  test('typed line breaks are always line breaks', () => {
    expect(cut('one\ntwo', 40)).toEqual(['one', 'two']);
  });

  test('blank lines are kept, as many as typed', () => {
    expect(cut('one\n\n\ntwo', 40)).toEqual(['one', '', '', 'two']);
    expect(cut('\none', 40)).toEqual(['', 'one']);
  });

  describe('indentation is kept, counts toward the length, and carries to wrapped lines', () => {
    test.each([
      ['an indented line', '  one two three', 9, ['  one two', '  three']],
      ['indentation which takes most of a line is shortened to half', '        one two', 6, ['   one', '   two']],
    ])('%s', (_, text, charsPerLine, expected) => {
      expect(cut(text, charsPerLine)).toEqual(expected);
    });

    test('positions point at the text after the indentation', () => {
      expect(wrapText('  one two', 5)).toEqual([
        { text: 'one', start: 2, indent: 2 },
        { text: 'two', start: 6, indent: 2 },
      ]);
    });
  });

  test('spaces inside a line are shown exactly as typed', () => {
    expect(cut('one   two  three', 40)).toEqual(['one   two  three']);
  });

  test('a tab becomes 4 spaces and \\r\\n becomes \\n', () => {
    expect(cut('one\ttwo\r\nthree', 40)).toEqual(['one    two', 'three']);
    expect(wrapText('a\r\nb', 40)).toEqual([
      { text: 'a', start: 0, indent: 0 },
      { text: 'b', start: 2, indent: 0 },
    ]);
  });

  describe('trailing whitespace of an event is ignored', () => {
    test.each([
      ['trailing spaces and lines', 'one  \n\n  ', ['one']],
      ['only whitespace counts as empty', ' \n\t\n ', []],
      ['an empty text', '', []],
    ])('%s', (_, text, expected) => {
      expect(cut(text, 40)).toEqual(expected);
    });
  });

  test('every position points at its line in the normalised text', () => {
    const text = 'Good evening and welcome\tto the 2026 awards.\r\n\n  Our first guest is a well-known face';
    const normalised = normaliseScriptText(text);
    for (const line of wrapText(text, 12)) {
      expect(normalised.slice(line.start, line.start + line.text.length)).toBe(line.text);
    }
  });
});

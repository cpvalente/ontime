import { cleanURL } from '../url.js';

describe('url is correctly formatted', () => {
  it('has no leading spaces', () => {
    const test = '         http://testing';
    const expected = 'http://testing';
    expect(cleanURL(test)).toBe(expected);
  });

  it('has no trailing spaces', () => {
    const test = 'http://testing  ';
    const expected = 'http://testing';
    expect(cleanURL(test)).toBe(expected);
  });

  it('doesnt contain spaces', () => {
    const test = 'http://t e s t i n g';
    const expected = 'http://t%20e%20s%20t%20i%20n%20g';
    expect(cleanURL(test)).toBe(expected);
  });

  it('only contains allowed characters', () => {
    const test = 'http://<>[]{}|^';
    const expected = 'http://';
    expect(cleanURL(test)).toBe(expected);
  });

  it('begins with http://', () => {
    const test = 'ontime.com';
    const expected = 'http://ontime.com';
    expect(cleanURL(test)).toBe(expected);
  });
});

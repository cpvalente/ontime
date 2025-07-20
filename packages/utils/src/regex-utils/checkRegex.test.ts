import { checkRegex } from './checkRegex';

describe('checkRegex()', () => {
  it('isOnlyNumbers', () => {
    expect(checkRegex.isOnlyNumbers('12345')).toBe(true);
    expect(checkRegex.isOnlyNumbers('123a')).toBe(false);
  });

  it('isIPAddress', () => {
    expect(checkRegex.isIPAddress('192.168.0.1')).toBe(true);
    expect(checkRegex.isIPAddress('999.999.999.999')).toBe(false);
  });

  it('startsWithHttp', () => {
    expect(checkRegex.startsWithHttp('http://example.com')).toBe(true);
    expect(checkRegex.startsWithHttp('https://example.com')).toBe(true);
    expect(checkRegex.startsWithHttp('ftp://example.com')).toBe(false);
  });

  it('startsWithSlash', () => {
    expect(checkRegex.startsWithSlash('/path')).toBe(true);
    expect(checkRegex.startsWithSlash('path')).toBe(false);
  });

  it('isAlphanumericWithSpace', () => {
    expect(checkRegex.isAlphanumericWithSpace('abc 123')).toBe(true);
    expect(checkRegex.isAlphanumericWithSpace('abc-123')).toBe(false);
  });

  it('isASCII', () => {
    expect(checkRegex.isASCII('Hello, World!')).toBe(true);
    expect(checkRegex.isASCII('こんにちは')).toBe(false);
  });

  it('isASCIIorEmpty', () => {
    expect(checkRegex.isASCIIorEmpty('')).toBe(true);
    expect(checkRegex.isASCIIorEmpty('Hello')).toBe(true);
    expect(checkRegex.isASCIIorEmpty('こんにちは')).toBe(false);
  });

  it('isNotEmpty', () => {
    expect(checkRegex.isNotEmpty('Hello')).toBe(true);
    expect(checkRegex.isNotEmpty('')).toBe(false);
  });
});

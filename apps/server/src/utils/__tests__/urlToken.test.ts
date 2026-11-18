import { removeTokenFromPath, removeTokenFromSearch } from '../urlToken.js';

describe('removeTokenFromSearch()', () => {
  it.each([
    ['token=abc', ''],
    ['?token=abc', ''],
    ['n=1&token=abc&alias=main', 'n=1&alias=main'],
    ['?token=abc&n=1', '?n=1'],
    ['token=a&token=b', ''],
  ])('removes the token from %s', (search, expected) => {
    expect(removeTokenFromSearch(search)).toBe(expected);
  });

  it('returns other values untouched', () => {
    expect(removeTokenFromSearch('')).toBe('');
    expect(removeTokenFromSearch('n=1&text=a%20b')).toBe('n=1&text=a%20b');
    expect(removeTokenFromSearch('mytoken=abc')).toBe('mytoken=abc');
  });
});

describe('removeTokenFromPath()', () => {
  it.each([
    ['/timer?token=abc', '/timer'],
    ['/timer?n=1&token=abc', '/timer?n=1'],
    ['/preset/main?token=abc&n=1', '/preset/main?n=1'],
  ])('removes the token from %s', (path, expected) => {
    expect(removeTokenFromPath(path)).toBe(expected);
  });

  it('returns other paths untouched', () => {
    expect(removeTokenFromPath('')).toBe('');
    expect(removeTokenFromPath('/editor')).toBe('/editor');
    expect(removeTokenFromPath('/timer?n=1')).toBe('/timer?n=1');
  });
});

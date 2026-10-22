import { stripTokenFromPath } from '../clientPath.js';

describe('stripTokenFromPath()', () => {
  it.each([
    ['/timer?token=abc', '/timer'],
    ['/client-hash/timer?token=abc&hideClock=true', '/client-hash/timer?hideClock=true'],
    ['/timer?hideClock=true&token=abc', '/timer?hideClock=true'],
  ])('removes the token from %s', (path, expected) => {
    expect(stripTokenFromPath(path)).toBe(expected);
  });

  it.each(['/timer', '/timer?hideClock=true&secondary-src=note', ''])('keeps %s unchanged', (path) => {
    expect(stripTokenFromPath(path)).toBe(path);
  });
});

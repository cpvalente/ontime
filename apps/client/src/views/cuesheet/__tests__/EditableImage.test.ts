import { describe, expect, test } from 'vitest';

import { isValidImageSource } from '../cuesheet-table/cuesheet-table-elements/EditableImage';

describe('isValidImageSource()', () => {
  test('accepts links to a hosted image', () => {
    expect(isValidImageSource('https://example.com/image.png')).toBe(true);
    expect(isValidImageSource('http://example.com/image.png')).toBe(true);
  });

  test('rejects references to a local file, they would not resolve for our clients', () => {
    expect(isValidImageSource('/user/image.png')).toBe(false);
    expect(isValidImageSource('user/image.png')).toBe(false);
    expect(isValidImageSource('file:///Users/me/image.png')).toBe(false);
    expect(isValidImageSource('C:\\images\\image.png')).toBe(false);
  });

  test('rejects values which would not resolve to an image', () => {
    expect(isValidImageSource('www.example.com/image.png')).toBe(false);
    expect(isValidImageSource('example.com/image.png')).toBe(false);
    expect(isValidImageSource('https://')).toBe(false);
    expect(isValidImageSource('some text')).toBe(false);
  });
});

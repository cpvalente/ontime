import { describe, expect, test } from 'vitest';

import { isValidImageSource } from '../cuesheet-table/cuesheet-table-elements/EditableImage';

describe('isValidImageSource()', () => {
  test('accepts images hosted elsewhere', () => {
    expect(isValidImageSource('https://example.com/image.png')).toBe(true);
    expect(isValidImageSource('http://example.com/image.png')).toBe(true);
  });

  test('accepts images served by ontime', () => {
    expect(isValidImageSource('/user/image.png')).toBe(true);
    expect(isValidImageSource('/external/image.png')).toBe(true);
  });

  test('rejects values which would not resolve to an image', () => {
    expect(isValidImageSource('www.example.com/image.png')).toBe(false);
    expect(isValidImageSource('example.com/image.png')).toBe(false);
    expect(isValidImageSource('user/image.png')).toBe(false);
    expect(isValidImageSource('some text')).toBe(false);
  });
});

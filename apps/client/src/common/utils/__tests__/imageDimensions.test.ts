import { describe, expect, test } from 'vitest';

import { getRememberedAspectRatio, rememberAspectRatio } from '../imageDimensions';

/** stand-in for a loaded HTMLImageElement */
function makeImage(naturalWidth: number, naturalHeight: number) {
  return { naturalWidth, naturalHeight } as HTMLImageElement;
}

describe('image dimensions', () => {
  test('remembers the aspect ratio of a loaded image', () => {
    expect(getRememberedAspectRatio('http://ontime.local/image.png')).toBe(null);

    rememberAspectRatio('http://ontime.local/image.png', makeImage(1920, 1080));

    expect(getRememberedAspectRatio('http://ontime.local/image.png')).toBe(1920 / 1080);
  });

  test('handles images which have not loaded', () => {
    rememberAspectRatio('http://ontime.local/broken.png', makeImage(0, 0));
    expect(getRememberedAspectRatio('http://ontime.local/broken.png')).toBe(null);
  });

  test('handles missing values', () => {
    expect(getRememberedAspectRatio(undefined)).toBe(null);
    expect(getRememberedAspectRatio('')).toBe(null);
    expect(() => rememberAspectRatio('', makeImage(100, 100))).not.toThrow();
  });

  test('forgets the least recently used entries', () => {
    for (let i = 0; i < 600; i++) {
      rememberAspectRatio(`http://ontime.local/${i}.png`, makeImage(100, 50));
    }

    expect(getRememberedAspectRatio('http://ontime.local/0.png')).toBe(null);
    expect(getRememberedAspectRatio('http://ontime.local/599.png')).toBe(2);
  });
});

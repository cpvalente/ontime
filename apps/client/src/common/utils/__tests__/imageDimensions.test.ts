import { getRememberedDimensions, rememberDimensions } from '../imageDimensions';

/** stand-in for a loaded HTMLImageElement */
function makeImage(naturalWidth: number, naturalHeight: number) {
  return { naturalWidth, naturalHeight } as HTMLImageElement;
}

test('We remember the size of an image, so that we can reserve its space when it comes back', () => {
  expect(getRememberedDimensions('http://ontime.local/unseen.png')).toBe(null);

  rememberDimensions('http://ontime.local/image.png', makeImage(1920, 1080));
  expect(getRememberedDimensions('http://ontime.local/image.png')).toMatchObject({ width: 1920, height: 1080 });

  // an image which failed to load has no size to offer
  rememberDimensions('http://ontime.local/broken.png', makeImage(0, 0));
  expect(getRememberedDimensions('http://ontime.local/broken.png')).toBe(null);
});

test('We keep the most recently seen images, older entries are forgotten', () => {
  for (let i = 0; i < 600; i++) {
    rememberDimensions(`http://ontime.local/${i}.png`, makeImage(100, 50));
  }

  expect(getRememberedDimensions('http://ontime.local/0.png')).toBe(null);
  expect(getRememberedDimensions('http://ontime.local/599.png')).toMatchObject({ width: 100, height: 50 });
});

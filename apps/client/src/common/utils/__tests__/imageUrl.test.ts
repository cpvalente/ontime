import { isImageUrl } from '../imageUrl';

describe('isImageUrl()', () => {
  test.each(['https://example.com/slide.png', 'http://192.168.1.10:8080/cue12.jpg'])('accepts %s', (value) => {
    expect(isImageUrl(value)).toBe(true);
  });

  test.each([
    '',
    'example.com/slide.png',
    '/external/slide.png',
    'httpfoo',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
  ])('rejects %s', (value) => {
    expect(isImageUrl(value)).toBe(false);
  });
});

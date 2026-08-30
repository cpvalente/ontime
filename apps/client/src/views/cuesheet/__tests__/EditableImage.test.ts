import { isValidImageSource } from '../cuesheet-table/cuesheet-table-elements/EditableImage';

test('An image is referenced by link, anything else is rejected', () => {
  const testCases = [
    { value: 'https://example.com/image.png', isValid: true },
    { value: 'http://example.com/image.png', isValid: true },
    // a file is local to the machine running ontime, it would not resolve for the clients we serve
    { value: '/user/image.png', isValid: false },
    { value: 'file:///Users/me/image.png', isValid: false },
    { value: 'C:\\images\\image.png', isValid: false },
    // values which do not describe a location we can reach
    { value: 'www.example.com/image.png', isValid: false },
    { value: 'https://', isValid: false },
    { value: 'some text', isValid: false },
  ];

  testCases.forEach((t) => expect(isValidImageSource(t.value)).toBe(t.isValid));
});

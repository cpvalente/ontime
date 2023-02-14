import getRandomName from '../getRandomName.js';

test('generates 100 unique names', () => {
  const names = new Set();
  let attempts = 1;
  while (names.size < 100) {
    names.add(getRandomName());
    attempts++;
  }
  expect(attempts).toBeLessThan(105);
});

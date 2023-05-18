import getRandomName from '../getRandomName.js';

test('generates unique names', () => {
  const names = new Set();
  let attempts = 1;
  while (names.size < 10) {
    names.add(getRandomName());
    attempts++;
  }
  expect(attempts).toBeLessThan(50);
});

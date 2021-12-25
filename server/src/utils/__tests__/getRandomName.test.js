import getRandomName from '../getRandomName.js';

test('generates 500 unique names', () => {
  let names = [];
  for (let i = 0; i < 500; i++) {
    names.push(getRandomName());
  }

  const unique = [...new Set(names)];
  expect(names.length).toBe(unique.length);
});
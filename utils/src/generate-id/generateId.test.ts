import { generateId } from './generateId.js';

test('generate a valid 5 digit id', () => {
  const id = generateId();
  expect(id.length).toBe(5);
});

test('generate 100 with less than 110 attempts', () => {
  const ids = new Set<string>();
  let attempts = 1;
  while (ids.size < 100) {
    ids.add(generateId());
    attempts++;
  }

  expect(attempts).toBeLessThan(105);
});

test('generate 1000 with less than 1020 attempts', () => {
  const ids = new Set<string>();
  let attempts = 1;
  while (ids.size < 1000) {
    ids.add(generateId());
    attempts++;
  }

  expect(attempts).toBeLessThan(1020);
});

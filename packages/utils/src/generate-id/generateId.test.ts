import { generateId } from './generateId.js';

test('generate a valid 6 digit id', () => {
  const id = generateId();
  expect(id.length).toBe(6);
});

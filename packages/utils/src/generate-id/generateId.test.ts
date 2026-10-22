import { generateId } from './generateId.js';

test('generates a 6 character hex id', () => {
  const id = generateId();
  expect(id).toMatch(/^[0-9a-f]{6}$/);
});

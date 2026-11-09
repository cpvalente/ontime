import { generateId } from './generateId.js';

test('generates a 6 character id without ambiguous characters', () => {
  const id = generateId();
  expect(id).toMatch(/^[2-9a-hjkmnp-z]{6}$/);
});

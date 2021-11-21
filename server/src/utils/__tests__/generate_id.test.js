import { generateId } from '../generate_id.js';

describe('generate a valid id', () => {
  it('generates a 5 digit id', () => {
    const id = generateId();
    expect(id.length).toBe(5);
  });
});

describe('generate 100', () => {
  it('all ids are unique', () => {
    let ids = [];
    for (let i = 0; i < 100; i++) {
      ids.push(generateId());
    }

    const unique = [...new Set(ids)];
    expect(ids.length).toBe(unique.length);
  });
});

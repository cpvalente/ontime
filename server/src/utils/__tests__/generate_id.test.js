import { generateId } from '../generate_id.js';

describe('generate a valid id', () => {
  it('generates a 4 digit id', () => {
    const id = generateId();
    expect(id.length).toBe(4);
  });
});

describe('generate 500', () => {
  it('all ids are unique', () => {
    let ids = [];
    for (let i = 0; i < 500; i++) {
      ids.push(generateId());
    }

    const unique = [...new Set(ids)];
    expect(ids.length).toBe(unique.length);
  });
});

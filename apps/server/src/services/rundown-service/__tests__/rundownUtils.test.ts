import { OntimeRundown } from 'ontime-types';
import { getPaginated } from '../rundownUtils.js';

describe('getPaginated', () => {
  // mock cache so we dont run data functions
  beforeAll(() => {
    vi.mock('../rundownCache.js', () => ({}));
  });

  // @ts-expect-error -- we know this is not correct, but good enough for the test
  const getData = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as OntimeRundown;

  it('should return the correct paginated rundown', () => {
    const offset = 0;
    const limit = 1;
    const result = getPaginated(offset, limit, getData);

    expect(result.rundown).toHaveLength(1);
    expect(result.total).toBe(10);
  });

  it('should handle overflows', () => {
    const offset = 0;
    const limit = 20;
    const result = getPaginated(offset, limit, getData);

    expect(result.rundown).toHaveLength(10);
    expect(result.total).toBe(10);
  });

  it('should handle out of range', () => {
    const offset = 11;
    const limit = Infinity;
    const result = getPaginated(offset, limit, getData);

    expect(result.rundown).toHaveLength(0);
    expect(result.total).toBe(10);
  });
});

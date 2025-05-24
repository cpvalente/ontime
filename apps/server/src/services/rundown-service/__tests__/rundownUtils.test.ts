import { getPreviousId } from '../rundownUtils.js';

// Mock cache module
vi.mock('../rundownCache.js', () => ({
  getEventOrder: () => ({
    flatOrder: ['a', 'b', 'c', 'd'],
  }),
}));

describe('getPreviousId', () => {
  it('returns afterId if provided', () => {
    expect(getPreviousId('b')).toBe('b');
  });

  it('returns the previous id before beforeId if provided', () => {
    expect(getPreviousId(undefined, 'c')).toBe('b');
  });

  it('returns undefined if neither afterId nor beforeId is provided', () => {
    expect(getPreviousId()).toBeUndefined();
  });

  it('returns undefined if beforeId is not found', () => {
    expect(getPreviousId(undefined, 'z')).toBeUndefined();
  });
});

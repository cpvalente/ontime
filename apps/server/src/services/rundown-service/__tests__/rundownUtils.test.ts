import { makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { getPreviousId } from '../rundownUtils.js';

describe('getPreviousId', () => {
  const rundown = makeRundown({
    flatOrder: ['a', 'b', 'c', 'd'],
  });

  it('returns afterId if provided', () => {
    expect(getPreviousId(rundown, 'b')).toBe('b');
  });

  it('returns the previous id before beforeId if provided', () => {
    expect(getPreviousId(rundown, undefined, 'c')).toBe('b');
  });

  it('returns undefined if neither afterId nor beforeId is provided', () => {
    expect(getPreviousId(rundown)).toBeNull();
  });

  it('returns undefined if beforeId is not found', () => {
    expect(getPreviousId(rundown, undefined, 'z')).toBeNull();
  });
});

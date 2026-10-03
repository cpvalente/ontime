import { describe, expect, it } from 'vitest';

import { aggregateQueryStatus } from '../viewLoader.utils';

describe('aggregateQueryStatus()', () => {
  it('shows the view only once all its data has loaded', () => {
    expect(aggregateQueryStatus(['success', 'success'])).toBe('success');
    expect(aggregateQueryStatus(['success', 'pending'])).toBe('pending');
    expect(aggregateQueryStatus(['pending', 'pending'])).toBe('pending');
  });

  it('shows an error if any of its data fails to load', () => {
    expect(aggregateQueryStatus(['success', 'error'])).toBe('error');
    expect(aggregateQueryStatus(['pending', 'error'])).toBe('error');
  });
});

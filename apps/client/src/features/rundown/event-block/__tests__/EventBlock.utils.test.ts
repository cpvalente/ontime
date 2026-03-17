import { formatDelay } from '../EventBlock.utils';

describe('formatDelay()', () => {
  it('shows the original planned start time when delay is present', () => {
    const timeStart = 60000; // 1 min
    const delay = 60000; // 1 min
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('Original start 00:01');
  });
});

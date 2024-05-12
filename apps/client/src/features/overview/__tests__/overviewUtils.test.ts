import { dayInMs } from 'ontime-utils';

import { calculateEndAndDaySpan } from '../overviewUtils';

describe('calculateEndAndDaySpan', () => {
  it('should return [null, 0] when end is null', () => {
    const result = calculateEndAndDaySpan(null);
    expect(result).toEqual([null, 0]);
  });

  it('should return [end, 0] when end is less than or equal to dayInMs', () => {
    const end = dayInMs / 2;
    const result = calculateEndAndDaySpan(end);
    expect(result).toEqual([end, 0]);
  });

  it('should return [end % dayInMs, Math.floor(end / dayInMs)] when end is greater than dayInMs', () => {
    const end = dayInMs * 1.5;
    const result = calculateEndAndDaySpan(end);
    expect(result).toEqual([end % dayInMs, Math.floor(end / dayInMs)]);
  });
});

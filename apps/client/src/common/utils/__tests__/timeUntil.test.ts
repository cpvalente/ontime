import { calculateTimeUntilStart } from '../timeuntil';

describe('calculateTimeUntilStart()', () => {
  it('accounts for offsets when running behind', () => {
    const now = 150;
    const start = 150;
    const offset = -50; // running behind

    const result = calculateTimeUntilStart(start, 0, false, now, offset);
    expect(result).toBe(50);
  });
  it('accounts for offsets when running ahead', () => {
    const now = 100;
    const start = 150;
    const offset = 50;

    const result = calculateTimeUntilStart(start, 0, false, now, offset);
    expect(result).toBe(50);
  });
  it('offsets when running ahead are ignored when linked', () => {
    const now = 100;
    const start = 150;
    const offset = 50;

    const result = calculateTimeUntilStart(start, 0, true, now, offset);
    expect(result).toBe(0);
  });
  it('consume gaps when running behind', () => {
    const now = 150;
    const start = 160;
    const gap = 50;
    const offset = -40;

    const result = calculateTimeUntilStart(start, gap, false, now, offset);
    expect(result).toBe(10);
  });
  it('when there is no more gap to consume push out the start time', () => {
    const now = 150;
    const start = 160;
    const gap = 50;
    const offset = -60;

    const result = calculateTimeUntilStart(start, gap, false, now, offset);
    expect(result).toBe(20);
  });
});

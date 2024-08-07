import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { getShouldClockUpdate, getShouldTimerUpdate } from '../rundownService.utils.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getShouldClockUpdate()', () => {
  it('should return true when we slid forwards', () => {
    const previousUpdate = Date.now(); // 2 seconds ago
    const now = Date.now() + 2000;
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(true);
  });

  it('should return true when we slid backwards', () => {
    const previousUpdate = Date.now() + 2000;
    const now = Date.now(); // 2 seconds ago
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(true);
  });

  it('should return true when clock is a second ahead', () => {
    const previousUpdate = MILLIS_PER_MINUTE - 100;
    const now = MILLIS_PER_MINUTE;
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(true);
  });

  it('should return false when clock is not a second ahead and force update is not required', () => {
    const previousUpdate = Date.now();
    const now = Date.now() + 32;
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(false);
  });
});

describe('getShouldTimerUpdate', () => {
  it('should return false when currentValue is null', () => {
    const previousValue = 0;
    const currentValue = null;
    const result = getShouldTimerUpdate(previousValue, currentValue);
    expect(result).toBe(false);
  });

  it('should return true when timer is a second ahead', () => {
    const previousValue = 6500;
    const currentValue = 5000;
    const result = getShouldTimerUpdate(previousValue, currentValue);
    expect(result).toBe(true);
  });

  it('should return false when timer is not a second ahead', () => {
    const previousValue = 5500;
    const currentValue = 5200;
    const result = getShouldTimerUpdate(previousValue, currentValue);
    expect(result).toBe(false);
  });

  it('timer value is ceiled', () => {
    const previousValue = 5001; // 6
    const currentValue = 4999; // 5
    const result = getShouldTimerUpdate(previousValue, currentValue);
    expect(result).toBe(true);
  });
});

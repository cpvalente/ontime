import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { getShouldClockUpdate, getShouldTimerUpdate } from '../rundownService.utils.js';

describe('getShouldClockUpdate()', () => {
  it('should return true when we slid forwards', () => {
    const previousUpdate = Date.now() - 2000; // 2 seconds ago
    const now = Date.now();
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(true);
  });

  it('should return true when we slid backwards', () => {
    const previousUpdate = Date.now();
    const now = Date.now() - 2000; // 2 seconds ago
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
    const previousUpdate = Date.now() - 32;
    const now = Date.now();
    const result = getShouldClockUpdate(previousUpdate, now);
    expect(result).toBe(false);
  });
});

describe('getShouldTimerUpdate', () => {
  it('should return false when currentValue is null', () => {
    const previousValue = 0;
    const currentValue = null;
    const previousUpdate = 0;
    const now = 0;
    const result = getShouldTimerUpdate(previousValue, currentValue, previousUpdate, now);
    expect(result).toBe(false);
  });

  it('should return true when timer is a second ahead', () => {
    const previousValue = 5000;
    const currentValue = 6500;
    const previousUpdate = Date.now();
    const now = Date.now();
    const result = getShouldTimerUpdate(previousValue, currentValue, previousUpdate, now);
    expect(result).toBe(true);
  });

  it('should return false when timer is not a second ahead and force update is not required', () => {
    const previousValue = 5000;
    const currentValue = 5500;
    const previousUpdate = Date.now();
    const now = Date.now();
    const result = getShouldTimerUpdate(previousValue, currentValue, previousUpdate, now);
    expect(result).toBe(false);
  });
});

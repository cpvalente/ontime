import { checkOverlap } from './checkOverlap';

describe('checkOverlap', () => {
  it('should return true if events fully overlap', () => {
    expect(checkOverlap(1000, 2000, 1000, 2000)).toBe(true);
  });

  it('should return true if one of the events is inside the other', () => {
    expect(checkOverlap(1000, 2000, 1000, 1000)).toBe(true);
    expect(checkOverlap(1000, 2000, 1500, 1750)).toBe(true);
  });

  it("should return false if events don't overlap", () => {
    expect(checkOverlap(1000, 2000, 2000, 3000)).toBe(false);
  });
});

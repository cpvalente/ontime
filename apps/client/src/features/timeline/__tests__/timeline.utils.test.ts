import { getCSSPosition } from '../timeline.utils';

describe('getCSSPosition()', () => {
  it('positions an element that takes the entire time', () => {
    const testState = {
      scheduleStart: 32400000, // 09:00:00
      scheduleEnd: 36000000, // 10:00:00
      eventStart: 32400000, // 09:00:00
      eventDuration: 1000 * 60 * 60, // 01:00:00
    };
    const expected = {
      left: 0,
      width: 100,
    };
    expect(getCSSPosition(testState)).toStrictEqual(expected);
  });
  it('positions an element that takes the first half', () => {
    const testState = {
      scheduleStart: 32400000, // 09:00:00
      scheduleEnd: 36000000, // 10:00:00
      eventStart: 32400000, // 09:30:00
      eventDuration: 1800000, // 00:30:00
    };
    const expected = {
      left: 0,
      width: 50,
    };
    expect(getCSSPosition(testState)).toStrictEqual(expected);
  });
  it('positions an element that takes the last half', () => {
    const testState = {
      scheduleStart: 32400000, // 09:00:00
      scheduleEnd: 36000000, // 10:00:00
      eventStart: 34200000, // 09:30:00
      eventDuration: 1800000, // 00:30:00
    };
    const expected = {
      left: 50,
      width: 50,
    };
    expect(getCSSPosition(testState)).toStrictEqual(expected);
  });
  it('positions an element that takes the last half', () => {
    const testState = {
      scheduleStart: 32400000, // 09:00:00
      scheduleEnd: 36000000, // 10:00:00
      eventStart: 34200000, // 09:30:00
      eventDuration: 1800000, // 00:30:00
    };
    const expected = {
      left: 50,
      width: 50,
    };
    expect(getCSSPosition(testState)).toStrictEqual(expected);
  });
});

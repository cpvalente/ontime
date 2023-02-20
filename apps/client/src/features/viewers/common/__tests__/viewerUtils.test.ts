import { TimerType } from 'ontime-types';

import { getTimerByType } from '../viewerUtils';

describe('getTimerByType', () => {
  it('returns elapsed data if type of count up', () => {
    const testData = {
      timerType: TimerType.CountUp,
      current: 1,
      elapsed: 2,
      clock: 4,
    };
    const expected = testData.elapsed;
    expect(getTimerByType(testData)).toStrictEqual(expected);
  });

  it('returns current data if type of count down', () => {
    const testData = {
      timerType: TimerType.CountDown,
      current: 1,
      elapsed: 2,
      clock: 4,
    };
    const expected = testData.current;
    expect(getTimerByType(testData)).toStrictEqual(expected);
  });

  it('returns clock data if type of clock', () => {
    const testData = {
      timerType: TimerType.Clock,
      current: 1,
      elapsed: 2,
      clock: 4,
    };
    const expected = testData.clock;
    expect(getTimerByType(testData)).toStrictEqual(expected);
  });

  it('returns null if timer is not present', () => {
    const expected = null;
    expect(getTimerByType()).toStrictEqual(expected);
  });

  it('safeguards case where elapsed is null', () => {
    const testData = {
      timerType: TimerType.CountUp,
      current: 1,
      elapsed: null,
      clock: 4,
    };
    const expected = 0;
    expect(getTimerByType(testData)).toStrictEqual(expected);
  });
});

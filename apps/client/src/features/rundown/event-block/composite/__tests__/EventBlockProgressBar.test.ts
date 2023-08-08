import { dayInMs } from 'ontime-utils';

import { getPercentComplete } from '../EventBlockProgressBar';

describe('getPercentComplete()', () => {
  describe('calculates progress in normal cases', () => {
    const testScenarios = [
      { current: 0, duration: 0, expect: 100 },
      { current: 0, duration: 100, expect: 100 },
      { current: 0, duration: dayInMs, expect: 100 },
      { current: 10, duration: 100, expect: 90 },
      { current: 50, duration: 100, expect: 50 },
      { current: 100, duration: 100, expect: 0 },
    ];

    testScenarios.forEach((testCase) => {
      it(`handles ${testCase.current} / ${testCase.duration}`, () => {
        const progress = getPercentComplete(testCase.current, testCase.duration);
        expect(progress).toBe(testCase.expect);
      });
    });
  });
  it('is 0 if we dont have a current or duration', () => {
    const progress = getPercentComplete(null, null);
    expect(progress).toBe(0);
  });
});

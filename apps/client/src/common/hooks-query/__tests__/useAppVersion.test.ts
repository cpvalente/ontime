import { isUpdate } from '../useAppVersion';

describe('isUpdate()', () => {
  test.each([
    ['v4.15.1', '4.15.1', false],
    ['v4.16.0', '4.15.1', true],
    ['4.16.0', '4.15.1', true],
    ['v4.15.1', '5.0.0-alpha.0', false],
    ['v5.0.0', '5.0.0-alpha.0', true],
    ['v5.0.0', '4.16.0', true],
  ])('latest %s for running %s is %s', (latest, running, expected) => {
    expect(isUpdate(latest, running)).toBe(expected);
  });
});

import { stringFromMillis } from '../../src/utils/time';

const t1 = { val: null, result: '...' };
test('test stringFromMillis() on null values', () => {
  expect(stringFromMillis(t1.val)).toBe(t1.result);
});

const t2 = { val: 3600000, result: '01:00:00' };
test('test stringFromMillis() on valid millis', () => {
  expect(stringFromMillis(t2.val)).toBe(t2.result);
});

const t3 = { val: -3600000, result: '-01:00:00' };
test('test stringFromMillis() on negative millis', () => {
  expect(stringFromMillis(t3.val)).toBe(t3.result);
});
